const express = require("express");
const router  = express.Router();
const db      = require("../supabase");

// GET /api/stores
router.get("/", async (req, res) => {
  let q = db.from("nk_stores").select("*, nk_users!nk_stores_manager_id_fkey(name)").order("name");
  if (req.query.active !== undefined) q = q.eq("active", req.query.active !== 'false');
  const { data, error } = await q;
  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true, data });
});

// GET /api/stores/:id
router.get("/:id", async (req, res) => {
  const { data, error } = await db.from("nk_stores").select("*, nk_users!nk_stores_manager_id_fkey(name)").eq("id", req.params.id).single();
  if (error) return res.status(404).json({ success: false, error: "Not found" });
  res.json({ success: true, data });
});

// POST /api/stores
router.post("/", async (req, res) => {
  const { data, error } = await db.from("nk_stores").insert(req.body).select().single();
  if (error) return res.status(500).json({ success: false, error: error.message });
  res.status(201).json({ success: true, data });
});

// PUT /api/stores/:id
router.put("/:id", async (req, res) => {
  const { data, error } = await db.from("nk_stores").update({ ...req.body, updated_at: new Date().toISOString() }).eq("id", req.params.id).select().single();
  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true, data });
});

// DELETE /api/stores/:id — soft delete
router.delete("/:id", async (req, res) => {
  const { error } = await db.from("nk_stores").update({ active: false }).eq("id", req.params.id);
  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true });
});

module.exports = router;
