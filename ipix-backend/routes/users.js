const express = require("express");
const router = express.Router();
const supabase = require("../supabase");

/* ── GET all users (admin only) ── */
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ── GET single user ── */
router.get("/:id", async (req, res) => {
  try {
    const { data, error } = await supabase.from("users").select("*").eq("id", req.params.id).single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ── UPDATE user (name, role, active, target) ── */
router.put("/:id", async (req, res) => {
  try {
    const allowed = ["name", "role", "active", "target", "phone", "avatar"];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const { data, error } = await supabase.from("users").update(updates).eq("id", req.params.id).select().single();
    if (error) throw error;

    // If role or name changed, update auth metadata too
    if (req.body.name || req.body.role) {
      await supabase.auth.admin.updateUserById(req.params.id, {
        user_metadata: { name: req.body.name, role: req.body.role }
      });
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ── CHANGE PASSWORD ── */
router.patch("/:id/password", async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, error: "Password must be at least 6 characters" });
    }
    const { error } = await supabase.auth.admin.updateUserById(req.params.id, { password });
    if (error) throw error;
    res.json({ success: true, message: "Password updated" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ── DEACTIVATE user ── */
router.patch("/:id/deactivate", async (req, res) => {
  try {
    const { data, error } = await supabase.from("users").update({ active: false }).eq("id", req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ── DELETE user (hard delete) ── */
router.delete("/:id", async (req, res) => {
  try {
    await supabase.from("users").delete().eq("id", req.params.id);
    await supabase.auth.admin.deleteUser(req.params.id);
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
