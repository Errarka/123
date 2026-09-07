#!/usr/bin/env bash
#
# migrate.sh — copy a Telegram bot from SRC_HOST to DST_HOST, install its
# dependencies on the destination, and set it up as a systemd service.
#
# Run this from a machine that has normal outbound SSH access to BOTH
# servers (your laptop, a jump host, etc). It does NOT run inside a
# restricted sandbox.
#
# Prereqs on the machine you run this from: ssh, rsync, sshpass (only if
# you want to use password auth instead of SSH keys).
#
# Usage example:
#   SRC_HOST=147.78.65.84 SRC_USER=root SRC_PASS='...' \
#   DST_HOST=91.186.223.150 DST_USER=root DST_PASS='...' \
#   BOT_DIR=/root/my_bot \
#   ./migrate.sh
#
# BOT_DIR is the directory on SRC_HOST containing the bot's source
# (found via discover.sh). Everything in it is copied to the same path
# on DST_HOST, excluding venv/node_modules/__pycache__/.git (those are
# rebuilt fresh on the destination).
#
# What this script does, in order:
#   1. rsync BOT_DIR from source to destination (over ssh, no plaintext
#      copy through this shell — password goes only into the ssh tunnel).
#   2. Detect Python (requirements.txt) or Node (package.json) project
#      and install dependencies on the destination.
#   3. Ask you for the exact start command (e.g. "python3 bot.py" or
#      "node index.js") and create+enable a systemd service for it on
#      the destination.
#   4. Start the new service and show its status/logs so you can verify
#      the bot came up correctly.
#   5. Optionally stop/disable the bot on the SOURCE server — Telegram
#      long-polling bots (getUpdates) CANNOT run in two places at once,
#      you'll get 409 Conflict errors and missed messages if both run
#      simultaneously. Webhook-based bots are less strict but you should
#      still only point the webhook at one server.
#
set -euo pipefail

SRC_HOST="${SRC_HOST:?set SRC_HOST=<ip>}"
SRC_USER="${SRC_USER:-root}"
SRC_PORT="${SRC_PORT:-22}"
DST_HOST="${DST_HOST:?set DST_HOST=<ip>}"
DST_USER="${DST_USER:-root}"
DST_PORT="${DST_PORT:-22}"
BOT_DIR="${BOT_DIR:?set BOT_DIR=/path/to/bot/on/source, found via discover.sh}"

SSH_OPTS="-o StrictHostKeyChecking=accept-new"

ssh_src() {
  if [[ -n "${SRC_PASS:-}" ]]; then
    SSHPASS="$SRC_PASS" sshpass -e ssh -p "$SRC_PORT" $SSH_OPTS "${SRC_USER}@${SRC_HOST}" "$@"
  else
    ssh -p "$SRC_PORT" $SSH_OPTS "${SRC_USER}@${SRC_HOST}" "$@"
  fi
}

ssh_dst() {
  if [[ -n "${DST_PASS:-}" ]]; then
    SSHPASS="$DST_PASS" sshpass -e ssh -p "$DST_PORT" $SSH_OPTS "${DST_USER}@${DST_HOST}" "$@"
  else
    ssh -p "$DST_PORT" $SSH_OPTS "${DST_USER}@${DST_HOST}" "$@"
  fi
}

echo "==> Step 1/5: copying ${BOT_DIR} from ${SRC_HOST} to ${DST_HOST} ..."

# rsync straight between the two remote hosts would need src->dst SSH
# trust, which we don't want to assume. Instead we stream through this
# machine: pull with rsync-over-ssh from source, push with rsync-over-ssh
# to destination, using a local temp dir as a relay.
TMP_RELAY="$(mktemp -d)"
trap 'rm -rf "$TMP_RELAY"' EXIT

RSYNC_EXCLUDES=(--exclude "venv" --exclude ".venv" --exclude "node_modules" \
                --exclude "__pycache__" --exclude ".git" --exclude "*.pyc")

if [[ -n "${SRC_PASS:-}" ]]; then
  SSHPASS="$SRC_PASS" rsync -avz -e "sshpass -e ssh -p ${SRC_PORT} ${SSH_OPTS}" \
    "${RSYNC_EXCLUDES[@]}" "${SRC_USER}@${SRC_HOST}:${BOT_DIR}/" "$TMP_RELAY/"
else
  rsync -avz -e "ssh -p ${SRC_PORT} ${SSH_OPTS}" \
    "${RSYNC_EXCLUDES[@]}" "${SRC_USER}@${SRC_HOST}:${BOT_DIR}/" "$TMP_RELAY/"
fi

echo "==> Creating ${BOT_DIR} on destination ..."
ssh_dst "mkdir -p '${BOT_DIR}'"

if [[ -n "${DST_PASS:-}" ]]; then
  SSHPASS="$DST_PASS" rsync -avz -e "sshpass -e ssh -p ${DST_PORT} ${SSH_OPTS}" \
    "$TMP_RELAY/" "${DST_USER}@${DST_HOST}:${BOT_DIR}/"
else
  rsync -avz -e "ssh -p ${DST_PORT} ${SSH_OPTS}" \
    "$TMP_RELAY/" "${DST_USER}@${DST_HOST}:${BOT_DIR}/"
fi

echo "==> Step 2/5: detecting project type and installing dependencies on destination ..."
ssh_dst bash -s <<EOF
set -e
cd '${BOT_DIR}'
if [ -f requirements.txt ]; then
  echo "Detected Python project (requirements.txt)."
  command -v python3 >/dev/null || (apt-get update && apt-get install -y python3 python3-venv python3-pip)
  python3 -m venv venv
  ./venv/bin/pip install --upgrade pip
  ./venv/bin/pip install -r requirements.txt
elif [ -f package.json ]; then
  echo "Detected Node.js project (package.json)."
  command -v node >/dev/null || (curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs)
  npm install --omit=dev
else
  echo "No requirements.txt or package.json found — skipping auto dependency install."
  echo "Install the bot's dependencies manually before starting it."
fi
EOF

echo "==> Step 3/5: configure the start command and systemd service."
read -rp "Start command to run the bot on the destination (e.g. 'venv/bin/python3 bot.py' or 'node index.js'): " START_CMD
read -rp "systemd service name to create [telegram-bot]: " SERVICE_NAME
SERVICE_NAME="${SERVICE_NAME:-telegram-bot}"

ssh_dst bash -s <<EOF
set -e
cat > /etc/systemd/system/${SERVICE_NAME}.service <<UNIT
[Unit]
Description=Telegram bot (migrated from ${SRC_HOST})
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=${BOT_DIR}
ExecStart=/bin/bash -lc '${START_CMD}'
Restart=on-failure
RestartSec=5
User=${DST_USER}

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable ${SERVICE_NAME}
systemctl restart ${SERVICE_NAME}
sleep 2
systemctl status ${SERVICE_NAME} --no-pager -l || true
EOF

echo
echo "==> Step 4/5: recent logs from the new service on the destination:"
ssh_dst "journalctl -u ${SERVICE_NAME} -n 40 --no-pager" || true

echo
echo "==> Step 5/5: stop the OLD bot on the source server?"
echo "    A Telegram long-polling bot cannot run in two places at once"
echo "    (you'll get 409 Conflict / missed messages) unless it uses webhooks"
echo "    pointed only at one server."
read -rp "Verify the new bot on ${DST_HOST} responds correctly BEFORE answering 'y' here. Stop old bot on source now? [y/N]: " STOP_OLD
if [[ "${STOP_OLD,,}" == "y" ]]; then
  echo "Enter how the OLD bot was running on the source (from discover.sh output),"
  echo "e.g. a systemd service name, or leave blank to skip and stop it manually."
  read -rp "Old systemd service name on source (blank to skip): " OLD_SERVICE
  if [[ -n "$OLD_SERVICE" ]]; then
    ssh_src "systemctl stop '${OLD_SERVICE}' && systemctl disable '${OLD_SERVICE}'"
    echo "Stopped and disabled '${OLD_SERVICE}' on ${SRC_HOST}."
  else
    echo "Skipped automatic stop — stop the old process manually on ${SRC_HOST}."
  fi
else
  echo "Leaving the old bot running on ${SRC_HOST}. Stop it manually once you've verified the migration."
fi

echo
echo "==> Migration finished."
echo "==> Reminder: rotate the root passwords on both servers now that they were shared in plaintext."
