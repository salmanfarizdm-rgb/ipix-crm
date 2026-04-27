# IPIX CRM — Nikshan Electronics
## Quick Share & Demo Access Guide

---

## 🚀 Share the CRM Instantly (Ngrok)

```bash
cd /Users/salmanfaris/ipix-crm
bash share.sh
```

This will:
1. Start the backend (if not running)
2. Create a public ngrok tunnel for the backend API
3. Update the frontend's `.env` with the tunnel URL
4. Start the frontend dev server
5. Print the public URL to share with the client

---

## 🔐 Demo Login Credentials

### Admin Account
| Field    | Value                     |
|----------|---------------------------|
| Email    | admin@nikshancrm.com      |
| Password | Nikshan@2026              |
| Role     | Admin (full access)       |

### Manager Account
| Field    | Value                     |
|----------|---------------------------|
| Email    | manager@nikshancrm.com   |
| Password | Manager@2026             |
| Role     | Branch Manager            |

### Demo Account (read-friendly)
| Field    | Value                     |
|----------|---------------------------|
| Email    | demo@nikshancrm.com      |
| Password | NikshanDemo@2026         |
| Role     | Sales Executive           |

---

## 🌐 Deployed URLs

| Service  | URL                                               |
|----------|---------------------------------------------------|
| Frontend | https://ipix-crm-nikshan.vercel.app               |
| Backend  | https://nikshan-backend.railway.app               |
| Supabase | https://supabase.com/dashboard/project/lrawsoojxzbrzfmtvttx |

---

## 🛠 Local Development

### Start Backend
```bash
cd nikshan-backend
npm run dev      # nodemon (auto-reload)
# or
npm start        # plain node
```

### Start Frontend
```bash
cd nikshan-crm
npm run dev      # Vite dev server on port 3003
```

### Seed Demo Accounts
```bash
cd nikshan-backend
node scripts/seedAdmin.js
```

---

## 📱 Ports

| Service   | Port |
|-----------|------|
| Frontend  | 3003 |
| Backend   | 3004 |
| Ngrok UI  | 4040 |

---

## 🗄 Database

- **Provider**: Supabase (PostgreSQL)
- **Project ID**: `lrawsoojxzbrzfmtvttx`
- **Region**: ap-south-1 (Mumbai)
- Table prefix: `nk_`

---

## 📦 Features Included

- ✅ Customer Management (with activity timeline)
- ✅ Lead Pipeline (with date filters)
- ✅ Multi-product Cart with GST calculation
- ✅ Split Payment support
- ✅ EMI Tracker
- ✅ Service Requests (with warranty checker + return policy)
- ✅ Follow-up Scheduler
- ✅ Delivery Tracking
- ✅ Products DB (with stock + low-stock alerts)
- ✅ Store Management (with GSTIN)
- ✅ Team Performance + Targets
- ✅ AI-powered Reports (Anthropic Claude)
- ✅ WhatsApp integration (purchase receipt, warranty reminders, delivery notify)
- ✅ Role-based Access (Admin / Branch Manager / Sales Manager / Sales Exec / Technician)
- ✅ Date filters on all major pages

---

> **Note**: The `share.sh` script requires an ngrok account.
> Free tier supports 1 active tunnel at a time.
> Get your auth token at https://dashboard.ngrok.com
> Then run: `ngrok config add-authtoken YOUR_TOKEN`
