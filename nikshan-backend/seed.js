require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const STORE_CALICUT_ID = "aaaaaaaa-0001-0001-0001-000000000001";
const STORE_KANNUR_ID  = "aaaaaaaa-0002-0002-0002-000000000002";

const USERS = [
  { email:"admin@nikshan.com",           password:"Admin@123",   name:"Salman Fariz",      role:"admin",          store_id:null,            phone:"9876543210" },
  { email:"manager.calicut@nikshan.com", password:"Manager@123", name:"Rahul Nair",         role:"branch_manager", store_id:STORE_CALICUT_ID, phone:"9876543211" },
  { email:"manager.kannur@nikshan.com",  password:"Manager@123", name:"Priya Menon",        role:"branch_manager", store_id:STORE_KANNUR_ID,  phone:"9876543212" },
  { email:"salesmanager@nikshan.com",    password:"Sales@123",   name:"Arjun Krishnan",     role:"sales_manager",  store_id:STORE_CALICUT_ID, phone:"9876543213" },
  { email:"john@nikshan.com",            password:"Staff@123",   name:"John Thomas",        role:"sales_exec",     store_id:STORE_CALICUT_ID, phone:"9876543214" },
  { email:"sarah@nikshan.com",           password:"Staff@123",   name:"Sarah Mathew",       role:"sales_exec",     store_id:STORE_CALICUT_ID, phone:"9876543215" },
  { email:"nizar@nikshan.com",           password:"Staff@123",   name:"Mohammed Nizar",     role:"sales_exec",     store_id:STORE_KANNUR_ID,  phone:"9876543216" },
  { email:"tech@nikshan.com",            password:"Tech@123",    name:"Ravi Technician",    role:"technician",     store_id:STORE_CALICUT_ID, phone:"9876543217" },
];

async function seed() {
  console.log("🌱 Starting Nikshan CRM seed...\n");

  // Stores
  console.log("📦 Creating stores...");
  await db.from("nk_stores").upsert([
    { id: STORE_CALICUT_ID, name: "Nikshan Calicut", location: "Mavoor Road, Calicut", phone: "0495-2720001" },
    { id: STORE_KANNUR_ID,  name: "Nikshan Kannur",  location: "Fort Road, Kannur",    phone: "0497-2720002" },
  ], { onConflict: "id" });

  // Users
  console.log("👥 Creating users...");
  const userIds = {};
  for (const u of USERS) {
    try {
      const { data: existing } = await db.auth.admin.listUsers();
      const found = existing?.users?.find(x => x.email === u.email);
      let authId;
      if (found) {
        authId = found.id;
        console.log(`  ⚠️  Auth user exists: ${u.email}`);
      } else {
        const { data, error } = await db.auth.admin.createUser({ email: u.email, password: u.password, email_confirm: true, user_metadata: { name: u.name, role: u.role } });
        if (error) { console.error(`  ❌ ${u.email}:`, error.message); continue; }
        authId = data.user.id;
      }
      const { data: profile } = await db.from("nk_users").upsert({ auth_id: authId, email: u.email, name: u.name, role: u.role, store_id: u.store_id, phone: u.phone, active: true }, { onConflict: "email" }).select().single();
      userIds[u.email] = profile?.id;
      console.log(`  ✅ ${u.name} (${u.role})`);
    } catch (err) { console.error(`  ❌ ${u.email}:`, err.message); }
  }

  const john  = userIds["john@nikshan.com"];
  const sarah = userIds["sarah@nikshan.com"];
  const nizar = userIds["nizar@nikshan.com"];
  const admin = userIds["admin@nikshan.com"];
  const tech  = userIds["tech@nikshan.com"];

  // Customers
  console.log("\n👤 Creating customers...");
  const customers = [
    { name:"Arun Kumar P",      phone:"9400111001", email:"arun@gmail.com",    address:"Palayam, Calicut",     store_id:STORE_CALICUT_ID, source:"walk-in",  created_by:john,  tags:["premium","repeat"] },
    { name:"Sreelakshmi R",     phone:"9400111002", email:"sree@gmail.com",    address:"West Hill, Calicut",   store_id:STORE_CALICUT_ID, source:"referral", created_by:sarah, tags:["emi-customer"] },
    { name:"Muhammed Shafi K",  phone:"9400111003", email:"shafi@gmail.com",   address:"Feroke, Calicut",      store_id:STORE_CALICUT_ID, source:"online",   created_by:john,  tags:[] },
    { name:"Divya Nair",        phone:"9400111004", email:"divya@gmail.com",   address:"Kottakkal, Calicut",   store_id:STORE_CALICUT_ID, source:"walk-in",  created_by:sarah, tags:["repeat"] },
    { name:"Vishnu Das",        phone:"9400111005",                            address:"Nadakavu, Calicut",    store_id:STORE_CALICUT_ID, source:"referral", created_by:john,  tags:[] },
    { name:"Fathima Beevi",     phone:"9400111006", email:"fathima@gmail.com", address:"Chevayur, Calicut",    store_id:STORE_CALICUT_ID, source:"walk-in",  created_by:sarah, tags:["emi-customer"] },
    { name:"Rajesh Nambiar",    phone:"9400111007",                            address:"Kunnamangalam, Calicut",store_id:STORE_CALICUT_ID, source:"online",  created_by:john,  tags:[] },
    { name:"Amitha Krishnan",   phone:"9400111008", email:"amitha@gmail.com",  address:"Puthiyara, Calicut",   store_id:STORE_CALICUT_ID, source:"walk-in",  created_by:sarah, tags:["premium"] },
    { name:"Suresh Babu",       phone:"9400111009",                            address:"Thalassery, Kannur",   store_id:STORE_KANNUR_ID,  source:"walk-in",  created_by:nizar, tags:[] },
    { name:"Anitha Thomas",     phone:"9400111010", email:"anitha@gmail.com",  address:"Kannur Town",          store_id:STORE_KANNUR_ID,  source:"referral", created_by:nizar, tags:["repeat"] },
    { name:"Pradeep Kumar",     phone:"9400111011",                            address:"Thalipparamba, Kannur",store_id:STORE_KANNUR_ID,  source:"online",   created_by:nizar, tags:[] },
    { name:"Suma Jayakumar",    phone:"9400111012", email:"suma@gmail.com",    address:"Payyannur, Kannur",    store_id:STORE_KANNUR_ID,  source:"walk-in",  created_by:nizar, tags:["emi-customer"] },
  ];
  const { data: custData } = await db.from("nk_customers").insert(customers).select();
  const custIds = custData?.map(c => c.id) || [];
  console.log(`  ✅ ${custIds.length} customers created`);

  const [c1,c2,c3,c4,c5,c6,c7,c8,c9,c10,c11,c12] = custIds;

  // Purchases
  console.log("\n🛒 Creating purchases...");
  const today = new Date();
  const daysAgo = n => { const d = new Date(today); d.setDate(d.getDate()-n); return d.toISOString().split("T")[0]; };
  const purchases = [
    { customer_id:c1, store_id:STORE_CALICUT_ID, sold_by:john,  product_name:"Samsung 55\" 4K Smart TV", brand:"Samsung", model:"UA55AUE60", amount:75000, payment_type:"cash",     purchase_date:daysAgo(2) },
    { customer_id:c2, store_id:STORE_CALICUT_ID, sold_by:sarah, product_name:"LG 1.5 Ton Inverter AC",    brand:"LG",      model:"S4-W18JZXA", amount:48000, payment_type:"emi",  emi_bank:"HDFC Bank",     purchase_date:daysAgo(5) },
    { customer_id:c3, store_id:STORE_CALICUT_ID, sold_by:john,  product_name:"iPhone 15",                 brand:"Apple",   model:"iPhone 15 128GB", amount:79999, payment_type:"card",  purchase_date:daysAgo(7) },
    { customer_id:c4, store_id:STORE_CALICUT_ID, sold_by:sarah, product_name:"Whirlpool Washing Machine",  brand:"Whirlpool",model:"WM Wash+Dry 7.5kg",amount:35000,payment_type:"upi",  purchase_date:daysAgo(10) },
    { customer_id:c6, store_id:STORE_CALICUT_ID, sold_by:john,  product_name:"Samsung Double Door Fridge", brand:"Samsung", model:"RT39B553ER8", amount:42000, payment_type:"emi",  emi_bank:"Bajaj Finserv", purchase_date:daysAgo(12) },
    { customer_id:c7, store_id:STORE_CALICUT_ID, sold_by:sarah, product_name:"OnePlus 12",                brand:"OnePlus", model:"OP12 256GB",   amount:69999, payment_type:"card",  purchase_date:daysAgo(15) },
    { customer_id:c8, store_id:STORE_CALICUT_ID, sold_by:john,  product_name:"Bosch Microwave Oven",      brand:"Bosch",   model:"BFL523MB0I",   amount:18000, payment_type:"cash",  purchase_date:daysAgo(18) },
    { customer_id:c9, store_id:STORE_KANNUR_ID,  sold_by:nizar, product_name:"Sony Bravia 65\" OLED",     brand:"Sony",    model:"XR65A80L",     amount:185000,payment_type:"emi",  emi_bank:"SBI",           purchase_date:daysAgo(3) },
    { customer_id:c10,store_id:STORE_KANNUR_ID,  sold_by:nizar, product_name:"Daikin 2 Ton Inverter AC",  brand:"Daikin",  model:"FTKF60TV",     amount:62000, payment_type:"emi",  emi_bank:"ICICI Bank",    purchase_date:daysAgo(8) },
    { customer_id:c11,store_id:STORE_KANNUR_ID,  sold_by:nizar, product_name:"Samsung Galaxy S24",        brand:"Samsung", model:"S24 256GB",    amount:89999, payment_type:"card",  purchase_date:daysAgo(20) },
    { customer_id:c12,store_id:STORE_KANNUR_ID,  sold_by:nizar, product_name:"Voltas 1 Ton Split AC",     brand:"Voltas",  model:"183V ADJUSTABLE",amount:32000,payment_type:"emi", emi_bank:"TVS Credit",    purchase_date:daysAgo(25) },
    { customer_id:c1, store_id:STORE_CALICUT_ID, sold_by:john,  product_name:"Sony Soundbar",             brand:"Sony",    model:"HT-S400",      amount:22000, payment_type:"cash",  purchase_date:daysAgo(30) },
  ];
  const { data: purchData } = await db.from("nk_purchases").insert(purchases).select();
  const purchIds = purchData?.map(p => p.id) || [];
  console.log(`  ✅ ${purchIds.length} purchases created`);

  // EMI Records
  console.log("\n🏦 Creating EMI records...");
  const emiRecords = [
    { purchase_id:purchIds[1], customer_id:c2,  bank_name:"HDFC Bank",     loan_amount:48000, monthly_emi:4200,  tenure_months:12, start_date:daysAgo(5),  status:"active" },
    { purchase_id:purchIds[4], customer_id:c6,  bank_name:"Bajaj Finserv", loan_amount:42000, monthly_emi:2450,  tenure_months:18, start_date:daysAgo(12), status:"active" },
    { purchase_id:purchIds[7], customer_id:c9,  bank_name:"SBI",           loan_amount:185000,monthly_emi:9800,  tenure_months:24, start_date:daysAgo(3),  status:"active" },
    { purchase_id:purchIds[8], customer_id:c10, bank_name:"ICICI Bank",    loan_amount:62000, monthly_emi:5600,  tenure_months:12, start_date:daysAgo(8),  status:"active" },
    { purchase_id:purchIds[10],customer_id:c12, bank_name:"TVS Credit",    loan_amount:32000, monthly_emi:3200,  tenure_months:10, start_date:daysAgo(25), status:"active" },
    { customer_id:c5,           bank_name:"AXIS Bank",      loan_amount:55000, monthly_emi:4800,  tenure_months:12, start_date:daysAgo(60), status:"closed" },
  ];
  const { data: emiData } = await db.from("nk_emi_records").insert(emiRecords).select();
  console.log(`  ✅ ${emiData?.length || 0} EMI records created`);

  // Leads
  console.log("\n🎯 Creating leads...");
  const leads = [
    { name:"Bibin Jose",      phone:"9400222001", product_interest:"65\" 4K TV",           source:"walk-in",  status:"new",         assigned_to:john,  store_id:STORE_CALICUT_ID, estimated_value:90000 },
    { name:"Nafeesa Beevi",   phone:"9400222002", product_interest:"Front Load Washing Machine",source:"referral",status:"contacted",assigned_to:sarah, store_id:STORE_CALICUT_ID, estimated_value:45000 },
    { name:"Amal Raj",        phone:"9400222003", product_interest:"iPhone 15 Pro",         source:"online",   status:"quoted",      assigned_to:john,  store_id:STORE_CALICUT_ID, estimated_value:135000 },
    { name:"Renjitha Krishnan",phone:"9400222004",product_interest:"2 Ton Inverter AC",     source:"walk-in",  status:"negotiating", assigned_to:sarah, store_id:STORE_CALICUT_ID, estimated_value:65000 },
    { name:"Suhail Ahmed",    phone:"9400222005", product_interest:"Samsung S24 Ultra",     source:"online",   status:"new",         assigned_to:john,  store_id:STORE_CALICUT_ID, estimated_value:130000 },
    { name:"Deepthi Nair",    phone:"9400222006", product_interest:"Double Door Fridge",    source:"walk-in",  status:"contacted",   assigned_to:sarah, store_id:STORE_CALICUT_ID, estimated_value:40000 },
    { name:"Ajmal Hassan",    phone:"9400222007", product_interest:"Home Theatre System",   source:"referral", status:"quoted",      assigned_to:nizar, store_id:STORE_KANNUR_ID,  estimated_value:55000 },
    { name:"Saritha Menon",   phone:"9400222008", product_interest:"Laptop for college",    source:"online",   status:"new",         assigned_to:nizar, store_id:STORE_KANNUR_ID,  estimated_value:60000 },
    { name:"Vineeth Kumar",   phone:"9400222009", product_interest:"Split AC 1.5 Ton",      source:"walk-in",  status:"negotiating", assigned_to:nizar, store_id:STORE_KANNUR_ID,  estimated_value:48000 },
    { name:"Reshma Ravi",     phone:"9400222010", product_interest:"Microwave + OTG combo", source:"referral", status:"lost",        assigned_to:john,  store_id:STORE_CALICUT_ID, estimated_value:25000, lost_reason:"Went to competitor" },
    { name:"Manoj P Nair",    phone:"9400222011", product_interest:"55\" OLED TV",          source:"walk-in",  status:"lost",        assigned_to:sarah, store_id:STORE_CALICUT_ID, estimated_value:95000, lost_reason:"Budget constraint" },
    { name:"Shiny Thomas",    phone:"9400222012", product_interest:"Fully Auto Washing Machine",source:"online",status:"contacted",  assigned_to:nizar, store_id:STORE_KANNUR_ID,  estimated_value:35000 },
    { name:"Fahad Basheer",   phone:"9400222013", product_interest:"iPhone 14 refurbished", source:"walk-in",  status:"new",         assigned_to:john,  store_id:STORE_CALICUT_ID, estimated_value:55000 },
    { name:"Gopika Suresh",   phone:"9400222014", product_interest:"Air Purifier",          source:"referral", status:"quoted",      assigned_to:sarah, store_id:STORE_CALICUT_ID, estimated_value:18000 },
    { name:"Jithin Mohan",    phone:"9400222015", product_interest:"Gaming Monitor 144hz",   source:"online",   status:"negotiating", assigned_to:nizar, store_id:STORE_KANNUR_ID,  estimated_value:28000 },
  ];
  const { data: leadsData } = await db.from("nk_leads").insert(leads).select();
  console.log(`  ✅ ${leadsData?.length || 0} leads created`);

  // Service Requests
  console.log("\n🔧 Creating service requests...");
  const svc = [
    { customer_id:c1, store_id:STORE_CALICUT_ID, assigned_to:tech, created_by:john,  request_type:"repair",        product_name:"Samsung TV", issue_description:"Display flickering issue", status:"in_progress", priority:"high" },
    { customer_id:c2, store_id:STORE_CALICUT_ID, assigned_to:tech, created_by:sarah, request_type:"installation",  product_name:"LG AC", issue_description:"AC installation at home", status:"resolved", priority:"normal", resolved_date:daysAgo(2), resolution_notes:"Installed successfully" },
    { customer_id:c4, store_id:STORE_CALICUT_ID, assigned_to:tech, created_by:sarah, request_type:"repair",        product_name:"Whirlpool Washing Machine", issue_description:"Not spinning properly", status:"pending", priority:"normal" },
    { customer_id:c6, store_id:STORE_CALICUT_ID, assigned_to:tech, created_by:john,  request_type:"warranty",      product_name:"Samsung Fridge", issue_description:"Ice maker not working", status:"pending", priority:"high" },
    { customer_id:c9, store_id:STORE_KANNUR_ID,  assigned_to:tech, created_by:nizar, request_type:"installation",  product_name:"Sony OLED TV", issue_description:"Wall mount installation required", status:"in_progress", priority:"urgent" },
    { customer_id:c10,store_id:STORE_KANNUR_ID,  assigned_to:tech, created_by:nizar, request_type:"repair",        product_name:"Daikin AC", issue_description:"Not cooling adequately", status:"pending", priority:"normal" },
    { customer_id:c3, store_id:STORE_CALICUT_ID, assigned_to:tech, created_by:john,  request_type:"general",       product_name:"iPhone 15", issue_description:"Screen protector application", status:"resolved", priority:"low", resolved_date:daysAgo(5), resolution_notes:"Done" },
    { customer_id:c12,store_id:STORE_KANNUR_ID,  assigned_to:tech, created_by:nizar, request_type:"installation",  product_name:"Voltas AC", issue_description:"AC fitting and demo", status:"resolved", priority:"normal", resolved_date:daysAgo(20), resolution_notes:"Installed and demoed" },
  ];
  await db.from("nk_service_requests").insert(svc);
  console.log(`  ✅ ${svc.length} service requests created`);

  // Follow-ups
  console.log("\n📅 Creating follow-ups...");
  const todayStr = today.toISOString().split("T")[0];
  const futureDate = n => { const d = new Date(today); d.setDate(d.getDate()+n); return d.toISOString().split("T")[0]; };
  const pastDate = n => daysAgo(n);

  const followups = [
    { assigned_to:john,  created_by:john,  customer_id:c1,  follow_up_type:"call",  due_date:todayStr,     notes:"Check satisfaction with new TV",  done:false },
    { assigned_to:sarah, created_by:sarah, customer_id:c4,  follow_up_type:"call",  due_date:todayStr,     notes:"Follow up on washing machine issue",done:false },
    { assigned_to:nizar, created_by:nizar, customer_id:c9,  follow_up_type:"visit", due_date:todayStr,     notes:"Check TV installation status",     done:false },
    { assigned_to:john,  created_by:john,  lead_id:leadsData[0].id, follow_up_type:"call",  due_date:futureDate(1), notes:"Call Bibin about TV demo",  done:false },
    { assigned_to:sarah, created_by:sarah, lead_id:leadsData[3].id, follow_up_type:"demo",  due_date:futureDate(2), notes:"AC demo at Renjitha's home", done:false },
    { assigned_to:nizar, created_by:nizar, lead_id:leadsData[6].id, follow_up_type:"call",  due_date:futureDate(3), notes:"Final price quote for Ajmal",done:false },
    { assigned_to:john,  created_by:john,  customer_id:c7,  follow_up_type:"call",  due_date:pastDate(2),  notes:"Check OnePlus phone feedback",     done:false },
    { assigned_to:sarah, created_by:sarah, customer_id:c8,  follow_up_type:"visit", due_date:pastDate(3),  notes:"Premium customer visit",           done:false },
    { assigned_to:john,  created_by:john,  customer_id:c3,  follow_up_type:"call",  due_date:pastDate(1),  notes:"iPhone accessories upsell",        done:true, done_at:new Date().toISOString(), outcome:"Customer interested in case + earphones" },
    { assigned_to:nizar, created_by:nizar, customer_id:c11, follow_up_type:"call",  due_date:futureDate(5),notes:"Galaxy S24 post-purchase check",   done:false },
    { assigned_to:sarah, created_by:sarah, lead_id:leadsData[1].id, follow_up_type:"call", due_date:futureDate(1), notes:"Share washing machine brochure", done:false },
    { assigned_to:john,  created_by:john,  lead_id:leadsData[4].id, follow_up_type:"demo", due_date:futureDate(4), notes:"S24 Ultra in-store demo for Suhail", done:false },
  ];
  await db.from("nk_follow_ups").insert(followups);
  console.log(`  ✅ ${followups.length} follow-ups created`);

  // Customer Interactions
  console.log("\n💬 Creating interaction logs...");
  const interactions = [
    { customer_id:c1, user_id:john,  interaction_type:"visit",    notes:"Customer walked in, purchased Samsung TV and soundbar. Very satisfied." },
    { customer_id:c1, user_id:sarah, interaction_type:"call",     notes:"Called to check satisfaction. Customer happy, recommended to friend." },
    { customer_id:c2, user_id:sarah, interaction_type:"visit",    notes:"Customer came for AC purchase. Opted for EMI via HDFC Bank." },
    { customer_id:c2, user_id:john,  interaction_type:"service_check", notes:"Followed up on AC installation. All good." },
    { customer_id:c3, user_id:john,  interaction_type:"visit",    notes:"Young customer, bought iPhone 15. Also took screen protector." },
    { customer_id:c4, user_id:sarah, interaction_type:"sale",     notes:"Washing machine sold. Customer satisfied with demo." },
    { customer_id:c8, user_id:john,  interaction_type:"visit",    notes:"Premium customer - Amitha, purchased Bosch microwave. Potential for more purchases." },
    { customer_id:c8, user_id:sarah, interaction_type:"follow_up",notes:"Called about after-sales experience. Very positive feedback." },
    { customer_id:c9, user_id:nizar, interaction_type:"sale",     notes:"Big sale - Sony OLED TV worth 1.85L. Customer very particular about quality." },
    { customer_id:c10,user_id:nizar, interaction_type:"visit",    notes:"AC purchase completed. Installation scheduled for next day." },
  ];
  await db.from("nk_customer_interactions").insert(interactions);
  console.log(`  ✅ ${interactions.length} interactions logged`);

  console.log("\n✅ Seed complete! Login credentials:");
  console.log("   admin@nikshan.com           / Admin@123   (Admin)");
  console.log("   manager.calicut@nikshan.com / Manager@123 (Branch Manager - Calicut)");
  console.log("   salesmanager@nikshan.com    / Sales@123   (Sales Manager)");
  console.log("   john@nikshan.com            / Staff@123   (Sales Executive - Calicut)");
  console.log("   sarah@nikshan.com           / Staff@123   (Sales Executive - Calicut)");
  console.log("   nizar@nikshan.com           / Staff@123   (Sales Executive - Kannur)");
  console.log("   tech@nikshan.com            / Tech@123    (Technician)");
}

seed().catch(console.error);
