#!/usr/bin/env bash
#
# discover.sh — find a Telegram bot running on a remote server.
#
# Run this from a machine that HAS normal outbound SSH access
# (your laptop, a jump host, etc.) — it connects to SRC_HOST and
# looks for anything that smells like a Telegram bot: running
# processes, systemd services, cron jobs, pm2/screen/tmux sessions,
# docker containers, and source files mentioning Telegram bot
# libraries or a bot token.
#
# It makes NO changes on the remote server — read-only discovery.
#
# Usage:
#   SRC_HOST=147.78.65.84 SRC_USER=root ./discover.sh
#   (you'll be prompted for the SSH password unless SRC_PASS is set,
#    or unless you have key-based auth already set up)
#
set -euo pipefail

SRC_HOST="${SRC_HOST:?set SRC_HOST=<ip>}"
SRC_USER="${SRC_USER:-root}"
SRC_PORT="${SRC_PORT:-22}"

SSH_BASE=(ssh -p "$SRC_PORT" -o StrictHostKeyChecking=accept-new)

run_remote() {
  if [[ -n "${SRC_PASS:-}" ]]; then
    sshpass -e -- "${SSH_BASE[@]}" "${SRC_USER}@${SRC_HOST}" "$1"
  else
    "${SSH_BASE[@]}" "${SRC_USER}@${SRC_HOST}" "$1"
  fi
}

if [[ -n "${SRC_PASS:-}" ]]; then
  export SSHPASS="$SRC_PASS"
fi

echo "==> Connecting to ${SRC_USER}@${SRC_HOST}:${SRC_PORT} ..."

# The remote-side script is a single heredoc so we only need one SSH round-trip.
REMOTE_SCRIPT='
echo "----- Running processes that look bot-ish (python/node/php) -----"
ps -eo pid,ppid,etime,cmd | grep -iE "python|node|php" | grep -viE "grep|discover.sh" || echo "(none found)"

echo
echo "----- systemd services mentioning bot/telegram -----"
systemctl list-units --type=service --all 2>/dev/null | grep -iE "bot|telegram" || echo "(none found)"

echo
echo "----- crontab (root) -----"
crontab -l 2>/dev/null || echo "(no crontab / not accessible)"

echo
echo "----- pm2 processes (if pm2 installed) -----"
command -v pm2 >/dev/null 2>&1 && pm2 list || echo "(pm2 not installed)"

echo
echo "----- screen sessions -----"
command -v screen >/dev/null 2>&1 && screen -ls || echo "(screen not installed)"

echo
echo "----- tmux sessions -----"
command -v tmux >/dev/null 2>&1 && tmux ls 2>&1 || echo "(tmux not installed / no sessions)"

echo
echo "----- docker containers (if docker installed) -----"
command -v docker >/dev/null 2>&1 && docker ps -a || echo "(docker not installed)"

echo
echo "----- Files that look like Telegram bot source (common dirs, depth-limited) -----"
for d in /root /home /opt /srv /var/www /app; do
  [ -d "$d" ] || continue
  grep -rlE "TELEGRAM_BOT_TOKEN|telebot|aiogram|python-telegram-bot|node-telegram-bot-api|telegraf|Bot(api_token|token=|API|Api)" \
    --include="*.py" --include="*.js" --include="*.ts" --include="*.env" --include="*.json" --include="*.cfg" --include="*.ini" \
    "$d" 2>/dev/null | grep -vE "node_modules/|venv/|\.git/|__pycache__/" | head -50
done

echo
echo "----- Recently modified .py/.js files outside system dirs (last 90 days) -----"
find /root /home /opt /srv /var/www /app -maxdepth 6 \( -name "*.py" -o -name "*.js" \) -mtime -90 \
  \! -path "*/node_modules/*" \! -path "*/venv/*" \! -path "*/.git/*" 2>/dev/null | head -50
'

run_remote "$REMOTE_SCRIPT"

echo
echo "==> Discovery finished."
echo "==> Look through the output above for the bot's directory, its process name,"
echo "    and how it is started (systemd service name, pm2 name, screen/tmux session,"
echo "    or plain 'python3 bot.py' in crontab/rc.local)."
echo "==> Once you know the directory, run migrate.sh with BOT_DIR set to it."
