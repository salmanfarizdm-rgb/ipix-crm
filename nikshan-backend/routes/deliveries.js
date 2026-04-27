const express = require("express");
const router = express.Router();
const db = require("../supabase");

router.get("/", async (req, res) => {
  try {
    let q = db.from("nk_deliveries")
      .select("*, nk_customers(name, phone), nk_users!nk_deliveries_assigned_to_fkey(name), nk_stores(name), nk_invoices(invoice_number, grand_total, nk_purchases(product_name, brand))")
      .order("scheduled_date", { ascending: true });
    if (req.query.status) q = q.eq("status", req.query.status);
    if (req.query.store_id) q = q.eq("store_id", req.query.store_id);
    if (req.query.from) q = q.gte("scheduled_date", req.query.from);
    if (req.query.to) q = q.lte("scheduled_date", req.query.to);
    const { data, error } = await q;
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { data, error } = await db.from("nk_deliveries")
      .insert({ ...req.body, status: req.body.status || "scheduled" })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const update = { status: req.body.status, updated_at: new Date().toISOString() };
    if (req.body.status === "delivered") update.delivered_at = new Date().toISOString();
    const { data, error } = await db.from("nk_deliveries")
      .update(update)
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
