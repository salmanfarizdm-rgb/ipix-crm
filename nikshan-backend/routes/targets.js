const express = require("express");
const router = express.Router();
const db = require("../supabase");

// GET /api/targets?month=3&year=2026
router.get("/", async (req, res) => {
  try {
    let q = db.from("nk_targets").select("*, nk_users(name, role)");
    const now = new Date();
    const month = parseInt(req.query.month) || now.getMonth() + 1;
    const year  = parseInt(req.query.year)  || now.getFullYear();
    q = q.eq("period_month", month).eq("period_year", year);
    if (req.query.target_type) q = q.eq("target_type", req.query.target_type);
    const { data, error } = await q;
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { data, error } = await db.from("nk_targets").insert(req.body).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { data, error } = await db.from("nk_targets").update(req.body).eq("id", req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { error } = await db.from("nk_targets").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
