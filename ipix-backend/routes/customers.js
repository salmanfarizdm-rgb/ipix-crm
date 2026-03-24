const express = require("express");
const router = express.Router();
const supabase = require("../supabase");

router.get("/", async (req, res) => {
  try {
    const { search, store_id, tags, source, limit = 100, order = "created_at" } = req.query;
    let query = supabase
      .from("customers")
      .select("*, stores(name)")
      .order(order, { ascending: false })
      .limit(Number(limit));

    if (store_id) query = query.eq("store_id", store_id);
    if (tags)     query = query.eq("tags", tags);
    if (source)   query = query.eq("source", source);
    if (search)   query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) throw error;

    const mapped = data.map(c => ({ ...c, store_name: c.stores?.name || null, stores: undefined }));
    res.json({ success: true, data: mapped, count: mapped.length });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get("/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("customers").select("*, stores(name)").eq("id", req.params.id).single();
    if (error) throw error;
    res.json({ success: true, data: { ...data, store_name: data.stores?.name, stores: undefined } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post("/", async (req, res) => {
  try {
    const { name, phone, email, store_id, source, tags, notes } = req.body;
    if (!name || !phone) return res.status(400).json({ success: false, error: "name and phone required" });
    const { data, error } = await supabase.from("customers")
      .insert([{ name, phone, email, store_id, source: source || "walk-in", tags: tags || "regular", notes }])
      .select().single();
    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put("/:id", async (req, res) => {
  try {
    const allowed = ["name","phone","email","store_id","source","tags","notes"];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const { data, error } = await supabase.from("customers").update(updates).eq("id", req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    const { error } = await supabase.from("customers").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
