const express = require("express");
const router  = express.Router();
const db      = require("../supabase");

router.get("/", async (req, res) => {
  try {
    let q = db.from("nk_customers").select("*, nk_stores(name)").order("created_at", { ascending: false });
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
    const [cust, purchases, emi, service, followups, interactions, users, stores] = await Promise.all([
      db.from("nk_customers").select("*").eq("id", id).single(),
      db.from("nk_purchases").select("*").eq("customer_id", id).order("created_at", { ascending: false }),
      db.from("nk_emi_records").select("*").eq("customer_id", id).order("created_at", { ascending: false }),
      db.from("nk_service_requests").select("*").eq("customer_id", id).order("created_at", { ascending: false }),
      db.from("nk_follow_ups").select("*").eq("customer_id", id).order("due_date", { ascending: true }),
      db.from("nk_customer_interactions").select("*").eq("customer_id", id).order("created_at", { ascending: false }),
      db.from("nk_users").select("id, name, role"),
      db.from("nk_stores").select("id, name")
    ]);
    if (cust.error) return res.status(404).json({ success: false, error: "Customer not found" });

    // Build lookup maps
    const userMap  = Object.fromEntries((users.data  || []).map(u => [u.id, u]));
    const storeMap = Object.fromEntries((stores.data || []).map(s => [s.id, s]));

    // Enrich records
    const enrichPurchase = p => ({ ...p, nk_users: userMap[p.sold_by] || null, nk_stores: storeMap[p.store_id] || null });
    const enrichSvc      = s => ({ ...s, nk_users: userMap[s.assigned_to] || null });
    const enrichFu       = f => ({ ...f, nk_users: userMap[f.assigned_to] || null });
    const enrichInt      = i => ({ ...i, nk_users: userMap[i.user_id] || null });

    res.json({ success: true, data: {
      ...cust.data,
      nk_stores: storeMap[cust.data.store_id] || null,
      purchases:    (purchases.data    || []).map(enrichPurchase),
      emi:          (emi.data          || []),
      service:      (service.data      || []).map(enrichSvc),
      followups:    (followups.data    || []).map(enrichFu),
      interactions: (interactions.data || []).map(enrichInt),
    }});
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
