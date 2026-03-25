const express = require("express");
const router = express.Router();
const supabase = require("../supabase");
const { supabaseAuth } = require("../supabase");

/* ── SIGN UP (Admin only creates users) ── */
router.post("/signup", async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name || !role) {
      return res.status(400).json({ success: false, error: "email, password, name, role are required" });
    }

    // Create auth user (admin client)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role }
    });
    if (authError) throw authError;

    // Save to users table
    const { data, error } = await supabase.from("users").insert([{
      id: authData.user.id,
      email,
      name,
      role,
      active: true,
      created_at: new Date().toISOString()
    }]).select().single();
    if (error) throw error;

    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ── LOGIN ── */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "email and password required" });
    }

    // Use anon-key client for user-facing sign-in
    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({ email, password });
    if (authError) throw authError;

    // Get user profile (admin client bypasses RLS)
    const { data: profile, error: profileError } = await supabase
      .from("users").select("*").eq("id", authData.user.id).single();
    if (profileError) throw profileError;

    if (!profile.active) {
      return res.status(403).json({ success: false, error: "Account is deactivated. Contact admin." });
    }

    // Update last login
    await supabase.from("users").update({ last_login: new Date().toISOString() }).eq("id", authData.user.id);

    res.json({
      success: true,
      token: authData.session.access_token,
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        avatar: profile.avatar || null
      }
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(401).json({ success: false, error: "Invalid email or password" });
  }
});

/* ── GET current user profile ── */
router.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ success: false, error: "No token" });

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) throw error || new Error("Invalid token");

    const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single();
    res.json({ success: true, data: profile });
  } catch (err) {
    res.status(401).json({ success: false, error: "Unauthorized" });
  }
});

/* ── LOGOUT ── */
router.post("/logout", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) await supabase.auth.admin.signOut(token);
    res.json({ success: true, message: "Logged out" });
  } catch (err) {
    res.json({ success: true, message: "Logged out" });
  }
});

module.exports = router;
