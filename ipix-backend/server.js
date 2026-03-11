const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const leadsRouter     = require("./routes/leads");
const clientsRouter   = require("./routes/clients");
const dashboardRouter = require("./routes/dashboard");
const authRouter      = require("./routes/auth");
const usersRouter     = require("./routes/users");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: "Too many requests." }
}));

app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    "http://localhost:3000",
    /\.vercel\.app$/
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "2mb" }));

app.get("/", (req, res) => {
  res.json({ status: "✅ IPIX CRM API is running", version: "1.0.0", timestamp: new Date().toISOString() });
});

app.use("/api/auth",      authRouter);
app.use("/api/users",     usersRouter);
app.use("/api/leads",     leadsRouter);
app.use("/api/clients",   clientsRouter);
app.use("/api/dashboard", dashboardRouter);

app.use((req, res) => res.status(404).json({ error: "Route not found" }));
app.use((err, req, res, next) => {
  console.error("Server error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => console.log(`🚀 IPIX CRM Backend running on port ${PORT}`));
