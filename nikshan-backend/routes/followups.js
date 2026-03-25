const express = require("express");
const router  = express.Router();
const db      = require("../supabase");

router.get("/", async (req, res) => {
  try {
    let q = db.from("nk_follow_ups").select("*, nk_customers(name,phone), nk_leads(name,phone), nk_users!nk_follow_ups_assigned_to_fkey(name)").order("due_date");
    if (req.query.assigned_to) q = q.eq("assigned_to", req.query.assigned_to);
    if (req.query.done !== undefined) q = q.eq("done", req.query.done === "true");
    if (req.query.customer_id) q = q.eq("customer_id", req.query.customer_id);
    const today = new Date().toISOString().split("T")[0];
    if (req.query.due === "today") q = q.eq("due_date", today);
    else if (req.query.due === "overdue") q = q.lt("due_date", today).eq("done", false);
    const { data, error } = await q;
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/", async (req, res) => {
  const { data, error } = await db.from("nk_follow_ups").insert(req.body).select().single();
  if (error) return res.status(500).json({ success: false, error: error.message });
  res.status(201).json({ success: true, data });
});

router.patch("/:id/done", async (req, res) => {
  const { data, error } = await db.from("nk_follow_ups").update({ done: true, done_at: new Date().toISOString(), outcome: req.body.outcome || "" }).eq("id", req.params.id).select().single();
  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true, data });
});

router.put("/:id", async (req, res) => {
  const { data, error } = await db.from("nk_follow_ups").update(req.body).eq("id", req.params.id).select().single();
  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true, data });
});

module.exports = router;
