const express = require("express");
const router  = express.Router();
const db      = require("../supabase");

router.get("/summary", async (req, res) => {
  try {
    const from = req.query.from || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
    const to   = req.query.to   || new Date().toISOString().split("T")[0];

    const [purchases, leads, emi, service, storeData] = await Promise.all([
      db.from("nk_purchases").select("amount, payment_type, store_id, nk_stores(name)").gte("purchase_date", from).lte("purchase_date", to),
      db.from("nk_leads").select("status, store_id").gte("created_at", from + "T00:00:00").lte("created_at", to + "T23:59:59"),
      db.from("nk_emi_records").select("id, bank_name, loan_amount, status").gte("created_at", from + "T00:00:00").lte("created_at", to + "T23:59:59"),
      db.from("nk_service_requests").select("id, status").gte("created_at", from + "T00:00:00").lte("created_at", to + "T23:59:59"),
      db.from("nk_stores").select("id, name")
    ]);

    const totalSales = (purchases.data || []).reduce((s, p) => s + parseFloat(p.amount || 0), 0);
    const cashSales  = (purchases.data || []).filter(p => p.payment_type === "cash").reduce((s, p) => s + parseFloat(p.amount || 0), 0);
    const emiSales   = (purchases.data || []).filter(p => p.payment_type === "emi").reduce((s, p) => s + parseFloat(p.amount || 0), 0);
    const cardSales  = (purchases.data || []).filter(p => ["card","upi"].includes(p.payment_type)).reduce((s, p) => s + parseFloat(p.amount || 0), 0);

    const leadsByStatus = ["new","contacted","quoted","negotiating","won","lost"].map(s => ({
      status: s, count: (leads.data || []).filter(l => l.status === s).length
    }));

    const storePerformance = (storeData.data || []).map(store => ({
      name: store.name,
      sales: (purchases.data || []).filter(p => p.store_id === store.id).reduce((s, p) => s + parseFloat(p.amount || 0), 0),
      leads: (leads.data || []).filter(l => l.store_id === store.id).length,
      won:   (leads.data || []).filter(l => l.store_id === store.id && l.status === "won").length
    }));

    const bankBreakdown = {};
    (emi.data || []).forEach(e => { bankBreakdown[e.bank_name] = (bankBreakdown[e.bank_name] || 0) + 1; });

    res.json({
      success: true,
      data: {
        totalSales, cashSales, emiSales, cardSales,
        totalTransactions: (purchases.data || []).length,
        totalLeads: (leads.data || []).length,
        wonLeads: (leads.data || []).filter(l => l.status === "won").length,
        totalEMIs: (emi.data || []).length,
        totalService: (service.data || []).length,
        leadsByStatus,
        storePerformance,
        bankBreakdown
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
