#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════
//  IPIX CRM — Demo Account Seeder
//  Usage: node scripts/seedAdmin.js
//
//  Creates demo accounts in Supabase Auth + nk_users table.
//  Safe to run multiple times — skips existing users.
// ═══════════════════════════════════════════════════════════

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const db = require("../supabase");

const DEMO_USERS = [
  {
    email: "admin@nikshancrm.com",
    password: "Nikshan@2026",
    name: "Admin User",
    role: "admin",
    phone: "9999000001",
  },
  {
    email: "manager@nikshancrm.com",
    password: "Manager@2026",
    name: "Branch Manager",
    role: "branch_manager",
    phone: "9999000002",
  },
  {
    email: "demo@nikshancrm.com",
    password: "NikshanDemo@2026",
    name: "Demo Sales Exec",
    role: "sales_exec",
    phone: "9999000003",
  },
];

async function seed() {
  console.log("\n🌱  IPIX CRM — Seeding demo accounts...\n");

  for (const user of DEMO_USERS) {
    process.stdout.write(`  → ${user.email} (${user.role})... `);

    // Check if nk_users row already exists
    const { data: existing } = await db
      .from("nk_users")
      .select("id, email")
      .eq("email", user.email)
      .maybeSingle();

    if (existing) {
      console.log("✅ already exists, skipping");
      continue;
    }

    // Create Supabase Auth user
    const { data: authData, error: authErr } = await db.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { name: user.name, role: user.role },
    });

    if (authErr) {
      // If user already exists in auth but not nk_users, try to find them
      if (authErr.message?.includes("already been registered")) {
        const { data: authList } = await db.auth.admin.listUsers();
        const existingAuth = (authList?.users || []).find(u => u.email === user.email);
        if (existingAuth) {
          // Insert into nk_users with the existing auth_id
          const { error: insertErr } = await db.from("nk_users").insert({
            auth_id: existingAuth.id,
            email: user.email,
            name: user.name,
            role: user.role,
            phone: user.phone,
            active: true,
          });
          if (insertErr) {
            console.log(`❌ nk_users insert failed: ${insertErr.message}`);
          } else {
            console.log("✅ linked existing auth user to nk_users");
          }
        } else {
          console.log(`❌ auth error: ${authErr.message}`);
        }
        continue;
      }
      console.log(`❌ auth error: ${authErr.message}`);
      continue;
    }

    // Insert into nk_users
    const { error: insertErr } = await db.from("nk_users").insert({
      auth_id: authData.user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      active: true,
    });

    if (insertErr) {
      console.log(`❌ nk_users insert failed: ${insertErr.message}`);
    } else {
      console.log("✅ created");
    }
  }

  console.log("\n╔═══════════════════════════════════════╗");
  console.log("║   Demo accounts ready!                ║");
  console.log("╠═══════════════════════════════════════╣");
  console.log("║  admin@nikshancrm.com / Nikshan@2026  ║");
  console.log("║  manager@nikshancrm.com / Manager@2026║");
  console.log("║  demo@nikshancrm.com / NikshanDemo@26 ║");
  console.log("╚═══════════════════════════════════════╝\n");
}

seed().catch(err => {
  console.error("\n❌ Seed failed:", err.message);
  process.exit(1);
});
