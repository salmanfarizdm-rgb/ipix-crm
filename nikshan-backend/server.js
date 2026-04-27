require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const app     = express();

// ── CORS — open during demo phase, can restrict in prod ──────
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // curl, Postman, mobile apps
    const allowed = [
      "http://localhost:3003",
      "http://localhost:5173",
      "https://ipix-crm-nikshan.vercel.app",
      process.env.FRONTEND_URL,
    ].filter(Boolean);
    if (
      allowed.includes(origin) ||
      origin.includes("ngrok")        ||
      origin.includes("ngrok-free.app") ||
      origin.includes("vercel.app")   ||
      origin.includes("railway.app")  ||
      origin.includes("loca.lt")
    ) return callback(null, true);
    if (process.env.NODE_ENV !== "production") return callback(null, true);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));
app.use(express.json());

// ── Health check ─────────────────────────────────────────────
app.get("/health", (_, res) => res.json({
  status: "ok",
  app: "IPIX CRM — Nikshan Electronics",
  version: "2.0",
  timestamp: new Date().toISOString()
}));

// ── Routes ───────────────────────────────────────────────────
app.use("/api/auth",        require("./routes/auth"));
app.use("/api/stores",      require("./routes/stores"));
app.use("/api/customers",   require("./routes/customers"));
app.use("/api/leads",       require("./routes/leads"));
app.use("/api/purchases",   require("./routes/purchases"));
app.use("/api/emi",         require("./routes/emi"));
app.use("/api/service",     require("./routes/service"));
app.use("/api/followups",   require("./routes/followups"));
app.use("/api/dashboard",   require("./routes/dashboard"));
app.use("/api/performance", require("./routes/performance"));
app.use("/api/reports",     require("./routes/reports"));
app.use("/api/users",       require("./routes/users"));
app.use("/api/products",    require("./routes/products"));
app.use("/api/seasons",     require("./routes/seasons"));
app.use("/api/ai-reports",  require("./routes/ai-reports"));
app.use("/api/activity",    require("./routes/activity"));
app.use("/api/deliveries",  require("./routes/deliveries"));
app.use("/api/targets",     require("./routes/targets"));

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => console.log(`🚀 Nikshan CRM Backend running on port ${PORT}`));
