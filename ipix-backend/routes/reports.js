const express = require("express");
const router = express.Router();
const supabase = require("../supabase");

router.get("/summary", async (req, res) => {
  try {
    const { from, to } = req.query;
    const fromDate = from || new Date(new Date().setDate(1)).toISOString().split("T")[0];
    const toDate = to || new Date().toISOString().split("T")[0];

    const [
      { data: leads },
      { data: purchases },
      { data: emis },
      { data: stores },
    ] = await Promise.all([
      supabase.from("retail_leads").select("id, status, store_id, stores(name)").gte("created_at", fromDate).lte("created_at", toDate + "T23:59:59"),
      supabase.from("purchases").select("amount, product_name, store_id, stores(name)").gte("purchase_date", fromDate).lte("purchase_date", toDate),
      supabase.from("emi_records").select("id, status"),
      supabase.from("stores").select("id, name"),
    ]);

    const wonLeads = (leads || []).filter(l => l.status === "won").length;
    const totalSales = (purchases || []).reduce((s, p) => s + Number(p.amount || 0), 0);
    const activeEMIs = (emis || []).filter(e => e.status === "active").length;

    // Store performance
    const storePerformance = (stores || []).map(store => {
      const storeLeads = (leads || []).filter(l => l.store_id === store.id);
      const storePurchases = (purchases || []).filter(p => p.store_id === store.id);
      return {
        store: store.name,
        leads: storeLeads.length,
        won: storeLeads.filter(l => l.status === "won").length,
        sales: storePurchases.reduce((s, p) => s + Number(p.amount || 0), 0),
      };
    });

    // Top products
    const productCounts = {};
    (purchases || []).forEach(p => {
      productCounts[p.product_name] = (productCounts[p.product_name] || 0) + 1;
    });
    const topProducts = Object.entries(productCounts)
      .map(([product_name, count]) => ({ product_name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        totalLeads: (leads || []).length,
        wonLeads,
        totalSales,
        activeEMIs,
        storePerformance,
        topProducts,
      }
    });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
