const express = require("express");
const router  = express.Router();
const db      = require("../supabase");

function genInvoiceNumber() {
  const d = new Date();
  const dp = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  return `INV-${dp}-${Math.floor(1000+Math.random()*9000)}`;
}

router.get("/", async (req, res) => {
  try {
    let q = db.from("nk_purchases").select("*, nk_customers(name,phone), nk_stores(name), nk_users!nk_purchases_sold_by_fkey(name), nk_invoices(invoice_number,payment_type,grand_total,purchase_date)").order("created_at",{ascending:false});
    if (req.query.customer_id)  q = q.eq("customer_id",  req.query.customer_id);
    if (req.query.store_id)     q = q.eq("store_id",     req.query.store_id);
    if (req.query.payment_type) q = q.eq("payment_type", req.query.payment_type);
    if (req.query.invoice_id)   q = q.eq("invoice_id",   req.query.invoice_id);
    if (req.query.status)       q = q.eq("status",       req.query.status);
    if (req.query.from)         q = q.gte("purchase_date", req.query.from);
    if (req.query.to)           q = q.lte("purchase_date", req.query.to);
    const { data, error } = await q;
    if (error) throw error;
    res.json({ success:true, data });
  } catch (err) { res.status(500).json({ success:false, error:err.message }); }
});

router.get("/invoices", async (req, res) => {
  try {
    let q = db.from("nk_invoices").select("*, nk_customers(name,phone), nk_stores(name), nk_users!nk_invoices_sold_by_fkey(name), nk_purchases(id,product_name,brand,model,actual_price,final_price,is_gift,quantity,discount_type,discount_value,status,category)").order("created_at",{ascending:false});
    if (req.query.customer_id) q = q.eq("customer_id", req.query.customer_id);
    if (req.query.store_id)    q = q.eq("store_id",    req.query.store_id);
    if (req.query.status)      q = q.eq("status",      req.query.status);
    if (req.query.from)        q = q.gte("purchase_date", req.query.from);
    if (req.query.to)          q = q.lte("purchase_date", req.query.to);
    const { data, error } = await q;
    if (error) throw error;
    res.json({ success:true, data });
  } catch (err) { res.status(500).json({ success:false, error:err.message }); }
});

router.get("/:id", async (req, res) => {
  const { data, error } = await db.from("nk_purchases").select("*, nk_customers(name,phone), nk_stores(name), nk_users!nk_purchases_sold_by_fkey(name), nk_emi_records(*)").eq("id", req.params.id).single();
  if (error) return res.status(404).json({ success:false, error:"Not found" });
  res.json({ success:true, data });
});

router.post("/cart", async (req, res) => {
  const { customer_id, store_id, sold_by, payment_type, emi_bank, items, notes, purchase_date, split_payment, payment_type2, amount1, amount2 } = req.body;
  if (!items?.length) return res.status(400).json({ success:false, error:"No items in cart" });
  try {
    const nonGift = items.filter(i => !i.is_gift);
    const subtotal            = nonGift.reduce((s,i) => s + parseFloat(i.actual_price||0)*(i.quantity||1), 0);
    const totalDiscount       = nonGift.reduce((s,i) => s + ((parseFloat(i.actual_price||0)*(i.quantity||1)) - parseFloat(i.final_price||i.actual_price||0)*(i.quantity||1)), 0);
    const gstTotal            = nonGift.reduce((s,i) => s + parseFloat(i.gst_amount||0), 0);
    const subtotalBeforeGst   = nonGift.reduce((s,i) => s + parseFloat(i.final_price||0)*(i.quantity||1), 0);
    const grandTotalWithGst   = subtotalBeforeGst + gstTotal;

    const { data: invoice, error: invErr } = await db.from("nk_invoices").insert({
      invoice_number: genInvoiceNumber(), customer_id, store_id, sold_by,
      payment_type, emi_bank: emi_bank||null, subtotal, total_discount: totalDiscount,
      subtotal_before_gst: subtotalBeforeGst, gst_total: gstTotal, grand_total: grandTotalWithGst,
      split_payment: !!split_payment,
      payment_type2: split_payment ? payment_type2 : null,
      amount1: split_payment ? amount1 : null,
      amount2: split_payment ? amount2 : null,
      notes: notes||null,
      purchase_date: purchase_date||new Date().toISOString().split('T')[0], status:'active'
    }).select("*, nk_stores(name,phone,address,gstin), nk_customers(name,phone,address)").single();
    if (invErr) throw invErr;

    const lineItems = items.map(item => ({
      customer_id, store_id, sold_by, invoice_id: invoice.id,
      product_name:  item.product_name,
      brand:         item.brand||null,
      model:         item.model_number||item.model||null,
      category:      item.category||null,
      product_id:    item.product_id||null,
      actual_price:  parseFloat(item.actual_price||0),
      discount_type: item.is_gift ? 'none' : (item.discount_type||'none'),
      discount_value: item.is_gift ? 0 : parseFloat(item.discount_value||0),
      final_price:   item.is_gift ? 0 : parseFloat(item.final_price||item.actual_price||0),
      amount:        item.is_gift ? 0 : parseFloat(item.final_price||item.actual_price||0),
      quantity:      parseInt(item.quantity||1),
      is_gift:       !!item.is_gift,
      gst_percentage:  parseFloat(item.gst_percentage||0),
      gst_amount:      parseFloat(item.gst_amount||0),
      taxable_amount:  parseFloat(item.final_price||0) * (parseInt(item.quantity||1)),
      warranty_months: item.is_gift ? 0 : parseInt(item.warranty_months||0),
      warranty_expiry: item.is_gift ? null : (item.warranty_expiry||null),
      payment_type, emi_bank: emi_bank||null,
      purchase_date: purchase_date||new Date().toISOString().split('T')[0],
      status: 'active'
    }));

    const { data: purchases, error: pErr } = await db.from("nk_purchases").insert(lineItems).select();
    if (pErr) throw pErr;

    const stockUpdates = items.filter(i => !i.is_gift && i.product_id).map(async (item) => {
      const { data: prod } = await db.from("nk_products").select("stock_count").eq("id", item.product_id).single()
      if (prod) {
        const newCount = Math.max(0, (prod.stock_count || 0) - (item.quantity || 1))
        await db.from("nk_products").update({ stock_count: newCount }).eq("id", item.product_id)
      }
    })
    await Promise.all(stockUpdates)

    res.status(201).json({ success:true, invoice, purchases });
  } catch (err) { res.status(500).json({ success:false, error:err.message }); }
});

router.post("/", async (req, res) => {
  const { data, error } = await db.from("nk_purchases").insert(req.body).select("*, nk_customers(name,phone)").single();
  if (error) return res.status(500).json({ success:false, error:error.message });
  res.status(201).json({ success:true, data });
});

router.put("/:id", async (req, res) => {
  const { data, error } = await db.from("nk_purchases").update(req.body).eq("id", req.params.id).select().single();
  if (error) return res.status(500).json({ success:false, error:error.message });
  res.json({ success:true, data });
});

router.patch("/:id/cancel", async (req, res) => {
  const { reason } = req.body;
  if (!reason) return res.status(400).json({ success:false, error:"Cancellation reason required" });
  const { data, error } = await db.from("nk_purchases").update({ status:'cancelled', cancel_reason:reason }).eq("id", req.params.id).select().single();
  if (error) return res.status(500).json({ success:false, error:error.message });
  res.json({ success:true, data });
});

router.patch("/invoices/:id/cancel", async (req, res) => {
  const { reason } = req.body;
  if (!reason) return res.status(400).json({ success:false, error:"Reason required" });
  const [invR, pR] = await Promise.all([
    db.from("nk_invoices").update({ status:'cancelled', cancel_reason:reason }).eq("id", req.params.id).select().single(),
    db.from("nk_purchases").update({ status:'cancelled', cancel_reason:reason }).eq("invoice_id", req.params.id).select()
  ]);
  if (invR.error) return res.status(500).json({ success:false, error:invR.error.message });
  res.json({ success:true, invoice:invR.data, purchases:pR.data });
});

module.exports = router;
