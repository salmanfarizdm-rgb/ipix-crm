const express = require("express");
const router  = express.Router();
const db      = require("../supabase");

router.get("/", async (req, res) => {
  try {
    let q = db.from("nk_emi_records").select("*, nk_customers(name,phone), nk_purchases(product_name,amount)").order("created_at", { ascending: false });
    if (req.query.customer_id) q = q.eq("customer_id", req.query.customer_id);
    if (req.query.bank_name) q = q.eq("bank_name", req.query.bank_name);
    if (req.query.status) q = q.eq("status", req.query.status);
    const { data, error } = await q;
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/", async (req, res) => {
  const { data, error } = await db.from("nk_emi_records").insert(req.body).select().single();
  if (error) return res.status(500).json({ success: false, error: error.message });
  res.status(201).json({ success: true, data });
});

router.put("/:id", async (req, res) => {
  const { data, error } = await db.from("nk_emi_records").update(req.body).eq("id", req.params.id).select().single();
  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true, data });
});

router.patch("/:id/status", async (req, res) => {
  const { data, error } = await db.from("nk_emi_records").update({ status: req.body.status }).eq("id", req.params.id).select().single();
  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true, data });
});

module.exports = router;
