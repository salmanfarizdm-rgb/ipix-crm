const express = require("express");
const router  = express.Router();
const db      = require("../supabase");

// Hard-coded Kerala festival seasons (no DB table needed — admin can override)
const DEFAULT_SEASONS = [
  { id:'onam',       name:'Onam Offer',            months:[7,8],    default_pct:15 },
  { id:'xmas',       name:'Christmas & New Year',  months:[11,0],   default_pct:12 },
  { id:'vishu',      name:'Vishu Special',          months:[3],      default_pct:10 },
  { id:'eid',        name:'Eid Special',            months:[2,3,4],  default_pct:10 },
  { id:'yearend',    name:'Year End Sale',          months:[11],     default_pct:8  },
  { id:'summer',     name:'Summer Sale',            months:[2,3,4],  default_pct:7  },
];

router.get("/", async (req, res) => {
  try {
    // Try DB first; fall back to defaults
    const { data, error } = await db.from("nk_seasons").select("*").order("name");
    if (error || !data?.length) {
      const m = new Date().getMonth();
      return res.json({ success:true, data: DEFAULT_SEASONS.map(s => ({ ...s, active: s.months.includes(m) })) });
    }
    res.json({ success:true, data });
  } catch { res.json({ success:true, data: DEFAULT_SEASONS }); }
});

router.post("/", async (req, res) => {
  const { data, error } = await db.from("nk_seasons").insert(req.body).select().single();
  if (error) return res.status(500).json({ success:false, error: error.message });
  res.status(201).json({ success:true, data });
});

router.put("/:id", async (req, res) => {
  const { data, error } = await db.from("nk_seasons").update(req.body).eq("id", req.params.id).select().single();
  if (error) return res.status(500).json({ success:false, error: error.message });
  res.json({ success:true, data });
});

module.exports = router;
