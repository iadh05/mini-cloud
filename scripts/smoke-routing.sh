#!/usr/bin/env bash
# Smoke test for the edge router (MC-206). Needs the platform running: npm run platform:up
# 1. A container labelled traefik.enable=true answers at http://<host>.mc.localhost
# 2. A container without that label is not reachable through Traefik
set -euo pipefail

IMAGE="traefik/whoami:v1.11.0"
YES="mc-smoke-routed"
NO="mc-smoke-hidden"

cleanup() { docker rm -f "$YES" "$NO" >/dev/null 2>&1 || true; }
trap cleanup EXIT
cleanup

docker run -d --name "$YES" --network mc-tenants \
  --label traefik.enable=true \
  --label "traefik.http.routers.$YES.rule=Host(\`smoke.mc.localhost\`)" \
  --label "traefik.http.routers.$YES.entrypoints=web" \
  --label "traefik.http.services.$YES.loadbalancer.server.port=80" \
  "$IMAGE" >/dev/null

docker run -d --name "$NO" --network mc-tenants \
  --label "traefik.http.routers.$NO.rule=Host(\`hidden.mc.localhost\`)" \
  "$IMAGE" >/dev/null

status() { curl -s -o /dev/null -w '%{http_code}' --max-time 3 "$1" || true; }

# Traefik picks up new containers within a second or two.
for _ in $(seq 1 20); do
  [ "$(status http://smoke.mc.localhost/)" = "200" ] && break
  sleep 0.5
done

routed=$(status http://smoke.mc.localhost/)
hidden=$(status http://hidden.mc.localhost/)
echo "labelled   http://smoke.mc.localhost  -> $routed (want 200)"
echo "unlabelled http://hidden.mc.localhost -> $hidden (want 404)"

[ "$routed" = "200" ] && [ "$hidden" = "404" ]
echo "routing OK"
