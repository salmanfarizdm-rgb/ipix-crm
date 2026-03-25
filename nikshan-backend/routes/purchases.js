const express = require("express");
const router  = express.Router();
const db      = require("../supabase");

router.get("/", async (req, res) => {
  try {
    let q = db.from("nk_purchases").select("*, nk_customers(name,phone), nk_stores(name), nk_users!nk_purchases_sold_by_fkey(name)").order("created_at", { ascending: false });
    if (req.query.customer_id) q = q.eq("customer_id", req.query.customer_id);
    if (req.query.store_id) q = q.eq("store_id", req.query.store_id);
    if (req.query.payment_type) q = q.eq("payment_type", req.query.payment_type);
    if (req.query.from) q = q.gte("purchase_date", req.query.from);
    if (req.query.to) q = q.lte("purchase_date", req.query.to);
    const { data, error } = await q;
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  const { data, error } = await db.from("nk_purchases").select("*, nk_customers(name,phone), nk_stores(name), nk_users!nk_purchases_sold_by_fkey(name), nk_emi_records(*)").eq("id", req.params.id).single();
  if (error) return res.status(404).json({ success: false, error: "Not found" });
  res.json({ success: true, data });
});

router.post("/", async (req, res) => {
  const { data, error } = await db.from("nk_purchases").insert(req.body).select("*, nk_customers(name,phone)").single();
  if (error) return res.status(500).json({ success: false, error: error.message });
  res.status(201).json({ success: true, data });
});

router.put("/:id", async (req, res) => {
  const { data, error } = await db.from("nk_purchases").update(req.body).eq("id", req.params.id).select().single();
  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true, data });
});

module.exports = router;
