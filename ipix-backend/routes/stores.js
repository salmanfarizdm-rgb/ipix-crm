const express = require("express");
const router = express.Router();
const supabase = require("../supabase");

router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase.from("stores").select("*").order("name");
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post("/", async (req, res) => {
  try {
    const { name, location, phone, email } = req.body;
    const { data, error } = await supabase.from("stores").insert([{ name, location, phone, email }]).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put("/:id", async (req, res) => {
  try {
    const { name, location, phone, email } = req.body;
    const { data, error } = await supabase.from("stores").update({ name, location, phone, email }).eq("id", req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
