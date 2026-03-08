const express = require("express");
const router = express.Router();
const supabase = require("../supabase");

/* ── GET dashboard stats ── */
router.get("/stats", async (req, res) => {
  try {
    const { data: leads, error } = await supabase.from("leads").select("*");
    if (error) throw error;

    const today = new Date().toISOString().split("T")[0];
    const active = ["New","Contacted","Qualified","Scope","Proposal Sent","Negotiation","Closing Soon"];

    const stats = {
      totalLeads:      leads.length,
      activeLeads:     leads.filter(l => active.includes(l.status)).length,
      wonLeads:        leads.filter(l => l.status === "Won").length,
      lostLeads:       leads.filter(l => l.status === "Lost").length,
      disqualified:    leads.filter(l => l.status === "Disqualified").length,
      totalPipeline:   leads.filter(l => active.includes(l.status)).reduce((s,l) => s + (l.deal_value||0), 0),
      totalRevenue:    leads.filter(l => l.status === "Won").reduce((s,l) => s + (l.deal_value||0), 0),
      pendingApproval: leads.filter(l => l.assign_status === "pending").length,
      todayFollowUps:  leads.filter(l => l.follow_up_date === today).length,
      byStatus: active.map(status => ({
        status,
        count: leads.filter(l => l.status === status).length,
        value: leads.filter(l => l.status === status).reduce((s,l) => s + (l.deal_value||0), 0)
      })),
      bySource: [...new Set(leads.map(l => l.source))].map(source => ({
        source,
        count: leads.filter(l => l.source === source).length,
        won:   leads.filter(l => l.source === source && l.status === "Won").length
      })),
      byService: [...new Set(leads.map(l => l.service).filter(Boolean))].map(service => ({
        service,
        count: leads.filter(l => l.service === service).length,
        won:   leads.filter(l => l.service === service && l.status === "Won").length
      })),
      byExec: [...new Set(leads.map(l => l.assigned_to).filter(Boolean))].map(exec => ({
        exec,
        total: leads.filter(l => l.assigned_to === exec).length,
        won:   leads.filter(l => l.assigned_to === exec && l.status === "Won").length,
        active:leads.filter(l => l.assigned_to === exec && active.includes(l.status)).length
      }))
    };

    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ── GET leads due for follow-up today ── */
router.get("/followups", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("leads").select("id, company, contact, phone, assigned_to, status, follow_up_date, remarks")
      .eq("follow_up_date", today);
    if (error) throw error;
    res.json({ success: true, data, count: data.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ── GET aging leads (stuck in a stage too long) ── */
router.get("/aging", async (req, res) => {
  try {
    const stageLimits = { "New":2,"Contacted":3,"Qualified":7,"Scope":7,"Proposal Sent":10,"Negotiation":14,"Closing Soon":7 };
    const { data: leads, error } = await supabase
      .from("leads").select("*")
      .not("status", "in", '("Won","Lost","Disqualified")');
    if (error) throw error;

    const today = new Date();
    const aging = leads.filter(l => {
      if (!l.stage_entered_date) return false;
      const days = Math.floor((today - new Date(l.stage_entered_date)) / 86400000);
      return days > (stageLimits[l.status] || 14);
    });

    res.json({ success: true, data: aging, count: aging.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
