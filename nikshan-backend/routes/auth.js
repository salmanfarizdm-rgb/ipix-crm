const express = require("express");
const router  = express.Router();
const supabase = require("../supabase");
const { supabaseAuth } = require("../supabase");

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, error: "Email and password required" });

    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({ email, password });
    if (authError) throw authError;

    const { data: profile, error: profileError } = await supabase
      .from("nk_users").select("*").eq("auth_id", authData.user.id).single();
    if (profileError) throw new Error("User profile not found");
    if (!profile.active) return res.status(403).json({ success: false, error: "Account deactivated. Contact admin." });

    await supabase.from("nk_users").update({ last_login: new Date().toISOString() }).eq("id", profile.id);

    res.json({ success: true, token: authData.session.access_token, user: { id: profile.id, name: profile.name, email: profile.email, role: profile.role, store_id: profile.store_id, avatar: profile.avatar || null } });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(401).json({ success: false, error: "Invalid email or password" });
  }
});

router.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ success: false, error: "No token" });
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) throw new Error("Invalid token");
    const { data: profile } = await supabase.from("nk_users").select("*, nk_stores(name)").eq("auth_id", user.id).single();
    res.json({ success: true, data: profile });
  } catch (err) {
    res.status(401).json({ success: false, error: "Unauthorized" });
  }
});

router.post("/logout", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) await supabase.auth.admin.signOut(token);
  } catch (_) {}
  res.json({ success: true });
});

module.exports = router;
