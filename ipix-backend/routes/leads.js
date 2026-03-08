const express = require("express");
const router = express.Router();
const supabase = require("../supabase");

/* ── GET all leads ── */
router.get("/", async (req, res) => {
  try {
    const { status, source, assignedTo, score, search } = req.query;
    let query = supabase.from("leads").select("*").order("created_date", { ascending: false });

    if (status)     query = query.eq("status", status);
    if (source)     query = query.eq("source", source);
    if (assignedTo) query = query.eq("assigned_to", assignedTo);
    if (score)      query = query.eq("score", score);
    if (search)     query = query.or(`company.ilike.%${search}%,contact.ilike.%${search}%,phone.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, data, count: data.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ── GET single lead ── */
router.get("/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("leads").select("*").eq("id", req.params.id).single();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: "Lead not found" });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ── POST create lead ── */
router.post("/", async (req, res) => {
  try {
    const lead = {
      company:            req.body.company || "",
      contact:            req.body.contact || "",
      phone:              req.body.phone || "",
      backup_phone:       req.body.backupPhone || "",
      email:              req.body.email || "",
      backup_email:       req.body.backupEmail || "",
      role:               req.body.role || "",
      location:           req.body.location || "",
      source:             req.body.source || "Google Ads",
      campaign:           req.body.campaign || "—",
      ad_group:           req.body.adGroup || "—",
      score:              req.body.score || "Cold",
      status:             req.body.status || "New",
      service:            req.body.service || "",
      deal_value:         Number(req.body.dealValue) || 0,
      budget_confirmed:   req.body.budgetConfirmed || false,
      timeline_confirmed: req.body.timelineConfirmed || false,
      assigned_to:        req.body.assignedTo || "",
      assign_status:      req.body.assignedTo ? "pending" : "unassigned",
      created_date:       new Date().toISOString().split("T")[0],
      stage_entered_date: new Date().toISOString().split("T")[0],
      follow_up_date:     req.body.followUpDate || "—",
      last_contact_date:  "",
      expected_credit:    "",
      remarks:            req.body.remarks || "",
      lost_reason:        "",
      disq_reason:        "",
      proposal_viewed:    false,
      proposal_viewed_at: null,
      qual_checklist:     { budget: false, decisionMaker: false, requirement: false, timeline: false },
      notes:              [],
      tasks:              [],
      history:            [{ action: "Lead Created", by: "Admin", date: new Date().toISOString().split("T")[0], time: new Date().toLocaleTimeString() }],
      credit_changes:     [],
      nps:                null
    };

    const { data, error } = await supabase.from("leads").insert([lead]).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ── PUT update lead ── */
router.put("/:id", async (req, res) => {
  try {
    const updates = {};
    const allowed = ["company","contact","phone","backup_phone","email","backup_email","role","location","source","campaign","ad_group","score","status","service","deal_value","budget_confirmed","timeline_confirmed","assigned_to","assign_status","follow_up_date","last_contact_date","expected_credit","remarks","lost_reason","disq_reason","proposal_viewed","proposal_viewed_at","qual_checklist","notes","tasks","history","credit_changes","nps","won_date","stage_entered_date"];
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const { data, error } = await supabase.from("leads").update(updates).eq("id", req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ── PATCH update lead status ── */
router.patch("/:id/status", async (req, res) => {
  try {
    const { status, lostReason, disqReason } = req.body;
    const today = new Date().toISOString().split("T")[0];
    const updates = {
      status,
      stage_entered_date: today,
      lost_reason: lostReason || "",
      disq_reason: disqReason || "",
      won_date: status === "Won" ? today : null
    };
    const { data, error } = await supabase.from("leads").update(updates).eq("id", req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ── POST bulk import ── */
router.post("/bulk", async (req, res) => {
  try {
    const { leads } = req.body;
    if (!leads || !Array.isArray(leads)) return res.status(400).json({ success: false, error: "leads array required" });

    const today = new Date().toISOString().split("T")[0];
    const rows = leads.map(l => ({
      company: l.company || "", contact: l.contact || "", phone: l.phone || "",
      backup_phone: "", email: l.email || "", backup_email: "",
      role: "", location: l.location || "Kerala",
      source: l.source || "Google Ads", campaign: "—", ad_group: "—",
      score: "Cold", status: "New", service: l.service || "",
      deal_value: Number(l.dealValue) || 0,
      budget_confirmed: false, timeline_confirmed: false,
      assigned_to: "", assign_status: "unassigned",
      created_date: l.date || today, stage_entered_date: today,
      follow_up_date: "—", last_contact_date: "", expected_credit: "",
      remarks: l.remarks || "", lost_reason: "", disq_reason: "",
      proposal_viewed: false, proposal_viewed_at: null,
      qual_checklist: { budget: false, decisionMaker: false, requirement: false, timeline: false },
      notes: [], tasks: [],
      history: [{ action: "Lead Imported", by: "Admin", date: today, time: "Now" }],
      credit_changes: [], nps: null
    }));

    const { data, error } = await supabase.from("leads").insert(rows).select();
    if (error) throw error;
    res.status(201).json({ success: true, data, imported: data.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ── DELETE lead ── */
router.delete("/:id", async (req, res) => {
  try {
    const { error } = await supabase.from("leads").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ success: true, message: "Lead deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
