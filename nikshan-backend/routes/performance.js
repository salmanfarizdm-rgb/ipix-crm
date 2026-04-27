const express = require("express");
const router  = express.Router();
const db      = require("../supabase");

router.get("/team", async (req, res) => {
  try {
    const { period = "month" } = req.query;
    const now = new Date();
    let fromDate;
    if (period === "week") { const d = new Date(); d.setDate(d.getDate() - 7); fromDate = d.toISOString(); }
    else if (period === "month") { fromDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString(); }
    else if (period === "quarter") { fromDate = new Date(now.getFullYear(), Math.floor(now.getMonth()/3)*3, 1).toISOString(); }
    else { fromDate = req.query.from ? new Date(req.query.from).toISOString() : new Date(now.getFullYear(), now.getMonth(), 1).toISOString(); }

    const toDate = req.query.to ? new Date(req.query.to + "T23:59:59").toISOString() : now.toISOString();

    // Get all sales staff
    const { data: users, error: usersErr } = await db
      .from("nk_users")
      .select("id, name, role, store_id")
      .in("role", ["sales_exec", "sales_manager", "branch_manager", "admin"]);

    if (usersErr) throw usersErr;

    // Get stores for name lookup
    const { data: stores } = await db.from("nk_stores").select("id, name");
    const storeMap = Object.fromEntries((stores || []).map(s => [s.id, s.name]));

    // Get all leads in period
    const { data: leads } = await db
      .from("nk_leads")
      .select("id, assigned_to, converted_by, status, estimated_value, won_at, created_at")
      .gte("created_at", fromDate)
      .lte("created_at", toDate);

    // Won leads in period (check both won_at and created_at for leads without won_at)
    const { data: wonLeads } = await db
      .from("nk_leads")
      .select("id, converted_by, estimated_value, won_at")
      .eq("status", "won");

    // Purchases in period
    const { data: purchases } = await db
      .from("nk_purchases")
      .select("id, sold_by, amount, purchase_date, created_at")
      .gte("created_at", fromDate)
      .lte("created_at", toDate);

    // Customer interactions in period
    const { data: attendees } = await db
      .from("nk_customer_interactions")
      .select("user_id, customer_id")
      .gte("created_at", fromDate)
      .lte("created_at", toDate);

    const stats = (users || []).map(u => {
      const assigned = (leads || []).filter(l => l.assigned_to === u.id).length;
      // Count won leads converted by this user (no date filter on won_at since it may be null)
      const won = (wonLeads || []).filter(l => l.converted_by === u.id).length;
      const revenue = (purchases || []).filter(p => p.sold_by === u.id).reduce((s, p) => s + parseFloat(p.amount || 0), 0);
      const attended = new Set((attendees || []).filter(a => a.user_id === u.id).map(a => a.customer_id)).size;
      return {
        id: u.id,
        name: u.name,
        role: u.role,
        store: storeMap[u.store_id] || "-",
        leads_assigned: assigned,
        leads_won: won,
        conversion_rate: assigned > 0 ? Math.round((won / assigned) * 100) : 0,
        customers_attended: attended,
        revenue_generated: Math.round(revenue)
      };
    })
    // Sort by revenue desc (highest first)
    .sort((a, b) => b.revenue_generated - a.revenue_generated);

    res.json({ success: true, data: stats, period });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
