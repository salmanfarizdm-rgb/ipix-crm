const { createClient } = require("@supabase/supabase-js");

const url = (process.env.SUPABASE_URL || "").trim();
const key = (process.env.SUPABASE_SERVICE_KEY || "").replace(/\s+/g, "").trim();

if (!url || !key) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
}

const supabase = createClient(url, key);

module.exports = supabase;
