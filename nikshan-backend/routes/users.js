const express = require("express");
const router  = express.Router();
const db      = require("../supabase");
const { supabaseAuth } = require("../supabase");

router.get("/", async (req, res) => {
  try {
    let q = db.from("nk_users").select("id, name, email, role, store_id, phone, active, last_login").order("name");
    if (req.query.store_id) q = q.eq("store_id", req.query.store_id);
    if (req.query.role) q = q.eq("role", req.query.role);
    const { data: users, error } = await q;
    if (error) throw error;
    const { data: stores } = await db.from("nk_stores").select("id, name");
    const storeMap = Object.fromEntries((stores || []).map(s => [s.id, s]));
    const enriched = (users || []).map(u => ({ ...u, nk_stores: storeMap[u.store_id] || null }));
    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  const { data, error } = await db.from("nk_users").select("*").eq("id", req.params.id).single();
  if (error) return res.status(404).json({ success: false, error: "User not found" });
  res.json({ success: true, data });
});

router.post("/", async (req, res) => {
  try {
    const { email, password, name, role, store_id, phone } = req.body;
    const { data: authData, error: authErr } = await db.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name, role } });
    if (authErr) throw authErr;
    const { data, error } = await db.from("nk_users").insert({ auth_id: authData.user.id, email, name, role, store_id, phone, active: true }).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  const { data, error } = await db.from("nk_users").update(req.body).eq("id", req.params.id).select().single();
  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true, data });
});

module.exports = router;
