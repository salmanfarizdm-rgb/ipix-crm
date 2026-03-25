const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const url  = (process.env.SUPABASE_URL || "").trim();
const skey = (process.env.SUPABASE_SERVICE_KEY || "").trim();
const akey = (process.env.SUPABASE_ANON_KEY || "").trim();

const supabase     = createClient(url, skey);          // admin — bypasses RLS
const supabaseAuth = createClient(url, akey || skey);  // anon  — for signInWithPassword

module.exports = supabase;
module.exports.supabaseAuth = supabaseAuth;
