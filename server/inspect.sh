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
line "Docker networks"
docker network ls --format '{{.Name}} ({{.Driver}})' 2>/dev/null || echo "(none or needs sudo)"
line "Docker projects in /docker (folder names only)"
ls -1 /docker 2>/dev/null || echo "no /docker folder"
line "Front door (Traefik) settings, with email addresses and passwords hidden"
for name in $(docker ps --format '{{.Names}} {{.Image}}' 2>/dev/null | awk 'tolower($2) ~ /traefik|caddy|nginx/ {print $1}'); do
  echo "-- $name"
  docker inspect --format '{{range .Args}}{{println .}}{{end}}' "$name" 2>/dev/null \
    | sed -E 's/[^ =]+@[^ ]+/<email hidden>/g; s/(password|secret|token|users|key)=.*/\1=<hidden>/I'
done
line "Website-related labels on running containers (secrets hidden)"
for name in $(docker ps --format '{{.Names}}' 2>/dev/null); do
  docker inspect --format '{{range $k, $v := .Config.Labels}}{{$k}}={{$v}}{{println}}{{end}}' "$name" 2>/dev/null \
    | grep -i '^traefik\.' | grep -viE 'users|password|secret|token|key' | sed "s/^/$name: /"
done
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
