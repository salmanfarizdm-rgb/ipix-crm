#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  IPIX CRM — Quick Share via Ngrok
#  Usage: bash share.sh
# ═══════════════════════════════════════════════════════════

NGROK="/opt/homebrew/bin/ngrok"
BACKEND_PORT=3004
FRONTEND_PORT=3003
FRONTEND_ENV="/Users/salmanfaris/ipix-crm/nikshan-crm/.env"
FRONTEND_DIR="/Users/salmanfaris/ipix-crm/nikshan-crm"
BACKEND_DIR="/Users/salmanfaris/ipix-crm/nikshan-backend"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo ""
echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${CYAN}║     IPIX CRM — Nikshan Electronics       ║${NC}"
echo -e "${BOLD}${CYAN}║           Quick Share Setup               ║${NC}"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════╝${NC}"
echo ""

# Check ngrok
if [ ! -f "$NGROK" ]; then
  echo -e "${RED}✗ ngrok not found at $NGROK${NC}"
  echo "  Install with: brew install ngrok"
  exit 1
fi

# Kill any existing ngrok
pkill -f ngrok 2>/dev/null
sleep 1

# Check backend is running
if ! curl -s http://localhost:$BACKEND_PORT/health > /dev/null 2>&1; then
  echo -e "${YELLOW}⚡ Starting backend...${NC}"
  cd "$BACKEND_DIR" && node server.js > /tmp/nikshan-backend.log 2>&1 &
  sleep 3
fi

echo -e "${GREEN}✓ Backend running on port $BACKEND_PORT${NC}"

# Start ngrok for backend
echo -e "${YELLOW}⚡ Starting ngrok tunnel for backend...${NC}"
$NGROK http $BACKEND_PORT \
  --log=stdout \
  --log-format=json \
  > /tmp/ngrok-backend.log 2>&1 &
NGROK_PID=$!
sleep 4

# Get the ngrok URL from the local API
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | \
  python3 -c "
import sys, json
try:
  d = json.load(sys.stdin)
  tunnels = d.get('tunnels', [])
  for t in tunnels:
    if t.get('proto') == 'https':
      print(t['public_url'])
      break
except:
  pass
" 2>/dev/null)

if [ -z "$NGROK_URL" ]; then
  echo -e "${RED}✗ Could not get ngrok URL. Check your ngrok auth token.${NC}"
  echo -e "  Run: ${BOLD}ngrok config add-authtoken YOUR_TOKEN${NC}"
  echo -e "  Get your token at: https://dashboard.ngrok.com"
  echo ""
  echo -e "${YELLOW}  Trying without auth (basic tunnel)...${NC}"
  kill $NGROK_PID 2>/dev/null
  $NGROK http $BACKEND_PORT > /tmp/ngrok-backend.log 2>&1 &
  sleep 5
  NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | \
    python3 -c "
import sys, json
try:
  d = json.load(sys.stdin)
  tunnels = d.get('tunnels', [])
  for t in tunnels:
    if 'https' in t.get('public_url',''):
      print(t['public_url'])
      break
except:
  pass
")
fi

if [ -z "$NGROK_URL" ]; then
  echo -e "${RED}✗ ngrok tunnel failed to start.${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Backend tunnel: ${BOLD}$NGROK_URL${NC}"

# Update frontend .env with the ngrok backend URL
VITE_LINE="VITE_API_URL=${NGROK_URL}/api"

if [ -f "$FRONTEND_ENV" ]; then
  # Replace existing VITE_API_URL line
  if grep -q "VITE_API_URL" "$FRONTEND_ENV"; then
    sed -i '' "s|VITE_API_URL=.*|$VITE_LINE|" "$FRONTEND_ENV"
  else
    echo "$VITE_LINE" >> "$FRONTEND_ENV"
  fi
else
  echo "$VITE_LINE" > "$FRONTEND_ENV"
fi

echo -e "${GREEN}✓ Frontend API URL updated${NC}"

# Restart frontend dev server if running
FRONTEND_PID=$(lsof -ti :$FRONTEND_PORT 2>/dev/null)
if [ -n "$FRONTEND_PID" ]; then
  echo -e "${YELLOW}⚡ Restarting frontend to apply new API URL...${NC}"
  kill $FRONTEND_PID 2>/dev/null
  sleep 2
fi

cd "$FRONTEND_DIR" && npx vite --port $FRONTEND_PORT > /tmp/nikshan-frontend.log 2>&1 &
sleep 4

# Now tunnel the frontend too
echo -e "${YELLOW}⚡ Starting ngrok tunnel for frontend...${NC}"
# Kill backend ngrok first (free plan: 1 tunnel)
kill $NGROK_PID 2>/dev/null
sleep 1

# Check if user has paid plan (try both ports)
pkill -f ngrok 2>/dev/null
sleep 1
$NGROK start --all > /tmp/ngrok-all.log 2>&1 &
sleep 3

FRONTEND_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | \
  python3 -c "
import sys, json
try:
  d = json.load(sys.stdin)
  tunnels = d.get('tunnels', [])
  for t in tunnels:
    url = t.get('public_url','')
    if 'https' in url:
      # Find the frontend one
      if '3003' in t.get('config',{}).get('addr',''):
        print(url)
        break
  # fallback: print first https
  for t in tunnels:
    if 'https' in t.get('public_url',''):
      print(t['public_url'])
      break
except:
  pass
" 2>/dev/null)

# If no paid plan, fall back to tunneling only the frontend
if [ -z "$FRONTEND_URL" ]; then
  pkill -f ngrok 2>/dev/null
  sleep 1
  $NGROK http $FRONTEND_PORT > /tmp/ngrok-frontend.log 2>&1 &
  sleep 4
  FRONTEND_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | \
    python3 -c "
import sys, json
try:
  d = json.load(sys.stdin)
  tunnels = d.get('tunnels', [])
  for t in tunnels:
    if 'https' in t.get('public_url',''):
      print(t['public_url'])
      break
except:
  pass
")
  echo -e "${YELLOW}⚠  Free plan: only one tunnel active.${NC}"
  echo -e "   Backend tunneled via: ${BOLD}$NGROK_URL${NC} (used for API)"
  echo -e "   Frontend tunneled via: ${BOLD}$FRONTEND_URL${NC} (share this)"
fi

echo ""
echo -e "${BOLD}${GREEN}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${GREEN}║          ✅  SHARE THIS URL WITH CLIENT           ║${NC}"
echo -e "${BOLD}${GREEN}╠═══════════════════════════════════════════════════╣${NC}"
echo -e "${BOLD}${GREEN}║                                                   ║${NC}"
echo -e "${BOLD}${GREEN}║  🌍 ${BOLD}${FRONTEND_URL:-http://localhost:3003}${NC}"
echo -e "${BOLD}${GREEN}║                                                   ║${NC}"
echo -e "${BOLD}${GREEN}╠═══════════════════════════════════════════════════╣${NC}"
echo -e "${BOLD}${GREEN}║  Demo Login Credentials:                          ║${NC}"
echo -e "${BOLD}${GREEN}║                                                   ║${NC}"
echo -e "${BOLD}${GREEN}║  Admin:   admin@nikshancrm.com                    ║${NC}"
echo -e "${BOLD}${GREEN}║  Pass:    Nikshan@2026                             ║${NC}"
echo -e "${BOLD}${GREEN}║                                                   ║${NC}"
echo -e "${BOLD}${GREEN}║  Manager: manager@nikshancrm.com                  ║${NC}"
echo -e "${BOLD}${GREEN}║  Pass:    Manager@2026                             ║${NC}"
echo -e "${BOLD}${GREEN}║                                                   ║${NC}"
echo -e "${BOLD}${GREEN}╚═══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}  Backend API: $NGROK_URL${NC}"
echo -e "${CYAN}  Ngrok dashboard: http://localhost:4040${NC}"
echo ""
echo -e "${YELLOW}  Press Ctrl+C to stop sharing${NC}"
echo ""

# Keep script running
wait
