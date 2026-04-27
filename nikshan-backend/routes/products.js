const express = require("express");
const router  = express.Router();
const db      = require("../supabase");

// GET /api/products — search or list all
router.get("/", async (req, res) => {
  try {
    let q = db.from("nk_products").select("*").eq("active", true).order("brand").order("product_name");
    if (req.query.search) {
      q = q.or(`model_number.ilike.%${req.query.search}%,product_name.ilike.%${req.query.search}%,brand.ilike.%${req.query.search}%`);
    }
    if (req.query.category) q = q.eq("category", req.query.category);
    const { data, error } = await q;
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/products/:id
router.get("/:id", async (req, res) => {
  const { data, error } = await db.from("nk_products").select("*").eq("id", req.params.id).single();
  if (error) return res.status(404).json({ success: false, error: "Not found" });
  res.json({ success: true, data });
});

// POST /api/products
router.post("/", async (req, res) => {
  const { data, error } = await db.from("nk_products").insert(req.body).select().single();
  if (error) return res.status(500).json({ success: false, error: error.message });
  res.status(201).json({ success: true, data });
});

// PUT /api/products/:id
router.put("/:id", async (req, res) => {
  const { data, error } = await db.from("nk_products").update({ ...req.body, updated_at: new Date().toISOString() }).eq("id", req.params.id).select().single();
  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true, data });
});

// DELETE /api/products/:id — soft delete
router.delete("/:id", async (req, res) => {
  const { error } = await db.from("nk_products").update({ active: false }).eq("id", req.params.id);
  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true });
});

module.exports = router;
