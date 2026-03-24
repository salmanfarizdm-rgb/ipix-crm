const express = require("express");
const router = express.Router();
const supabase = require("../supabase");

router.get("/", async (req, res) => {
  try {
    const { customer_id, store_id, search } = req.query;
    let query = supabase
      .from("purchases")
      .select("*, customers(name), stores(name)")
      .order("purchase_date", { ascending: false });

    if (customer_id) query = query.eq("customer_id", customer_id);
    if (store_id)    query = query.eq("store_id", store_id);
    if (search)      query = query.or(`product_name.ilike.%${search}%,brand.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) throw error;
    const mapped = data.map(p => ({ ...p, customer_name: p.customers?.name, store_name: p.stores?.name, customers: undefined, stores: undefined }));
    res.json({ success: true, data: mapped });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get("/:id", async (req, res) => {
  try {
    const { data, error } = await supabase.from("purchases").select("*").eq("id", req.params.id).single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post("/", async (req, res) => {
  try {
    const { customer_id, store_id, product_name, brand, category, amount, payment_type, purchase_date, invoice_number } = req.body;
    if (!customer_id || !product_name || !amount) return res.status(400).json({ success: false, error: "customer_id, product_name, amount required" });
    const { data, error } = await supabase.from("purchases")
      .insert([{ customer_id, store_id, product_name, brand, category, amount: Number(amount), payment_type, purchase_date, invoice_number }])
      .select().single();
    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put("/:id", async (req, res) => {
  try {
    const allowed = ["product_name","brand","category","amount","payment_type","purchase_date","invoice_number"];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const { data, error } = await supabase.from("purchases").update(updates).eq("id", req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
