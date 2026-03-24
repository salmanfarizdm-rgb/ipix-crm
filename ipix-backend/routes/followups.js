const express = require("express");
const router = express.Router();
const supabase = require("../supabase");

router.get("/", async (req, res) => {
  try {
    const { customer_id, lead_id, due, done } = req.query;
    let query = supabase
      .from("follow_ups")
      .select("*, customers(name), retail_leads(customer_name)")
      .order("due_date", { ascending: true });

    if (customer_id) query = query.eq("customer_id", customer_id);
    if (lead_id)     query = query.eq("lead_id", lead_id);
    if (done !== undefined) query = query.eq("is_done", done === "true");
    if (due === "today") {
      const today = new Date().toISOString().split("T")[0];
      query = query.eq("due_date", today);
    }

    const { data, error } = await query;
    if (error) throw error;
    const mapped = data.map(f => ({
      ...f,
      customer_name: f.customers?.name,
      lead_name: f.retail_leads?.customer_name,
      customers: undefined,
      retail_leads: undefined
    }));
    res.json({ success: true, data: mapped });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post("/", async (req, res) => {
  try {
    const { lead_id, customer_id, user_id, note, due_date } = req.body;
    if (!note || !due_date) return res.status(400).json({ success: false, error: "note and due_date required" });
    const { data, error } = await supabase.from("follow_ups")
      .insert([{ lead_id, customer_id, user_id, note, due_date, is_done: false }])
      .select().single();
    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.patch("/:id/done", async (req, res) => {
  try {
    const { data, error } = await supabase.from("follow_ups").update({ is_done: true }).eq("id", req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put("/:id", async (req, res) => {
  try {
    const { note, due_date, is_done } = req.body;
    const { data, error } = await supabase.from("follow_ups").update({ note, due_date, is_done }).eq("id", req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
