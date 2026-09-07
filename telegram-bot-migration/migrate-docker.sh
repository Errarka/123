#!/usr/bin/env bash
#
# migrate-docker.sh — migrate a Dockerized Telegram bot (with a Dockerfile
# and docker-compose file, e.g. telegram-spybot) from SRC_HOST to DST_HOST.
#
# Unlike migrate.sh (which sets up a plain venv + systemd service), this
# variant rebuilds the bot's own Docker image on the destination via
# `docker compose up -d --build`, so it keeps the exact same runtime
# (base image, env vars from .env, restart policy) as defined by the
# project itself.
#
# Run from a machine with normal outbound SSH access — your PC, or
# directly from SRC_HOST itself (which already has normal internet
# access, unlike a restricted sandbox).
#
# Usage:
#   SRC_HOST=147.78.65.84 SRC_USER=root SRC_PASS='...' \
#   DST_HOST=91.186.223.150 DST_USER=root DST_PASS='...' \
#   BOT_DIR=/root/telegram-spybot \
#     ./migrate-docker.sh
#
set -euo pipefail

SRC_HOST="${SRC_HOST:?set SRC_HOST=<ip>}"
SRC_USER="${SRC_USER:-root}"
SRC_PORT="${SRC_PORT:-22}"
DST_HOST="${DST_HOST:?set DST_HOST=<ip>}"
DST_USER="${DST_USER:-root}"
DST_PORT="${DST_PORT:-22}"
BOT_DIR="${BOT_DIR:?set BOT_DIR=/path/to/bot, e.g. /root/telegram-spybot}"

SSH_OPTS="-o StrictHostKeyChecking=accept-new"

echo "==> Step 1/3: copying ${BOT_DIR} from ${SRC_HOST} to ${DST_HOST}:${BOT_DIR} ..."

if [[ -n "${SRC_PASS:-}" ]]; then
  SSHPASS="$SRC_PASS" rsync -avz -e "sshpass -e ssh -p ${SRC_PORT} ${SSH_OPTS}" \
    --exclude '.git' \
    "${SRC_USER}@${SRC_HOST}:${BOT_DIR}/" "/tmp/_bot_relay/"
else
  rsync -avz -e "ssh -p ${SRC_PORT} ${SSH_OPTS}" \
    --exclude '.git' \
    "${SRC_USER}@${SRC_HOST}:${BOT_DIR}/" "/tmp/_bot_relay/"
fi

if [[ -n "${DST_PASS:-}" ]]; then
  SSHPASS="$DST_PASS" ssh -p "$DST_PORT" $SSH_OPTS "${DST_USER}@${DST_HOST}" "mkdir -p '${BOT_DIR}'"
  SSHPASS="$DST_PASS" rsync -avz -e "sshpass -e ssh -p ${DST_PORT} ${SSH_OPTS}" \
    "/tmp/_bot_relay/" "${DST_USER}@${DST_HOST}:${BOT_DIR}/"
else
  ssh -p "$DST_PORT" $SSH_OPTS "${DST_USER}@${DST_HOST}" "mkdir -p '${BOT_DIR}'"
  rsync -avz -e "ssh -p ${DST_PORT} ${SSH_OPTS}" \
    "/tmp/_bot_relay/" "${DST_USER}@${DST_HOST}:${BOT_DIR}/"
fi
rm -rf /tmp/_bot_relay

echo "==> Step 2/3: installing Docker on destination (if missing) and building the image ..."

DST_REMOTE_SCRIPT="
set -e
command -v docker >/dev/null || curl -fsSL https://get.docker.com | sh
systemctl enable --now docker
cd '${BOT_DIR}'
docker compose up -d --build 2>/dev/null || docker-compose up -d --build
sleep 3
docker compose ps 2>/dev/null || docker-compose ps
"

if [[ -n "${DST_PASS:-}" ]]; then
  SSHPASS="$DST_PASS" sshpass -e ssh -p "$DST_PORT" $SSH_OPTS "${DST_USER}@${DST_HOST}" bash -s <<< "$DST_REMOTE_SCRIPT"
else
  ssh -p "$DST_PORT" $SSH_OPTS "${DST_USER}@${DST_HOST}" bash -s <<< "$DST_REMOTE_SCRIPT"
fi

echo "==> Step 3/3: recent logs from the new container:"
if [[ -n "${DST_PASS:-}" ]]; then
  SSHPASS="$DST_PASS" sshpass -e ssh -p "$DST_PORT" $SSH_OPTS "${DST_USER}@${DST_HOST}" \
    "cd '${BOT_DIR}' && (docker compose logs --tail 50 2>/dev/null || docker-compose logs --tail 50)"
else
  ssh -p "$DST_PORT" $SSH_OPTS "${DST_USER}@${DST_HOST}" \
    "cd '${BOT_DIR}' && (docker compose logs --tail 50 2>/dev/null || docker-compose logs --tail 50)"
fi

echo
echo "==> Verify the bot responds in Telegram before relying on it."
echo "==> If the old container on ${SRC_HOST} was already stopped, leave it stopped"
echo "    (a long-polling bot can't run in two places at once)."
echo "==> The bot token and both server passwords were shared in plaintext during"
echo "    setup — rotate the Telegram bot token via @BotFather and change both"
echo "    root passwords now."
