const express = require("express");
const router  = express.Router();
const db      = require("../supabase");

// GET /api/service
router.get("/", async (req, res) => {
  try {
    let q = db.from("nk_service_requests")
      .select("*, nk_customers(name,phone), nk_users!nk_service_requests_assigned_to_fkey(name), nk_stores(name)")
      .order("created_at", { ascending: false });
    if (req.query.status)       q = q.eq("status", req.query.status);
    if (req.query.request_type) q = q.eq("request_type", req.query.request_type);
    if (req.query.store_id)     q = q.eq("store_id", req.query.store_id);
    if (req.query.assigned_to)  q = q.eq("assigned_to", req.query.assigned_to);
    if (req.query.from)         q = q.gte("created_at", req.query.from);
    if (req.query.to)           q = q.lte("created_at", req.query.to + "T23:59:59");
    const { data, error } = await q;
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/service/:id
router.get("/:id", async (req, res) => {
  const { data, error } = await db.from("nk_service_requests")
    .select("*, nk_customers(name,phone,address), nk_users!nk_service_requests_assigned_to_fkey(name), nk_stores(name), nk_purchases(product_name, brand, model, purchase_date)")
    .eq("id", req.params.id).single();
  if (error) return res.status(404).json({ success: false, error: "Not found" });
  res.json({ success: true, data });
});

// POST /api/service — supports walk-in customers (no customer_id)
router.post("/", async (req, res) => {
  try {
    const body = { ...req.body };
    if (!body.customer_id) body.customer_id = null;
    const { data, error } = await db.from("nk_service_requests").insert(body).select("*, nk_customers(name,phone)").single();
    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/service/:id
router.put("/:id", async (req, res) => {
  const body = { ...req.body, updated_at: new Date().toISOString() };
  if (body.status === "resolved" && !body.resolved_date) body.resolved_date = new Date().toISOString().split("T")[0];
  const { data, error } = await db.from("nk_service_requests").update(body).eq("id", req.params.id).select().single();
  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true, data });
});

module.exports = router;
