const express = require("express");
const router = express.Router();
const supabase = require("../supabase");

router.get("/stats", async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const today = now.toISOString().split("T")[0];

    const [
      { data: leadsThisMonth },
      { data: allLeads },
      { data: pendingFollowUps },
      { data: pendingService },
      { data: purchases },
      { data: stores },
    ] = await Promise.all([
      supabase.from("retail_leads").select("id, status").gte("created_at", monthStart),
      supabase.from("retail_leads").select("id, status"),
      supabase.from("follow_ups").select("id").eq("is_done", false).eq("due_date", today),
      supabase.from("service_requests").select("id").in("status", ["pending","in-progress"]),
      supabase.from("purchases").select("amount, store_id, stores(name)").gte("purchase_date", monthStart),
      supabase.from("stores").select("id, name"),
    ]);

    const wonLeads = (allLeads || []).filter(l => l.status === "won").length;

    // Store-wise sales
    const storeWiseSales = (stores || []).map(store => {
      const storePurchases = (purchases || []).filter(p => p.store_id === store.id);
      return {
        store: store.name,
        sales: storePurchases.reduce((s, p) => s + Number(p.amount || 0), 0)
      };
    });

    res.json({
      success: true,
      data: {
        leadsThisMonth: (leadsThisMonth || []).length,
        totalLeads: (allLeads || []).length,
        wonLeads,
        pendingFollowUps: (pendingFollowUps || []).length,
        pendingService: (pendingService || []).length,
        storeWiseSales,
      }
    });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
