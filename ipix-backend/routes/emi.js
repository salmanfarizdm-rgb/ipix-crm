const express = require("express");
const router = express.Router();
const supabase = require("../supabase");

router.get("/", async (req, res) => {
  try {
    const { customer_id, status } = req.query;
    let query = supabase.from("emi_records").select("*, customers(name)").order("start_date", { ascending: false });
    if (customer_id) query = query.eq("customer_id", customer_id);
    if (status)      query = query.eq("status", status);
    const { data, error } = await query;
    if (error) throw error;
    const mapped = data.map(e => ({ ...e, customer_name: e.customers?.name, customers: undefined }));
    res.json({ success: true, data: mapped });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post("/", async (req, res) => {
  try {
    const { purchase_id, customer_id, bank_name, tenure_months, emi_amount, start_date, status } = req.body;
    const { data, error } = await supabase.from("emi_records")
      .insert([{ purchase_id, customer_id, bank_name, tenure_months: Number(tenure_months), emi_amount: Number(emi_amount), start_date, status: status || "active" }])
      .select().single();
    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const { data, error } = await supabase.from("emi_records").update({ status }).eq("id", req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
