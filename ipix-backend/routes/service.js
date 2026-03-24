const express = require("express");
const router = express.Router();
const supabase = require("../supabase");

router.get("/", async (req, res) => {
  try {
    const { customer_id, status, store_id } = req.query;
    let query = supabase.from("service_requests").select("*, customers(name), stores(name)").order("created_at", { ascending: false });
    if (customer_id) query = query.eq("customer_id", customer_id);
    if (status)      query = query.eq("status", status);
    if (store_id)    query = query.eq("store_id", store_id);
    const { data, error } = await query;
    if (error) throw error;
    const mapped = data.map(r => ({ ...r, customer_name: r.customers?.name, store_name: r.stores?.name, customers: undefined, stores: undefined }));
    res.json({ success: true, data: mapped });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get("/:id", async (req, res) => {
  try {
    const { data, error } = await supabase.from("service_requests").select("*").eq("id", req.params.id).single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post("/", async (req, res) => {
  try {
    const { customer_id, purchase_id, store_id, type, description, assigned_technician, status, scheduled_date } = req.body;
    if (!customer_id || !description) return res.status(400).json({ success: false, error: "customer_id and description required" });
    const { data, error } = await supabase.from("service_requests")
      .insert([{ customer_id, purchase_id, store_id, type, description, assigned_technician, status: status || "pending", scheduled_date }])
      .select().single();
    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put("/:id", async (req, res) => {
  try {
    const allowed = ["type","description","assigned_technician","status","scheduled_date","resolved_date"];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    if (req.body.status === "resolved" && !updates.resolved_date) updates.resolved_date = new Date().toISOString();
    const { data, error } = await supabase.from("service_requests").update(updates).eq("id", req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
