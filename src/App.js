import React, { useState, useEffect } from "react";
import { LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

/* ── RESPONSIVE ──────────────────────────────────────────────────────── */
function useW() {
  const [w,setW]=useState(typeof window!=="undefined"?window.innerWidth:1200);
  useEffect(()=>{const h=()=>setW(window.innerWidth);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);
  return w;
}
const TODAY="2025-03-05";

/* ── PALETTE ─────────────────────────────────────────────────────────── */
const C={
  bg:"#05080F",surface:"#0A1220",card:"#0F1A2E",card2:"#131F35",
  border:"#182847",accent:"#0EA5E9",green:"#10B981",red:"#EF4444",
  amber:"#F59E0B",purple:"#8B5CF6",teal:"#14B8A6",pink:"#EC4899",
  orange:"#F97316",indigo:"#6366F1",cyan:"#06B6D4",lime:"#84CC16",
  text:"#EEF4FF",muted:"#7B95BA",faint:"#162035",
};

/* ── ROLES ───────────────────────────────────────────────────────────── */
const ROLES={
  admin:            {label:"Admin",           short:"AD",color:C.red,    canAssign:true, canApprove:true, canSeeAll:true, canEditClient:true, pages:["dashboard","leads","clients","projects","marketing","performance","documents","brochures","finance","forecast","calendar"]},
  sales_manager:    {label:"Sales Manager",   short:"SM",color:C.accent, canAssign:true, canApprove:true, canSeeAll:true, canEditClient:true, pages:["dashboard","leads","clients","projects","performance","documents","forecast","calendar"]},
  sales_exec:       {label:"Sales Executive", short:"SE",color:C.green,  canAssign:false,canApprove:false,canSeeAll:false,canEditClient:false,pages:["dashboard","leads","clients","documents","calendar"]},
  marketing_manager:{label:"Mktg Manager",   short:"MM",color:C.purple, canAssign:true, canApprove:true, canSeeAll:true, canEditClient:false,pages:["dashboard","marketing","performance","documents","brochures","forecast"]},
  marketing_exec:   {label:"Mktg Exec",       short:"ME",color:C.amber,  canAssign:false,canApprove:false,canSeeAll:false,canEditClient:false,pages:["dashboard","marketing","documents","brochures"]},
  project_manager:  {label:"Project Manager", short:"PM",color:C.teal,   canAssign:false,canApprove:false,canSeeAll:true, canEditClient:false,pages:["dashboard","projects","clients"]},
  finance:          {label:"Finance",         short:"FN",color:C.lime,   canAssign:false,canApprove:false,canSeeAll:true, canEditClient:false,pages:["dashboard","finance","clients"]},
  hr:               {label:"HR",              short:"HR",color:C.pink,   canAssign:false,canApprove:false,canSeeAll:true, canEditClient:false,pages:["dashboard","performance"]},
};

/* ── STAGE CONFIG ────────────────────────────────────────────────────── */
const STAGE_CFG={
  "New":          {color:"#6B7280",maxDays:2, prob:10, order:1},
  "Contacted":    {color:"#3B82F6",maxDays:3, prob:20, order:2},
  "Qualified":    {color:C.purple, maxDays:7, prob:35, order:3},
  "Scope":        {color:C.indigo, maxDays:7, prob:45, order:4},
  "Proposal Sent":{color:C.amber,  maxDays:10,prob:55, order:5},
  "Negotiation":  {color:C.orange, maxDays:14,prob:70, order:6},
  "Closing Soon": {color:C.teal,   maxDays:7, prob:90, order:7},
  "Won":          {color:C.green,  maxDays:999,prob:100,order:8},
  "Lost":         {color:C.red,    maxDays:999,prob:0,  order:9},
  "Disqualified": {color:"#4B5563",maxDays:999,prob:0,  order:10},
};
const ACTIVE_STAGES=["New","Contacted","Qualified","Scope","Proposal Sent","Negotiation","Closing Soon"];
const ALL_STAGES=Object.keys(STAGE_CFG);
const SCORE_C={Hot:C.red,Warm:C.amber,Cold:"#3B82F6"};
const SRC_C={"Google Ads":"#4285F4",Meta:"#0668E1",LinkedIn:"#0A66C2",Referral:C.green,Website:C.purple,Expo:C.amber,Partner:C.pink,"Phone Call":"#6B7280","Existing Client":C.teal,WhatsApp:C.green};
const ASSIGN_C={approved:C.green,pending:C.amber,unassigned:"#6B7280"};
const LOST_REASONS=["Price too high","Competitor selected","Budget unavailable","Timeline not suitable","Client not interested","No response","Project scope mismatch","Other"];
const DISQ_REASONS=["Fake lead","Budget < ₹50K","Wrong geography","Duplicate record","No decision authority","Other"];

/* ── LEAD QUALITY SCORE ──────────────────────────────────────────────── */
function calcQScore(l){
  let s=0;
  if(l.email&&!l.email.includes("gmail")&&!l.email.includes("yahoo")&&!l.email.includes("hotmail"))s+=20;
  if(l.phone)s+=10;
  if(l.budgetConfirmed)s+=30;
  if(l.timelineConfirmed)s+=20;
  if(l.source==="Referral"||l.source==="Existing Client")s+=40;
  else if(l.source==="Expo"||l.source==="Partner")s+=15;
  return Math.min(100,s);
}
function scoreLabel(s){return s>=70?"Hot":s>=40?"Warm":"Cold";}

/* ── PIPELINE VELOCITY ───────────────────────────────────────────────── */
function calcVelocity(leads){
  const won=leads.filter(l=>l.status==="Won"&&l.createdDate&&l.wonDate);
  if(!won.length)return null;
  const avg=won.reduce((s,l)=>s+Math.floor((new Date(l.wonDate)-new Date(l.createdDate))/86400000),0)/won.length;
  return Math.round(avg);
}

/* ── TEAM ────────────────────────────────────────────────────────────── */
const TEAM=[
  {name:"Alex Morgan",   role:"sales_exec",  target:1500000,email:"alex@ipix.com",   nps:[]},
  {name:"Priya Nair",    role:"sales_exec",  target:1500000,email:"priya@ipix.com",  nps:[]},
  {name:"Tom Hank",      role:"sales_exec",  target:1200000,email:"tom@ipix.com",    nps:[]},
  {name:"Sara Lee",      role:"sales_exec",  target:1500000,email:"sara@ipix.com",   nps:[]},
  {name:"Ravi Kumar",    role:"marketing_exec",target:0,email:"ravi@ipix.com",       nps:[]},
  {name:"Rohan Das",     role:"project_manager",target:0,email:"rohan@ipix.com",     nps:[]},
];

/* ── WA TEMPLATES ────────────────────────────────────────────────────── */
const WA_TEMPLATES=[
  {id:"w1",title:"Initial Follow-up",category:"Follow-up",msg:"Hi {contact}! 👋 This is {exec} from IPIX Technologies. I'm following up on your enquiry about {service}. Would you be available for a quick call this week? 📞"},
  {id:"w2",title:"Proposal Sent",category:"Proposal",msg:"Hi {contact}! 🙏 I've sent across our detailed proposal for {service}. Please check your email (subject: Proposal – {company}). Happy to walk you through it on a call. Let me know a good time! 😊"},
  {id:"w3",title:"Follow-up After Proposal",category:"Follow-up",msg:"Hi {contact}, hope you're doing well! 😊 Just checking in on the proposal we shared for {service}. Do you have any questions or would you like to schedule a discussion? We're happy to customise as needed! 🙌"},
  {id:"w4",title:"Invoice Reminder",category:"Payment",msg:"Hi {contact}, a friendly reminder that Invoice #{invoice} for ₹{amount} is pending. Please find the invoice attached. Feel free to reach out if you have any questions. Thank you! 🙏"},
  {id:"w5",title:"Deal Won – Welcome",category:"Onboarding",msg:"Hi {contact}! 🎉 Welcome to the IPIX Technologies family! We're excited to work with {company} on {service}. Our team will connect with you shortly to kick off the project. Thank you for trusting us! 🚀"},
  {id:"w6",title:"Renewal Reminder",category:"Renewal",msg:"Hi {contact}! 🔔 Your {service} with IPIX Technologies is due for renewal on {renewal}. To continue uninterrupted service, please let us know if you'd like to proceed. Happy to help! 😊"},
  {id:"w7",title:"NPS Survey",category:"Feedback",msg:"Hi {contact}! 😊 We hope you're happy with our services at {company}. On a scale of 0–10, how likely are you to recommend IPIX Technologies to others? Your feedback helps us improve. Thank you! 🙏"},
];

/* ── SAMPLE DATA ─────────────────────────────────────────────────────── */
const mkL=(id,date,contact,phone,email,company,source,service,rawStatus,assignedTo,remarks,followUp)=>{
  const status=rawStatus==="DISQUALIFIED – BAD FIT"||rawStatus==="SPAM / JUNK LEAD"?"Disqualified":rawStatus==="LOST"?"Lost":rawStatus==="CONNECTED /ASK TO CALL LATER"||rawStatus==="CONNECTED /ASK TO SHARE DETAILS"||rawStatus==="FOLLOW-UP F1"||rawStatus==="FOLLOW-UP F2"?"Contacted":rawStatus==="QUALIFIED – PROPOSAL SENT"?"Proposal Sent":rawStatus==="QUALIFIED – DEMO GIVEN"||rawStatus==="QUALIFIED – DEMO SCHEDULED"?"Qualified":rawStatus==="ATTEMPTED – NO RESPONSE"?"New":"New";
  const score=status==="Disqualified"||status==="Lost"?"Cold":status==="Proposal Sent"||status==="Qualified"?"Hot":"Warm";
  const exec=assignedTo==="Saketh"||assignedTo==="sahal"?"Sara Lee":assignedTo==="safvan"||assignedTo==="SAFVAN"?"Alex Morgan":assignedTo==="nabeel"?"Tom Hank":"Priya Nair";
  return{id,company:company||"",contact,phone,backupPhone:"",email:email||"",backupEmail:"",role:"",location:"Kerala",source,campaign:"—",adGroup:"—",score,status,service,dealValue:0,budgetConfirmed:false,timelineConfirmed:false,assignedTo:exec,assignStatus:"approved",createdDate:date,stageEnteredDate:date,wonDate:null,followUpDate:followUp||"—",lastContactDate:date,expectedCredit:"",creditChanges:[],remarks,lostReason:status==="Lost"?"Client not interested":"",disqReason:status==="Disqualified"?"Fake lead":"",proposalViewed:status==="Proposal Sent",proposalViewedAt:null,qualChecklist:{budget:false,decisionMaker:false,requirement:false,timeline:false},nps:null,notes:remarks?[{text:remarks,by:"Admin",date,time:"9:00 AM"}]:[],tasks:[],history:[{action:"Lead Created",by:"Admin",date,time:"9:00 AM"},{action:"Status → "+status,by:"Admin",date,time:"9:05 AM"}]};
};
const INIT_LEADS=[
  mkL("L001","2026-02-03","Muhammed Junaid K","+918078952613","","","Google Ads","Mobile App","DISQUALIFIED – BAD FIT","Saketh","Had initial discussion - they need a simple e-commerce website for their publication, all details shared","—"),
  mkL("L002","2026-02-03","Aaryan Menon","+919745143143","lukatmeee@gmail.com","","Google Ads","Mobile App","CONNECTED /ASK TO CALL LATER","Saketh","Ask me to share the detail call after 6; they hold project till April","2026-03-10"),
  mkL("L003","2026-02-04","Rajesh Kumar R","+919567059991","rajeshrenr@gmail.com","Malayali channel","Google Ads","Mobile App","CONNECTED /ASK TO SHARE DETAILS","Saketh","Need to share the detail; 26/02 - not connected","—"),
  mkL("L004","2026-02-04","Muhammad M","+919567342426","m.muhammadmhd123@gmail.com","No name","Google Ads","Mobile App","ATTEMPTED – NO RESPONSE","Saketh","","—"),
  mkL("L005","2026-02-05","Vili Hhu Appuzz","+918137820108","vishnuabhaya186@gmail.com","Not Yet Working","Google Ads","Mobile App","ATTEMPTED – NO RESPONSE","Saketh","","—"),
  mkL("L006","2026-02-05","Suraj P Pilanku","+918078252505","pilanikusuraj@gmail.com","Impression","Google Ads","Mobile App","CONNECTED /ASK TO SHARE DETAILS","Saketh","Ask me to share details; 27/02 - ask me to call on march 10","2026-03-10"),
  mkL("L007","2026-02-05","Khalidct1111","+917377711114","khalidct777@gmail.com","Fueleum Energy","Google Ads","Mobile App","LOST","Saketh","Planning to share scope of work; 26/02 they found another provider","—"),
  mkL("L008","2026-02-05","Manu","+919746629939","manoranjithcheenu@gmail.com","just_exploring","Google Ads","Mobile App","DISQUALIFIED – BAD FIT","Saketh","Budget issue","—"),
  mkL("L009","2026-02-06","Bhoopesh Fakirchand Bhondle","9372524543","bhoopesh.bhondie@gmail.com","Secora Tech","","LMS","ATTEMPTED – NO RESPONSE","Saketh","They didn't respond; shared message; 27/02: they are not responding","—"),
  mkL("L010","2026-02-06","Anuanand","8086836963","anuanandofoul@gmail.com","Selfimp","","LMS","QUALIFIED – PROPOSAL SENT","Saketh","They will share the details after that need to connect; 27/02: they are not responding","—"),
  mkL("L011","2026-02-09","Rakhi rani","9219533328","sudhir1980rk@gmail.com","Sts","","LMS","CONNECTED /ASK TO CALL LATER","Saketh","27/02: they are not responding","—"),
  mkL("L012","2026-02-09","Balraj Kori","9407079122","aryabalraj3@gmail.com","KORI TECHSERV PRIVATE LIMITED","","LMS","QUALIFIED – PROPOSAL SENT","safvan","Proposal shared - 10/2/26","—"),
  mkL("L013","2026-02-10","Akaai Book Centre","9417933882","akaalbookcentre@gmail.com","Success adda","","LMS","QUALIFIED – PROPOSAL SENT","safvan","","—"),
  mkL("L014","2026-02-11","Yelleswari","9177611560","gyelleswan13@gmail.com","Biosky Industries Limited","","LMS","DISQUALIFIED – BAD FIT","Saketh","17/02 - she doesn't have any requirement; she is driving right now; ask me to share the details","—"),
  mkL("L015","2026-02-13","Puni Brahamne","9754708599","nileshbarde9754@gmail.com","","","LMS","ATTEMPTED – NO RESPONSE","Saketh","27/02: they are not responding","—"),
  mkL("L016","2026-02-14","Ronak Kotecha","9067023923","ronak@ethans.co.in","Ethan's Tech Solutions LLP","","LMS","CONNECTED /ASK TO CALL LATER","Saketh","He is in traffic right now; 27/02: they are not responding","2026-03-14"),
  mkL("L017","2026-02-16","Esub ali","9395652107","esubali45612@gmail.com","Esub","","LMS","ATTEMPTED – NO RESPONSE","Saketh","They are not talking; background noise; 27/02: they are not responding","—"),
  mkL("L018","2026-02-16","Yogesh Sharma","9267958688","karan123456788bhardwaj@gmail.com","","","LMS","DISQUALIFIED – BAD FIT","Saketh","","—"),
  mkL("L019","2026-02-19","Dharmanand","7972932285","vidheyakosambe@gmail.com","Sukashi Enterprise Pvt Ltd","","LMS","QUALIFIED – DEMO GIVEN","safvan","Proposal shared - discussion going on with CMO","—"),
  mkL("L020","2026-02-20","Hitesh Sachdeva","7888400903","hiteshsachdeva2929@gmail.com","","","LMS","ATTEMPTED – NO RESPONSE","safvan","","—"),
  mkL("L021","2026-02-20","Anshinder Singh","7982172127","arshinder.singh@gilbarco.com","gilbarco.com","","LMS","QUALIFIED – PROPOSAL SENT","Saketh","Need LMS for partner onboarding programmes and engineer skill upgradation","—"),
  mkL("L022","2026-02-23","Guru Govind Maheesh","91 9355235522","gurugovindmaheesh@gmail.com","","Website","Web Development","ATTEMPTED – NO RESPONSE","Saketh","Ecommerce Website Development on MERN Platform; 27/02: not responding","—"),
  mkL("L023","2026-02-24","Derick Elliot","p: +1 3855355181","derickoelliot@outlook.com","","Website","Web Development","QUALIFIED – PROPOSAL SENT","Saketh","Need urgent service for a new website project; mail shared","—"),
  mkL("L024","2026-02-25","Anurag","8318130325","singh.anurag@sis-india.com","","","LMS","QUALIFIED – DEMO SCHEDULED","SAFVAN","Demo scheduled for 28/2 - 3:00 pm","2026-02-28"),
  mkL("L025","2026-02-25","Dr V.V.Hadge","9860131843","ascpulgaon@gmail.com","SHANKARRAO BHOYAR PATIL MAHAVIDYALAY PULGAON","","LMS","SPAM / JUNK LEAD","SAFVAN","Doesn't know about this - didn't make any enquiry","—"),
  mkL("L026","2026-01-06","Piyush Khiyani","7000629627","contact.presto@gmail.com","Presto Solutions","","LMS","FOLLOW-UP F1","Saketh","Call back post lunch / evening","—"),
  mkL("L027","2026-01-07","Nishad pk","+9193880033321","loclampm@gmail.com","ITA Malappuram","Google Ads","Mobile App","FOLLOW-UP F1","sahal","Tried connecting, messaged him with IPIX brochure. 30-Jan-2026 no response","—"),
  mkL("L028","2026-01-08","Adolfina Isabel Blatter","+1-800-123-4567","blaite@m.spheremail.net","","Google Ads","Mobile App","FOLLOW-UP F1","Saketh","30/1/2026: no response from his end; toll-free number/mail shared 9-01-2026","—"),
  mkL("L029","2026-01-12","Benjamin Sam","91 88619 42017","benjaminsam.officiel@gmail.com","Forge Dental Lab","Google Ads","Mobile App","QUALIFIED – DEMO SCHEDULED","Saketh","Currently doesn't have any requirement; number not valid; mail shared; connected tomorrow meeting schedule","—"),
  mkL("L030","2026-01-12","Prabhakar","+919900794940","prabhakar@instareward.in","Self-Employed","Google Ads","Mobile App","QUALIFIED – PROPOSAL SENT","Saketh","30/1: no response; he cut the call; call scheduled","—"),
  mkL("L031","2026-01-13","Midhun VR","+919746256083","midhunvr1983@gmail.com","","Google Ads","Mobile App","ATTEMPTED – NO RESPONSE","Saketh","30/01 not connected; 21/01: they need a blood donation app","—"),
  mkL("L032","2026-01-14","Justin george","+918089960172","cheersmedia2023@gmail.com","","Google Ads","Mobile App","DISQUALIFIED – BAD FIT","Saketh","30/01 - need to call tomorrow afternoon; want app like BookMyShow; details shared","—"),
  mkL("L033","2026-01-16","Nebu M Johnson","+917306231689","mcjmedia@gmail.com","buisnessman","Google Ads","Mobile App","CONNECTED /ASK TO SHARE DETAILS","Saketh","30/1: need to send details; they need a digital gold platform; busy","—"),
  mkL("L034","2026-01-19","Daljinder Chandhok","9987880070","REGISTRAR.MUMBAI@IIGJ.COM","IIGJ","","LMS","DISQUALIFIED – BAD FIT","Saketh","Detailed shared; wants to discuss with team after that will update on demo timing","—"),
  mkL("L035","2026-01-19","Jabin Joseph Thomas","+9194465515360","jabinjosephthomas210@gmail.com","Hea ventures","Google Ads","Mobile App","CONNECTED /ASK TO SHARE DETAILS","Saketh","They are busy; need doctor appointment app; ask me to share detail; planning to schedule meeting","—"),
  mkL("L036","2026-01-24","Sunil Gideon","9818088825","info@labfindia.org","LSBF Institute of Education","","LMS","QUALIFIED – DEMO SCHEDULED","Saketh","Connected; ask me to share details 28/01; no response; text message shared","—"),
  mkL("L037","2026-01-27","Rajesh Kumar","p: +971 543606184","rajesh.kumar1@kaplan.com","","","LMS","QUALIFIED – DEMO GIVEN","safvan","Connected in mail - need followup - Moodle LMS - Demo shared and discussion undergoing","—"),
  mkL("L038","2026-01-28","Muhammed Yusuf","+8848896043","yasinmuhammedyasin@gmail.com","Brookhaven","Google Ads","Mobile App","FOLLOW-UP F2","Saketh","Message shared both mail and whatsapp; tried but didn't pick up","—"),
  mkL("L039","2026-01-29","Shameer Shajahan","+919400040059","shameershajahan143@gmail.com","Chemkry","Google Ads","Mobile App","ATTEMPTED – NO RESPONSE","nabeel","","—"),
  mkL("L040","2026-01-30","Firoze Thikkodi","+919037087883","ammuhammedfiroz@gmail.com","Avanzo Institute","Google Ads","Mobile App","FOLLOW-UP F1","safvan","Direct meet on Calicut at 31/01/26; looking for job consulting app","—"),
  mkL("L041","2026-01-30","Mohamed Rafeeq c","+919605035106","mrafeeqchalambat@gmail.com","nh","Google Ads","Mobile App","ATTEMPTED – NO RESPONSE","nabeel","","—"),
];

const INIT_CLIENTS=[
  {id:"C001",shortName:"Sunrise Hotels",company:"Sunrise Hotels & Resorts Pvt Ltd",contact:"Kavya Pillai",role:"CEO",phone:"+91 8765432109",backupPhone:"+91 8765432108",email:"kavya@sunrise.com",backupEmail:"accounts@sunrise.com",location:"Mumbai",segment:"Enterprise",status:"Active",notes:"VIP client. Expanding to 3 new properties in 2025.",crossSell:["Mobile App","CRM Module","Analytics Dashboard"],upsell:["ERP Premium Tier","Priority AMC"],paymentTerms:"40% advance, 30% on delivery, 30% at Go-Live",lifetimeRevenue:450000,totalProjects:2,npsScores:[9],
   payments:[{id:"PAY1",type:"Advance (40%)",amount:180000,invoiceNum:"INV-001",invoiceSentDate:"2025-02-25",receivedDate:"2025-02-28",status:"Received"},{id:"PAY2",type:"On Delivery (30%)",amount:135000,invoiceNum:"INV-002",invoiceSentDate:"2025-04-01",receivedDate:"",status:"Invoice Sent"},{id:"PAY3",type:"Go-Live (30%)",amount:135000,invoiceNum:"",invoiceSentDate:"",receivedDate:"",status:"Pending"}],
   services:[{name:"ERP System",type:"Product",amount:450000,start:"2025-02-28",renewal:"2026-02-28",daysLeft:360,status:"Active"}],
   purchases:[{id:"PU1",name:"sunrisehotels.com Domain",type:"Domain",spec:".com / GoDaddy",amount:1200,purchaseDate:"2024-01-01",renewal:"2025-12-31",daysLeft:28,status:"Renewal Due"},{id:"PU2",name:"AMC Package",type:"AMC",spec:"Annual maintenance + support",amount:60000,purchaseDate:"2025-02-28",renewal:"2026-02-28",daysLeft:360,status:"Active"}],
   editHistory:[{field:"Contact Person",old:"Raj Pillai",new:"Kavya Pillai",by:"Sara Lee",date:"2025-03-01",time:"10:34 AM",reason:"Ownership change"}]},
  {id:"C002",shortName:"TechNova",company:"TechNova Technologies Pvt Ltd",contact:"Arjun Shah",role:"CTO",phone:"+91 9876543210",backupPhone:"+91 9876543211",email:"arjun@technova.com",backupEmail:"hr@technova.com",location:"Bangalore",segment:"SME",status:"Active",notes:"High-potential, expanding team.",crossSell:["Web Dashboard","QA Testing","API Integration"],upsell:["Server Upgrade","App Premium Features"],paymentTerms:"50% advance, 25% testing, 25% delivery",lifetimeRevenue:320000,totalProjects:1,npsScores:[],
   payments:[{id:"PAY4",type:"Advance (50%)",amount:160000,invoiceNum:"INV-003",invoiceSentDate:"2025-01-20",receivedDate:"2025-01-22",status:"Received"},{id:"PAY5",type:"Testing (25%)",amount:80000,invoiceNum:"INV-004",invoiceSentDate:"2025-03-15",receivedDate:"",status:"Invoice Sent"},{id:"PAY6",type:"Delivery (25%)",amount:80000,invoiceNum:"",invoiceSentDate:"",receivedDate:"",status:"Pending"}],
   services:[{name:"Mobile App (React Native)",type:"Service",amount:320000,start:"2025-01-20",renewal:"—",daysLeft:999,status:"In Progress"}],
   purchases:[{id:"PU3",name:"AWS Server t3.large",type:"Server",spec:"t3.large / 2vCPU 8GB / ap-south-1",amount:24000,purchaseDate:"2025-01-20",renewal:"2026-01-20",daysLeft:6,status:"Renewal Due"}],
   editHistory:[{field:"Segment",old:"Startup",new:"SME",by:"Alex Morgan",date:"2025-02-15",time:"2:00 PM",reason:"Company reclassified"}]},
];

const INIT_PROJECTS=[
  {id:"P001",clientId:"C001",name:"Sunrise Hotels – ERP System",totalDays:90,startDate:"2025-03-01",phases:[{name:"Design",days:10,color:C.accent},{name:"Conversion",days:20,color:C.purple},{name:"Development",days:30,color:C.green},{name:"Testing",days:30,color:C.amber}],currentDay:75,status:"In Progress",pm:"Rohan Das",team:["Dev: Kiran R","Dev: Arjun P","Design: Sneha M","QA: Ravi K"],milestones:[{name:"Design Sign-off",day:10,done:true},{name:"Module 1 Live",day:40,done:true},{name:"UAT Start",day:70,done:true},{name:"Go Live",day:90,done:false}]},
  {id:"P002",clientId:"C002",name:"TechNova – Mobile App",totalDays:60,startDate:"2025-01-22",phases:[{name:"Design",days:10,color:C.accent},{name:"Conversion",days:10,color:C.purple},{name:"Development",days:25,color:C.green},{name:"Testing",days:15,color:C.amber}],currentDay:42,status:"In Progress",pm:"Rohan Das",team:["Dev: Kiran R","Dev: Preethi S","Design: Sneha M"],milestones:[{name:"UI Design Done",day:10,done:true},{name:"API Integration",day:35,done:true},{name:"Beta Build",day:50,done:false},{name:"App Store Submit",day:60,done:false}]},
  {id:"P003",clientId:"C001",name:"Sunrise Hotels – Mobile App",totalDays:45,startDate:"2025-04-01",phases:[{name:"Design",days:8,color:C.accent},{name:"Conversion",days:7,color:C.purple},{name:"Development",days:20,color:C.green},{name:"Testing",days:10,color:C.amber}],currentDay:0,status:"Not Started",pm:"Rohan Das",team:[],milestones:[{name:"Kickoff",day:1,done:false},{name:"Design Done",day:8,done:false},{name:"Dev Complete",day:35,done:false},{name:"Go Live",day:45,done:false}]},
];

const CAMPAIGNS=[
  {id:"M001",platform:"Google Ads",name:"Q1-Search-2025",adGroup:"Mobile Dev",creative:"Banner A",budget:50000,leads:18,conversions:3,revenue:770000,cpl:2778,roi:1440},
  {id:"M002",platform:"Meta",name:"Meta-Feb-Brand",adGroup:"Awareness",creative:"Video 30s",budget:30000,leads:12,conversions:1,revenue:0,cpl:2500,roi:-100},
  {id:"M003",platform:"LinkedIn",name:"PartnerQ1",adGroup:"B2B Solutions",creative:"Carousel",budget:40000,leads:8,conversions:2,revenue:450000,cpl:5000,roi:1025},
  {id:"M004",platform:"Expo",name:"TravelExpo2025",adGroup:"—",creative:"Booth",budget:80000,leads:5,conversions:2,revenue:450000,cpl:16000,roi:463},
];

const MONTHLY=[
  {month:"Oct",leads:12,deals:2,rev:320000},{month:"Nov",leads:18,deals:3,rev:580000},
  {month:"Dec",leads:14,deals:4,rev:720000},{month:"Jan",leads:22,deals:5,rev:950000},
  {month:"Feb",leads:28,deals:6,rev:1100000},{month:"Mar",leads:19,deals:3,rev:620000},
];

const BROCHURES=[
  {id:"B1",title:"IPIX Company Profile 2025",type:"Company",file:"company-profile-2025.pdf",size:"8.2 MB",uploadedBy:"Marketing",date:"2025-01-01",tags:["company","overview"]},
  {id:"B2",title:"LMS Product Brochure",type:"Product",file:"lms-brochure-v3.pdf",size:"3.8 MB",uploadedBy:"Marketing",date:"2025-02-01",tags:["lms","education"]},
  {id:"B3",title:"ERP System Brochure",type:"Product",file:"erp-brochure-v2.pdf",size:"4.1 MB",uploadedBy:"Marketing",date:"2025-02-10",tags:["erp","manufacturing"]},
  {id:"B4",title:"Mobile App Development",type:"Service",file:"mobile-app-services.pdf",size:"2.9 MB",uploadedBy:"Marketing",date:"2025-01-15",tags:["mobile","app"]},
  {id:"B5",title:"Web Development Services",type:"Service",file:"web-dev-services.pdf",size:"2.1 MB",uploadedBy:"Marketing",date:"2025-01-15",tags:["web","development"]},
  {id:"B6",title:"Cloud & Server Hosting",type:"Service",file:"cloud-services.pdf",size:"1.8 MB",uploadedBy:"Marketing",date:"2025-02-20",tags:["cloud","hosting"]},
];

/* ── ATOMS ───────────────────────────────────────────────────────────── */
const Badge=({label,color,size="sm"})=>(<span style={{display:"inline-block",padding:size==="lg"?"3px 10px":"2px 8px",borderRadius:20,fontSize:size==="lg"?11:10,fontWeight:700,background:`${color||C.accent}22`,color:color||C.accent,border:`1px solid ${color||C.accent}44`,whiteSpace:"nowrap"}}>{label}</span>);
const Dot=({color})=>(<span style={{width:7,height:7,borderRadius:"50%",background:color,display:"inline-block",marginRight:5,flexShrink:0}}/>);
const Btn=({children,onClick,v="primary",sz="md",disabled,style={}})=>(<button onClick={onClick} disabled={disabled} style={{padding:sz==="sm"?"4px 10px":sz==="lg"?"10px 22px":"7px 14px",borderRadius:7,border:"none",cursor:disabled?"not-allowed":"pointer",fontSize:sz==="sm"?11:12,fontWeight:600,background:disabled?"#1A2D4A":v==="ghost"?"transparent":v==="danger"?`${C.red}22`:v==="success"?C.green:v==="warn"?C.amber:v==="purple"?C.purple:v==="teal"?C.teal:C.accent,color:disabled?C.muted:v==="ghost"?C.muted:v==="danger"?C.red:"#fff",opacity:disabled?0.6:1,whiteSpace:"nowrap",...style}}>{children}</button>);
const Card=({title,action,children,style={}})=>(<div style={{background:C.card,borderRadius:12,border:`1px solid ${C.border}`,overflow:"hidden",...style}}>{title&&<div style={{padding:"11px 15px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,flexWrap:"wrap"}}><span style={{fontSize:13,fontWeight:700}}>{title}</span>{action}</div>}<div style={{padding:14}}>{children}</div></div>);
const TH=({ch})=>(<th style={{textAlign:"left",padding:"7px 10px",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:0.8,borderBottom:`1px solid ${C.border}`,whiteSpace:"nowrap"}}>{ch}</th>);
const TD=({children,style={}})=>(<td style={{padding:"9px 10px",fontSize:12,borderBottom:`1px solid ${C.faint}`,verticalAlign:"middle",...style}}>{children}</td>);
const FI=({label,k,f,s,type="text",ph="",req,errs={}})=>(<div style={{display:"flex",flexDirection:"column",gap:3}}>{label&&<label style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:0.8}}>{label}{req&&<span style={{color:C.red,marginLeft:2}}>*</span>}</label>}<input type={type} value={f[k]||""} onChange={e=>s(x=>({...x,[k]:e.target.value}))} placeholder={ph} style={{background:C.faint,border:`1px solid ${errs[k]?C.red:C.border}`,borderRadius:7,color:C.text,padding:"7px 10px",fontSize:12,outline:"none",width:"100%",boxSizing:"border-box"}}/>{errs[k]&&<span style={{fontSize:10,color:C.red}}>{errs[k]}</span>}</div>);
const FS=({label,k,f,s,opts,req,errs={}})=>(<div style={{display:"flex",flexDirection:"column",gap:3}}>{label&&<label style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:0.8}}>{label}{req&&<span style={{color:C.red,marginLeft:2}}>*</span>}</label>}<select value={f[k]||""} onChange={e=>s(x=>({...x,[k]:e.target.value}))} style={{background:C.faint,border:`1px solid ${errs[k]?C.red:C.border}`,borderRadius:7,color:C.text,padding:"7px 10px",fontSize:12,outline:"none",width:"100%",boxSizing:"border-box",cursor:"pointer"}}>{opts.map(o=><option key={o.v!==undefined?o.v:o} value={o.v!==undefined?o.v:o}>{o.l||o}</option>)}</select>{errs[k]&&<span style={{fontSize:10,color:C.red}}>{errs[k]}</span>}</div>);
const Sfilter=({value,onChange,opts})=>(<select value={value} onChange={e=>onChange(e.target.value)} style={{background:C.faint,border:`1px solid ${C.border}`,borderRadius:7,color:C.text,padding:"6px 10px",fontSize:12,outline:"none",cursor:"pointer"}}>{opts.map(o=><option key={o.v!==undefined?o.v:o} value={o.v!==undefined?o.v:o}>{o.l||o}</option>)}</select>);
const KPI=({label,value,sub,color,onClick})=>(<div onClick={onClick} style={{background:C.card,borderRadius:12,padding:"12px 14px",border:`1px solid ${C.border}`,borderTop:`3px solid ${color||C.accent}`,cursor:onClick?"pointer":"default"}}><div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:0.8}}>{label}</div><div style={{fontSize:19,fontWeight:800,color:color||C.text,marginTop:4}}>{value}</div>{sub&&<div style={{fontSize:10,color:C.muted,marginTop:3}}>{sub}</div>}</div>);
const Fbar=({children})=>(<div style={{display:"flex",gap:8,flexWrap:"wrap",padding:"10px 14px",background:C.card,borderRadius:12,border:`1px solid ${C.border}`,alignItems:"center"}}>{children}</div>);
const Modal=({title,onClose,children,mw=720})=>(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:12}} onClick={onClose}><div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,width:"100%",maxWidth:mw,maxHeight:"92vh",overflowY:"auto",padding:20}} onClick={e=>e.stopPropagation()}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}><span style={{fontSize:15,fontWeight:800}}>{title}</span><Btn v="ghost" sz="sm" onClick={onClose}>✕</Btn></div>{children}</div></div>);
const Hlog=({entries})=>(<div style={{display:"flex",flexDirection:"column",gap:6}}>{entries.map((h,i)=>(<div key={i} style={{display:"flex",gap:10,padding:"9px 12px",background:`${C.faint}99`,borderRadius:8}}><div style={{width:4,background:C.accent,borderRadius:2,alignSelf:"stretch",flexShrink:0}}/><div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,fontSize:12}}>{h.action}</div>{h.reason&&<div style={{fontSize:11,color:C.amber,marginTop:1}}>Reason: {h.reason}</div>}<div style={{fontSize:10,color:C.muted,marginTop:2}}>By {h.by} · {h.date} {h.time}</div></div></div>))}</div>);

/* ── QUAL CHECKLIST ──────────────────────────────────────────────────── */
function QualChecklist({lead,setLeads,role,onClose}){
  const fp=ROLES[role];
  const [checks,setChecks]=useState({...lead.qualChecklist});
  const items=[["budget","Budget confirmed / available"],["decisionMaker","Decision maker identified"],["requirement","Requirement clearly understood"],["timeline","Timeline confirmed"]];
  const allPass=items.every(([k])=>checks[k]);
  const save=()=>{
    const newStatus=allPass?"Qualified":lead.status;
    setLeads(ls=>ls.map(l=>l.id===lead.id?{...l,qualChecklist:checks,status:newStatus,stageEnteredDate:newStatus!==lead.status?TODAY:l.stageEnteredDate,timelineConfirmed:checks.timeline,budgetConfirmed:checks.budget,history:[...l.history,{action:`Qualification checklist updated${allPass?" → Status: Qualified":""}`,by:fp.label,date:TODAY,time:"Now"}]}:l));
    onClose();
  };
  return(
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{padding:"8px 12px",background:`${C.purple}10`,borderRadius:8,fontSize:12,color:C.muted}}>Complete all 4 criteria to move lead to Qualified status.</div>
      {items.map(([k,label])=>(
        <label key={k} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"10px 14px",borderRadius:8,background:checks[k]?`${C.green}12`:C.faint,border:`1px solid ${checks[k]?C.green+"44":C.border}`,fontSize:12,fontWeight:500}}>
          <input type="checkbox" checked={!!checks[k]} onChange={e=>setChecks(c=>({...c,[k]:e.target.checked}))} style={{accentColor:C.green,width:15,height:15}}/>
          <span>{label}</span>
          {checks[k]&&<span style={{marginLeft:"auto",color:C.green,fontWeight:700}}>✓</span>}
        </label>
      ))}
      <div style={{padding:"10px 14px",borderRadius:8,background:allPass?`${C.green}12`:`${C.amber}12`,border:`1px solid ${allPass?C.green+"44":C.amber+"44"}`,fontSize:12,fontWeight:700,color:allPass?C.green:C.amber}}>
        {allPass?"✅ All criteria met – lead will be marked Qualified":"⚠️ "+items.filter(([k])=>!checks[k]).length+" criteria pending"}
      </div>
      <div style={{display:"flex",gap:8}}><Btn v="success" onClick={save}>Save Checklist</Btn><Btn v="ghost" onClick={onClose}>Cancel</Btn></div>
    </div>
  );
}

/* ── WA TEMPLATE PICKER ──────────────────────────────────────────────── */
function WaModal({lead,onClose}){
  const [sel,setSel]=useState(WA_TEMPLATES[0]);
  const [preview,setPreview]=useState("");
  useEffect(()=>{
    let msg=sel.msg
      .replace("{contact}",lead.contact.split(" ")[0])
      .replace("{exec}","Your Name")
      .replace("{company}",lead.company)
      .replace("{service}",lead.service||"our solution")
      .replace("{invoice}","INV-XXX")
      .replace("{amount}","XX,XXX")
      .replace("{renewal}","renewal date");
    setPreview(msg);
  },[sel,lead]);
  const phone=lead.phone.replace(/\D/g,"");
  return(
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {WA_TEMPLATES.map(t=><Btn key={t.id} sz="sm" v={sel.id===t.id?"primary":"ghost"} onClick={()=>setSel(t)}>{t.title}</Btn>)}
      </div>
      <div style={{padding:"12px 14px",background:`${C.green}10`,border:`1px solid ${C.green}33`,borderRadius:10}}>
        <div style={{fontSize:10,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:6}}>Message Preview</div>
        <div style={{fontSize:12,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{preview}</div>
      </div>
      <div style={{display:"flex",gap:8}}>
        <a href={`https://wa.me/${phone}?text=${encodeURIComponent(preview)}`} target="_blank" rel="noreferrer" style={{textDecoration:"none"}}>
          <Btn v="success">💬 Open in WhatsApp</Btn>
        </a>
        <Btn onClick={()=>{navigator.clipboard?.writeText(preview);}}>📋 Copy</Btn>
        <Btn v="ghost" onClick={onClose}>Cancel</Btn>
      </div>
    </div>
  );
}

/* ── MERGE LEADS MODAL ───────────────────────────────────────────────── */
function MergeModal({lead,leads,setLeads,onClose}){
  const [target,setTarget]=useState("");
  const targetLead=leads.find(l=>l.id===target);
  const merge=()=>{
    if(!target||target===lead.id)return;
    const tl=leads.find(l=>l.id===target);
    if(!tl)return;
    const merged={
      ...tl,
      phone:tl.phone||lead.phone,
      email:tl.email||lead.email,
      backupPhone:tl.backupPhone||lead.phone,
      backupEmail:tl.backupEmail||lead.email,
      notes:[...tl.notes,...lead.notes],
      tasks:[...tl.tasks,...lead.tasks],
      history:[...tl.history,{action:`Merged with ${lead.id} (${lead.company})`,by:"Admin",date:TODAY,time:"Now"},{...lead.history[0],action:`[Merged] ${lead.history[0]?.action||"History entry"}`}],
      dealValue:Math.max(tl.dealValue||0,lead.dealValue||0),
    };
    setLeads(ls=>ls.filter(l=>l.id!==lead.id).map(l=>l.id===target?merged:l));
    onClose();
  };
  return(
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{padding:"10px 14px",background:`${C.amber}12`,borderRadius:8,fontSize:12,color:C.amber}}>⚠️ Merging will delete <strong>{lead.company} ({lead.id})</strong> and combine its data into the selected lead. This cannot be undone.</div>
      <div>
        <label style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:0.8}}>Merge into (existing lead)</label>
        <select value={target} onChange={e=>setTarget(e.target.value)} style={{marginTop:4,background:C.faint,border:`1px solid ${C.border}`,borderRadius:7,color:C.text,padding:"7px 10px",fontSize:12,outline:"none",width:"100%"}}>
          <option value="">Select a lead to merge into...</option>
          {leads.filter(l=>l.id!==lead.id&&(l.phone===lead.phone||l.email===lead.email||l.company===lead.company)).map(l=>(
            <option key={l.id} value={l.id}>{l.id} – {l.company} ({l.phone})</option>
          ))}
          {leads.filter(l=>l.id!==lead.id&&!(l.phone===lead.phone||l.email===lead.email||l.company===lead.company)).map(l=>(
            <option key={l.id} value={l.id}>{l.id} – {l.company} (manual)</option>
          ))}
        </select>
      </div>
      {targetLead&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {[["Company",lead.company,targetLead.company],["Phone",lead.phone,targetLead.phone],["Email",lead.email,targetLead.email],["Status",lead.status,targetLead.status],["Deal Value",`₹${lead.dealValue?.toLocaleString()||0}`,`₹${targetLead.dealValue?.toLocaleString()||0}`]].map(([field,a,b])=>(
            <div key={field} style={{padding:"8px 10px",background:C.faint,borderRadius:8,gridColumn:"1/-1"}}>
              <div style={{fontSize:10,color:C.muted,marginBottom:4,fontWeight:700}}>{field}</div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <span style={{fontSize:11,color:C.red,textDecoration:"line-through",opacity:0.7}}>{a}</span>
                <span style={{fontSize:10,color:C.muted}}>→</span>
                <span style={{fontSize:11,color:C.green,fontWeight:600}}>{b}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={{display:"flex",gap:8}}><Btn v="danger" onClick={merge} disabled={!target}>🔀 Confirm Merge</Btn><Btn v="ghost" onClick={onClose}>Cancel</Btn></div>
    </div>
  );
}

/* ── CREDIT DATE MODAL ───────────────────────────────────────────────── */
function CreditDateModal({lead,setLeads,role,onClose}){
  const fp=ROLES[role];
  const [form,setForm]=useState({newDate:"",reason:""});
  const [err,setErr]=useState("");
  const remaining=3-lead.creditChanges.length;
  const save=()=>{
    if(!form.newDate){setErr("Date required");return;}
    if(!form.reason.trim()){setErr("Reason required");return;}
    if(remaining<=0){setErr("Maximum 3 changes reached");return;}
    setLeads(ls=>ls.map(l=>l.id===lead.id?{...l,expectedCredit:form.newDate,creditChanges:[...l.creditChanges,{date:TODAY,oldDate:l.expectedCredit,newDate:form.newDate,by:fp.label,reason:form.reason}],history:[...l.history,{action:`Expected credit date changed → ${form.newDate}`,by:fp.label,date:TODAY,time:"Now",reason:form.reason}]}:l));
    onClose();
  };
  return(
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{padding:"8px 12px",background:`${remaining<=1?C.red:C.amber}12`,borderRadius:8,fontSize:12,color:remaining<=1?C.red:C.amber,fontWeight:600}}>{remaining} change(s) remaining (max 3). Each change requires a reason.</div>
      <div style={{padding:"10px 14px",background:C.faint,borderRadius:8}}>
        <div style={{fontSize:10,color:C.muted,marginBottom:6,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8}}>Change History</div>
        {lead.creditChanges.length===0?<div style={{fontSize:11,color:C.muted}}>No changes yet.</div>:lead.creditChanges.map((c,i)=>(
          <div key={i} style={{fontSize:11,padding:"5px 0",borderBottom:`1px solid ${C.border}`}}><span style={{color:C.red,textDecoration:"line-through"}}>{c.oldDate}</span> → <span style={{color:C.green,fontWeight:600}}>{c.newDate}</span><div style={{fontSize:10,color:C.muted}}>{c.by} · {c.date} · {c.reason}</div></div>
        ))}
      </div>
      <FI label="New Credit Date" k="newDate" f={form} s={setForm} type="date"/>
      <div><label style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:0.8}}>Reason <span style={{color:C.red}}>*</span></label><textarea value={form.reason} onChange={e=>setForm(x=>({...x,reason:e.target.value}))} placeholder="Why is the credit date changing?" style={{marginTop:4,background:C.faint,border:`1px solid ${C.border}`,borderRadius:7,color:C.text,padding:"7px 10px",fontSize:12,outline:"none",width:"100%",minHeight:60,resize:"vertical",boxSizing:"border-box"}}/></div>
      {err&&<div style={{fontSize:11,color:C.red}}>{err}</div>}
      <div style={{display:"flex",gap:8}}><Btn onClick={save} disabled={remaining<=0}>Save Change</Btn><Btn v="ghost" onClick={onClose}>Cancel</Btn></div>
    </div>
  );
}

/* ── NPS MODAL ───────────────────────────────────────────────────────── */
function NpsModal({lead,setLeads,role,onClose}){
  const [score,setScore]=useState(null);
  const fp=ROLES[role];
  const save=()=>{
    if(score===null)return;
    setLeads(ls=>ls.map(l=>l.id===lead.id?{...l,nps:score,history:[...l.history,{action:`NPS score recorded: ${score}/10`,by:fp.label,date:TODAY,time:"Now"}]}:l));
    onClose();
  };
  const cat=s=>s>=9?"Promoter 🟢":s>=7?"Passive 🟡":"Detractor 🔴";
  return(
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{fontSize:12,color:C.muted}}>On a scale of 0–10, how likely is <strong>{lead.contact}</strong> to recommend IPIX to others?</div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {[...Array(11)].map((_,i)=>(
          <button key={i} onClick={()=>setScore(i)} style={{width:36,height:36,borderRadius:8,border:`2px solid ${score===i?(i>=9?C.green:i>=7?C.amber:C.red):C.border}`,background:score===i?`${i>=9?C.green:i>=7?C.amber:C.red}22`:"transparent",color:score===i?(i>=9?C.green:i>=7?C.amber:C.red):C.muted,fontWeight:700,fontSize:13,cursor:"pointer"}}>{i}</button>
        ))}
      </div>
      {score!==null&&<div style={{padding:"8px 12px",borderRadius:8,background:`${score>=9?C.green:score>=7?C.amber:C.red}12`,fontSize:12,fontWeight:700,color:score>=9?C.green:score>=7?C.amber:C.red}}>{cat(score)} (score: {score}/10)</div>}
      <div style={{display:"flex",gap:8}}><Btn v="success" onClick={save} disabled={score===null}>Save NPS</Btn><Btn v="ghost" onClick={onClose}>Cancel</Btn></div>
    </div>
  );
}

/* ── PROJECT TIMELINE ────────────────────────────────────────────────── */
function Timeline({p,compact}){
  const remaining=p.totalDays-p.currentDay;
  const pct=p.totalDays>0?Math.min(100,(p.currentDay/p.totalDays)*100):0;
  const wc=remaining<=9?C.red:remaining<=20?C.amber:C.green;
  let cum=0;
  const phases=p.phases.map(ph=>{const s=cum;cum+=ph.days;return{...ph,startPct:(s/p.totalDays)*100,widthPct:(ph.days/p.totalDays)*100};});
  return(
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:6}}>
        <div><div style={{fontWeight:700,fontSize:compact?12:13}}>{p.name}</div><div style={{fontSize:10,color:C.muted,marginTop:2}}>PM: {p.pm} · Start: {p.startDate} · {p.totalDays}d total{p.team.length>0?" · Team: "+p.team.slice(0,2).join(", ")+(p.team.length>2?" +"+(p.team.length-2)+" more":""):""}</div></div>
        <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
          {remaining<=9&&<span style={{padding:"3px 10px",background:`${C.red}22`,border:`1px solid ${C.red}66`,borderRadius:20,fontSize:11,fontWeight:700,color:C.red,animation:"pulse 1s infinite"}}>⚠️ {remaining}d LEFT!</span>}
          {remaining>9&&remaining<=20&&<span style={{padding:"3px 10px",background:`${C.amber}22`,border:`1px solid ${C.amber}55`,borderRadius:20,fontSize:11,fontWeight:700,color:C.amber}}>⏰ {remaining}d left</span>}
          {remaining>20&&<span style={{padding:"3px 10px",background:`${C.green}22`,border:`1px solid ${C.green}44`,borderRadius:20,fontSize:11,fontWeight:600,color:C.green}}>✓ {remaining}d left</span>}
          <Badge label={p.status} color={p.status==="In Progress"?C.accent:p.status==="Completed"?C.green:C.muted}/>
        </div>
      </div>
      <div style={{position:"relative",height:26}}>
        <div style={{display:"flex",height:"100%",borderRadius:8,overflow:"hidden",border:`1px solid ${C.border}`}}>
          {phases.map(ph=>(<div key={ph.name} style={{flex:ph.days,background:ph.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.9)",overflow:"hidden",whiteSpace:"nowrap",padding:"0 3px"}}>{ph.widthPct>10?`${ph.name} (${ph.days}d)`:""}</div>))}
        </div>
        {pct>0&&<div style={{position:"absolute",top:0,left:0,width:`${pct}%`,height:"100%",background:"rgba(0,0,0,0.45)",borderRadius:pct>=100?"8px":"8px 0 0 8px",pointerEvents:"none"}}/>}
        {p.currentDay>0&&<div style={{position:"absolute",top:-3,bottom:-3,left:`${pct}%`,width:2,background:wc,borderRadius:1,transform:"translateX(-1px)",zIndex:2}}/>}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:4}}>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{phases.map(ph=><span key={ph.name} style={{fontSize:10,color:C.muted,display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,borderRadius:2,background:ph.color,display:"inline-block"}}/>{ph.name} {ph.days}d</span>)}</div>
        <span style={{fontSize:11,fontWeight:700,color:wc}}>Day {p.currentDay}/{p.totalDays} · {pct.toFixed(0)}%</span>
      </div>
      {!compact&&(
        <>
          <div style={{display:"grid",gridTemplateColumns:`repeat(${p.phases.length},1fr)`,gap:8,marginTop:4}}>
            {p.phases.map((ph,idx)=>{const phS=p.phases.slice(0,idx).reduce((s,x)=>s+x.days,0);const phE=phS+ph.days;const state=p.currentDay>=phE?"done":p.currentDay>phS?"active":"upcoming";return(<div key={ph.name} style={{padding:"8px 10px",background:state==="done"?`${C.green}10`:state==="active"?`${ph.color}15`:C.faint,borderRadius:8,borderLeft:`3px solid ${state==="done"?C.green:state==="active"?ph.color:C.border}`}}><div style={{fontSize:11,fontWeight:700,color:state==="done"?C.green:state==="active"?ph.color:C.muted}}>{ph.name}</div><div style={{fontSize:13,fontWeight:800,marginTop:2}}>{ph.days}d</div><div style={{fontSize:9,color:C.muted}}>Day {phS+1}–{phE}</div><div style={{fontSize:10,marginTop:3,color:state==="done"?C.green:state==="active"?ph.color:C.muted,fontWeight:600}}>{state==="done"?"✅ Done":state==="active"?"🔄 Active":"⏳ Soon"}</div></div>);})}
          </div>
          {p.milestones?.length>0&&(<div><div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:0.8,marginBottom:6,marginTop:4}}>Milestones</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{p.milestones.map((m,i)=>(<span key={i} style={{padding:"4px 10px",borderRadius:20,fontSize:11,background:m.done?`${C.green}15`:`${C.border}44`,border:`1px solid ${m.done?C.green+"44":C.border}`,color:m.done?C.green:C.muted}}>{m.done?"✅":"⏳"} {m.name} (day {m.day})</span>))}</div></div>)}
          {p.team.length>0&&(<div><div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:0.8,marginBottom:6,marginTop:4}}>Team</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{p.team.map((t,i)=><Badge key={i} label={t} color={C.teal}/>)}</div></div>)}
        </>
      )}
    </div>
  );
}

/* ── PAYMENT PANEL ───────────────────────────────────────────────────── */
function PayPanel({client}){
  const [pays,setPays]=useState(client.payments);
  const [invM,setInvM]=useState(null);
  const [recM,setRecM]=useState(null);
  const [form,setForm]=useState({});
  const [errs,setErrs]=useState({});
  const total=pays.reduce((s,p)=>s+p.amount,0);
  const rcvd=pays.filter(p=>p.status==="Received").reduce((s,p)=>s+p.amount,0);
  const PC={Received:C.green,"Invoice Sent":C.amber,Pending:C.muted};
  const sendInv=()=>{const e={};if(!form.n?.trim())e.n="Required";if(!form.d)e.d="Required";if(Object.keys(e).length){setErrs(e);return;}setPays(ps=>ps.map(p=>p.id===invM.id?{...p,status:"Invoice Sent",invoiceNum:form.n,invoiceSentDate:form.d}:p));setInvM(null);setForm({});setErrs({});};
  const markR=()=>{if(!form.d){setErrs({d:"Required"});return;}setPays(ps=>ps.map(p=>p.id===recM.id?{...p,status:"Received",receivedDate:form.d}:p));setRecM(null);setForm({});setErrs({});};
  return(
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
        {[["Total Deal",total,C.accent],["Collected",rcvd,C.green],["Pending",total-rcvd,C.red]].map(([l,v,c])=>(<div key={l} style={{background:C.faint,borderRadius:10,padding:"10px 12px",borderTop:`3px solid ${c}`}}><div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase"}}>{l}</div><div style={{fontSize:16,fontWeight:800,color:c,marginTop:3}}>₹{v.toLocaleString()}</div></div>))}
      </div>
      <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:560}}><thead><tr><TH ch="Milestone"/><TH ch="Amount"/><TH ch="Invoice #"/><TH ch="Invoice Date"/><TH ch="Received Date"/><TH ch="Status"/><TH ch="Action"/></tr></thead><tbody>{pays.map(p=>(<tr key={p.id} style={{background:p.status==="Received"?`${C.green}08`:"transparent"}}><TD style={{fontWeight:600}}>{p.type}</TD><TD>₹{p.amount.toLocaleString()}</TD><TD style={{color:C.muted,fontSize:11}}>{p.invoiceNum||"—"}</TD><TD style={{color:C.muted,fontSize:11}}>{p.invoiceSentDate||"—"}</TD><TD style={{color:p.receivedDate?C.green:C.muted,fontSize:11}}>{p.receivedDate||"—"}</TD><TD><div style={{display:"flex",alignItems:"center",gap:4}}>{p.status==="Received"&&<span>✅</span>}<Badge label={p.status} color={PC[p.status]}/></div></TD><TD>{p.status==="Pending"&&<Btn sz="sm" onClick={()=>{setInvM(p);setForm({});setErrs({})}}>Send Invoice</Btn>}{p.status==="Invoice Sent"&&<Btn sz="sm" v="success" onClick={()=>{setRecM(p);setForm({});setErrs({})}}>Mark Received</Btn>}{p.status==="Received"&&<span style={{fontSize:11,color:C.green,fontWeight:600}}>Completed ✓</span>}</TD></tr>))}</tbody></table></div>
      {invM&&<Modal title={`Send Invoice – ${invM.type}`} onClose={()=>setInvM(null)} mw={420}><div style={{display:"flex",flexDirection:"column",gap:12}}><div style={{padding:"8px 12px",background:`${C.amber}15`,borderRadius:8,fontSize:12,color:C.amber}}>₹{invM.amount.toLocaleString()}</div><FI label="Invoice Number" k="n" f={form} s={setForm} req ph="INV-005" errs={errs}/><FI label="Invoice Date" k="d" f={form} s={setForm} type="date" req errs={errs}/><div style={{display:"flex",gap:8}}><Btn onClick={sendInv}>Send Invoice</Btn><Btn v="ghost" onClick={()=>setInvM(null)}>Cancel</Btn></div></div></Modal>}
      {recM&&<Modal title={`Mark Received – ${recM.type}`} onClose={()=>setRecM(null)} mw={420}><div style={{display:"flex",flexDirection:"column",gap:12}}><div style={{padding:"8px 12px",background:`${C.green}15`,borderRadius:8,fontSize:12,color:C.green}}>Invoice #{recM.invoiceNum} · ₹{recM.amount.toLocaleString()}</div><FI label="Payment Received Date" k="d" f={form} s={setForm} type="date" req errs={errs}/><div style={{display:"flex",gap:8}}><Btn v="success" onClick={markR}>Confirm Received</Btn><Btn v="ghost" onClick={()=>setRecM(null)}>Cancel</Btn></div></div></Modal>}
    </div>
  );
}

/* ── DASHBOARD ───────────────────────────────────────────────────────── */
function Dashboard({leads,role,isMobile}){
  const fp=ROLES[role];
  const [fUser,setFUser]=useState("");
  const [fSource,setFSource]=useState("");
  const fl=leads.filter(l=>(!fUser||l.assignedTo===fUser)&&(!fSource||l.source===fSource));
  const won=fl.filter(l=>l.status==="Won");
  const pending=leads.filter(l=>l.assignStatus==="pending");
  const slaBreaches=leads.filter(l=>!l.lastContactDate&&l.assignStatus==="approved"&&l.status==="New");
  const agingAlerts=leads.filter(l=>{if(["Won","Lost","Disqualified"].includes(l.status))return false;const d=Math.floor((new Date(TODAY)-new Date(l.stageEnteredDate))/86400000);return d>(STAGE_CFG[l.status]?.maxDays||14);});
  const velocity=calcVelocity(leads);
  const stuckDeals=leads.filter(l=>{if(!ACTIVE_STAGES.includes(l.status))return false;const d=Math.floor((new Date(TODAY)-new Date(l.stageEnteredDate))/86400000);return d>(STAGE_CFG[l.status]?.maxDays||14)*1.5;});
  const forecast=ACTIVE_STAGES.map(stage=>{const sl=leads.filter(l=>l.status===stage&&l.dealValue);const p=STAGE_CFG[stage]?.prob||0;return{stage,prob:p,pipeline:sl.reduce((s,l)=>s+l.dealValue,0),forecast:Math.round(sl.reduce((s,l)=>s+l.dealValue,0)*p/100),count:sl.length,color:STAGE_CFG[stage]?.color};}).filter(r=>r.count>0);
  const totalPipeline=forecast.reduce((s,r)=>s+r.pipeline,0);
  const totalForecast=forecast.reduce((s,r)=>s+r.forecast,0);
  const srcRevenue=Object.entries(SRC_C).map(([src])=>{const sl=leads.filter(l=>l.source===src&&l.status==="Won");return{source:src,revenue:sl.reduce((s,l)=>s+(l.dealValue||0),0),deals:sl.length};}).filter(r=>r.revenue>0).sort((a,b)=>b.revenue-a.revenue);
  const lostLeads=leads.filter(l=>l.status==="Lost"&&l.lostReason);
  const lostMap=lostLeads.reduce((m,l)=>{m[l.lostReason]=(m[l.lostReason]||0)+1;return m;},{});
  const renewals=INIT_CLIENTS.flatMap(c=>[...c.services,...c.purchases].filter(p=>p.renewal!=="—"&&p.daysLeft<45).map(p=>({client:c.shortName,...p}))).sort((a,b)=>a.daysLeft-b.daysLeft);
  const renewalRevenue=renewals.reduce((s,r)=>s+(r.amount||0),0);
  const unviewedProposals=leads.filter(l=>l.status==="Proposal Sent"&&!l.proposalViewed);
  const proposalViewedCount=leads.filter(l=>l.proposalViewed).length;

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {/* Filters */}
      <Fbar>
        <span style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1}}>Filters</span>
        {fp.canSeeAll&&<Sfilter value={fUser} onChange={setFUser} opts={[{v:"",l:"All Executives"},...TEAM.filter(t=>t.role==="sales_exec").map(t=>({v:t.name,l:t.name}))]}/>}
        <Sfilter value={fSource} onChange={setFSource} opts={[{v:"",l:"All Sources"},...Object.keys(SRC_C).map(s=>({v:s,l:s}))]}/>
        <Btn v="ghost" sz="sm" onClick={()=>{setFUser("");setFSource("");}}>✕ Clear</Btn>
        <div style={{marginLeft:"auto",display:"flex",gap:6}}>
          <Btn sz="sm" v="ghost" style={{border:`1px solid ${C.border}`}}>⬇ Export Excel</Btn>
          <Btn sz="sm" v="ghost" style={{border:`1px solid ${C.border}`}}>⬇ Export PDF</Btn>
        </div>
      </Fbar>

      {/* Alerts strip */}
      {(pending.length>0||slaBreaches.length>0||agingAlerts.length>0||unviewedProposals.length>0||stuckDeals.length>0)&&(
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {pending.length>0&&<div style={{flex:1,minWidth:160,padding:"9px 14px",background:`${C.amber}12`,border:`1px solid ${C.amber}44`,borderRadius:10,fontSize:12,color:C.amber,fontWeight:600}}>⏳ {pending.length} approval(s) pending</div>}
          {slaBreaches.length>0&&<div style={{flex:1,minWidth:160,padding:"9px 14px",background:`${C.red}12`,border:`1px solid ${C.red}44`,borderRadius:10,fontSize:12,color:C.red,fontWeight:600}}>🚨 {slaBreaches.length} SLA breach(es)</div>}
          {agingAlerts.length>0&&<div style={{flex:1,minWidth:160,padding:"9px 14px",background:`${C.orange}12`,border:`1px solid ${C.orange}44`,borderRadius:10,fontSize:12,color:C.orange,fontWeight:600}}>⚠️ {agingAlerts.length} deal(s) over stage limit</div>}
          {unviewedProposals.length>0&&<div style={{flex:1,minWidth:160,padding:"9px 14px",background:`${C.purple}12`,border:`1px solid ${C.purple}44`,borderRadius:10,fontSize:12,color:C.purple,fontWeight:600}}>📄 {unviewedProposals.length} proposal(s) not yet viewed</div>}
          {stuckDeals.length>0&&<div style={{flex:1,minWidth:160,padding:"9px 14px",background:`${C.red}12`,border:`1px solid ${C.red}55`,borderRadius:10,fontSize:12,color:C.red,fontWeight:600}}>🔴 {stuckDeals.length} deal(s) stuck — notify manager</div>}
        </div>
      )}

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(6,1fr)",gap:10}}>
        <KPI label="Total Leads" value={fl.length} sub={`${fl.filter(l=>l.score==="Hot").length} hot`} color={C.accent}/>
        <KPI label="Won Deals" value={won.length} sub="This period" color={C.green}/>
        <KPI label="Pipeline" value={`₹${(totalPipeline/100000).toFixed(1)}L`} sub="Active" color={C.purple}/>
        <KPI label="Forecast" value={`₹${(totalForecast/100000).toFixed(1)}L`} sub="Probability-wtd" color={C.teal}/>
        <KPI label="Velocity" value={velocity?`${velocity}d`:"-"} sub="Avg New→Won" color={C.orange}/>
        <KPI label="Renewal Rev." value={`₹${(renewalRevenue/100000).toFixed(1)}L`} sub="Upcoming (<45d)" color={C.lime}/>
      </div>

      {/* Charts */}
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"2fr 1fr",gap:12}}>
        <Card title="Monthly Performance">
          <ResponsiveContainer width="100%" height={155}>
            <LineChart data={MONTHLY} margin={{left:-10,right:12,top:4,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.faint}/><XAxis dataKey="month" tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false}/><YAxis tick={{fill:C.muted,fontSize:9}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,fontSize:11}}/>
              <Line type="monotone" dataKey="leads" stroke={C.accent} strokeWidth={2} dot={false} name="Leads"/>
              <Line type="monotone" dataKey="deals" stroke={C.green} strokeWidth={2} dot={false} name="Deals"/>
              <Legend iconType="circle" wrapperStyle={{fontSize:10}}/>
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Revenue by Source">
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {srcRevenue.length===0?<div style={{color:C.muted,fontSize:12,textAlign:"center",padding:"20px 0"}}>No won deals yet</div>:srcRevenue.slice(0,5).map(r=>(
              <div key={r.source} style={{display:"flex",flexDirection:"column",gap:3}}>
                <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:11}}>{r.source}</span><span style={{fontSize:11,fontWeight:700,color:C.green}}>₹{(r.revenue/100000).toFixed(1)}L</span></div>
                <div style={{height:4,background:C.faint,borderRadius:2}}><div style={{width:`${(r.revenue/srcRevenue[0].revenue)*100}%`,height:"100%",background:SRC_C[r.source]||C.green,borderRadius:2}}/></div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Forecast table */}
      <Card title="📊 Revenue Forecast by Stage" action={<Badge label="Probability-weighted" color={C.teal}/>}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:480}}>
            <thead><tr><TH ch="Stage"/><TH ch="Leads"/><TH ch="Pipeline"/><TH ch="Probability"/><TH ch="Forecast"/><TH ch="Progress"/></tr></thead>
            <tbody>
              {forecast.map(r=>(<tr key={r.stage}><TD><Badge label={r.stage} color={r.color}/></TD><TD>{r.count}</TD><TD>₹{r.pipeline.toLocaleString()}</TD><TD><span style={{fontWeight:700,color:r.color}}>{r.prob}%</span></TD><TD style={{fontWeight:700,color:C.teal}}>₹{r.forecast.toLocaleString()}</TD><TD><div style={{width:"100%",height:5,background:C.faint,borderRadius:3}}><div style={{width:`${r.prob}%`,height:"100%",background:r.color,borderRadius:3}}/></div></TD></tr>))}
              <tr style={{background:`${C.teal}08`}}><TD style={{fontWeight:700}}>TOTAL</TD><TD style={{fontWeight:700}}>{forecast.reduce((s,r)=>s+r.count,0)}</TD><TD style={{fontWeight:700}}>₹{totalPipeline.toLocaleString()}</TD><TD>—</TD><TD style={{fontWeight:800,color:C.teal,fontSize:13}}>₹{totalForecast.toLocaleString()}</TD><TD/></tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Project timelines */}
      <Card title="📅 Active Project Timelines">
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {INIT_PROJECTS.filter(p=>p.status==="In Progress").map(p=>(<div key={p.id} style={{padding:12,background:C.faint,borderRadius:10,border:`1px solid ${C.border}`}}><Timeline p={p} compact/></div>))}
        </div>
      </Card>

      {/* Bottom widgets */}
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr",gap:12}}>
        <Card title="🔔 Smart Renewals" action={<Badge label={`₹${(renewalRevenue/100000).toFixed(1)}L forecast`} color={C.lime}/>}>
          {renewals.slice(0,6).map((r,i)=>{const uc=r.daysLeft<=7?C.red:r.daysLeft<=30?C.amber:C.green;return(<div key={i} style={{padding:"7px 0",borderBottom:`1px solid ${C.faint}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:12,fontWeight:600}}>{r.client}</div><div style={{fontSize:10,color:C.muted}}>{r.name}</div></div><div style={{textAlign:"right"}}><div style={{fontSize:11,fontWeight:700,color:uc}}>{r.daysLeft}d</div><Badge label={r.status} color={uc}/></div></div>);})}
        </Card>
        <Card title="📉 Lost Deal Analysis">
          {Object.keys(lostMap).length===0?<div style={{color:C.muted,fontSize:12,textAlign:"center",padding:"16px 0"}}>No lost deals yet</div>:Object.entries(lostMap).map(([r,c])=>(<div key={r} style={{padding:"6px 0",borderBottom:`1px solid ${C.faint}`}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:11}}>{r}</span><span style={{fontSize:11,fontWeight:700,color:C.red}}>{c}</span></div><div style={{height:4,background:C.faint,borderRadius:2}}><div style={{width:`${(c/lostLeads.length)*100}%`,height:"100%",background:C.red,borderRadius:2}}/></div></div>))}
        </Card>
        <Card title="📄 Proposal Tracking" action={<Badge label={`${proposalViewedCount} viewed`} color={C.green}/>}>
          {leads.filter(l=>["Proposal Sent","Negotiation","Closing Soon"].includes(l.status)).map(l=>(<div key={l.id} style={{padding:"7px 0",borderBottom:`1px solid ${C.faint}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:12,fontWeight:600}}>{l.company}</div><div style={{fontSize:10,color:C.muted}}>{l.status}</div></div><div style={{textAlign:"right"}}>{l.proposalViewed?<div><div style={{fontSize:10,color:C.green,fontWeight:700}}>👁 Viewed</div><div style={{fontSize:9,color:C.muted}}>{l.proposalViewedAt}</div></div>:<Badge label="Not opened" color={C.red}/>}</div></div>))}
        </Card>
      </div>
    </div>
  );
}

/* ── LEADS PAGE ──────────────────────────────────────────────────────── */
function LeadsPage({leads,setLeads,role,isMobile,onOpenLead}){
  const fp=ROLES[role];
  const [search,setSearch]=useState("");
  const [fStatus,setFStatus]=useState("");
  const [fScore,setFScore]=useState("");
  const [fSource,setFSource]=useState("");
  const [fAssign,setFAssign]=useState("");
  const [showAdd,setShowAdd]=useState(false);
  const [showLost,setShowLost]=useState(null);
  const [showDisq,setShowDisq]=useState(null);
  const [lostReason,setLostReason]=useState("");
  const [disqReason,setDisqReason]=useState("");
  const [showImport,setShowImport]=useState(false);

  const fl=leads.filter(l=>{
    const s=search.toLowerCase();
    return (l.company.toLowerCase().includes(s)||l.contact.toLowerCase().includes(s)||l.id.toLowerCase().includes(s))&&((!fStatus)||l.status===fStatus)&&((!fScore)||l.score===fScore)&&((!fSource)||l.source===fSource)&&((!fAssign)||l.assignStatus===fAssign);
  });

  const approve=id=>setLeads(ls=>ls.map(l=>l.id===id?{...l,assignStatus:"approved",history:[...l.history,{action:"Assignment Approved",by:fp.label,date:TODAY,time:"Now"}]}:l));
  const reject=id=>setLeads(ls=>ls.map(l=>l.id===id?{...l,assignedTo:"",assignStatus:"unassigned",history:[...l.history,{action:"Assignment Rejected",by:fp.label,date:TODAY,time:"Now"}]}:l));
  const confirmLost=()=>{if(!lostReason)return;setLeads(ls=>ls.map(l=>l.id===showLost.id?{...l,status:"Lost",lostReason,history:[...l.history,{action:"Status → Lost",by:fp.label,date:TODAY,time:"Now",reason:lostReason}]}:l));setShowLost(null);setLostReason("");};
  const confirmDisq=()=>{if(!disqReason)return;setLeads(ls=>ls.map(l=>l.id===showDisq.id?{...l,status:"Disqualified",disqReason,history:[...l.history,{action:"Lead Disqualified",by:fp.label,date:TODAY,time:"Now",reason:disqReason}]}:l));setShowDisq(null);setDisqReason("");};

  const stageGroups=ACTIVE_STAGES.reduce((m,s)=>{m[s]=fl.filter(l=>l.status===s).length;return m;},{});

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {/* Pipeline summary bar */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {ACTIVE_STAGES.map(s=>(<div key={s} style={{flex:1,minWidth:80,padding:"7px 10px",background:stageGroups[s]>0?`${STAGE_CFG[s].color}18`:`${C.faint}80`,borderRadius:8,border:`1px solid ${stageGroups[s]>0?STAGE_CFG[s].color+"44":C.border}`,textAlign:"center"}}>
          <div style={{fontSize:16,fontWeight:800,color:stageGroups[s]>0?STAGE_CFG[s].color:C.muted}}>{stageGroups[s]}</div>
          <div style={{fontSize:9,color:C.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5}}>{s}</div>
        </div>))}
      </div>

      <Fbar>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Company / contact / ID..." style={{background:C.faint,border:`1px solid ${C.border}`,borderRadius:7,color:C.text,padding:"6px 10px",fontSize:12,outline:"none",width:isMobile?"100%":170}}/>
        <Sfilter value={fStatus} onChange={setFStatus} opts={[{v:"",l:"All Status"},...ALL_STAGES.map(s=>({v:s,l:s}))]}/>
        <Sfilter value={fScore} onChange={setFScore} opts={[{v:"",l:"All Scores"},{v:"Hot",l:"🔥 Hot"},{v:"Warm",l:"🌡 Warm"},{v:"Cold",l:"❄️ Cold"}]}/>
        <Sfilter value={fSource} onChange={setFSource} opts={[{v:"",l:"All Sources"},...Object.keys(SRC_C).map(s=>({v:s,l:s}))]}/>
        <Sfilter value={fAssign} onChange={setFAssign} opts={[{v:"",l:"All Assign"},{v:"approved",l:"✅ Approved"},{v:"pending",l:"⏳ Pending"},{v:"unassigned",l:"❌ Unassigned"}]}/>
        <Btn v="ghost" sz="sm" onClick={()=>{setSearch("");setFStatus("");setFScore("");setFSource("");setFAssign("");}}>✕</Btn>
        <div style={{marginLeft:"auto",display:"flex",gap:6}}>
          {fp.canAssign&&<Btn sz="sm" v="ghost" onClick={()=>setShowImport(true)}>📥 Import CSV</Btn>}
          <Btn sz="sm" v="ghost" style={{border:`1px solid ${C.border}`}}>⬇ Export</Btn>
          {fp.canAssign&&<Btn sz="sm" onClick={()=>setShowAdd(true)}>+ Add Lead</Btn>}
        </div>
      </Fbar>

      {isMobile?(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {fl.map(l=>{
            const qs=calcQScore(l);
            return(<div key={l.id} style={{background:C.card,borderRadius:12,border:`1px solid ${C.border}`,padding:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <div><div style={{fontWeight:700,fontSize:13}}>{l.company}</div><div style={{fontSize:11,color:C.muted}}>{l.contact}</div></div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3}}><Badge label={l.score} color={SCORE_C[l.score]}/><span style={{fontSize:10,color:C.muted}}>Q:{qs}</span></div>
              </div>
              <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:8}}>
                <Badge label={l.status} color={STAGE_CFG[l.status]?.color}/>
                <Badge label={l.assignStatus==="pending"?"⏳ Pending":l.assignStatus==="approved"?"✅ Approved":"Unassigned"} color={ASSIGN_C[l.assignStatus]}/>
                {!l.lastContactDate&&l.assignStatus==="approved"&&l.status==="New"&&<Badge label="SLA⚠" color={C.red}/>}
              </div>
              <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}>
                {l.assignStatus==="pending"&&fp.canApprove&&<><Btn sz="sm" v="success" onClick={()=>approve(l.id)}>✓</Btn><Btn sz="sm" v="danger" onClick={()=>reject(l.id)}>✗</Btn></>}
                <Btn sz="sm" onClick={()=>onOpenLead(l)}>View</Btn>
              </div>
            </div>);
          })}
        </div>
      ):(
        <div style={{background:C.card,borderRadius:12,border:`1px solid ${C.border}`,overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:1060}}>
            <thead><tr><TH ch="ID"/><TH ch="Company / Contact"/><TH ch="Service"/><TH ch="Source"/><TH ch="Score"/><TH ch="Q-Score"/><TH ch="Stage"/><TH ch="Age/SLA"/><TH ch="Proposal"/><TH ch="Assignment"/><TH ch="F/Up"/><TH ch="Actions"/></tr></thead>
            <tbody>{fl.map(l=>{
              const qs=calcQScore(l);
              const stageDays=Math.floor((new Date(TODAY)-new Date(l.stageEnteredDate))/86400000);
              const maxDays=STAGE_CFG[l.status]?.maxDays||14;
              const ageOver=stageDays>maxDays&&ACTIVE_STAGES.includes(l.status);
              const slaBreached=!l.lastContactDate&&l.assignStatus==="approved"&&l.status==="New";
              return(<tr key={l.id} style={{cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background=`${C.faint}55`} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <TD style={{color:C.accent,fontWeight:600,fontSize:11}}>{l.id}</TD>
                <TD><div style={{fontWeight:600}}>{l.company}</div><div style={{fontSize:10,color:C.muted}}>{l.contact} · {l.phone}</div></TD>
                <TD style={{fontSize:11,maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.service}</TD>
                <TD><Badge label={l.source} color={SRC_C[l.source]||C.muted}/></TD>
                <TD><Badge label={l.score} color={SCORE_C[l.score]}/></TD>
                <TD><div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:36,height:5,background:C.faint,borderRadius:3}}><div style={{width:`${qs}%`,height:"100%",background:qs>=70?C.green:qs>=40?C.amber:C.red,borderRadius:3}}/></div><span style={{fontSize:11,fontWeight:700,color:qs>=70?C.green:qs>=40?C.amber:C.red}}>{qs}</span></div></TD>
                <TD><div style={{display:"flex",flexDirection:"column",gap:2}}><Badge label={l.status} color={STAGE_CFG[l.status]?.color}/>{l.lostReason&&<div style={{fontSize:9,color:C.muted}}>{l.lostReason}</div>}{l.disqReason&&<div style={{fontSize:9,color:C.muted}}>{l.disqReason}</div>}</div></TD>
                <TD><div style={{display:"flex",flexDirection:"column",gap:2}}>{ageOver&&<span style={{fontSize:10,fontWeight:700,color:C.red}}>⚠ {stageDays}d/{maxDays}d</span>}{!ageOver&&ACTIVE_STAGES.includes(l.status)&&<span style={{fontSize:10,color:C.muted}}>{stageDays}d</span>}{slaBreached&&<Badge label="SLA⚠" color={C.red}/>}</div></TD>
                <TD>{l.proposalViewed?<div><div style={{fontSize:10,color:C.green,fontWeight:700}}>👁 Viewed</div><div style={{fontSize:9,color:C.muted,whiteSpace:"nowrap"}}>{l.proposalViewedAt?.split(" ")[0]}</div></div>:<span style={{fontSize:10,color:C.muted}}>—</span>}</TD>
                <TD><div style={{display:"flex",alignItems:"center",gap:4}}><Dot color={ASSIGN_C[l.assignStatus]}/><span style={{fontSize:10,color:ASSIGN_C[l.assignStatus],fontWeight:600}}>{l.assignStatus==="pending"?"Pending":l.assignStatus==="approved"?"Approved":"Unassigned"}</span></div><div style={{fontSize:10,color:C.muted}}>{l.assignedTo||"—"}</div></TD>
                <TD style={{fontSize:11,color:C.muted,whiteSpace:"nowrap"}}>{l.followUpDate}</TD>
                <TD>
                  <div style={{display:"flex",gap:3,alignItems:"center",flexWrap:"wrap"}}>
                    {l.assignStatus==="pending"&&fp.canApprove&&<><Btn sz="sm" v="success" onClick={e=>{e.stopPropagation();approve(l.id);}}>✓</Btn><Btn sz="sm" v="danger" onClick={e=>{e.stopPropagation();reject(l.id);}}>✗</Btn></>}
                    {ACTIVE_STAGES.includes(l.status)&&fp.canAssign&&<Btn sz="sm" v="danger" onClick={e=>{e.stopPropagation();setShowLost(l);setLostReason("");}}>Lost</Btn>}
                    {["New","Contacted"].includes(l.status)&&fp.canAssign&&<Btn sz="sm" v="ghost" onClick={e=>{e.stopPropagation();setShowDisq(l);setDisqReason("");}}>Disq</Btn>}
                    <Btn sz="sm" onClick={e=>{e.stopPropagation();onOpenLead(l);}}>View</Btn>
                  </div>
                </TD>
              </tr>);
            })}</tbody>
          </table>
        </div>
      )}

      {showAdd&&<AddLeadModal leads={leads} setLeads={setLeads} role={role} onClose={()=>setShowAdd(false)}/>}
      {showImport&&<BulkImportModal leads={leads} setLeads={setLeads} role={role} onClose={()=>setShowImport(false)}/>}

      {showLost&&<Modal title={`Mark Lost – ${showLost.company}`} onClose={()=>setShowLost(null)} mw={440}>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{padding:"10px 14px",background:`${C.red}12`,borderRadius:8,fontSize:12,color:C.red}}>Select a reason to help improve future sales strategy.</div>
          {LOST_REASONS.map(r=>(<label key={r} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",padding:"7px 12px",borderRadius:8,background:lostReason===r?`${C.red}15`:C.faint,border:`1px solid ${lostReason===r?C.red+"44":C.border}`,fontSize:12}}><input type="radio" name="lost" value={r} checked={lostReason===r} onChange={()=>setLostReason(r)} style={{accentColor:C.red}}/>{r}</label>))}
          <div style={{display:"flex",gap:8,marginTop:4}}><Btn v="danger" onClick={confirmLost} disabled={!lostReason}>Confirm Lost</Btn><Btn v="ghost" onClick={()=>setShowLost(null)}>Cancel</Btn></div>
        </div>
      </Modal>}

      {showDisq&&<Modal title={`Disqualify – ${showDisq.company}`} onClose={()=>setShowDisq(null)} mw={440}>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{padding:"10px 14px",background:`${C.red}12`,borderRadius:8,fontSize:12,color:C.muted}}>Disqualified leads are removed from active pipeline.</div>
          {DISQ_REASONS.map(r=>(<label key={r} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",padding:"7px 12px",borderRadius:8,background:disqReason===r?`${C.orange}15`:C.faint,border:`1px solid ${disqReason===r?C.orange+"44":C.border}`,fontSize:12}}><input type="radio" name="disq" value={r} checked={disqReason===r} onChange={()=>setDisqReason(r)} style={{accentColor:C.orange}}/>{r}</label>))}
          <div style={{display:"flex",gap:8,marginTop:4}}><Btn v="warn" onClick={confirmDisq} disabled={!disqReason}>Disqualify Lead</Btn><Btn v="ghost" onClick={()=>setShowDisq(null)}>Cancel</Btn></div>
        </div>
      </Modal>}
    </div>
  );
}

/* ── BULK IMPORT ─────────────────────────────────────────────────────── */
function BulkImportModal({leads,setLeads,role,onClose}){
  const fp=ROLES[role];
  const [activeTab,setActiveTab]=useState("photo"); // photo | excel | csv
  const [parsed,setParsed]=useState([]);
  const [dupes,setDupes]=useState([]);
  const [aiLoading,setAiLoading]=useState(false);
  const [aiError,setAiError]=useState("");
  const [imgPreview,setImgPreview]=useState(null);
  const [csvText,setCsvText]=useState("");
  const [importDone,setImportDone]=useState(false);
  const fileRef=React.useRef();
  const excelRef=React.useRef();

  const buildLead=(obj,idx)=>({
    id:`IMP${Date.now()}${idx}`,
    company:obj.company||obj.Company||"",
    contact:obj.contact||obj.Contact||obj.name||obj.Name||"",
    phone:String(obj.phone||obj.Phone||obj.Number||obj.number||""),
    email:obj.email||obj.Email||"",
    role:obj.role||obj.Role||"",
    location:obj.location||obj.Location||"Kerala",
    source:obj.source||obj.Source||"Google Ads",
    service:obj.service||obj.Service||obj.product||obj.Product||"",
    dealValue:Number(obj.dealValue||obj.DealValue||obj.deal_value||0),
    score:"Cold",status:"New",assignedTo:"",assignStatus:"unassigned",
    createdDate:obj.date||obj.Date||TODAY,
    stageEnteredDate:TODAY,wonDate:null,
    followUpDate:obj.followUp||obj.follow_up||"—",
    lastContactDate:"",expectedCredit:"",creditChanges:[],
    remarks:obj.remarks||obj.Remarks||obj.notes||obj.Notes||"",
    lostReason:"",disqReason:"",proposalViewed:false,proposalViewedAt:null,
    budgetConfirmed:false,timelineConfirmed:false,
    qualChecklist:{budget:false,decisionMaker:false,requirement:false,timeline:false},
    nps:null,notes:[],tasks:[],
    history:[{action:"Lead Imported via Bulk Import",by:fp.label,date:TODAY,time:"Now"}]
  });

  const finaliseParsed=(rows)=>{
    const results=rows.map((r,i)=>buildLead(r,i)).filter(r=>r.company||r.contact||r.phone);
    const d=results.filter(r=>leads.some(l=>(l.phone&&l.phone===r.phone)||(l.email&&r.email&&l.email===r.email)));
    setDupes(d.map(r=>r.id));
    setParsed(results);
  };

  /* ── AI Photo Scan ── */
  const handlePhoto=async(e)=>{
    const file=e.target.files[0];
    if(!file)return;
    const reader=new FileReader();
    reader.onload=async(ev)=>{
      const b64=ev.target.result.split(",")[1];
      setImgPreview(ev.target.result);
      setAiLoading(true);setAiError("");setParsed([]);
      try{
        const res=await fetch("https://api.anthropic.com/v1/messages",{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({
            model:"claude-sonnet-4-20250514",max_tokens:1000,
            messages:[{role:"user",content:[
              {type:"image",source:{type:"base64",media_type:file.type||"image/png",data:b64}},
              {type:"text",text:`This is a lead/CRM spreadsheet. Extract ALL visible lead rows into a JSON array. Each object must have these keys (use empty string if not found): company, contact, phone, email, source, service, date, remarks. Return ONLY valid JSON array, no markdown, no explanation. Example: [{"company":"Acme","contact":"John","phone":"+91 9999","email":"","source":"LMS","service":"LMS","date":"","remarks":""}]`}
            ]}]
          })
        });
        const data=await res.json();
        const text=data.content?.find(b=>b.type==="text")?.text||"[]";
        const clean=text.replace(/```json|```/g,"").trim();
        const arr=JSON.parse(clean);
        finaliseParsed(Array.isArray(arr)?arr:[]);
      }catch(err){setAiError("Could not extract data. Please try a clearer image or use CSV/Excel.");}
      setAiLoading(false);
    };
    reader.readAsDataURL(file);
  };

  /* ── Excel Upload ── */
  const handleExcel=async(e)=>{
    const file=e.target.files[0];
    if(!file)return;
    try{
      const {read,utils}=await import("https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs");
      const buf=await file.arrayBuffer();
      const wb=read(buf);
      const ws=wb.Sheets[wb.SheetNames[0]];
      const rows=utils.sheet_to_json(ws,{defval:""});
      finaliseParsed(rows);
    }catch(err){setAiError("Could not read Excel file. Make sure it's a valid .xlsx file.");}
  };

  /* ── CSV Parse ── */
  const parseCsv=()=>{
    const rows=csvText.trim().split("\n");
    const headers=rows[0].split(",").map(h=>h.trim().toLowerCase().replace(/\s+/g,""));
    const map={company:["company","companyname"],contact:["contact","name","contactname"],phone:["phone","mobile","number","phonenumber"],email:["email"],source:["source","leadsource"],service:["service","product","leadsource2"],date:["date","createddate"],remarks:["remarks","notes","status","followup"]};
    const getVal=(obj,keys)=>{for(const k of keys){const found=Object.keys(obj).find(h=>keys.includes(h.toLowerCase().replace(/\s+/g,"")));if(found)return obj[found];}return "";};
    const data=rows.slice(1).map(r=>{const cols=r.split(",");const obj={};headers.forEach((h,i)=>obj[h]=cols[i]?.trim()||"");return{company:getVal(obj,map.company)||obj[headers[0]]||"",contact:getVal(obj,map.contact)||obj[headers[1]]||"",phone:getVal(obj,map.phone)||obj[headers[2]]||"",email:getVal(obj,map.email)||"",source:getVal(obj,map.source)||"Google Ads",service:getVal(obj,map.service)||"",date:getVal(obj,map.date)||"",remarks:getVal(obj,map.remarks)||""};});
    finaliseParsed(data);
  };

  /* ── Sample Excel Download ── */
  const downloadSample=async()=>{
    try{
      const {utils,writeFile}=await import("https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs");
      const sampleData=[
        {Date:"3-Feb-2026",Name:"Muhammed Junaid K",Phone:"+918078952613",Email:"junaid@example.com","Company Name":"TechCorp Pvt Ltd",Source:"Google Ads",Service:"LMS",DealValue:150000,Location:"Kerala",Remarks:"Interested in demo"},
        {Date:"3-Feb-2026",Name:"Aaryan Menon",Phone:"+919745143143",Email:"lukatmeee@gmail.com","Company Name":"",Source:"Meta",Service:"Mobile App",DealValue:80000,Location:"Kerala",Remarks:"Ask to call later"},
        {Date:"5-Feb-2026",Name:"Suraj P Pilanku",Phone:"+918078252505",Email:"pilanikusuraj@gmail.com","Company Name":"Impression",Source:"Website",Service:"Web Development",DealValue:60000,Location:"Kerala",Remarks:"Share details"},
      ];
      const ws=utils.json_to_sheet(sampleData);
      ws["!cols"]=[{wch:12},{wch:22},{wch:16},{wch:28},{wch:22},{wch:14},{wch:18},{wch:12},{wch:12},{wch:30}];
      const wb=utils.book_new();
      utils.book_append_sheet(wb,ws,"Leads");
      writeFile(wb,"IPIX_Lead_Import_Sample.xlsx");
    }catch(err){alert("Could not generate sample file.");}
  };

  const importAll=()=>{
    const toImport=parsed.filter(r=>!dupes.includes(r.id));
    setLeads(ls=>[...ls,...toImport]);
    setImportDone(true);
    setTimeout(()=>onClose(),1200);
  };

  const tabStyle=(id)=>({padding:"7px 16px",borderRadius:7,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:activeTab===id?C.accent:"transparent",color:activeTab===id?"#fff":C.muted});

  return(
    <Modal title="📥 Bulk Lead Import" onClose={onClose} mw={720}>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>

        {/* Download sample */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:`${C.green}10`,border:`1px solid ${C.green}33`,borderRadius:10}}>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:C.green}}>📄 Download Sample Excel Format</div>
            <div style={{fontSize:11,color:C.muted,marginTop:2}}>Matches your existing lead sheet — Date, Name, Phone, Email, Company, Source, Service, Deal Value, Location, Remarks</div>
          </div>
          <Btn v="success" sz="sm" onClick={downloadSample}>⬇ Sample Excel</Btn>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",gap:4,background:C.faint,borderRadius:10,padding:4}}>
          <button style={tabStyle("photo")} onClick={()=>setActiveTab("photo")}>📸 Scan Sheet Photo</button>
          <button style={tabStyle("excel")} onClick={()=>setActiveTab("excel")}>📊 Upload Excel / CSV File</button>
          <button style={tabStyle("csv")} onClick={()=>setActiveTab("csv")}>📋 Paste CSV Text</button>
        </div>

        {/* Photo Tab */}
        {activeTab==="photo"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div style={{padding:"10px 14px",background:`${C.purple}10`,border:`1px solid ${C.purple}33`,borderRadius:8,fontSize:11,color:C.muted}}>
              📸 Take a photo of your lead sheet (like the one above) and AI will extract all leads automatically.
            </div>
            <div
              style={{border:`2px dashed ${C.border}`,borderRadius:12,padding:"28px 20px",textAlign:"center",cursor:"pointer",background:C.faint}}
              onClick={()=>fileRef.current.click()}
            >
              {imgPreview
                ?<img src={imgPreview} alt="uploaded" style={{maxWidth:"100%",maxHeight:200,borderRadius:8,objectFit:"contain"}}/>
                :<div><div style={{fontSize:28,marginBottom:8}}>📷</div><div style={{fontSize:13,fontWeight:600,color:C.muted}}>Click to upload sheet photo</div><div style={{fontSize:11,color:C.muted,marginTop:4}}>Supports PNG, JPG, JPEG, WEBP</div></div>
              }
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handlePhoto}/>
            {aiLoading&&<div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",background:`${C.accent}10`,borderRadius:8,fontSize:12,color:C.accent}}><span style={{animation:"pulse 1s infinite",fontSize:16}}>🤖</span> AI is reading your sheet… extracting leads…</div>}
            {aiError&&<div style={{padding:"10px 14px",background:`${C.red}10`,border:`1px solid ${C.red}33`,borderRadius:8,fontSize:12,color:C.red}}>⚠️ {aiError}</div>}
          </div>
        )}

        {/* Excel Tab */}
        {activeTab==="excel"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div style={{padding:"10px 14px",background:`${C.accent}10`,border:`1px solid ${C.accent}33`,borderRadius:8,fontSize:11,color:C.muted}}>
              Upload your .xlsx or .csv file. Column headers are auto-detected — works best with the sample format above.
            </div>
            <div
              style={{border:`2px dashed ${C.border}`,borderRadius:12,padding:"32px 20px",textAlign:"center",cursor:"pointer",background:C.faint}}
              onClick={()=>excelRef.current.click()}
            >
              <div style={{fontSize:28,marginBottom:8}}>📊</div>
              <div style={{fontSize:13,fontWeight:600,color:C.muted}}>Click to upload Excel / CSV file</div>
              <div style={{fontSize:11,color:C.muted,marginTop:4}}>.xlsx, .xls, .csv supported</div>
            </div>
            <input ref={excelRef} type="file" accept=".xlsx,.xls,.csv" style={{display:"none"}} onChange={handleExcel}/>
            {aiError&&<div style={{padding:"10px 14px",background:`${C.red}10`,border:`1px solid ${C.red}33`,borderRadius:8,fontSize:12,color:C.red}}>⚠️ {aiError}</div>}
          </div>
        )}

        {/* CSV Tab */}
        {activeTab==="csv"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div style={{padding:"10px 14px",background:`${C.accent}10`,borderRadius:8,fontSize:11,color:C.muted}}>
              Paste CSV data. First row = headers.<br/>
              <code style={{color:C.accent,fontSize:10}}>Date,Name,Phone,Email,Company Name,Source,Service,DealValue,Location,Remarks</code>
            </div>
            <textarea value={csvText} onChange={e=>setCsvText(e.target.value)}
              placeholder={"Date,Name,Phone,Email,Company Name,Source,Service,DealValue,Location,Remarks\n3-Feb-2026,Muhammed Junaid K,+918078952613,,TechCorp,Google Ads,LMS,150000,Kerala,Demo interested"}
              style={{background:C.faint,border:`1px solid ${C.border}`,borderRadius:7,color:C.text,padding:"8px 10px",fontSize:11,outline:"none",width:"100%",minHeight:130,resize:"vertical",boxSizing:"border-box",fontFamily:"monospace"}}/>
            <Btn onClick={parseCsv} disabled={!csvText.trim()}>Parse CSV</Btn>
          </div>
        )}

        {/* Preview Table */}
        {parsed.length>0&&(
          <div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
              <div style={{fontSize:12,fontWeight:700}}>
                {parsed.length} leads found ·{" "}
                <span style={{color:C.green}}>{parsed.length-dupes.length} new</span> ·{" "}
                <span style={{color:C.red}}>{dupes.length} duplicate(s)</span>
              </div>
              {importDone&&<Badge label="✅ Imported!" color={C.green}/>}
            </div>
            <div style={{maxHeight:220,overflowY:"auto",border:`1px solid ${C.border}`,borderRadius:10}}>
              <table style={{width:"100%",borderCollapse:"collapse",minWidth:580}}>
                <thead><tr><TH ch="#"/><TH ch="Company"/><TH ch="Contact"/><TH ch="Phone"/><TH ch="Source"/><TH ch="Service"/><TH ch="Status"/></tr></thead>
                <tbody>{parsed.map((r,i)=>(<tr key={r.id} style={{background:dupes.includes(r.id)?`${C.red}08`:"transparent"}}>
                  <TD style={{fontSize:10,color:C.muted}}>{i+1}</TD>
                  <TD style={{fontWeight:600}}>{r.company||<span style={{color:C.muted}}>—</span>}</TD>
                  <TD style={{fontSize:11}}>{r.contact}</TD>
                  <TD style={{fontSize:11,color:C.muted}}>{r.phone}</TD>
                  <TD style={{fontSize:11}}>{r.source}</TD>
                  <TD style={{fontSize:11}}>{r.service||<span style={{color:C.muted}}>—</span>}</TD>
                  <TD>{dupes.includes(r.id)?<Badge label="Duplicate" color={C.red}/>:<Badge label="New" color={C.green}/>}</TD>
                </tr>))}</tbody>
              </table>
            </div>
            <div style={{display:"flex",gap:8,marginTop:12,alignItems:"center"}}>
              <Btn v="success" onClick={importAll} disabled={importDone||parsed.filter(r=>!dupes.includes(r.id)).length===0}>
                ✅ Import {parsed.filter(r=>!dupes.includes(r.id)).length} New Leads
              </Btn>
              {dupes.length>0&&<span style={{fontSize:11,color:C.muted}}>{dupes.length} duplicate(s) will be skipped</span>}
              <Btn v="ghost" onClick={onClose} style={{marginLeft:"auto"}}>Cancel</Btn>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ── ADD LEAD ────────────────────────────────────────────────────────── */
function AddLeadModal({leads,setLeads,role,onClose}){
  const fp=ROLES[role];
  const [form,setForm]=useState({company:"",contact:"",phone:"",backupPhone:"",email:"",backupEmail:"",role:"",location:"",source:"",campaign:"",adGroup:"",score:"Hot",status:"New",service:"",dealValue:"",budgetConfirmed:false,timelineConfirmed:false,remarks:"",assignedTo:""});
  const [errs,setErrs]=useState({});
  const [dup,setDup]=useState(null);
  useEffect(()=>{if(!form.phone&&!form.email)return;const d=leads.find(l=>(form.phone&&l.phone===form.phone)||(form.email&&l.email===form.email));setDup(d||null);},[form.phone,form.email,leads]);
  const validate=()=>{const e={};if(!form.company.trim())e.company="Required";if(!form.contact.trim())e.contact="Required";if(!form.phone.trim())e.phone="Required";if(!form.email.trim())e.email="Required";if(!form.source)e.source="Required";if(!form.service.trim())e.service="Required";return e;};
  const save=()=>{const e=validate();if(Object.keys(e).length){setErrs(e);return;}const id=`L${String(leads.length+1).padStart(3,"0")}`;setLeads(ls=>[...ls,{id,...form,dealValue:Number(form.dealValue)||0,assignStatus:form.assignedTo?"pending":"unassigned",createdDate:TODAY,stageEnteredDate:TODAY,wonDate:null,followUpDate:"—",lastContactDate:"",expectedCredit:"",creditChanges:[],lostReason:"",disqReason:"",proposalViewed:false,proposalViewedAt:null,qualChecklist:{budget:form.budgetConfirmed,decisionMaker:false,requirement:false,timeline:form.timelineConfirmed},nps:null,notes:[],tasks:[],history:[{action:"Lead Created",by:fp.label,date:TODAY,time:"Now"},...(form.assignedTo?[{action:`Assigned to ${form.assignedTo} – Pending Approval`,by:fp.label,date:TODAY,time:"Now"}]:[])]}]);onClose();};
  return(
    <Modal title="Add New Lead" onClose={onClose} mw={660}>
      {dup&&<div style={{marginBottom:12,padding:"10px 14px",background:`${C.red}15`,border:`1px solid ${C.red}44`,borderRadius:10}}><div style={{fontSize:12,fontWeight:700,color:C.red,marginBottom:4}}>⚠️ Duplicate Detected</div><div style={{fontSize:11,color:C.muted}}>Match found: <strong style={{color:C.text}}>{dup.company}</strong> ({dup.id}) — same phone/email</div><div style={{display:"flex",gap:6,marginTop:8}}><Btn sz="sm" v="ghost">View Existing</Btn><Btn sz="sm" v="danger">Continue Anyway</Btn></div></div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <FI label="Company" k="company" f={form} s={setForm} req errs={errs}/>
        <FI label="Contact Person" k="contact" f={form} s={setForm} req errs={errs}/>
        <FI label="Primary Phone" k="phone" f={form} s={setForm} req errs={errs}/>
        <FI label="Backup Phone" k="backupPhone" f={form} s={setForm}/>
        <FI label="Primary Email" k="email" f={form} s={setForm} req errs={errs}/>
        <FI label="Backup Email" k="backupEmail" f={form} s={setForm}/>
        <FI label="Contact Role" k="role" f={form} s={setForm}/>
        <FI label="Location" k="location" f={form} s={setForm}/>
        <FS label="Lead Source" k="source" f={form} s={setForm} req errs={errs} opts={[{v:"",l:"Select source"},...["Google Ads","Meta","LinkedIn","Website","Referral","Expo","Partner","Phone Call","Existing Client"].map(s=>({v:s,l:s}))]}/>
        <FI label="Campaign" k="campaign" f={form} s={setForm}/>
        <FI label="Ad Group" k="adGroup" f={form} s={setForm}/>
        <FI label="Service / Product" k="service" f={form} s={setForm} req errs={errs}/>
        <FI label="Deal Value (₹)" k="dealValue" f={form} s={setForm} type="number"/>
        <FS label="Score" k="score" f={form} s={setForm} opts={["Hot","Warm","Cold"]}/>
        <FS label="Assign To" k="assignedTo" f={form} s={setForm} opts={[{v:"",l:"Leave Unassigned"},...TEAM.filter(t=>t.role==="sales_exec").map(t=>({v:t.name,l:t.name}))]}/>
        <div style={{display:"flex",flexDirection:"column",gap:8,padding:"8px 10px",background:C.faint,borderRadius:7}}>
          <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:12}}><input type="checkbox" checked={!!form.budgetConfirmed} onChange={e=>setForm(f=>({...f,budgetConfirmed:e.target.checked}))} style={{accentColor:C.accent}}/>Budget Confirmed</label>
          <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:12}}><input type="checkbox" checked={!!form.timelineConfirmed} onChange={e=>setForm(f=>({...f,timelineConfirmed:e.target.checked}))} style={{accentColor:C.accent}}/>Timeline Confirmed</label>
        </div>
        <div style={{gridColumn:"1/-1"}}><label style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:0.8}}>Remarks</label><textarea value={form.remarks} onChange={e=>setForm(f=>({...f,remarks:e.target.value}))} style={{marginTop:4,background:C.faint,border:`1px solid ${C.border}`,borderRadius:7,color:C.text,padding:"7px 10px",fontSize:12,outline:"none",width:"100%",minHeight:56,resize:"vertical",boxSizing:"border-box"}}/></div>
      </div>
      {form.assignedTo&&<div style={{marginTop:10,padding:"8px 12px",background:`${C.amber}12`,border:`1px solid ${C.amber}44`,borderRadius:8,fontSize:11,color:C.amber}}>⏳ Will be <strong>Pending Approval</strong> until {form.assignedTo} accepts.</div>}
      <div style={{display:"flex",gap:8,marginTop:14}}><Btn onClick={save}>Save Lead</Btn><Btn v="ghost" onClick={onClose}>Cancel</Btn></div>
    </Modal>
  );
}

/* ── LEAD MODAL ──────────────────────────────────────────────────────── */
function LeadModal({lead,onClose,role,setLeads,leads}){
  const fp=ROLES[role];
  const [tab,setTab]=useState("details");
  const [editMode,setEditMode]=useState(false);
  const [form,setForm]=useState({...lead});
  const [errs,setErrs]=useState({});
  const [noteText,setNoteText]=useState("");
  const [taskForm,setTaskForm]=useState({title:"",assignedTo:"",dueDate:"",status:"Pending"});
  const [showWa,setShowWa]=useState(false);
  const [showMerge,setShowMerge]=useState(false);
  const [showQual,setShowQual]=useState(false);
  const [showCreditModal,setShowCreditModal]=useState(false);
  const [showNps,setShowNps]=useState(false);

  const validate=()=>{const e={};if(!form.company?.trim())e.company="Required";if(!form.phone?.trim())e.phone="Required";if(!form.email?.trim())e.email="Required";return e;};
  const save=()=>{const e=validate();if(Object.keys(e).length){setErrs(e);return;}setLeads(ls=>ls.map(l=>l.id===lead.id?{...form,history:[...form.history,{action:"Lead Details Updated",by:fp.label,date:TODAY,time:"Now"}]}:l));setEditMode(false);setErrs({});};
  const addNote=()=>{if(!noteText.trim())return;setLeads(ls=>ls.map(l=>l.id===lead.id?{...l,notes:[...l.notes,{text:noteText,by:fp.label,date:TODAY,time:"Now"}],history:[...l.history,{action:"Internal note added",by:fp.label,date:TODAY,time:"Now"}]}:l));setNoteText("");};
  const addTask=()=>{if(!taskForm.title.trim())return;const t={id:`T${Date.now()}`,title:taskForm.title,assignedTo:taskForm.assignedTo||fp.label,dueDate:taskForm.dueDate,status:"Pending"};setLeads(ls=>ls.map(l=>l.id===lead.id?{...l,tasks:[...l.tasks,t],history:[...l.history,{action:`Task created: ${t.title}`,by:fp.label,date:TODAY,time:"Now"}]}:l));setTaskForm({title:"",assignedTo:"",dueDate:"",status:"Pending"});};
  const qs=calcQScore(lead);
  const TABS=["details","notes","tasks","qualification","follow-up","credit","documents","history"];

  return(
    <Modal title={`${lead.company} · ${lead.id}`} onClose={onClose} mw={820}>
      {/* Header */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10,padding:"8px 12px",background:C.card,borderRadius:8,alignItems:"center"}}>
        <Badge label={lead.score} color={SCORE_C[lead.score]}/><Badge label={lead.status} color={STAGE_CFG[lead.status]?.color}/><Badge label={`Q:${qs}`} color={qs>=70?C.green:qs>=40?C.amber:C.red}/>
        <Badge label={lead.assignStatus==="pending"?"⏳ Pending":lead.assignStatus==="approved"?"✅ Approved":"❌ Unassigned"} color={ASSIGN_C[lead.assignStatus]}/>
        {lead.lostReason&&<Badge label={`Lost: ${lead.lostReason}`} color={C.red}/>}
        {lead.disqReason&&<Badge label={`Disq: ${lead.disqReason}`} color={"#4B5563"}/>}
        {lead.nps!==null&&lead.nps!==undefined&&<Badge label={`NPS: ${lead.nps}/10`} color={lead.nps>=9?C.green:lead.nps>=7?C.amber:C.red}/>}
        <div style={{marginLeft:"auto",display:"flex",gap:6}}>
          <Btn sz="sm" v="success" onClick={()=>setShowWa(true)}>💬 WA</Btn>
          {lead.status==="Won"&&!lead.nps&&<Btn sz="sm" v="purple" onClick={()=>setShowNps(true)}>NPS</Btn>}
          {fp.canAssign&&<Btn sz="sm" v="ghost" onClick={()=>setShowMerge(true)}>🔀 Merge</Btn>}
        </div>
      </div>

      {/* Q-Score bar */}
      <div style={{marginBottom:12,padding:"8px 12px",background:`${qs>=70?C.green:qs>=40?C.amber:C.red}10`,borderRadius:8,border:`1px solid ${qs>=70?C.green:qs>=40?C.amber:C.red}33`}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:11,fontWeight:700,color:C.muted}}>Lead Quality Score</span><span style={{fontSize:12,fontWeight:800,color:qs>=70?C.green:qs>=40?C.amber:C.red}}>{qs}/100 · {scoreLabel(qs)}</span></div>
        <div style={{height:6,background:C.faint,borderRadius:3}}><div style={{width:`${qs}%`,height:"100%",background:qs>=70?C.green:qs>=40?C.amber:C.red,borderRadius:3,transition:"width 0.5s"}}/></div>
        <div style={{display:"flex",gap:10,marginTop:5,flexWrap:"wrap"}}>
          {[["Corp email",lead.email&&!lead.email.includes("gmail")&&!lead.email.includes("yahoo"),20],["Phone",!!lead.phone,10],["Budget",lead.budgetConfirmed,30],["Timeline",lead.timelineConfirmed,20],["Referral/Existing",["Referral","Existing Client"].includes(lead.source),40]].map(([l,met,pts])=>(<span key={l} style={{fontSize:9,color:met?C.green:C.muted}}>{met?"✓":"✗"} {l} (+{pts})</span>))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:4,marginBottom:14,flexWrap:"wrap",borderBottom:`1px solid ${C.border}`,paddingBottom:8}}>
        {TABS.map(t=>(<Btn key={t} v={tab===t?"primary":"ghost"} sz="sm" onClick={()=>setTab(t)} style={{textTransform:"capitalize"}}>{t}{t==="notes"&&lead.notes.length>0?<span style={{marginLeft:3,background:C.amber,color:"#000",borderRadius:10,fontSize:9,padding:"0 4px"}}>{lead.notes.length}</span>:null}{t==="tasks"&&lead.tasks.filter(x=>x.status!=="Completed").length>0?<span style={{marginLeft:3,background:C.red,color:"#fff",borderRadius:10,fontSize:9,padding:"0 4px"}}>{lead.tasks.filter(x=>x.status!=="Completed").length}</span>:null}</Btn>))}
        {tab==="details"&&fp.canAssign&&<Btn sz="sm" v={editMode?"danger":"ghost"} style={{marginLeft:"auto"}} onClick={()=>setEditMode(e=>!e)}>{editMode?"✕":"✏️ Edit"}</Btn>}
        {editMode&&<Btn sz="sm" v="success" onClick={save}>✓ Save</Btn>}
      </div>

      {tab==="details"&&(editMode?(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <FI label="Company" k="company" f={form} s={setForm} req errs={errs}/>
          <FI label="Contact Person" k="contact" f={form} s={setForm}/>
          <FI label="Primary Phone" k="phone" f={form} s={setForm} req errs={errs}/>
          <FI label="Backup Phone" k="backupPhone" f={form} s={setForm}/>
          <FI label="Primary Email" k="email" f={form} s={setForm} req errs={errs}/>
          <FI label="Backup Email" k="backupEmail" f={form} s={setForm}/>
          <FI label="Role / Title" k="role" f={form} s={setForm}/>
          <FI label="Location" k="location" f={form} s={setForm}/>
          <FS label="Score" k="score" f={form} s={setForm} opts={["Hot","Warm","Cold"]}/>
          <FS label="Status" k="status" f={form} s={setForm} opts={ALL_STAGES.map(s=>({v:s,l:s}))}/>
          <FI label="Service" k="service" f={form} s={setForm}/>
          <FI label="Deal Value (₹)" k="dealValue" f={form} s={setForm} type="number"/>
          <div style={{gridColumn:"1/-1",display:"flex",gap:16,padding:"8px 10px",background:C.faint,borderRadius:7}}>
            <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:12}}><input type="checkbox" checked={!!form.budgetConfirmed} onChange={e=>setForm(f=>({...f,budgetConfirmed:e.target.checked}))} style={{accentColor:C.accent}}/>Budget Confirmed</label>
            <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:12}}><input type="checkbox" checked={!!form.timelineConfirmed} onChange={e=>setForm(f=>({...f,timelineConfirmed:e.target.checked}))} style={{accentColor:C.accent}}/>Timeline Confirmed</label>
          </div>
          <div style={{gridColumn:"1/-1"}}><label style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:0.8}}>Remarks</label><textarea value={form.remarks||""} onChange={e=>setForm(f=>({...f,remarks:e.target.value}))} style={{marginTop:4,background:C.faint,border:`1px solid ${C.border}`,borderRadius:7,color:C.text,padding:"7px 10px",fontSize:12,outline:"none",width:"100%",minHeight:60,resize:"vertical",boxSizing:"border-box"}}/></div>
        </div>
      ):(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {[["Lead ID",lead.id],["Company",lead.company],["Contact",lead.contact],["Phone",lead.phone],["Backup Phone",lead.backupPhone||"—"],["Email",lead.email],["Backup Email",lead.backupEmail||"—"],["Role",lead.role],["Location",lead.location],["Service",lead.service],["Deal Value",lead.dealValue?`₹${lead.dealValue.toLocaleString()}`:"—"],["Budget",lead.budgetConfirmed?"✅ Confirmed":"❌ Not confirmed"],["Timeline",lead.timelineConfirmed?"✅ Confirmed":"❌ Not confirmed"],["Source",lead.source],["Campaign",lead.campaign||"—"],["Expected Credit",lead.expectedCredit||"—"],["Credit Changes",`${lead.creditChanges.length}/3 used`],["Proposal Viewed",lead.proposalViewed?`✅ ${lead.proposalViewedAt}`:"❌ Not opened"],["NPS Score",lead.nps!==null&&lead.nps!==undefined?`${lead.nps}/10`:"Not submitted"],["Remarks",lead.remarks||"—"]].map(([k,v])=>(<div key={k}><div style={{fontSize:10,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:2}}>{k}</div><div style={{fontSize:12,fontWeight:500,lineHeight:1.4}}>{v}</div></div>))}
        </div>
      ))}

      {tab==="notes"&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{padding:"8px 12px",background:`${C.amber}10`,borderRadius:8,fontSize:11,color:C.muted}}>🔒 Internal notes — visible to team only, never shown to clients.</div>
          {lead.notes.length===0&&<div style={{color:C.muted,fontSize:12,textAlign:"center",padding:"20px 0"}}>No internal notes yet.</div>}
          {lead.notes.map((n,i)=>(<div key={i} style={{padding:"10px 12px",background:C.faint,borderRadius:8}}><div style={{fontSize:12,lineHeight:1.5}}>{n.text}</div><div style={{fontSize:10,color:C.muted,marginTop:4}}>By {n.by} · {n.date} {n.time}</div></div>))}
          <div style={{display:"flex",gap:8,marginTop:4}}><textarea value={noteText} onChange={e=>setNoteText(e.target.value)} placeholder="Add internal note..." style={{flex:1,background:C.faint,border:`1px solid ${C.border}`,borderRadius:7,color:C.text,padding:"8px 10px",fontSize:12,outline:"none",minHeight:60,resize:"vertical",boxSizing:"border-box"}}/><Btn onClick={addNote} style={{alignSelf:"flex-end"}} disabled={!noteText.trim()}>Add</Btn></div>
        </div>
      )}

      {tab==="tasks"&&(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {lead.tasks.length===0&&<div style={{color:C.muted,fontSize:12,textAlign:"center",padding:"16px 0"}}>No tasks yet.</div>}
          {lead.tasks.map(t=>(<div key={t.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 12px",background:C.faint,borderRadius:8,border:`1px solid ${C.border}`}}><div><div style={{fontSize:12,fontWeight:600,textDecoration:t.status==="Completed"?"line-through":"none",color:t.status==="Completed"?C.muted:C.text}}>{t.title}</div><div style={{fontSize:10,color:C.muted,marginTop:2}}>{t.assignedTo} · Due: {t.dueDate}</div></div><Badge label={t.status} color={t.status==="Completed"?C.green:t.status==="Overdue"?C.red:t.status==="In Progress"?C.amber:C.muted}/></div>))}
          <div style={{padding:"12px 14px",background:C.card2,borderRadius:10,border:`1px solid ${C.border}`}}>
            <div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:0.8}}>Add New Task</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
              <FI label="Task Title" k="title" f={taskForm} s={setTaskForm} req/>
              <FS label="Assign To" k="assignedTo" f={taskForm} s={setTaskForm} opts={[{v:"",l:"Myself"},...TEAM.map(t=>({v:t.name,l:t.name}))]}/>
              <FI label="Due Date" k="dueDate" f={taskForm} s={setTaskForm} type="date"/>
            </div>
            <Btn onClick={addTask} style={{marginTop:8}} disabled={!taskForm.title.trim()}>+ Add Task</Btn>
          </div>
        </div>
      )}

      {tab==="qualification"&&(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:13,fontWeight:700}}>Qualification Checklist</span><Btn sz="sm" onClick={()=>setShowQual(true)}>Edit Checklist</Btn></div>
          {[["budget","Budget confirmed / available",lead.qualChecklist?.budget],["decisionMaker","Decision maker identified",lead.qualChecklist?.decisionMaker],["requirement","Requirement clearly understood",lead.qualChecklist?.requirement],["timeline","Timeline confirmed",lead.qualChecklist?.timeline]].map(([k,label,done])=>(<div key={k} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:8,background:done?`${C.green}12`:C.faint,border:`1px solid ${done?C.green+"44":C.border}`}}><span style={{fontSize:16}}>{done?"✅":"⬜"}</span><span style={{fontSize:12,fontWeight:done?600:400,color:done?C.text:C.muted}}>{label}</span>{done&&<span style={{marginLeft:"auto",fontSize:11,fontWeight:700,color:C.green}}>✓ Confirmed</span>}</div>))}
          {lead.qualChecklist&&Object.values(lead.qualChecklist).every(Boolean)&&<div style={{padding:"10px 14px",background:`${C.green}12`,border:`1px solid ${C.green}44`,borderRadius:8,fontSize:12,fontWeight:700,color:C.green}}>✅ Fully Qualified — ready to progress to Scope/Proposal</div>}
        </div>
      )}

      {tab==="follow-up"&&(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <FI label="Next Follow-up Date" k="followUpDate" f={form} s={setForm} type="date"/>
            <FS label="Follow-up Type" k="followType" f={form} s={setForm} opts={[{v:"",l:"Select type"},"Connected","Missed","Scheduled","Callback","Demo","Site Visit"]}/>
          </div>
          <div><label style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:0.8}}>Remarks</label><textarea value={form.remarks||""} onChange={e=>setForm(f=>({...f,remarks:e.target.value}))} style={{marginTop:4,background:C.faint,border:`1px solid ${C.border}`,borderRadius:7,color:C.text,padding:"7px 10px",fontSize:12,outline:"none",width:"100%",minHeight:70,resize:"vertical",boxSizing:"border-box"}}/></div>
          <FI label="Next Meeting Date & Time" k="nextMeeting" f={form} s={setForm} type="datetime-local"/>
          <Btn>Save Follow-up</Btn>
        </div>
      )}

      {tab==="credit"&&(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:13,fontWeight:700}}>Expected Credit Date</span><Btn sz="sm" onClick={()=>setShowCreditModal(true)} disabled={lead.creditChanges.length>=3}>Change Date ({3-lead.creditChanges.length} left)</Btn></div>
          <div style={{padding:"12px 14px",background:C.card2,borderRadius:10,border:`1px solid ${C.border}`}}>
            <div style={{fontSize:12,color:C.muted,marginBottom:4}}>Current Expected Credit Date</div>
            <div style={{fontSize:18,fontWeight:800,color:C.accent}}>{lead.expectedCredit||"Not set"}</div>
            <div style={{fontSize:11,color:C.muted,marginTop:4}}>{lead.creditChanges.length}/3 changes used</div>
          </div>
          {lead.creditChanges.length>0&&(
            <div>
              <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:0.8,marginBottom:6}}>Change Log</div>
              {lead.creditChanges.map((c,i)=>(<div key={i} style={{padding:"9px 12px",background:C.faint,borderRadius:8,marginBottom:6}}><div style={{fontSize:12}}><span style={{color:C.red,textDecoration:"line-through"}}>{c.oldDate}</span> → <span style={{color:C.green,fontWeight:700}}>{c.newDate}</span></div><div style={{fontSize:11,color:C.amber,marginTop:2}}>Reason: {c.reason}</div><div style={{fontSize:10,color:C.muted,marginTop:2}}>By {c.by} · {c.date}</div></div>))}
            </div>
          )}
          {lead.creditChanges.length>=3&&<div style={{padding:"8px 12px",background:`${C.red}12`,borderRadius:8,fontSize:12,color:C.red,fontWeight:600}}>⚠️ Maximum 3 credit date changes reached</div>}
        </div>
      )}

      {tab==="documents"&&(
        <div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>{["Scope","Proposal","Invoice","Agreement","Brochure","Other"].map(t=><Btn key={t} sz="sm" v="ghost">+ {t}</Btn>)}</div>
          <div style={{padding:28,textAlign:"center",color:C.muted,border:`2px dashed ${C.border}`,borderRadius:10}}>📄 No documents yet.<br/><span style={{fontSize:10}}>Drag & drop · PDF, DOCX, XLSX · max 25MB</span></div>
        </div>
      )}

      {tab==="history"&&(<div><div style={{fontSize:11,color:C.muted,marginBottom:10}}>Complete activity timeline.</div><Hlog entries={lead.history}/></div>)}

      {showWa&&<Modal title={`💬 WhatsApp – ${lead.company}`} onClose={()=>setShowWa(false)} mw={580}><WaModal lead={lead} onClose={()=>setShowWa(false)}/></Modal>}
      {showMerge&&<Modal title="🔀 Merge Duplicate Lead" onClose={()=>setShowMerge(false)} mw={560}><MergeModal lead={lead} leads={leads} setLeads={setLeads} onClose={()=>{setShowMerge(false);onClose();}}/></Modal>}
      {showQual&&<Modal title="📋 Qualification Checklist" onClose={()=>setShowQual(false)} mw={480}><QualChecklist lead={lead} setLeads={setLeads} role={role} onClose={()=>setShowQual(false)}/></Modal>}
      {showCreditModal&&<Modal title="📅 Change Credit Date" onClose={()=>setShowCreditModal(false)} mw={480}><CreditDateModal lead={lead} setLeads={setLeads} role={role} onClose={()=>setShowCreditModal(false)}/></Modal>}
      {showNps&&<Modal title={`⭐ NPS Survey – ${lead.company}`} onClose={()=>setShowNps(false)} mw={440}><NpsModal lead={lead} setLeads={setLeads} role={role} onClose={()=>setShowNps(false)}/></Modal>}
    </Modal>
  );
}

/* ── CLIENTS PAGE ────────────────────────────────────────────────────── */
function ClientsPage({role,isMobile}){
  const [clients,setClients]=useState(INIT_CLIENTS);
  const [sel,setSel]=useState(clients[0]);
  const [tab,setTab]=useState("overview");
  const [editMode,setEditMode]=useState(false);
  const [form,setForm]=useState({...clients[0]});
  const [errs,setErrs]=useState({});
  const fp=ROLES[role];

  const pick=c=>{setSel(c);setForm({...c});setEditMode(false);setTab("overview");setErrs({});};
  const saveEdit=()=>{
    const e={};if(!form.contact?.trim())e.contact="Required";if(!form.phone?.trim())e.phone="Required";if(!form.email?.trim())e.email="Required";if(Object.keys(e).length){setErrs(e);return;}
    const newH=[];["contact","phone","backupPhone","email","backupEmail","notes","paymentTerms"].forEach(k=>{if(form[k]!==sel[k])newH.push({field:k,old:sel[k],new:form[k],by:fp.label,date:TODAY,time:"Now",reason:"Manual update"});});
    const updated={...form,editHistory:[...form.editHistory,...newH]};
    setClients(cs=>cs.map(c=>c.id===sel.id?updated:c));setSel(updated);setEditMode(false);setErrs({});
  };

  const clientProjects=INIT_PROJECTS.filter(p=>p.clientId===sel.id);
  const totalDeal=sel.payments.reduce((s,p)=>s+p.amount,0);
  const collected=sel.payments.filter(p=>p.status==="Received").reduce((s,p)=>s+p.amount,0);
  const avgNps=sel.npsScores.length>0?(sel.npsScores.reduce((s,n)=>s+n,0)/sel.npsScores.length).toFixed(1):null;
  const TABS=["overview","products","purchases","payments","projects","cross-sell","edit history"];

  return(
    <div style={{display:"flex",gap:12,flexDirection:isMobile?"column":"row"}}>
      <div style={{background:C.card,borderRadius:12,border:`1px solid ${C.border}`,width:isMobile?"100%":230,minWidth:isMobile?"auto":230,flexShrink:0}}>
        <div style={{padding:"11px 15px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:13,fontWeight:700}}>Clients</span><Btn sz="sm">+ Add</Btn></div>
        {clients.map(c=>(<div key={c.id} onClick={()=>pick(c)} style={{padding:"10px 15px",cursor:"pointer",borderLeft:`3px solid ${sel?.id===c.id?C.accent:"transparent"}`,background:sel?.id===c.id?`${C.accent}10`:"transparent"}}>
          <div style={{fontWeight:600,fontSize:12}}>{c.shortName}</div>
          <div style={{fontSize:10,color:C.muted,marginTop:1}}>{c.segment} · {c.location}</div>
          <div style={{fontSize:11,color:C.green,fontWeight:700,marginTop:3}}>₹{(c.lifetimeRevenue/100000).toFixed(1)}L lifetime</div>
        </div>))}
      </div>

      {sel&&(<div style={{flex:1,display:"flex",flexDirection:"column",gap:12,minWidth:0}}>
        <div style={{background:C.card,borderRadius:12,border:`1px solid ${C.border}`,padding:"14px 16px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
            <div>
              <div style={{fontSize:18,fontWeight:800}}>{sel.company}</div>
              <div style={{fontSize:11,color:C.muted,marginTop:3}}>{sel.contact} ({sel.role}) · {sel.location}</div>
              <div style={{display:"flex",gap:8,marginTop:6,flexWrap:"wrap"}}>
                <button style={{background:"none",border:"none",cursor:"pointer",color:C.accent,fontSize:12}}>📞 {sel.phone}</button>
                <button style={{background:"none",border:"none",cursor:"pointer",color:C.green,fontSize:12}}>💬 WhatsApp</button>
                <button style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:12}}>✉️ {sel.email}</button>
              </div>
              <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
                <div style={{padding:"4px 12px",background:`${C.green}15`,borderRadius:8,fontSize:11}}>💰 Lifetime: <strong style={{color:C.green}}>₹{sel.lifetimeRevenue.toLocaleString()}</strong></div>
                <div style={{padding:"4px 12px",background:`${C.accent}15`,borderRadius:8,fontSize:11}}>📁 {sel.totalProjects} project(s)</div>
                {avgNps&&<div style={{padding:"4px 12px",background:`${avgNps>=8?C.green:avgNps>=7?C.amber:C.red}15`,borderRadius:8,fontSize:11}}>⭐ NPS: <strong style={{color:avgNps>=8?C.green:avgNps>=7?C.amber:C.red}}>{avgNps}</strong></div>}
              </div>
            </div>
            {fp.canEditClient&&<div style={{display:"flex",gap:6}}><Btn sz="sm" v={editMode?"danger":"ghost"} onClick={()=>setEditMode(e=>!e)}>{editMode?"✕":"✏️ Edit"}</Btn>{editMode&&<Btn sz="sm" v="success" onClick={saveEdit}>✓ Save</Btn>}<Btn sz="sm" v="ghost" style={{border:`1px solid ${C.border}`}}>⬇ Export</Btn></div>}
          </div>
          <div style={{display:"flex",gap:4,marginTop:12,flexWrap:"wrap",borderTop:`1px solid ${C.border}`,paddingTop:10}}>
            {TABS.map(t=><Btn key={t} v={tab===t?"primary":"ghost"} sz="sm" onClick={()=>setTab(t)} style={{textTransform:"capitalize"}}>{t}</Btn>)}
          </div>
        </div>

        {tab==="overview"&&(<div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12}}>
          <Card title="Contact Information">
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {[["Primary Phone","phone"],["Backup Phone","backupPhone"],["Primary Email","email"],["Backup Email","backupEmail"],["Contact Person","contact"],["Role","role"],["Location","location"],["Segment","segment"]].map(([l,k])=>(<div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}><span style={{fontSize:11,color:C.muted,flexShrink:0}}>{l}</span>{editMode&&["phone","backupPhone","email","backupEmail","contact"].includes(k)?<input value={form[k]||""} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} style={{background:C.faint,border:`1px solid ${errs[k]?C.red:C.border}`,borderRadius:6,color:C.text,padding:"4px 8px",fontSize:11,outline:"none",width:170}}/>:<span style={{fontSize:11,fontWeight:500,textAlign:"right"}}>{sel[k]||"—"}</span>}</div>))}
            </div>
          </Card>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <Card title="Deal & Lifetime Value">
              {[["Total Deal",`₹${totalDeal.toLocaleString()}`,C.text],["Collected",`₹${collected.toLocaleString()}`,C.green],["Pending",`₹${(totalDeal-collected).toLocaleString()}`,C.red],["Lifetime Revenue",`₹${sel.lifetimeRevenue.toLocaleString()}`,C.purple],["Total Projects",sel.totalProjects,C.accent],["NPS Score",avgNps?`${avgNps}/10 (${sel.npsScores.length} survey(s))`:"Not yet collected",avgNps?(avgNps>=8?C.green:C.amber):C.muted]].map(([l,v,c])=>(<div key={l} style={{display:"flex",justifyContent:"space-between",padding:"4px 0"}}><span style={{fontSize:11,color:C.muted}}>{l}</span><span style={{fontSize:13,fontWeight:700,color:c}}>{v}</span></div>))}
              <div style={{marginTop:8}}><div style={{fontSize:10,color:C.muted,fontWeight:700,textTransform:"uppercase",marginBottom:3}}>Payment Terms</div>{editMode?<input value={form.paymentTerms||""} onChange={e=>setForm(f=>({...f,paymentTerms:e.target.value}))} style={{background:C.faint,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,padding:"5px 8px",fontSize:11,outline:"none",width:"100%",boxSizing:"border-box"}}/>:<span style={{fontSize:11}}>{sel.paymentTerms}</span>}</div>
            </Card>
            <Card title="Notes">{editMode?<textarea value={form.notes||""} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} style={{background:C.faint,border:`1px solid ${C.border}`,borderRadius:7,color:C.text,padding:"7px 10px",fontSize:12,outline:"none",width:"100%",minHeight:70,resize:"vertical",boxSizing:"border-box"}}/>:<div style={{fontSize:12,color:C.muted,lineHeight:1.6}}>{sel.notes}</div>}</Card>
          </div>
        </div>)}

        {tab==="products"&&(<Card title="Services (Active)" action={<Btn sz="sm">+ Add Service</Btn>}>
          <table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><TH ch="Service"/><TH ch="Type"/><TH ch="Amount"/><TH ch="Start"/><TH ch="Status"/></tr></thead>
          <tbody>{sel.services.map((s,i)=>(<tr key={i}><TD style={{fontWeight:600}}>{s.name}</TD><TD><Badge label={s.type} color={C.accent}/></TD><TD>₹{s.amount.toLocaleString()}</TD><TD style={{color:C.muted,fontSize:11}}>{s.start}</TD><TD><Badge label={s.status} color={s.status==="Active"?C.green:s.status==="In Progress"?C.accent:C.muted}/></TD></tr>))}</tbody></table>
        </Card>)}

        {tab==="purchases"&&(<Card title="Purchases – Servers, Domains, AMC" action={<Btn sz="sm">+ Add Purchase</Btn>}>
          <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:600}}><thead><tr><TH ch="Item"/><TH ch="Type"/><TH ch="Specifications"/><TH ch="Amount"/><TH ch="Purchased"/><TH ch="Renewal"/><TH ch="Days Left"/><TH ch="Status"/></tr></thead>
          <tbody>{sel.purchases.map((p,i)=>(<tr key={i}><TD style={{fontWeight:600}}>{p.name}</TD><TD><Badge label={p.type} color={p.type==="Domain"?C.accent:p.type==="Server"?C.purple:C.teal}/></TD><TD style={{color:C.muted,fontSize:11,maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.spec}</TD><TD>₹{p.amount.toLocaleString()}</TD><TD style={{color:C.muted,fontSize:11}}>{p.purchaseDate}</TD><TD style={{color:C.muted,fontSize:11}}>{p.renewal}</TD><TD><span style={{fontSize:11,fontWeight:700,color:p.daysLeft<=7?C.red:p.daysLeft<=30?C.amber:C.green}}>{p.daysLeft}d</span></TD><TD><Badge label={p.status} color={p.status==="Active"?C.green:C.amber}/></TD></tr>))}</tbody></table></div>
        </Card>)}

        {tab==="payments"&&<Card title="Payment Tracking"><PayPanel client={sel}/></Card>}

        {tab==="projects"&&(<Card title="Project Timelines" action={<Btn sz="sm">+ New Project</Btn>}>
          {clientProjects.length===0?<div style={{color:C.muted,fontSize:12,textAlign:"center",padding:24}}>No projects yet</div>:<div style={{display:"flex",flexDirection:"column",gap:14}}>{clientProjects.map(p=>(<div key={p.id} style={{padding:12,background:C.faint,borderRadius:10,border:`1px solid ${C.border}`}}><Timeline p={p}/></div>))}</div>}
        </Card>)}

        {tab==="cross-sell"&&(<div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Card title="🔁 Cross-Sell Opportunities" action={<Badge label={`${sel.crossSell.length} identified`} color={C.accent}/>}>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {sel.crossSell.map(o=>(<div key={o} style={{padding:"10px 14px",background:`${C.accent}10`,border:`1px solid ${C.accent}33`,borderRadius:10}}><div style={{fontWeight:700,color:C.accent,fontSize:12}}>{o}</div><div style={{fontSize:10,color:C.muted,marginTop:2}}>Not purchased</div><Btn sz="sm" style={{marginTop:6}}>Create Lead →</Btn></div>))}
            </div>
          </Card>
          <Card title="⬆️ Upsell Opportunities">
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {sel.upsell.map(o=>(<div key={o} style={{padding:"10px 14px",background:`${C.purple}10`,border:`1px solid ${C.purple}33`,borderRadius:10}}><div style={{fontWeight:700,color:C.purple,fontSize:12}}>{o}</div><Btn sz="sm" style={{marginTop:6,background:C.purple}}>Propose →</Btn></div>))}
            </div>
          </Card>
        </div>)}

        {tab==="edit history"&&(<Card title="Edit Audit Trail" action={<Btn sz="sm" v="ghost" style={{border:`1px solid ${C.border}`}}>⬇ Export</Btn>}>
          <table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><TH ch="Field"/><TH ch="Old Value"/><TH ch="New Value"/><TH ch="Changed By"/><TH ch="Date"/><TH ch="Reason"/></tr></thead>
          <tbody>{sel.editHistory.map((h,i)=>(<tr key={i}><TD style={{fontWeight:600}}>{h.field}</TD><TD style={{color:C.red,textDecoration:"line-through",fontSize:11}}>{h.old}</TD><TD style={{color:C.green,fontWeight:600,fontSize:11}}>{h.new}</TD><TD style={{fontSize:11}}>{h.by}</TD><TD style={{fontSize:11}}>{h.date} {h.time}</TD><TD style={{fontSize:11,color:C.muted}}>{h.reason}</TD></tr>))}</tbody></table>
        </Card>)}
      </div>)}
    </div>
  );
}

/* ── PROJECTS PAGE ───────────────────────────────────────────────────── */
function ProjectsPage({isMobile}){
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:10}}>
        {[["Total",INIT_PROJECTS.length,C.accent],["In Progress",INIT_PROJECTS.filter(p=>p.status==="In Progress").length,C.green],["Critical (≤9d)",INIT_PROJECTS.filter(p=>(p.totalDays-p.currentDay)<=9&&p.status==="In Progress").length,C.red],["Not Started",INIT_PROJECTS.filter(p=>p.status==="Not Started").length,C.muted]].map(([l,v,c])=>(<KPI key={l} label={l} value={v} color={c}/>))}
      </div>
      {INIT_PROJECTS.map(p=>(<div key={p.id} style={{background:C.card,borderRadius:12,border:`1px solid ${C.border}`,padding:16}}><Timeline p={p}/></div>))}
    </div>
  );
}

/* ── MARKETING PAGE ──────────────────────────────────────────────────── */
function MarketingPage({isMobile}){
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(5,1fr)",gap:10}}>
        {[["Total Spend","₹2L",C.accent],["Total Leads",CAMPAIGNS.reduce((s,c)=>s+c.leads,0),C.purple],["Conversions",CAMPAIGNS.reduce((s,c)=>s+c.conversions,0),C.green],["Revenue","₹16.7L",C.teal],["Avg CPL","₹6.6K",C.amber]].map(([l,v,c])=><KPI key={l} label={l} value={v} color={c}/>)}
      </div>
      <Card title="Campaign ROI – Platform → Campaign → Ad Group → Creative" action={<div style={{display:"flex",gap:6}}><Btn sz="sm">+ Campaign</Btn><Btn sz="sm" v="ghost" style={{border:`1px solid ${C.border}`}}>⬇ Export</Btn></div>}>
        <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:700}}><thead><tr><TH ch="Platform"/><TH ch="Campaign"/><TH ch="Ad Group"/><TH ch="Creative"/><TH ch="Budget"/><TH ch="Leads"/><TH ch="Conv."/><TH ch="Revenue"/><TH ch="CPL"/><TH ch="ROI%"/></tr></thead>
        <tbody>{CAMPAIGNS.map(c=>(<tr key={c.id} onMouseEnter={e=>e.currentTarget.style.background=`${C.faint}55`} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><TD><Badge label={c.platform} color={SRC_C[c.platform]||C.muted}/></TD><TD style={{fontWeight:600}}>{c.name}</TD><TD style={{color:C.muted,fontSize:11}}>{c.adGroup}</TD><TD style={{color:C.muted,fontSize:11}}>{c.creative}</TD><TD>₹{c.budget.toLocaleString()}</TD><TD>{c.leads}</TD><TD>{c.conversions}</TD><TD>{c.revenue>0?`₹${c.revenue.toLocaleString()}`:"—"}</TD><TD>₹{c.cpl.toLocaleString()}</TD><TD><span style={{fontWeight:700,color:c.roi>0?C.green:C.red}}>{c.roi}%</span></TD></tr>))}</tbody></table></div>
      </Card>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12}}>
        <Card title="ROI by Platform"><ResponsiveContainer width="100%" height={170}><BarChart data={CAMPAIGNS} margin={{left:-10,right:12}}><CartesianGrid strokeDasharray="3 3" stroke={C.faint}/><XAxis dataKey="platform" tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false}/><YAxis tick={{fill:C.muted,fontSize:9}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,fontSize:11}}/><Bar dataKey="roi" radius={[4,4,0,0]}>{CAMPAIGNS.map((c,i)=><Cell key={i} fill={c.roi>0?C.green:C.red}/>)}</Bar></BarChart></ResponsiveContainer></Card>
        <Card title="Leads by Platform"><ResponsiveContainer width="100%" height={170}><BarChart data={CAMPAIGNS} margin={{left:-10,right:12}}><CartesianGrid strokeDasharray="3 3" stroke={C.faint}/><XAxis dataKey="platform" tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false}/><YAxis tick={{fill:C.muted,fontSize:9}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,fontSize:11}}/><Bar dataKey="leads" fill={C.accent} radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></Card>
      </div>
    </div>
  );
}

/* ── PERFORMANCE PAGE ────────────────────────────────────────────────── */
function PerformancePage({isMobile}){
  const perf=[
    {name:"Alex Morgan", role:"sales_exec",leads:2,contacted:2,closed:1,missed:0,avgRespH:1.2,target:1500000,collected:450000},
    {name:"Priya Nair",  role:"sales_exec",leads:2,contacted:2,closed:1,missed:1,avgRespH:0.8,target:1500000,collected:770000},
    {name:"Tom Hank",    role:"sales_exec",leads:1,contacted:0,closed:0,missed:2,avgRespH:4.5,target:1200000,collected:0},
    {name:"Sara Lee",    role:"sales_exec",leads:1,contacted:1,closed:1,missed:0,avgRespH:0.5,target:1500000,collected:450000},
    {name:"Ravi Kumar",  role:"marketing_exec",leads:0,contacted:0,closed:0,missed:0,avgRespH:0,target:0,collected:0},
  ];
  const score=p=>{let s=0;if(p.leads>0)s+=Math.min(25,(p.contacted/p.leads)*25);if(p.leads>0)s+=Math.min(25,(p.closed/p.leads)*50);s+=Math.max(0,25-p.missed*8);s+=p.avgRespH<=2?25:p.avgRespH<=4?15:5;return Math.round(s);};
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:10}}>
        <KPI label="Team Closed" value={perf.reduce((s,p)=>s+p.closed,0)} sub="Deals this period" color={C.green}/>
        <KPI label="SLA Breaches" value={perf.filter(p=>p.avgRespH>2).length} sub="Executives" color={C.red}/>
        <KPI label="Missed Follow-ups" value={perf.reduce((s,p)=>s+p.missed,0)} sub="Total team" color={C.amber}/>
        <KPI label="Team Revenue" value={`₹${(perf.reduce((s,p)=>s+p.collected,0)/100000).toFixed(1)}L`} sub="Collected" color={C.purple}/>
      </div>
      <Card title="Executive Performance Scorecard" action={<Btn sz="sm" v="ghost" style={{border:`1px solid ${C.border}`}}>⬇ Export</Btn>}>
        <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:700}}><thead><tr><TH ch="Executive"/><TH ch="Role"/><TH ch="Leads"/><TH ch="Contacted"/><TH ch="Closed"/><TH ch="Missed F/U"/><TH ch="Avg Response"/><TH ch="Perf Score"/><TH ch="Target Ach."/></tr></thead>
        <tbody>{perf.map(p=>{const pct=p.target>0?Math.min(100,(p.collected/p.target)*100):0;const ps=score(p);return(<tr key={p.name} onMouseEnter={e=>e.currentTarget.style.background=`${C.faint}55`} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <TD style={{fontWeight:700}}>{p.name}</TD><TD><Badge label={ROLES[p.role]?.label||p.role} color={ROLES[p.role]?.color}/></TD><TD>{p.leads}</TD>
          <TD><span style={{color:p.contacted<p.leads?C.amber:C.green,fontWeight:600}}>{p.contacted}/{p.leads}</span></TD><TD>{p.closed}</TD>
          <TD><span style={{color:p.missed>0?C.red:C.green,fontWeight:700}}>{p.missed}</span></TD>
          <TD><span style={{color:p.avgRespH<=2?C.green:p.avgRespH<=4?C.amber:C.red,fontWeight:700}}>{p.avgRespH>0?`${p.avgRespH}h`:"—"}</span><div style={{fontSize:9,color:C.muted}}>{p.avgRespH>2?"⚠ SLA breach":"✓ On time"}</div></TD>
          <TD><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:40,height:6,background:C.faint,borderRadius:3}}><div style={{width:`${ps}%`,height:"100%",background:ps>=70?C.green:ps>=50?C.amber:C.red,borderRadius:3}}/></div><span style={{fontSize:12,fontWeight:800,color:ps>=70?C.green:ps>=50?C.amber:C.red}}>{ps}</span></div></TD>
          <TD><div style={{display:"flex",alignItems:"center",gap:6,minWidth:100}}><div style={{flex:1,height:5,background:C.faint,borderRadius:3}}><div style={{width:`${pct}%`,height:"100%",background:pct>=80?C.green:pct>=50?C.amber:C.red,borderRadius:3}}/></div><span style={{fontSize:11,fontWeight:700,color:pct>=80?C.green:pct>=50?C.amber:C.red}}>{pct.toFixed(0)}%</span></div></TD>
        </tr>);})}</tbody></table></div>
      </Card>
    </div>
  );
}

/* ── DOCUMENTS PAGE ──────────────────────────────────────────────────── */
function DocumentsPage({isMobile}){
  const [fType,setFType]=useState("");
  const docs=[{name:"Sunrise Hotels – ERP Proposal v2.pdf",type:"Proposal",client:"Sunrise Hotels",by:"Sara Lee",date:"2025-02-15",size:"2.4 MB",v:"v2"},{name:"TechNova – Mobile App Scope.pdf",type:"Scope",client:"TechNova",by:"Alex Morgan",date:"2025-01-20",size:"1.1 MB",v:"v1"},{name:"Sunrise Hotels – Invoice #001.pdf",type:"Invoice",client:"Sunrise Hotels",by:"Accounts",date:"2025-02-28",size:"0.3 MB",v:"v1"},{name:"TechNova – Agreement.pdf",type:"Agreement",client:"TechNova",by:"Admin",date:"2025-01-22",size:"0.8 MB",v:"v1"}];
  const TC={Proposal:C.accent,Scope:C.purple,Invoice:C.green,Agreement:C.amber};
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <Fbar>
        <Sfilter value={fType} onChange={setFType} opts={[{v:"",l:"All Types"},...["Proposal","Scope","Invoice","Agreement"].map(t=>({v:t,l:t}))]}/>
        <div style={{marginLeft:"auto",display:"flex",gap:6}}><Btn sz="sm">+ Upload</Btn><Btn sz="sm" v="ghost" style={{border:`1px solid ${C.border}`}}>⬇ Export All</Btn></div>
      </Fbar>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:10}}>
        {docs.filter(d=>!fType||d.type===fType).map((d,i)=>(<div key={i} style={{background:C.card,borderRadius:12,border:`1px solid ${C.border}`,padding:14}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{fontSize:22}}>📄</span><Badge label={d.type} color={TC[d.type]||C.accent}/></div><div style={{fontWeight:600,fontSize:12,marginBottom:3,lineHeight:1.4}}>{d.name}</div><div style={{fontSize:11,color:C.muted}}>{d.client}</div><div style={{fontSize:10,color:C.muted,marginTop:3}}>{d.by} · {d.date} · {d.size} · {d.v}</div><div style={{display:"flex",gap:5,marginTop:10,flexWrap:"wrap"}}><Btn sz="sm">View</Btn><Btn sz="sm" v="ghost">📤 Share</Btn><Btn sz="sm" v="ghost">Replace</Btn><Btn sz="sm" v="danger">Delete</Btn></div></div>))}
      </div>
    </div>
  );
}

/* ── BROCHURES PAGE ──────────────────────────────────────────────────── */
function BrochuresPage({isMobile}){
  const [fType,setFType]=useState("");
  const [search,setSearch]=useState("");
  const filtered=BROCHURES.filter(b=>(!fType||b.type===fType)&&(b.title.toLowerCase().includes(search.toLowerCase())||b.tags.some(t=>t.includes(search.toLowerCase()))));
  const TC={Company:C.accent,Product:C.green,Service:C.purple};
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{padding:"10px 14px",background:`${C.purple}10`,borderRadius:10,border:`1px solid ${C.purple}33`,fontSize:12,color:C.muted}}>📚 Brochure Library — shareable marketing materials. Use WA / email to send directly to leads.</div>
      <Fbar>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search brochures..." style={{background:C.faint,border:`1px solid ${C.border}`,borderRadius:7,color:C.text,padding:"6px 10px",fontSize:12,outline:"none",width:160}}/>
        <Sfilter value={fType} onChange={setFType} opts={[{v:"",l:"All Types"},...["Company","Product","Service"].map(t=>({v:t,l:t}))]}/>
        <div style={{marginLeft:"auto",display:"flex",gap:6}}><Btn sz="sm">+ Upload</Btn></div>
      </Fbar>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:10}}>
        {filtered.map(b=>(<div key={b.id} style={{background:C.card,borderRadius:12,border:`1px solid ${C.border}`,padding:14}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{fontSize:24}}>📋</span><Badge label={b.type} color={TC[b.type]||C.accent}/></div>
          <div style={{fontWeight:700,fontSize:13,marginBottom:4}}>{b.title}</div>
          <div style={{fontSize:10,color:C.muted,marginBottom:6}}>{b.uploadedBy} · {b.date} · {b.size}</div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:10}}>{b.tags.map(t=><span key={t} style={{fontSize:9,padding:"2px 6px",background:`${C.accent}15`,color:C.accent,borderRadius:10,border:`1px solid ${C.accent}33`}}>#{t}</span>)}</div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}><Btn sz="sm">View</Btn><Btn sz="sm" v="success">💬 Share WA</Btn><Btn sz="sm" v="ghost">✉️ Email</Btn><Btn sz="sm" v="ghost">⬇ Download</Btn></div>
        </div>))}
      </div>
    </div>
  );
}

/* ── FINANCE PAGE ────────────────────────────────────────────────────── */
function FinancePage({isMobile}){
  const allPays=INIT_CLIENTS.flatMap(c=>c.payments.map(p=>({...p,client:c.shortName,company:c.company})));
  const total=allPays.reduce((s,p)=>s+p.amount,0);
  const received=allPays.filter(p=>p.status==="Received").reduce((s,p)=>s+p.amount,0);
  const invoiced=allPays.filter(p=>p.status==="Invoice Sent").reduce((s,p)=>s+p.amount,0);
  const pending=allPays.filter(p=>p.status==="Pending").reduce((s,p)=>s+p.amount,0);
  const renewalRev=INIT_CLIENTS.flatMap(c=>c.purchases.filter(p=>p.daysLeft<45)).reduce((s,p)=>s+p.amount,0);
  const PS={Received:C.green,"Invoice Sent":C.amber,Pending:C.muted};
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(5,1fr)",gap:10}}>
        <KPI label="Total Billed" value={`₹${(total/100000).toFixed(1)}L`} color={C.accent}/>
        <KPI label="Collected" value={`₹${(received/100000).toFixed(1)}L`} sub={`${Math.round((received/total)*100)}%`} color={C.green}/>
        <KPI label="Invoice Sent" value={`₹${(invoiced/100000).toFixed(1)}L`} sub="Awaiting payment" color={C.amber}/>
        <KPI label="Pending" value={`₹${(pending/100000).toFixed(1)}L`} sub="Invoice not sent" color={C.red}/>
        <KPI label="Renewal Revenue" value={`₹${(renewalRev/100000).toFixed(1)}L`} sub="<45 days" color={C.lime}/>
      </div>
      <Card title="All Invoices & Payments" action={<div style={{display:"flex",gap:6}}><Btn sz="sm" v="ghost" style={{border:`1px solid ${C.border}`}}>⬇ Excel</Btn><Btn sz="sm" v="ghost" style={{border:`1px solid ${C.border}`}}>⬇ PDF</Btn></div>}>
        <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:640}}><thead><tr><TH ch="Client"/><TH ch="Milestone"/><TH ch="Amount"/><TH ch="Invoice #"/><TH ch="Invoice Date"/><TH ch="Received Date"/><TH ch="Status"/></tr></thead>
        <tbody>{allPays.map((p,i)=>(<tr key={i} style={{background:p.status==="Received"?`${C.green}06`:p.status==="Invoice Sent"?`${C.amber}06`:"transparent"}}><TD style={{fontWeight:600}}>{p.client}</TD><TD style={{fontSize:11}}>{p.type}</TD><TD>₹{p.amount.toLocaleString()}</TD><TD style={{color:C.muted,fontSize:11}}>{p.invoiceNum||"—"}</TD><TD style={{color:C.muted,fontSize:11}}>{p.invoiceSentDate||"—"}</TD><TD style={{color:p.receivedDate?C.green:C.muted,fontSize:11}}>{p.receivedDate||"—"}</TD><TD><Badge label={p.status} color={PS[p.status]}/></TD></tr>))}</tbody></table></div>
      </Card>
      <Card title="Upcoming Renewals – Revenue Forecast" action={<Badge label={`₹${(renewalRev/100000).toFixed(1)}L forecast`} color={C.lime}/>}>
        <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:540}}><thead><tr><TH ch="Client"/><TH ch="Item"/><TH ch="Type"/><TH ch="Renewal Amount"/><TH ch="Renewal Date"/><TH ch="Days Left"/><TH ch="Status"/></tr></thead>
        <tbody>{INIT_CLIENTS.flatMap(c=>c.purchases.map(p=>({...p,client:c.shortName}))).sort((a,b)=>a.daysLeft-b.daysLeft).map((r,i)=>{const uc=r.daysLeft<=7?C.red:r.daysLeft<=30?C.amber:C.green;return(<tr key={i}><TD style={{fontWeight:600}}>{r.client}</TD><TD style={{fontSize:11}}>{r.name}</TD><TD><Badge label={r.type} color={C.accent}/></TD><TD>₹{r.amount.toLocaleString()}</TD><TD style={{color:C.muted,fontSize:11}}>{r.renewal}</TD><TD><span style={{fontWeight:700,color:uc}}>{r.daysLeft}d</span></TD><TD><Badge label={r.status} color={uc}/></TD></tr>);})}</tbody></table></div>
      </Card>
    </div>
  );
}

/* ── FORECAST PAGE ───────────────────────────────────────────────────── */
function ForecastPage({leads,isMobile}){
  const sForecasts=ACTIVE_STAGES.map(stage=>{const sl=leads.filter(l=>l.status===stage&&l.dealValue);const p=STAGE_CFG[stage]?.prob||0;return{stage,prob:p,pipeline:sl.reduce((s,l)=>s+l.dealValue,0),forecast:Math.round(sl.reduce((s,l)=>s+l.dealValue,0)*p/100),count:sl.length,color:STAGE_CFG[stage]?.color};});
  const totalP=sForecasts.reduce((s,r)=>s+r.pipeline,0);
  const totalF=sForecasts.reduce((s,r)=>s+r.forecast,0);
  const lostLeads=leads.filter(l=>l.status==="Lost"&&l.lostReason);
  const lostMap=lostLeads.reduce((m,l)=>{m[l.lostReason]=(m[l.lostReason]||0)+1;return m;},{});
  const velocity=calcVelocity(leads);
  const srcRevenue=Object.keys(SRC_C).map(src=>{const sl=leads.filter(l=>l.source===src&&l.status==="Won");return{source:src,revenue:sl.reduce((s,l)=>s+(l.dealValue||0),0),deals:sl.length};}).filter(r=>r.revenue>0).sort((a,b)=>b.revenue-a.revenue);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:10}}>
        <KPI label="Total Pipeline" value={`₹${(totalP/100000).toFixed(1)}L`} color={C.accent}/>
        <KPI label="Weighted Forecast" value={`₹${(totalF/100000).toFixed(1)}L`} sub="Probability-adjusted" color={C.teal}/>
        <KPI label="Won Revenue" value={`₹${(leads.filter(l=>l.status==="Won").reduce((s,l)=>s+(l.dealValue||0),0)/100000).toFixed(1)}L`} color={C.green}/>
        <KPI label="Pipeline Velocity" value={velocity?`${velocity}d avg`:"—"} sub="New→Won" color={C.orange}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"2fr 1fr",gap:12}}>
        <Card title="Pipeline vs Forecast by Stage">
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {sForecasts.filter(r=>r.count>0).map(r=>(<div key={r.stage}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><div style={{display:"flex",alignItems:"center",gap:8}}><Dot color={r.color}/><span style={{fontSize:12,fontWeight:600}}>{r.stage}</span><Badge label={`${r.prob}%`} color={r.color}/></div><div style={{textAlign:"right"}}><span style={{fontSize:12,color:C.muted}}>₹{r.pipeline.toLocaleString()}</span><span style={{fontSize:12,fontWeight:700,color:C.teal,marginLeft:8}}>→ ₹{r.forecast.toLocaleString()}</span></div></div><div style={{height:8,background:C.faint,borderRadius:4,position:"relative"}}><div style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",background:r.color+"22",borderRadius:4}}/><div style={{position:"absolute",top:0,left:0,width:`${r.prob}%`,height:"100%",background:r.color,borderRadius:4}}/></div></div>))}
          </div>
        </Card>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Card title="Revenue by Source">
            {srcRevenue.length===0?<div style={{color:C.muted,fontSize:12,textAlign:"center",padding:"20px 0"}}>No won deals yet</div>:srcRevenue.map(r=>(<div key={r.source} style={{padding:"5px 0",borderBottom:`1px solid ${C.faint}`}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:11}}>{r.source}</span><span style={{fontSize:11,fontWeight:700,color:C.green}}>₹{(r.revenue/100000).toFixed(1)}L</span></div><div style={{height:4,background:C.faint,borderRadius:2}}><div style={{width:`${(r.revenue/srcRevenue[0].revenue)*100}%`,height:"100%",background:SRC_C[r.source]||C.green,borderRadius:2}}/></div></div>))}
          </Card>
          <Card title="Lost Breakdown">
            {Object.keys(lostMap).length===0?<div style={{color:C.muted,fontSize:12,textAlign:"center",padding:"16px 0"}}>No lost deals</div>:Object.entries(lostMap).map(([r,c])=>(<div key={r} style={{padding:"5px 0",borderBottom:`1px solid ${C.faint}`}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:11}}>{r}</span><span style={{fontSize:11,fontWeight:700,color:C.red}}>{c}</span></div><div style={{height:4,background:C.faint,borderRadius:2}}><div style={{width:`${(c/lostLeads.length)*100}%`,height:"100%",background:C.red,borderRadius:2}}/></div></div>))}
          </Card>
        </div>
      </div>
      <Card title="Monthly Revenue Trend"><ResponsiveContainer width="100%" height={200}><LineChart data={MONTHLY} margin={{left:-10,right:12,top:4,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke={C.faint}/><XAxis dataKey="month" tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false}/><YAxis tick={{fill:C.muted,fontSize:9}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,fontSize:11}} formatter={v=>`₹${v.toLocaleString()}`}/><Line type="monotone" dataKey="rev" stroke={C.teal} strokeWidth={2} dot={false} name="Revenue"/><Legend iconType="circle" wrapperStyle={{fontSize:10}}/></LineChart></ResponsiveContainer></Card>
    </div>
  );
}

/* ── SALES CALENDAR PAGE ─────────────────────────────────────────────── */
function CalendarPage({leads,isMobile}){
  const [view,setView]=useState("week");
  const days=["Mon 03","Tue 04","Wed 05","Thu 06","Fri 07","Sat 08","Sun 09"];
  const fuLeads=leads.filter(l=>l.followUpDate&&l.followUpDate!=="—"&&l.followUpDate>="2025-03-03");
  const dayMap=days.reduce((m,d)=>{const date="2025-03-"+d.split(" ")[1];m[date]=fuLeads.filter(l=>l.followUpDate===date);return m;},{});
  const allTasks=leads.flatMap(l=>l.tasks.map(t=>({...t,company:l.company,leadId:l.id})));
  const overdueCount=allTasks.filter(t=>t.status==="Overdue"||t.status==="Pending"&&t.dueDate<TODAY).length;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:10}}>
        <KPI label="This Week" value={fuLeads.length} sub="Follow-ups" color={C.accent}/>
        <KPI label="Today" value={fuLeads.filter(l=>l.followUpDate===TODAY).length} sub="Due today" color={C.green}/>
        <KPI label="Overdue Tasks" value={overdueCount} sub="Across all leads" color={C.red}/>
        <KPI label="Pending Tasks" value={allTasks.filter(t=>t.status==="Pending").length} sub="Open tasks" color={C.amber}/>
      </div>
      <Card title="📅 Weekly Follow-up Calendar" action={<div style={{display:"flex",gap:6}}><Btn sz="sm" v={view==="week"?"primary":"ghost"} onClick={()=>setView("week")}>Week</Btn><Btn sz="sm" v={view==="list"?"primary":"ghost"} onClick={()=>setView("list")}>List</Btn></div>}>
        {view==="week"?(
          <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(3,1fr)":"repeat(7,1fr)",gap:8}}>
            {days.map(d=>{const date="2025-03-"+d.split(" ")[1];const dLeads=dayMap[date]||[];const isToday=date===TODAY;return(<div key={d} style={{background:isToday?`${C.accent}10`:C.faint,borderRadius:10,border:`1px solid ${isToday?C.accent:C.border}`,minHeight:120,padding:"8px 10px"}}>
              <div style={{fontSize:12,fontWeight:700,color:isToday?C.accent:C.text,marginBottom:6}}>{d}{isToday&&<span style={{fontSize:9,marginLeft:4,color:C.accent}}>TODAY</span>}</div>
              {dLeads.length===0?<div style={{fontSize:10,color:C.muted}}>—</div>:dLeads.map(l=>(<div key={l.id} style={{padding:"5px 8px",background:`${SCORE_C[l.score]}15`,border:`1px solid ${SCORE_C[l.score]}33`,borderRadius:6,marginBottom:4}}><div style={{fontSize:11,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.company}</div><div style={{fontSize:9,color:C.muted}}>{l.assignedTo||"Unassigned"}</div></div>))}
            </div>);})}
          </div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {fuLeads.sort((a,b)=>a.followUpDate.localeCompare(b.followUpDate)).map(l=>(<div key={l.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",background:l.followUpDate===TODAY?`${C.accent}10`:C.faint,borderRadius:8,border:`1px solid ${l.followUpDate===TODAY?C.accent:C.border}`}}><div><div style={{fontWeight:600,fontSize:12}}>{l.company}</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>{l.contact} · {l.assignedTo||"Unassigned"}</div></div><div style={{textAlign:"right"}}><div style={{fontSize:12,fontWeight:700,color:l.followUpDate===TODAY?C.accent:C.text}}>{l.followUpDate}</div><Badge label={l.status} color={STAGE_CFG[l.status]?.color}/></div></div>))}
          </div>
        )}
      </Card>
      <Card title="📋 All Open Tasks">
        <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:500}}><thead><tr><TH ch="Task"/><TH ch="Lead"/><TH ch="Assigned To"/><TH ch="Due Date"/><TH ch="Status"/></tr></thead>
        <tbody>{allTasks.filter(t=>t.status!=="Completed").sort((a,b)=>a.dueDate?.localeCompare(b.dueDate)||0).map((t,i)=>(<tr key={i}><TD style={{fontWeight:600}}>{t.title}</TD><TD style={{fontSize:11,color:C.accent}}>{t.company}</TD><TD style={{fontSize:11}}>{t.assignedTo}</TD><TD style={{fontSize:11,color:t.dueDate<TODAY?C.red:C.muted}}>{t.dueDate}</TD><TD><Badge label={t.status} color={t.status==="Overdue"||t.dueDate<TODAY?C.red:t.status==="In Progress"?C.amber:C.muted}/></TD></tr>))}</tbody></table></div>
      </Card>
    </div>
  );
}

/* ── NAV CONFIG ──────────────────────────────────────────────────────── */
const NAV_GROUPS=[
  {sec:"MAIN",     items:[{id:"dashboard",icon:"⊞",label:"Dashboard"},{id:"forecast",icon:"📈",label:"Forecast"},{id:"calendar",icon:"📅",label:"Calendar"}]},
  {sec:"SALES",    items:[{id:"leads",icon:"◎",label:"Leads"},{id:"clients",icon:"❖",label:"Clients"}]},
  {sec:"DELIVERY", items:[{id:"projects",icon:"🏗",label:"Projects"}]},
  {sec:"MARKETING",items:[{id:"marketing",icon:"◆",label:"Campaigns"},{id:"brochures",icon:"📋",label:"Brochures"}]},
  {sec:"REPORTS",  items:[{id:"performance",icon:"▣",label:"Performance"},{id:"finance",icon:"₹",label:"Finance"},{id:"documents",icon:"▤",label:"Documents"}]},
];
const TITLES={dashboard:"Dashboard",leads:"Lead Management",clients:"Client Management",projects:"Project Timelines",marketing:"Campaigns & ROI",performance:"Performance Scorecard",documents:"Document Library",brochures:"Brochure Library",finance:"Finance & Accounts",forecast:"Revenue Forecast",calendar:"Sales Calendar"};

/* ── APP ─────────────────────────────────────────────────────────────── */
export default function CRM(){
  const w=useW();
  const isMobile=w<640;
  const [tab,setTab]=useState("dashboard");
  const [role,setRole]=useState("admin");
  const [sidebarOpen,setSidebarOpen]=useState(false);
  const [leads,setLeads]=useState(INIT_LEADS);
  const [selectedLead,setSelectedLead]=useState(null);
  const [notifOpen,setNotifOpen]=useState(false);

  const fp=ROLES[role];
  const allowed=fp.pages||[];
  const pendingCount=leads.filter(l=>l.assignStatus==="pending").length;
  const slaCount=leads.filter(l=>!l.lastContactDate&&l.assignStatus==="approved"&&l.status==="New").length;
  const agingCount=leads.filter(l=>{if(!ACTIVE_STAGES.includes(l.status))return false;const d=Math.floor((new Date(TODAY)-new Date(l.stageEnteredDate))/86400000);return d>(STAGE_CFG[l.status]?.maxDays||14);}).length;
  const stuckCount=leads.filter(l=>{if(!ACTIVE_STAGES.includes(l.status))return false;const d=Math.floor((new Date(TODAY)-new Date(l.stageEnteredDate))/86400000);return d>(STAGE_CFG[l.status]?.maxDays||14)*1.5;}).length;
  const totalAlerts=pendingCount+slaCount+agingCount+stuckCount;
  const todayFU=leads.filter(l=>l.followUpDate===TODAY).length;

  useEffect(()=>{if(!allowed.includes(tab))setTab(allowed[0]||"dashboard");},[role,allowed,tab]);

  const Sidebar=()=>(
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{padding:"18px 18px 14px",borderBottom:`1px solid ${C.border}`}}>
        <div style={{fontSize:17,fontWeight:800,letterSpacing:"-0.5px",color:C.accent}}>◈ NexCRM</div>
        <div style={{fontSize:9,color:C.muted,letterSpacing:2,textTransform:"uppercase",marginTop:2}}>IPIX Technologies</div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"8px 0"}}>
        {NAV_GROUPS.map(g=>(
          <div key={g.sec}>
            <div style={{padding:"10px 16px 4px",fontSize:9,fontWeight:700,color:C.muted,letterSpacing:2,textTransform:"uppercase"}}>{g.sec}</div>
            {g.items.filter(i=>allowed.includes(i.id)).map(item=>(
              <div key={item.id} onClick={()=>{setTab(item.id);setSidebarOpen(false);}} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 16px",borderRadius:8,margin:"1px 8px",cursor:"pointer",fontSize:12,fontWeight:tab===item.id?600:400,background:tab===item.id?`${C.accent}18`:"transparent",color:tab===item.id?C.accent:C.muted,borderLeft:tab===item.id?`2px solid ${C.accent}`:"2px solid transparent",transition:"all 0.1s"}}>
                <span style={{fontSize:13}}>{item.icon}</span>
                <span>{item.label}</span>
                {item.id==="leads"&&pendingCount>0&&<span style={{marginLeft:"auto",background:C.amber,color:"#000",fontSize:9,fontWeight:700,borderRadius:10,padding:"1px 6px"}}>{pendingCount}</span>}
                {item.id==="calendar"&&todayFU>0&&<span style={{marginLeft:"auto",background:C.green,color:"#000",fontSize:9,fontWeight:700,borderRadius:10,padding:"1px 6px"}}>{todayFU}</span>}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{padding:"12px 16px",borderTop:`1px solid ${C.border}`}}>
        <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:0.8,marginBottom:5}}>Role (Demo)</div>
        <select value={role} onChange={e=>setRole(e.target.value)} style={{background:C.faint,border:`1px solid ${C.border}`,borderRadius:7,color:fp.color,padding:"6px 8px",fontSize:11,outline:"none",width:"100%",fontWeight:700,cursor:"pointer"}}>
          {Object.entries(ROLES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
        </select>
        <div style={{fontSize:10,color:C.muted,marginTop:4}}>Changes nav & permissions live</div>
      </div>
    </div>
  );

  return(
    <div style={{display:"flex",height:"100vh",fontFamily:"'DM Sans','Segoe UI',sans-serif",background:C.bg,color:C.text,overflow:"hidden",fontSize:13}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-track{background:#0A1220;}
        ::-webkit-scrollbar-thumb{background:#182847;border-radius:2px;}
        select option{background:#0F1A2E;}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        input[type=radio],input[type=checkbox]{cursor:pointer;}
      `}</style>

      {!isMobile&&<div style={{width:215,minWidth:215,background:C.surface,borderRight:`1px solid ${C.border}`,flexShrink:0}}><Sidebar/></div>}
      {isMobile&&sidebarOpen&&(
        <div style={{position:"fixed",inset:0,zIndex:200,display:"flex"}}>
          <div style={{width:230,background:C.surface,borderRight:`1px solid ${C.border}`}}><Sidebar/></div>
          <div style={{flex:1,background:"rgba(0,0,0,0.55)"}} onClick={()=>setSidebarOpen(false)}/>
        </div>
      )}

      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
        {/* Topbar */}
        <div style={{padding:isMobile?"10px 14px":"11px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:C.surface,gap:8,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {isMobile&&<button style={{background:"none",border:"none",cursor:"pointer",color:C.text,fontSize:20,lineHeight:1}} onClick={()=>setSidebarOpen(true)}>☰</button>}
            <div style={{fontSize:isMobile?13:15,fontWeight:700}}>{TITLES[tab]}</div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {!isMobile&&<input style={{background:C.faint,border:`1px solid ${C.border}`,borderRadius:7,color:C.text,padding:"6px 10px",fontSize:12,outline:"none",width:165}} placeholder="🔍 Global search..."/>}
            <div style={{position:"relative"}}>
              <button style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:C.text,position:"relative",lineHeight:1}} onClick={()=>setNotifOpen(o=>!o)}>
                🔔{totalAlerts>0&&<span style={{position:"absolute",top:-2,right:-2,background:C.red,color:"#fff",fontSize:9,fontWeight:700,borderRadius:"50%",width:14,height:14,display:"flex",alignItems:"center",justifyContent:"center"}}>{totalAlerts}</span>}
              </button>
              {notifOpen&&(
                <div style={{position:"absolute",right:0,top:"calc(100% + 8px)",width:300,background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:14,zIndex:100,boxShadow:"0 8px 32px rgba(0,0,0,0.5)"}}>
                  <div style={{fontWeight:700,marginBottom:10,fontSize:13}}>Notifications</div>
                  {pendingCount>0&&<div style={{padding:"8px 10px",background:`${C.amber}12`,borderRadius:8,fontSize:11,color:C.amber,marginBottom:6}}>⏳ {pendingCount} assignment(s) pending approval</div>}
                  {slaCount>0&&<div style={{padding:"8px 10px",background:`${C.red}12`,borderRadius:8,fontSize:11,color:C.red,marginBottom:6}}>🚨 {slaCount} SLA breach(es) — 2-hour rule</div>}
                  {agingCount>0&&<div style={{padding:"8px 10px",background:`${C.orange}12`,borderRadius:8,fontSize:11,color:C.orange,marginBottom:6}}>⚠️ {agingCount} deal(s) over stage time limit</div>}
                  {stuckCount>0&&<div style={{padding:"8px 10px",background:`${C.red}12`,borderRadius:8,fontSize:11,color:C.red,marginBottom:6}}>🔴 {stuckCount} deal(s) stuck — escalate to manager</div>}
                  {todayFU>0&&<div style={{padding:"8px 10px",background:`${C.green}12`,borderRadius:8,fontSize:11,color:C.green,marginBottom:6}}>📞 {todayFU} follow-up(s) due today</div>}
                  <div style={{padding:"8px 10px",background:`${C.amber}12`,borderRadius:8,fontSize:11,color:C.amber,marginBottom:6}}>🔔 TechNova AWS server renewal in 6 days</div>
                  <div style={{padding:"8px 10px",background:`${C.purple}12`,borderRadius:8,fontSize:11,color:C.purple}}>📄 1 proposal not yet viewed by client</div>
                </div>
              )}
            </div>
            <div style={{width:28,height:28,borderRadius:"50%",background:fp.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0}} title={fp.label}>{fp.short}</div>
            {!isMobile&&<span style={{fontSize:11,fontWeight:600,color:fp.color}}>{fp.label}</span>}
          </div>
        </div>

        {/* Content */}
        <div style={{flex:1,overflowY:"auto",padding:isMobile?"10px 12px":"14px 18px",display:"flex",flexDirection:"column",gap:14}}>
          {tab==="dashboard"    &&<Dashboard     leads={leads} role={role} isMobile={isMobile}/>}
          {tab==="leads"        &&<LeadsPage     leads={leads} setLeads={setLeads} role={role} isMobile={isMobile} onOpenLead={l=>{setSelectedLead(l);}}/>}
          {tab==="clients"      &&<ClientsPage   role={role} isMobile={isMobile}/>}
          {tab==="projects"     &&<ProjectsPage  isMobile={isMobile}/>}
          {tab==="marketing"    &&<MarketingPage isMobile={isMobile}/>}
          {tab==="performance"  &&<PerformancePage isMobile={isMobile}/>}
          {tab==="documents"    &&<DocumentsPage isMobile={isMobile}/>}
          {tab==="brochures"    &&<BrochuresPage isMobile={isMobile}/>}
          {tab==="finance"      &&<FinancePage   isMobile={isMobile}/>}
          {tab==="forecast"     &&<ForecastPage  leads={leads} isMobile={isMobile}/>}
          {tab==="calendar"     &&<CalendarPage  leads={leads} isMobile={isMobile}/>}
        </div>

        {/* Mobile bottom nav */}
        {isMobile&&(
          <div style={{display:"flex",borderTop:`1px solid ${C.border}`,background:C.surface,flexShrink:0}}>
            {[{id:"dashboard",icon:"⊞"},{id:"leads",icon:"◎"},{id:"clients",icon:"❖"},{id:"calendar",icon:"📅"},{id:"forecast",icon:"📈"}].filter(i=>allowed.includes(i.id)).map(item=>(
              <button key={item.id} onClick={()=>setTab(item.id)} style={{flex:1,padding:"9px 4px",border:"none",background:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,color:tab===item.id?C.accent:C.muted,fontSize:17,position:"relative"}}>
                {item.icon}
                {item.id==="leads"&&pendingCount>0&&<span style={{position:"absolute",top:5,right:"calc(50% - 14px)",background:C.amber,color:"#000",fontSize:9,fontWeight:700,borderRadius:10,padding:"0 4px"}}>{pendingCount}</span>}
                <span style={{fontSize:9,fontWeight:600}}>{item.id}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Global Lead Modal */}
      {selectedLead&&<LeadModal lead={selectedLead} onClose={()=>setSelectedLead(null)} role={role} setLeads={setLeads} leads={leads}/>}
    </div>
  );
}
