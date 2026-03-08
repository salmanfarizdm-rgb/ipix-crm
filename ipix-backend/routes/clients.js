const express = require("express");
const router = express.Router();
const supabase = require("../supabase");

/* ── GET all clients ── */
router.get("/", async (req, res) => {
  try {
    const { status, segment } = req.query;
    let query = supabase.from("clients").select("*").order("created_at", { ascending: false });
    if (status)  query = query.eq("status", status);
    if (segment) query = query.eq("segment", segment);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, data, count: data.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ── GET single client ── */
router.get("/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("clients").select("*").eq("id", req.params.id).single();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: "Client not found" });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ── POST create client ── */
router.post("/", async (req, res) => {
  try {
    const client = {
      short_name:       req.body.shortName || req.body.company || "",
      company:          req.body.company || "",
      contact:          req.body.contact || "",
      role:             req.body.role || "",
      phone:            req.body.phone || "",
      backup_phone:     req.body.backupPhone || "",
      email:            req.body.email || "",
      backup_email:     req.body.backupEmail || "",
      location:         req.body.location || "",
      segment:          req.body.segment || "SME",
      status:           req.body.status || "Active",
      notes:            req.body.notes || "",
      cross_sell:       req.body.crossSell || [],
      upsell:           req.body.upsell || [],
      payment_terms:    req.body.paymentTerms || "",
      lifetime_revenue: Number(req.body.lifetimeRevenue) || 0,
      total_projects:   Number(req.body.totalProjects) || 0,
      nps_scores:       req.body.npsScores || [],
      payments:         req.body.payments || [],
      services:         req.body.services || [],
      purchases:        req.body.purchases || [],
      edit_history:     []
    };
    const { data, error } = await supabase.from("clients").insert([client]).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ── PUT update client ── */
router.put("/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("clients").update(req.body).eq("id", req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ── PATCH add payment ── */
router.patch("/:id/payment", async (req, res) => {
  try {
    const { data: client, error: fetchErr } = await supabase
      .from("clients").select("payments, lifetime_revenue").eq("id", req.params.id).single();
    if (fetchErr) throw fetchErr;

    const payments = [...(client.payments || []), req.body];
    const lifetime_revenue = payments
      .filter(p => p.status === "Received")
      .reduce((s, p) => s + (p.amount || 0), 0);

    const { data, error } = await supabase
      .from("clients").update({ payments, lifetime_revenue }).eq("id", req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ── DELETE client ── */
router.delete("/:id", async (req, res) => {
  try {
    const { error } = await supabase.from("clients").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ success: true, message: "Client deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
