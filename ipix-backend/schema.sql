-- ============================================================
-- IPIX CRM - Supabase Database Schema
-- Run this in Supabase → SQL Editor → New Query → Run
-- ============================================================

-- LEADS TABLE
create table if not exists leads (
  id                 text primary key default 'L' || extract(epoch from now())::bigint::text,
  company            text default '',
  contact            text default '',
  phone              text default '',
  backup_phone       text default '',
  email              text default '',
  backup_email       text default '',
  role               text default '',
  location           text default '',
  source             text default 'Google Ads',
  campaign           text default '—',
  ad_group           text default '—',
  score              text default 'Cold' check (score in ('Hot','Warm','Cold')),
  status             text default 'New' check (status in ('New','Contacted','Qualified','Scope','Proposal Sent','Negotiation','Closing Soon','Won','Lost','Disqualified')),
  service            text default '',
  deal_value         numeric default 0,
  budget_confirmed   boolean default false,
  timeline_confirmed boolean default false,
  assigned_to        text default '',
  assign_status      text default 'unassigned' check (assign_status in ('approved','pending','unassigned')),
  created_date       text default '',
  stage_entered_date text default '',
  won_date           text,
  follow_up_date     text default '—',
  last_contact_date  text default '',
  expected_credit    text default '',
  remarks            text default '',
  lost_reason        text default '',
  disq_reason        text default '',
  proposal_viewed    boolean default false,
  proposal_viewed_at text,
  qual_checklist     jsonb default '{"budget":false,"decisionMaker":false,"requirement":false,"timeline":false}',
  notes              jsonb default '[]',
  tasks              jsonb default '[]',
  history            jsonb default '[]',
  credit_changes     jsonb default '[]',
  nps                integer,
  created_at         timestamptz default now()
);

-- CLIENTS TABLE
create table if not exists clients (
  id               text primary key default 'C' || extract(epoch from now())::bigint::text,
  short_name       text default '',
  company          text default '',
  contact          text default '',
  role             text default '',
  phone            text default '',
  backup_phone     text default '',
  email            text default '',
  backup_email     text default '',
  location         text default '',
  segment          text default 'SME' check (segment in ('Enterprise','SME','Startup','Individual')),
  status           text default 'Active' check (status in ('Active','Inactive','Churned')),
  notes            text default '',
  cross_sell       jsonb default '[]',
  upsell           jsonb default '[]',
  payment_terms    text default '',
  lifetime_revenue numeric default 0,
  total_projects   integer default 0,
  nps_scores       jsonb default '[]',
  payments         jsonb default '[]',
  services         jsonb default '[]',
  purchases        jsonb default '[]',
  edit_history     jsonb default '[]',
  created_at       timestamptz default now()
);

-- INDEXES for fast filtering
create index if not exists leads_status_idx      on leads(status);
create index if not exists leads_source_idx      on leads(source);
create index if not exists leads_assigned_to_idx on leads(assigned_to);
create index if not exists leads_score_idx       on leads(score);
create index if not exists leads_created_date_idx on leads(created_date);
create index if not exists clients_status_idx    on clients(status);
create index if not exists clients_segment_idx   on clients(segment);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) - Enable for production
-- ============================================================
alter table leads   enable row level security;
alter table clients enable row level security;

-- Allow all operations for now (you can restrict later with auth)
create policy "Allow all on leads"   on leads   for all using (true) with check (true);
create policy "Allow all on clients" on clients for all using (true) with check (true);

-- ============================================================
-- SEED YOUR REAL LEAD DATA
-- ============================================================
insert into leads (id, contact, phone, email, company, source, service, status, score, assigned_to, assign_status, created_date, stage_entered_date, remarks, follow_up_date, history, notes, tasks, credit_changes, qual_checklist)
values
('L001','Muhammed Junaid K','+918078952613','','','Google Ads','Mobile App','Disqualified','Cold','Sara Lee','approved','2026-02-03','2026-02-03','Had initial discussion - they need a simple e-commerce website','—','[{"action":"Lead Created","by":"Admin","date":"2026-02-03","time":"9:00 AM"}]','[]','[]','[]','{"budget":false,"decisionMaker":false,"requirement":false,"timeline":false}'),
('L002','Aaryan Menon','+919745143143','lukatmeee@gmail.com','','Google Ads','Mobile App','Contacted','Warm','Sara Lee','approved','2026-02-03','2026-02-03','Ask to share detail call after 6; they hold project till April','2026-03-10','[{"action":"Lead Created","by":"Admin","date":"2026-02-03","time":"9:00 AM"}]','[]','[]','[]','{"budget":false,"decisionMaker":false,"requirement":false,"timeline":false}'),
('L003','Rajesh Kumar R','+919567059991','rajeshrenr@gmail.com','Malayali channel','Google Ads','Mobile App','Contacted','Warm','Sara Lee','approved','2026-02-04','2026-02-04','Need to share the detail; 26/02 - not connected','—','[{"action":"Lead Created","by":"Admin","date":"2026-02-04","time":"9:00 AM"}]','[]','[]','[]','{"budget":false,"decisionMaker":false,"requirement":false,"timeline":false}'),
('L004','Muhammad M','+919567342426','m.muhammadmhd123@gmail.com','No name','Google Ads','Mobile App','New','Cold','Sara Lee','approved','2026-02-04','2026-02-04','','—','[{"action":"Lead Created","by":"Admin","date":"2026-02-04","time":"9:00 AM"}]','[]','[]','[]','{"budget":false,"decisionMaker":false,"requirement":false,"timeline":false}'),
('L005','Vili Hhu Appuzz','+918137820108','vishnuabhaya186@gmail.com','Not Yet Working','Google Ads','Mobile App','New','Cold','Sara Lee','approved','2026-02-05','2026-02-05','','—','[{"action":"Lead Created","by":"Admin","date":"2026-02-05","time":"9:00 AM"}]','[]','[]','[]','{"budget":false,"decisionMaker":false,"requirement":false,"timeline":false}'),
('L006','Suraj P Pilanku','+918078252505','pilanikusuraj@gmail.com','Impression','Google Ads','Mobile App','Contacted','Warm','Sara Lee','approved','2026-02-05','2026-02-05','Ask me to share details; 27/02 - ask to call on march 10','2026-03-10','[{"action":"Lead Created","by":"Admin","date":"2026-02-05","time":"9:00 AM"}]','[]','[]','[]','{"budget":false,"decisionMaker":false,"requirement":false,"timeline":false}'),
('L007','Khalidct1111','+917377711114','khalidct777@gmail.com','Fueleum Energy','Google Ads','Mobile App','Lost','Cold','Sara Lee','approved','2026-02-05','2026-02-05','Planning to share scope of work; 26/02 they found another provider','—','[{"action":"Lead Created","by":"Admin","date":"2026-02-05","time":"9:00 AM"}]','[]','[]','[]','{"budget":false,"decisionMaker":false,"requirement":false,"timeline":false}'),
('L008','Manu','+919746629939','manoranjithcheenu@gmail.com','just_exploring','Google Ads','Mobile App','Disqualified','Cold','Sara Lee','approved','2026-02-05','2026-02-05','Budget issue','—','[{"action":"Lead Created","by":"Admin","date":"2026-02-05","time":"9:00 AM"}]','[]','[]','[]','{"budget":false,"decisionMaker":false,"requirement":false,"timeline":false}'),
('L009','Bhoopesh Fakirchand Bhondle','9372524543','bhoopesh.bhondie@gmail.com','Secora Tech','','LMS','New','Cold','Sara Lee','approved','2026-02-06','2026-02-06','They did not respond; shared message; 27/02: not responding','—','[{"action":"Lead Created","by":"Admin","date":"2026-02-06","time":"9:00 AM"}]','[]','[]','[]','{"budget":false,"decisionMaker":false,"requirement":false,"timeline":false}'),
('L010','Anuanand','8086836963','anuanandofoul@gmail.com','Selfimp','','LMS','Proposal Sent','Hot','Sara Lee','approved','2026-02-06','2026-02-06','Will share the details after that need to connect; 27/02: not responding','—','[{"action":"Lead Created","by":"Admin","date":"2026-02-06","time":"9:00 AM"}]','[]','[]','[]','{"budget":false,"decisionMaker":false,"requirement":false,"timeline":false}'),
('L011','Rakhi rani','9219533328','sudhir1980rk@gmail.com','Sts','','LMS','Contacted','Warm','Sara Lee','approved','2026-02-09','2026-02-09','27/02: they are not responding','—','[{"action":"Lead Created","by":"Admin","date":"2026-02-09","time":"9:00 AM"}]','[]','[]','[]','{"budget":false,"decisionMaker":false,"requirement":false,"timeline":false}'),
('L012','Balraj Kori','9407079122','aryabalraj3@gmail.com','KORI TECHSERV PRIVATE LIMITED','','LMS','Proposal Sent','Hot','Alex Morgan','approved','2026-02-09','2026-02-09','Proposal shared - 10/2/26','—','[{"action":"Lead Created","by":"Admin","date":"2026-02-09","time":"9:00 AM"}]','[]','[]','[]','{"budget":false,"decisionMaker":false,"requirement":false,"timeline":false}'),
('L013','Akaai Book Centre','9417933882','akaalbookcentre@gmail.com','Success adda','','LMS','Proposal Sent','Hot','Alex Morgan','approved','2026-02-10','2026-02-10','','—','[{"action":"Lead Created","by":"Admin","date":"2026-02-10","time":"9:00 AM"}]','[]','[]','[]','{"budget":false,"decisionMaker":false,"requirement":false,"timeline":false}'),
('L014','Yelleswari','9177611560','gyelleswan13@gmail.com','Biosky Industries Limited','','LMS','Disqualified','Cold','Sara Lee','approved','2026-02-11','2026-02-11','17/02 - does not have any requirement; she is driving right now','—','[{"action":"Lead Created","by":"Admin","date":"2026-02-11","time":"9:00 AM"}]','[]','[]','[]','{"budget":false,"decisionMaker":false,"requirement":false,"timeline":false}'),
('L015','Puni Brahamne','9754708599','nileshbarde9754@gmail.com','','','LMS','New','Cold','Sara Lee','approved','2026-02-13','2026-02-13','27/02: they are not responding','—','[{"action":"Lead Created","by":"Admin","date":"2026-02-13","time":"9:00 AM"}]','[]','[]','[]','{"budget":false,"decisionMaker":false,"requirement":false,"timeline":false}'),
('L016','Ronak Kotecha','9067023923','ronak@ethans.co.in','Ethans Tech Solutions LLP','','LMS','Contacted','Warm','Sara Lee','approved','2026-02-14','2026-02-14','He is in traffic right now; 27/02: not responding','2026-03-14','[{"action":"Lead Created","by":"Admin","date":"2026-02-14","time":"9:00 AM"}]','[]','[]','[]','{"budget":false,"decisionMaker":false,"requirement":false,"timeline":false}'),
('L017','Esub ali','9395652107','esubali45612@gmail.com','Esub','','LMS','New','Cold','Sara Lee','approved','2026-02-16','2026-02-16','They are not talking; background noise; 27/02: not responding','—','[{"action":"Lead Created","by":"Admin","date":"2026-02-16","time":"9:00 AM"}]','[]','[]','[]','{"budget":false,"decisionMaker":false,"requirement":false,"timeline":false}'),
('L018','Yogesh Sharma','9267958688','karan123456788bhardwaj@gmail.com','','','LMS','Disqualified','Cold','Sara Lee','approved','2026-02-16','2026-02-16','','—','[{"action":"Lead Created","by":"Admin","date":"2026-02-16","time":"9:00 AM"}]','[]','[]','[]','{"budget":false,"decisionMaker":false,"requirement":false,"timeline":false}'),
('L019','Dharmanand','7972932285','vidheyakosambe@gmail.com','Sukashi Enterprise Pvt Ltd','','LMS','Qualified','Hot','Alex Morgan','approved','2026-02-19','2026-02-19','Proposal shared - discussion going on with CMO','—','[{"action":"Lead Created","by":"Admin","date":"2026-02-19","time":"9:00 AM"}]','[]','[]','[]','{"budget":false,"decisionMaker":false,"requirement":false,"timeline":false}'),
('L020','Hitesh Sachdeva','7888400903','hiteshsachdeva2929@gmail.com','','','LMS','New','Cold','Alex Morgan','approved','2026-02-20','2026-02-20','','—','[{"action":"Lead Created","by":"Admin","date":"2026-02-20","time":"9:00 AM"}]','[]','[]','[]','{"budget":false,"decisionMaker":false,"requirement":false,"timeline":false}'),
('L021','Anshinder Singh','7982172127','arshinder.singh@gilbarco.com','gilbarco.com','','LMS','Proposal Sent','Hot','Sara Lee','approved','2026-02-20','2026-02-20','Need LMS for partner onboarding and engineer skill upgradation','—','[{"action":"Lead Created","by":"Admin","date":"2026-02-20","time":"9:00 AM"}]','[]','[]','[]','{"budget":false,"decisionMaker":false,"requirement":false,"timeline":false}'),
('L022','Guru Govind Maheesh','91 9355235522','gurugovindmaheesh@gmail.com','','Website','Web Development','New','Cold','Sara Lee','approved','2026-02-23','2026-02-23','Ecommerce Website Development on MERN Platform; 27/02: not responding','—','[{"action":"Lead Created","by":"Admin","date":"2026-02-23","time":"9:00 AM"}]','[]','[]','[]','{"budget":false,"decisionMaker":false,"requirement":false,"timeline":false}'),
('L023','Derick Elliot','+13855355181','derickoelliot@outlook.com','','Website','Web Development','Proposal Sent','Hot','Sara Lee','approved','2026-02-24','2026-02-24','Need urgent service for new website; mail shared','—','[{"action":"Lead Created","by":"Admin","date":"2026-02-24","time":"9:00 AM"}]','[]','[]','[]','{"budget":false,"decisionMaker":false,"requirement":false,"timeline":false}'),
('L024','Anurag','8318130325','singh.anurag@sis-india.com','','','LMS','Qualified','Hot','Alex Morgan','approved','2026-02-25','2026-02-25','Demo scheduled for 28/2 - 3:00 pm','2026-02-28','[{"action":"Lead Created","by":"Admin","date":"2026-02-25","time":"9:00 AM"}]','[]','[]','[]','{"budget":false,"decisionMaker":false,"requirement":false,"timeline":false}'),
('L025','Dr V.V.Hadge','9860131843','ascpulgaon@gmail.com','SHANKARRAO BHOYAR PATIL MAHAVIDYALAY PULGAON','','LMS','Disqualified','Cold','Alex Morgan','approved','2026-02-25','2026-02-25','Does not know about this - did not make any enquiry','—','[{"action":"Lead Created","by":"Admin","date":"2026-02-25","time":"9:00 AM"}]','[]','[]','[]','{"budget":false,"decisionMaker":false,"requirement":false,"timeline":false}'),
('L026','Piyush Khiyani','7000629627','contact.presto@gmail.com','Presto Solutions','','LMS','Contacted','Warm','Sara Lee','approved','2026-01-06','2026-01-06','Call back post lunch / evening','—','[{"action":"Lead Created","by":"Admin","date":"2026-01-06","time":"9:00 AM"}]','[]','[]','[]','{"budget":false,"decisionMaker":false,"requirement":false,"timeline":false}'),
('L027','Nishad pk','+9193880033321','loclampm@gmail.com','ITA Malappuram','Google Ads','Mobile App','Contacted','Warm','Sara Lee','approved','2026-01-07','2026-01-07','Tried connecting, messaged him with IPIX brochure. 30-Jan-2026 no response','—','[{"action":"Lead Created","by":"Admin","date":"2026-01-07","time":"9:00 AM"}]','[]','[]','[]','{"budget":false,"decisionMaker":false,"requirement":false,"timeline":false}'),
('L028','Benjamin Sam','91 88619 42017','benjaminsam.officiel@gmail.com','Forge Dental Lab','Google Ads','Mobile App','Qualified','Hot','Sara Lee','approved','2026-01-12','2026-01-12','Currently does not have any requirement; mail shared; connected tomorrow meeting schedule','—','[{"action":"Lead Created","by":"Admin","date":"2026-01-12","time":"9:00 AM"}]','[]','[]','[]','{"budget":false,"decisionMaker":false,"requirement":false,"timeline":false}'),
('L029','Prabhakar','+919900794940','prabhakar@instareward.in','Self-Employed','Google Ads','Mobile App','Proposal Sent','Hot','Sara Lee','approved','2026-01-12','2026-01-12','30/1: no response; he cut the call; call scheduled','—','[{"action":"Lead Created","by":"Admin","date":"2026-01-12","time":"9:00 AM"}]','[]','[]','[]','{"budget":false,"decisionMaker":false,"requirement":false,"timeline":false}'),
('L030','Midhun VR','+919746256083','midhunvr1983@gmail.com','','Google Ads','Mobile App','New','Cold','Sara Lee','approved','2026-01-13','2026-01-13','30/01 not connected; 21/01: they need a blood donation app','—','[{"action":"Lead Created","by":"Admin","date":"2026-01-13","time":"9:00 AM"}]','[]','[]','[]','{"budget":false,"decisionMaker":false,"requirement":false,"timeline":false}'),
('L031','Nebu M Johnson','+917306231689','mcjmedia@gmail.com','buisnessman','Google Ads','Mobile App','Contacted','Warm','Sara Lee','approved','2026-01-16','2026-01-16','30/1: need to send details; they need a digital gold platform; busy','—','[{"action":"Lead Created","by":"Admin","date":"2026-01-16","time":"9:00 AM"}]','[]','[]','[]','{"budget":false,"decisionMaker":false,"requirement":false,"timeline":false}'),
('L032','Sunil Gideon','9818088825','info@labfindia.org','LSBF Institute of Education','','LMS','Qualified','Hot','Sara Lee','approved','2026-01-24','2026-01-24','Connected; ask to share details 28/01; no response; text message shared','—','[{"action":"Lead Created","by":"Admin","date":"2026-01-24","time":"9:00 AM"}]','[]','[]','[]','{"budget":false,"decisionMaker":false,"requirement":false,"timeline":false}'),
('L033','Rajesh Kumar','+971543606184','rajesh.kumar1@kaplan.com','','','LMS','Qualified','Hot','Alex Morgan','approved','2026-01-27','2026-01-27','Connected in mail - need followup - Moodle LMS - Demo shared and discussion undergoing','—','[{"action":"Lead Created","by":"Admin","date":"2026-01-27","time":"9:00 AM"}]','[]','[]','[]','{"budget":false,"decisionMaker":false,"requirement":false,"timeline":false}'),
('L034','Muhammed Yusuf','+8848896043','yasinmuhammedyasin@gmail.com','Brookhaven','Google Ads','Mobile App','Contacted','Warm','Sara Lee','approved','2026-01-28','2026-01-28','Message shared both mail and whatsapp; tried but did not pick up','—','[{"action":"Lead Created","by":"Admin","date":"2026-01-28","time":"9:00 AM"}]','[]','[]','[]','{"budget":false,"decisionMaker":false,"requirement":false,"timeline":false}'),
('L035','Firoze Thikkodi','+919037087883','ammuhammedfiroz@gmail.com','Avanzo Institute','Google Ads','Mobile App','Contacted','Warm','Alex Morgan','approved','2026-01-30','2026-01-30','Direct meet on Calicut at 31/01/26; looking for job consulting app','—','[{"action":"Lead Created","by":"Admin","date":"2026-01-30","time":"9:00 AM"}]','[]','[]','[]','{"budget":false,"decisionMaker":false,"requirement":false,"timeline":false}')
on conflict (id) do nothing;
