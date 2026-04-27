const express = require("express");
const router  = express.Router();
const db      = require("../supabase");

const SCHEMA_CONTEXT = `
You are a helpful data analyst assistant for IPIX CRM — the CRM system for Nikshan Electronics stores in Kerala.

Database schema (all tables prefixed nk_):
- nk_stores: id, name, location, address, email, phone, active
- nk_users: id, name, email, role (admin/branch_manager/sales_manager/sales_exec/technician), store_id, active
- nk_customers: id, name, phone, email, address, store_id, source (walk-in/referral/online/lead), tags, created_at
- nk_leads: id, name, phone, product_interest, source, status (new/contacted/quoted/negotiating/won/lost), assigned_to (user_id), converted_by (user_id), store_id, estimated_value, lost_reason, won_at, created_at
- nk_purchases: id, customer_id, invoice_id, store_id, sold_by (user_id), product_name, brand, model, category, actual_price, discount_type, discount_value, final_price, amount, quantity, is_gift, payment_type (cash/card/upi/emi/exchange), emi_bank, purchase_date, status (active/cancelled/returned), created_at
- nk_invoices: id, invoice_number, customer_id, store_id, sold_by, payment_type, emi_bank, subtotal, total_discount, grand_total, notes, status, purchase_date, created_at
- nk_emi_records: id, purchase_id, customer_id, bank_name, loan_amount, monthly_emi, tenure_months, start_date, status (active/closed/defaulted)
- nk_service_requests: id, customer_id, store_id, assigned_to (user_id), request_type (installation/repair/complaint/return/replacement/demo_request), product_name, issue_description, status (pending/in_progress/resolved/cancelled), priority (low/normal/high/urgent), resolved_date, created_at
- nk_follow_ups: id, customer_id, lead_id, assigned_to, due_date, notes, done, created_at

Available query tools you can call (respond ONLY with a JSON object — no extra text):
{
  "action": "query",
  "table": "<table_name>",
  "filters": { "field": "value", ... },
  "date_from": "YYYY-MM-DD",
  "date_to": "YYYY-MM-DD",
  "answer_text": "A short human-readable summary of what you found / what the query will show",
  "columns_label": "Label for the main data column shown"
}

OR if you cannot answer from the database:
{ "action": "text", "answer_text": "Your answer here" }

Current date: ${new Date().toISOString().split('T')[0]}
`;

async function runQuery(action) {
  const { table, filters = {}, date_from, date_to } = action;

  const tableMap = {
    nk_purchases:       () => db.from("nk_purchases").select("*, nk_customers(name,phone), nk_stores(name), nk_users!nk_purchases_sold_by_fkey(name)").order("purchase_date",{ascending:false}),
    nk_invoices:        () => db.from("nk_invoices").select("*, nk_customers(name,phone), nk_stores(name), nk_users!nk_invoices_sold_by_fkey(name)").order("purchase_date",{ascending:false}),
    nk_leads:           () => db.from("nk_leads").select("*, nk_users!nk_leads_assigned_to_fkey(name), nk_stores(name)").order("created_at",{ascending:false}),
    nk_customers:       () => db.from("nk_customers").select("*, nk_stores(name)").order("created_at",{ascending:false}),
    nk_service_requests:() => db.from("nk_service_requests").select("*, nk_customers(name,phone), nk_stores(name), nk_users!nk_service_requests_assigned_to_fkey(name)").order("created_at",{ascending:false}),
    nk_emi_records:     () => db.from("nk_emi_records").select("*, nk_customers(name,phone)").order("created_at",{ascending:false}),
    nk_follow_ups:      () => db.from("nk_follow_ups").select("*, nk_customers(name,phone), nk_users!nk_follow_ups_assigned_to_fkey(name)").order("due_date",{ascending:true}),
  };

  const builder = tableMap[table];
  if (!builder) return [];

  let q = builder();
  for (const [field, value] of Object.entries(filters)) {
    if (value) q = q.eq(field, value);
  }
  if (date_from) q = q.gte(table === 'nk_purchases' || table === 'nk_invoices' ? 'purchase_date' : 'created_at', date_from);
  if (date_to)   q = q.lte(table === 'nk_purchases' || table === 'nk_invoices' ? 'purchase_date' : 'created_at', date_to);

  const { data, error } = await q.limit(200);
  if (error) throw error;
  return data || [];
}

// POST /api/ai-reports/query
router.post("/query", async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ success: false, error: "Query is required" });

  let Anthropic;
  try { Anthropic = require("@anthropic-ai/sdk"); }
  catch { return res.status(500).json({ success: false, error: "@anthropic-ai/sdk not installed. Run: npm install @anthropic-ai/sdk" }); }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ success: false, error: "ANTHROPIC_API_KEY not set in environment" });

  try {
    const client = new Anthropic.default({ apiKey });
    const message = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: `${SCHEMA_CONTEXT}\n\nUser question: "${query}"\n\nRespond ONLY with a valid JSON object.`
      }]
    });

    let action;
    try {
      const text = message.content[0].text.trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      action = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      return res.json({ success: true, answer: message.content[0].text, data: [], query });
    }

    if (action.action === 'text') {
      return res.json({ success: true, answer: action.answer_text, data: [], query });
    }

    const data = await runQuery(action);
    res.json({ success: true, answer: action.answer_text, data, table: action.table, query });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
