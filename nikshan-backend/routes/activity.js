const express = require("express");
const router = express.Router();
const db = require("../supabase");

// GET /api/activity?customer_id=X
router.get("/", async (req, res) => {
  try {
    let q = db.from("nk_activity_log")
      .select("*, nk_users(name, role)")
      .order("created_at", { ascending: false });
    if (req.query.customer_id) q = q.eq("customer_id", req.query.customer_id);
    const { data, error } = await q;
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/activity — log an activity
router.post("/", async (req, res) => {
  try {
    const { data, error } = await db.from("nk_activity_log")
      .insert(req.body)
      .select("*, nk_users(name)")
      .single();
    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
