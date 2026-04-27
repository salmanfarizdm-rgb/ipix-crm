const express = require("express");
const router  = express.Router();
const db      = require("../supabase");

router.get("/summary", async (req, res) => {
  try {
    const from = req.query.from || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
    const to   = req.query.to   || new Date().toISOString().split("T")[0];
    const fromTs = from + "T00:00:00";
    const toTs   = to   + "T23:59:59";

    const [purchases, leads, emi, service, storeData, customers, allCustomers, users] = await Promise.all([
      db.from("nk_purchases").select("id, amount, payment_type, store_id, sold_by, product_name, brand, purchase_date, nk_stores(name)").gte("purchase_date", from).lte("purchase_date", to),
      db.from("nk_leads").select("id, status, store_id, source, lost_reason, created_at").gte("created_at", fromTs).lte("created_at", toTs),
      db.from("nk_emi_records").select("id, bank_name, loan_amount, monthly_emi, tenure_months, status, customer_id, nk_customers(name, phone)").order("created_at", { ascending: false }),
      db.from("nk_service_requests").select("id, status, request_type, assigned_to, created_at, resolved_at, nk_users(name)").gte("created_at", fromTs).lte("created_at", toTs),
      db.from("nk_stores").select("id, name"),
      db.from("nk_customers").select("id, created_at, source").gte("created_at", fromTs).lte("created_at", toTs),
      db.from("nk_customers").select("id, created_at, source, name, phone, nk_purchases(amount)"),
      db.from("nk_users").select("id, name, role")
    ]);

    // ── Sales Summary ──
    const p = purchases.data || [];
    const totalSales = p.reduce((s, x) => s + parseFloat(x.amount || 0), 0);
    const cashSales  = p.filter(x => x.payment_type === "cash").reduce((s, x) => s + parseFloat(x.amount || 0), 0);
    const emiSales   = p.filter(x => x.payment_type === "emi").reduce((s, x) => s + parseFloat(x.amount || 0), 0);
    const cardSales  = p.filter(x => ["card","upi"].includes(x.payment_type)).reduce((s, x) => s + parseFloat(x.amount || 0), 0);
    const avgOrder   = p.length > 0 ? Math.round(totalSales / p.length) : 0;

    // Payment type breakdown for pie
    const payBreakdown = ["cash","card","upi","emi","exchange"].map(t => ({
      name: t.toUpperCase(), value: p.filter(x => x.payment_type === t).reduce((s,x)=>s+parseFloat(x.amount||0),0)
    })).filter(x => x.value > 0);

    // Store performance
    const storePerformance = (storeData.data || []).map(store => ({
      name: store.name,
      sales: p.filter(x => x.store_id === store.id).reduce((s, x) => s + parseFloat(x.amount || 0), 0),
      leads: (leads.data || []).filter(l => l.store_id === store.id).length,
      won:   (leads.data || []).filter(l => l.store_id === store.id && l.status === "won").length
    }));

    // Top products (by sales count)
    const productMap = {};
    p.forEach(x => {
      const key = `${x.brand || ''} ${x.product_name}`.trim();
      if (!productMap[key]) productMap[key] = { name: x.product_name, brand: x.brand || '', qty: 0, revenue: 0 };
      productMap[key].qty++;
      productMap[key].revenue += parseFloat(x.amount || 0);
    });
    const topProducts = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    // Top 5 staff by revenue
    const userMap = {};
    (users.data || []).forEach(u => { userMap[u.id] = u.name; });
    const staffRev = {};
    p.forEach(x => {
      if (!x.sold_by) return;
      staffRev[x.sold_by] = (staffRev[x.sold_by] || 0) + parseFloat(x.amount || 0);
    });
    const topStaff = Object.entries(staffRev).map(([id, rev]) => ({ name: userMap[id] || id, revenue: Math.round(rev) }))
      .sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // ── Customer Analytics ──
    const newCusts = (customers.data || []).length;
    const allC = allCustomers.data || [];
    const repeatCustomers = allC.filter(c => (c.nk_purchases?.length || 0) > 1).length;
    const repeatRate = allC.length > 0 ? Math.round((repeatCustomers / allC.length) * 100) : 0;

    const sourceBreakdown = ["walk-in","online","referral","lead"].map(s => ({
      name: s, value: (customers.data || []).filter(c => c.source === s).length
    })).filter(x => x.value > 0);

    const topCustomers = allC
      .map(c => ({ name: c.name, phone: c.phone, total: (c.nk_purchases || []).reduce((s, p) => s + parseFloat(p.amount || 0), 0) }))
      .sort((a, b) => b.total - a.total).slice(0, 10);

    // ── Lead Analytics ──
    const l = leads.data || [];
    const leadsByStatus = ["new","contacted","quoted","negotiating","won","lost"].map(s => ({
      status: s, count: l.filter(x => x.status === s).length
    }));
    const lostReasons = {};
    l.filter(x => x.status === "lost" && x.lost_reason).forEach(x => {
      lostReasons[x.lost_reason] = (lostReasons[x.lost_reason] || 0) + 1;
    });
    const lostReasonBreakdown = Object.entries(lostReasons).map(([reason, count]) => ({ reason, count }));

    const leadSources = {};
    l.forEach(x => { if (x.source) leadSources[x.source] = (leadSources[x.source] || 0) + 1; });
    const leadSourceBreakdown = Object.entries(leadSources).map(([source, count]) => ({ source, count }));

    // ── EMI Report ──
    const emiData = (emi.data || []).filter(e => e.status === "active");
    const totalEmiValue = emiData.reduce((s, e) => s + parseFloat(e.loan_amount || 0), 0);
    const emiList = emiData.map(e => ({
      name: e.nk_customers?.name || "—",
      phone: e.nk_customers?.phone || "—",
      bank: e.bank_name,
      monthly: e.monthly_emi,
      tenure: e.tenure_months,
      status: e.status
    }));

    const bankBreakdown = {};
    (emi.data || []).forEach(e => { bankBreakdown[e.bank_name] = (bankBreakdown[e.bank_name] || 0) + 1; });

    // ── Service Report ──
    const svc = service.data || [];
    const svcByType = ["installation","repair","complaint","return","replacement"].map(t => ({
      type: t, count: svc.filter(x => x.request_type === t).length
    }));
    const svcByTech = {};
    svc.forEach(x => {
      const name = x.nk_users?.name || "Unassigned";
      if (!svcByTech[name]) svcByTech[name] = { assigned: 0, resolved: 0 };
      svcByTech[name].assigned++;
      if (x.status === "resolved") svcByTech[name].resolved++;
    });
    const techPerformance = Object.entries(svcByTech).map(([name, s]) => ({ name, ...s }));

    res.json({
      success: true,
      data: {
        // Sales
        totalSales, cashSales, emiSales, cardSales, avgOrder,
        totalTransactions: p.length,
        payBreakdown, storePerformance, topProducts, topStaff,
        // Customers
        newCustomers: newCusts, repeatRate, sourceBreakdown, topCustomers,
        // Leads
        totalLeads: l.length,
        wonLeads: l.filter(x => x.status === "won").length,
        conversionRate: l.length > 0 ? Math.round((l.filter(x => x.status === "won").length / l.length) * 100) : 0,
        leadsByStatus, lostReasonBreakdown, leadSourceBreakdown,
        // EMI
        activeEMIs: emiData.length, totalEmiValue, emiList, bankBreakdown,
        totalEMIs: (emi.data || []).length,
        // Service
        totalService: svc.length,
        resolvedService: svc.filter(x => x.status === "resolved").length,
        svcByType, techPerformance
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
