const express = require("express");
const router  = express.Router();
const db      = require("../supabase");

router.get("/stats", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];

    const [customers, leadsMonth, revenue, followups, service, wonLeads, recentLeads, todayFollowups] = await Promise.all([
      db.from("nk_customers").select("id", { count: "exact", head: true }),
      db.from("nk_leads").select("id", { count: "exact", head: true }).gte("created_at", firstOfMonth),
      db.from("nk_purchases").select("amount").gte("purchase_date", firstOfMonth),
      db.from("nk_follow_ups").select("id", { count: "exact", head: true }).eq("done", false).lte("due_date", today),
      db.from("nk_service_requests").select("id", { count: "exact", head: true }).in("status", ["pending","in_progress"]),
      db.from("nk_leads").select("id", { count: "exact", head: true }).eq("status", "won").gte("won_at", firstOfMonth),
      db.from("nk_leads").select("name,phone,status,product_interest,created_at,nk_users!nk_leads_assigned_to_fkey(name)").order("created_at", { ascending: false }).limit(6),
      db.from("nk_follow_ups").select("*, nk_customers(name), nk_leads(name), nk_users!nk_follow_ups_assigned_to_fkey(name)").eq("due_date", today).eq("done", false).limit(5)
    ]);

    const totalRevenue = (revenue.data || []).reduce((s, r) => s + parseFloat(r.amount || 0), 0);

    res.json({
      success: true,
      data: {
        totalCustomers: customers.count || 0,
        leadsThisMonth: leadsMonth.count || 0,
        revenueThisMonth: totalRevenue,
        pendingFollowups: followups.count || 0,
        pendingService: service.count || 0,
        wonLeadsThisMonth: wonLeads.count || 0,
        recentLeads: recentLeads.data || [],
        todayFollowups: todayFollowups.data || []
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
