const express = require("express");
const router = express.Router();
const supabase = require("../supabase");

router.get("/", async (req, res) => {
  try {
    const { status, store_id, assigned_to, search } = req.query;
    let query = supabase
      .from("retail_leads")
      .select("*, stores(name), users(name)")
      .order("created_at", { ascending: false });

    if (status)      query = query.eq("status", status);
    if (store_id)    query = query.eq("store_id", store_id);
    if (assigned_to) query = query.eq("assigned_to", assigned_to);
    if (search)      query = query.or(`customer_name.ilike.%${search}%,phone.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) throw error;
    const mapped = data.map(l => ({ ...l, store_name: l.stores?.name, assigned_name: l.users?.name, stores: undefined, users: undefined }));
    res.json({ success: true, data: mapped });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get("/:id", async (req, res) => {
  try {
    const { data, error } = await supabase.from("retail_leads").select("*").eq("id", req.params.id).single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post("/", async (req, res) => {
  try {
    const { customer_name, phone, email, store_id, assigned_to, status, product_interest, source, follow_up_date, notes, lost_reason } = req.body;
    if (!customer_name || !phone) return res.status(400).json({ success: false, error: "customer_name and phone required" });
    const { data, error } = await supabase.from("retail_leads")
      .insert([{ customer_name, phone, email, store_id, assigned_to, status: status || "new", product_interest, source, follow_up_date, notes, lost_reason }])
      .select().single();
    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put("/:id", async (req, res) => {
  try {
    const allowed = ["customer_name","phone","email","store_id","assigned_to","status","product_interest","source","follow_up_date","notes","lost_reason"];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const { data, error } = await supabase.from("retail_leads").update(updates).eq("id", req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const { status, lost_reason } = req.body;
    const updates = { status, lost_reason: lost_reason || null };

    // Auto-create customer if won
    if (status === "won") {
      const { data: lead } = await supabase.from("retail_leads").select("*").eq("id", req.params.id).single();
      if (lead) {
        const { data: existing } = await supabase.from("customers").select("id").eq("phone", lead.phone).single();
        if (!existing) {
          await supabase.from("customers").insert([{
            name: lead.customer_name, phone: lead.phone, email: lead.email,
            store_id: lead.store_id, source: lead.source || "walk-in", tags: "regular"
          }]);
        }
      }
    }

    const { data, error } = await supabase.from("retail_leads").update(updates).eq("id", req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    const { error } = await supabase.from("retail_leads").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
