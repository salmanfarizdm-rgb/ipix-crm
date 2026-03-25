require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const app     = express();

app.use(cors({
  origin: [
    "http://localhost:3003",
    "https://ipix-crm-nikshan.vercel.app",
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json());

// Routes
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

app.get("/health", (_, res) => res.json({ ok: true, app: "Nikshan CRM Backend" }));

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => console.log(`🚀 Nikshan CRM Backend running on port ${PORT}`));
