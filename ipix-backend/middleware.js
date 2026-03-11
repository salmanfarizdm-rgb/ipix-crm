const supabase = require("./supabase");

/* ── Verify JWT token from frontend ── */
async function requireAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ success: false, error: "No token provided" });

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ success: false, error: "Invalid or expired token" });

    // Get full profile with role
    const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single();
    if (!profile) return res.status(401).json({ success: false, error: "User profile not found" });
    if (!profile.active) return res.status(403).json({ success: false, error: "Account deactivated" });

    req.user = profile;
    next();
  } catch (err) {
    res.status(401).json({ success: false, error: "Unauthorized" });
  }
}

/* ── Require specific roles ── */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, error: "Not authenticated" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: `Access denied. Required: ${roles.join(" or ")}` });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
