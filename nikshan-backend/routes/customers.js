const express = require("express");
const router  = express.Router();
const db      = require("../supabase");

router.get("/", async (req, res) => {
  try {
    let q = db.from("nk_customers").select("*, nk_stores(name), nk_users!nk_customers_created_by_fkey(name)").order("created_at", { ascending: false });
    if (req.query.search) q = q.or(`name.ilike.%${req.query.search}%,phone.ilike.%${req.query.search}%`);
    if (req.query.store_id) q = q.eq("store_id", req.query.store_id);
    if (req.query.source) q = q.eq("source", req.query.source);
    const { data, error } = await q;
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const [cust, purchases, emi, service, followups, interactions] = await Promise.all([
      db.from("nk_customers").select("*, nk_stores(name), nk_users!nk_customers_created_by_fkey(name)").eq("id", id).single(),
      db.from("nk_purchases").select("*, nk_users!nk_purchases_sold_by_fkey(name), nk_stores(name)").eq("customer_id", id).order("created_at", { ascending: false }),
      db.from("nk_emi_records").select("*, nk_purchases(product_name)").eq("customer_id", id).order("created_at", { ascending: false }),
      db.from("nk_service_requests").select("*, nk_users!nk_service_requests_assigned_to_fkey(name)").eq("customer_id", id).order("created_at", { ascending: false }),
      db.from("nk_follow_ups").select("*, nk_users!nk_follow_ups_assigned_to_fkey(name)").eq("customer_id", id).order("due_date", { ascending: true }),
      db.from("nk_customer_interactions").select("*, nk_users(name, role)").eq("customer_id", id).order("created_at", { ascending: false })
    ]);
    if (cust.error) return res.status(404).json({ success: false, error: "Customer not found" });
    res.json({ success: true, data: { ...cust.data, purchases: purchases.data, emi: emi.data, service: service.data, followups: followups.data, interactions: interactions.data } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/", async (req, res) => {
  const { data, error } = await db.from("nk_customers").insert(req.body).select().single();
  if (error) return res.status(500).json({ success: false, error: error.message });
  res.status(201).json({ success: true, data });
});

router.put("/:id", async (req, res) => {
  const { data, error } = await db.from("nk_customers").update({ ...req.body, updated_at: new Date().toISOString() }).eq("id", req.params.id).select().single();
  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true, data });
});

router.post("/:id/interactions", async (req, res) => {
  const { data, error } = await db.from("nk_customer_interactions").insert({ ...req.body, customer_id: req.params.id }).select("*, nk_users(name, role)").single();
  if (error) return res.status(500).json({ success: false, error: error.message });
  res.status(201).json({ success: true, data });
});

module.exports = router;
