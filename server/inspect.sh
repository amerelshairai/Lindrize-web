#!/usr/bin/env bash
# Looks at the server and changes nothing. It prints no passwords, keys or file contents.
# Run it once before the setup, and send the output so the plan can be fitted to this server.
#   bash inspect.sh
line() { printf '\n== %s ==\n' "$1"; }

line "System"
. /etc/os-release 2>/dev/null && echo "$PRETTY_NAME"
uname -m
line "Memory (MB)"
free -m | awk 'NR<=3'
line "Disk"
df -h / | awk 'NR<=2'
line "Processors"
nproc
line "What is listening on the web ports (80, 443) and the ports this setup wants (8081, 8082)"
(ss -ltnpH 2>/dev/null || true) | awk '{print $4, $6}' | grep -E ':(80|443|8081|8082) ' || echo "nothing"
line "Web servers installed"
for name in nginx apache2 caddy traefik; do command -v "$name" >/dev/null 2>&1 && echo "$name: installed"; done
systemctl is-active nginx apache2 caddy 2>/dev/null | paste -sd' ' || true
line "Docker"
if command -v docker >/dev/null 2>&1; then
  docker --version
  docker compose version 2>/dev/null || echo "compose plugin: missing"
  echo "Containers (name, image, ports):"
  docker ps --format '{{.Names}} | {{.Image}} | {{.Ports}}' 2>/dev/null || echo "(run with sudo to list containers)"
else
  echo "not installed"
fi
line "Firewall"
(ufw status 2>/dev/null || echo "ufw: not installed or needs sudo") | head -20
line "Protection and updates"
for name in fail2ban unattended-upgrades; do
  dpkg -s "$name" >/dev/null 2>&1 && echo "$name: installed" || echo "$name: not installed"
done
line "SSH login settings"
(sshd -T 2>/dev/null || true) | grep -E '^(port|permitrootlogin|passwordauthentication|pubkeyauthentication) ' || echo "(run with sudo to read these)"
line "Folders this setup would create"
for dir in /var/www/lindrize /srv/lindrize; do [ -e "$dir" ] && echo "$dir: already exists" || echo "$dir: free"; done
line "Done"
