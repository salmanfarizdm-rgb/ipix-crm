const express = require("express");
const router  = express.Router();
const db      = require("../supabase");

router.get("/", async (_, res) => {
  const { data, error } = await db.from("nk_stores").select("*, nk_users!nk_stores_manager_id_fkey(name)").order("name");
  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true, data });
});

router.post("/", async (req, res) => {
  const { data, error } = await db.from("nk_stores").insert(req.body).select().single();
  if (error) return res.status(500).json({ success: false, error: error.message });
  res.status(201).json({ success: true, data });
});

router.put("/:id", async (req, res) => {
  const { data, error } = await db.from("nk_stores").update(req.body).eq("id", req.params.id).select().single();
  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true, data });
});

module.exports = router;
