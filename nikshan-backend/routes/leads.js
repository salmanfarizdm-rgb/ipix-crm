const express = require("express");
const router  = express.Router();
const db      = require("../supabase");

router.get("/", async (req, res) => {
  try {
    let q = db.from("nk_leads").select("*, nk_stores(name), nk_users!nk_leads_assigned_to_fkey(name,role), nk_users!nk_leads_converted_by_fkey(name)").order("created_at", { ascending: false });
    if (req.query.status) q = q.eq("status", req.query.status);
    if (req.query.store_id) q = q.eq("store_id", req.query.store_id);
    if (req.query.assigned_to) q = q.eq("assigned_to", req.query.assigned_to);
    if (req.query.search) q = q.or(`name.ilike.%${req.query.search}%,phone.ilike.%${req.query.search}%`);
    const { data, error } = await q;
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  const { data, error } = await db.from("nk_leads").select("*, nk_stores(name), nk_users!nk_leads_assigned_to_fkey(name), nk_users!nk_leads_converted_by_fkey(name), nk_lead_attendees(*, nk_users(name, role))").eq("id", req.params.id).single();
  if (error) return res.status(404).json({ success: false, error: "Lead not found" });
  res.json({ success: true, data });
});

router.post("/", async (req, res) => {
  const { data, error } = await db.from("nk_leads").insert(req.body).select().single();
  if (error) return res.status(500).json({ success: false, error: error.message });
  res.status(201).json({ success: true, data });
});

router.put("/:id", async (req, res) => {
  const { data, error } = await db.from("nk_leads").update({ ...req.body, updated_at: new Date().toISOString() }).eq("id", req.params.id).select().single();
  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true, data });
});

// PATCH status — critical Won flow
router.patch("/:id/status", async (req, res) => {
  try {
    const { status, converted_by, lost_reason } = req.body;
    const updateData = { status, updated_at: new Date().toISOString() };
    if (status === "won") { updateData.won_at = new Date().toISOString(); updateData.converted_by = converted_by; }
    if (status === "lost" && lost_reason) { updateData.lost_reason = lost_reason; }

    const { data: lead, error: leadErr } = await db.from("nk_leads").update(updateData).eq("id", req.params.id).select().single();
    if (leadErr) throw leadErr;

    let customer = null;
    if (status === "won") {
      // Check if customer with same phone exists
      const { data: existing } = await db.from("nk_customers").select("*").eq("phone", lead.phone).maybeSingle();
      if (existing) {
        customer = existing;
      } else {
        const { data: newCust, error: custErr } = await db.from("nk_customers").insert({
          name: lead.name, phone: lead.phone, email: lead.email || null,
          store_id: lead.store_id, source: "lead", created_by: converted_by
        }).select().single();
        if (custErr) throw custErr;
        customer = newCust;
      }
      // Link customer to lead
      await db.from("nk_leads").update({ customer_id: customer.id }).eq("id", lead.id);
    }

    res.json({ success: true, data: lead, customer });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add attendee to lead
router.post("/:id/attendees", async (req, res) => {
  const { data, error } = await db.from("nk_lead_attendees").insert({ ...req.body, lead_id: req.params.id }).select("*, nk_users(name, role)").single();
  if (error) return res.status(500).json({ success: false, error: error.message });
  res.status(201).json({ success: true, data });
});

module.exports = router;
