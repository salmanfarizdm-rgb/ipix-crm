const { createClient } = require("@supabase/supabase-js");

const url  = (process.env.SUPABASE_URL         || "").trim();
const skey = (process.env.SUPABASE_SERVICE_KEY  || "").replace(/\s+/g, "").trim();
const akey = (process.env.SUPABASE_ANON_KEY     || "").replace(/\s+/g, "").trim();

if (!url || !skey) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
}

// Admin client — service role key, bypasses RLS. Use for admin operations only.
const supabase = createClient(url, skey);

// Auth client — anon key. Required for signInWithPassword (user-facing auth).
const supabaseAuth = createClient(url, akey || skey);

module.exports = supabase;
module.exports.supabaseAuth = supabaseAuth;
