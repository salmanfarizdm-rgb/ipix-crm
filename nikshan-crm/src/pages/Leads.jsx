import React, { useEffect, useState } from 'react'
import api from '../lib/api.js'
import { useAuth } from '../store/auth.js'
import toast from 'react-hot-toast'
import { Plus, X, Phone, IndianRupee, Trophy, AlertCircle } from 'lucide-react'

const QUICK_PERIODS = [
  { label:'Today',      getDates:()=>{ const t=new Date().toISOString().split('T')[0]; return {from:t,to:t} } },
  { label:'This Week',  getDates:()=>{ const t=new Date(),f=new Date(t); f.setDate(t.getDate()-7); return {from:f.toISOString().split('T')[0],to:t.toISOString().split('T')[0]} } },
  { label:'This Month', getDates:()=>{ const n=new Date(); return {from:new Date(n.getFullYear(),n.getMonth(),1).toISOString().split('T')[0],to:n.toISOString().split('T')[0]} } },
  { label:'Last Month', getDates:()=>{ const n=new Date(),f=new Date(n.getFullYear(),n.getMonth()-1,1),t=new Date(n.getFullYear(),n.getMonth(),0); return {from:f.toISOString().split('T')[0],to:t.toISOString().split('T')[0]} } },
]

const COLS = [
  { key:'new',         label:'New',         color:'bg-slate-100 text-slate-700',    dot:'bg-slate-400' },
  { key:'contacted',   label:'Contacted',   color:'bg-blue-100 text-blue-700',      dot:'bg-blue-400' },
  { key:'quoted',      label:'Quoted',      color:'bg-yellow-100 text-yellow-700',  dot:'bg-yellow-400' },
  { key:'negotiating', label:'Negotiating', color:'bg-orange-100 text-orange-700',  dot:'bg-orange-400' },
  { key:'won',         label:'Won',         color:'bg-green-100 text-green-700',    dot:'bg-green-400' },
  { key:'lost',        label:'Lost',        color:'bg-red-100 text-red-700',        dot:'bg-red-400' },
]

const BANKS = ['HDFC Bank','SBI','ICICI Bank','AXIS Bank','Bajaj Finserv','TVS Credit','HomeCredit','Muthoot Finance','Kotak Mahindra Bank','IndusInd Bank']
const SOURCES = ['walk-in','referral','online','social_media','exhibition']
const PAY_TYPES = ['cash','card','upi','emi','exchange']

function LeadCard({ lead, users, onMove, onWon, onLost }) {
  const next = s => { const idx = COLS.findIndex(c=>c.key===s); return COLS[idx+1]?.key }
  const canAdvance = lead.status !== 'won' && lead.status !== 'lost'

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 mb-3 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div className="font-semibold text-slate-800 text-sm">{lead.name}</div>
        {lead.estimated_value && (
          <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">₹{(lead.estimated_value/1000).toFixed(0)}K</span>
        )}
      </div>
      <div className="text-xs text-slate-500 flex items-center gap-1 mb-1"><Phone size={11}/>{lead.phone}</div>
      {lead.product_interest && <div className="text-xs text-slate-600 mb-2 truncate">{lead.product_interest}</div>}
      {lead.nk_users && <div className="text-xs text-primary-600 mb-3">👤 {lead.nk_users.name}</div>}

      <div className="flex flex-wrap gap-1.5">
        {canAdvance && lead.status !== 'negotiating' && next(lead.status) && next(lead.status) !== 'won' && (
          <button onClick={() => onMove(lead.id, next(lead.status))} className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 transition-colors">
            → {COLS.find(c=>c.key===next(lead.status))?.label}
          </button>
        )}
        {lead.status !== 'won' && lead.status !== 'lost' && (
          <button onClick={() => onWon(lead)} className="text-xs px-2 py-1 bg-green-100 hover:bg-green-200 rounded text-green-700 font-medium transition-colors flex items-center gap-1">
            <Trophy size={10}/> Won
          </button>
        )}
        {lead.status !== 'won' && lead.status !== 'lost' && (
          <button onClick={() => onLost(lead)} className="text-xs px-2 py-1 bg-red-100 hover:bg-red-200 rounded text-red-700 transition-colors">✗ Lost</button>
        )}
      </div>
    </div>
  )
}

function WonModal({ lead, users, stores, currentUser, onClose, onSuccess }) {
  const [step, setStep] = useState(1)
  const [customer, setCustomer] = useState(null)
  const [form, setForm] = useState({
    product_name:'', brand:'', model:'', amount:'', payment_type:'cash', emi_bank:'',
    loan_amount:'', monthly_emi:'', tenure_months:'12', start_date: new Date().toISOString().split('T')[0]
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Step 1: mark lead as won and get customer
    const markWon = async () => {
      const res = await api.patch(`/leads/${lead.id}/status`, { status:'won', converted_by: currentUser.id })
      setCustomer(res.customer)
      setStep(2)
    }
    markWon()
  }, [])

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const purchPayload = {
        customer_id: customer.id, lead_id: lead.id,
        store_id: lead.store_id || currentUser.store_id,
        sold_by: currentUser.id,
        product_name: form.product_name, brand: form.brand, model: form.model,
        amount: parseFloat(form.amount), payment_type: form.payment_type,
        emi_bank: form.payment_type === 'emi' ? form.emi_bank : null,
        purchase_date: new Date().toISOString().split('T')[0]
      }
      const purchRes = await api.post('/purchases', purchPayload)

      if (form.payment_type === 'emi') {
        await api.post('/emi', {
          purchase_id: purchRes.data.id, customer_id: customer.id,
          bank_name: form.emi_bank, loan_amount: parseFloat(form.loan_amount || form.amount),
          monthly_emi: parseFloat(form.monthly_emi), tenure_months: parseInt(form.tenure_months),
          start_date: form.start_date, status:'active'
        })
      }
      toast.success('🎉 Lead converted! Customer & purchase saved.')
      onSuccess()
    } catch (err) {
      toast.error(err?.error || 'Failed to save purchase')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="bg-green-50 p-6 rounded-t-2xl border-b border-green-100">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-2xl mb-1">🎉</div>
              <h2 className="text-lg font-bold text-green-800">Lead Converted!</h2>
              <p className="text-green-700 text-sm">{lead.name} is now a customer</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
          </div>
          {customer && (
            <div className="mt-3 bg-white rounded-xl p-3 border border-green-200">
              <div className="text-xs font-medium text-slate-500 mb-1">Customer Created</div>
              <div className="font-semibold text-slate-800">{customer.name}</div>
              <div className="text-sm text-slate-500">{customer.phone}</div>
            </div>
          )}
        </div>

        {step === 1 && <div className="p-8 text-center"><div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"/><p className="text-slate-500 mt-3">Creating customer...</p></div>}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <h3 className="font-semibold text-slate-800">Add Purchase Details</h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="label">Product Name *</label>
                <input className="input" placeholder="e.g. Samsung 55'' 4K TV" value={form.product_name} onChange={e=>setForm({...form,product_name:e.target.value})} required />
              </div>
              <div>
                <label className="label">Brand</label>
                <input className="input" placeholder="Samsung, LG, Sony..." value={form.brand} onChange={e=>setForm({...form,brand:e.target.value})} />
              </div>
              <div>
                <label className="label">Model</label>
                <input className="input" placeholder="Model number" value={form.model} onChange={e=>setForm({...form,model:e.target.value})} />
              </div>
              <div>
                <label className="label">Sale Amount (₹) *</label>
                <input className="input" type="number" placeholder="75000" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} required />
              </div>
              <div>
                <label className="label">Payment Type *</label>
                <select className="select" value={form.payment_type} onChange={e=>setForm({...form,payment_type:e.target.value})}>
                  {PAY_TYPES.map(t=><option key={t} value={t}>{t.toUpperCase()}</option>)}
                </select>
              </div>
            </div>

            {form.payment_type === 'emi' && (
              <div className="bg-blue-50 rounded-xl p-4 space-y-3">
                <div className="text-sm font-semibold text-blue-800 flex items-center gap-1"><IndianRupee size={14}/> EMI Details</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="label">EMI Bank *</label>
                    <select className="select" value={form.emi_bank} onChange={e=>setForm({...form,emi_bank:e.target.value})} required>
                      <option value="">Select Bank</option>
                      {BANKS.map(b=><option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Loan Amount (₹)</label>
                    <input className="input" type="number" placeholder={form.amount} value={form.loan_amount} onChange={e=>setForm({...form,loan_amount:e.target.value})} />
                  </div>
                  <div>
                    <label className="label">Monthly EMI (₹) *</label>
                    <input className="input" type="number" placeholder="4500" value={form.monthly_emi} onChange={e=>setForm({...form,monthly_emi:e.target.value})} required={form.payment_type==='emi'} />
                  </div>
                  <div>
                    <label className="label">Tenure (months)</label>
                    <select className="select" value={form.tenure_months} onChange={e=>setForm({...form,tenure_months:e.target.value})}>
                      {[3,6,9,12,18,24,36].map(m=><option key={m} value={m}>{m} months</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">EMI Start Date</label>
                    <input className="input" type="date" value={form.start_date} onChange={e=>setForm({...form,start_date:e.target.value})} />
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">Skip</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-60">
                {loading ? 'Saving...' : 'Save & Complete'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function LostModal({ lead, onClose, onSuccess }) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.patch(`/leads/${lead.id}/status`, { status:'lost', lost_reason: reason })
      toast.success('Lead marked as lost')
      onSuccess()
    } catch { toast.error('Failed') } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-slate-800 flex items-center gap-2"><AlertCircle size={18} className="text-red-500"/> Mark as Lost</h2>
          <button onClick={onClose}><X size={18} className="text-slate-400"/></button>
        </div>
        <p className="text-sm text-slate-600 mb-4">Why did we lose <strong>{lead.name}</strong>?</p>
        <form onSubmit={handleSubmit}>
          <textarea className="input mb-4 h-24 resize-none" placeholder="e.g. Budget constraint, went to competitor, no response..." value={reason} onChange={e=>setReason(e.target.value)} required />
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-danger flex-1">{loading?'Saving...':'Mark Lost'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AddLeadModal({ users, stores, currentUser, onClose, onSuccess }) {
  const [form, setForm] = useState({ name:'', phone:'', email:'', product_interest:'', source:'walk-in', assigned_to: currentUser.id, store_id: currentUser.store_id || '', estimated_value:'' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/leads', form)
      toast.success('Lead added!')
      onSuccess()
    } catch (err) { toast.error(err?.error || 'Failed') } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">Add New Lead</h2>
          <button onClick={onClose}><X size={20} className="text-slate-400"/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Name *</label><input className="input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required /></div>
            <div><label className="label">Phone *</label><input className="input" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} required /></div>
            <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} /></div>
            <div><label className="label">Source</label><select className="select" value={form.source} onChange={e=>setForm({...form,source:e.target.value})}>{SOURCES.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
            <div className="col-span-2"><label className="label">Product Interest</label><input className="input" placeholder="e.g. 65'' 4K TV, iPhone 15..." value={form.product_interest} onChange={e=>setForm({...form,product_interest:e.target.value})} /></div>
            <div><label className="label">Est. Value (₹)</label><input className="input" type="number" value={form.estimated_value} onChange={e=>setForm({...form,estimated_value:e.target.value})} /></div>
            <div><label className="label">Assign To</label>
              <select className="select" value={form.assigned_to} onChange={e=>setForm({...form,assigned_to:e.target.value})}>
                {users.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div><label className="label">Store</label>
              <select className="select" value={form.store_id} onChange={e=>setForm({...form,store_id:e.target.value})}>
                <option value="">Select store</option>
                {stores.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div><label className="label">Notes</label><input className="input" value={form.notes||''} onChange={e=>setForm({...form,notes:e.target.value})} /></div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">{loading?'Adding...':'Add Lead'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Leads() {
  const [leads, setLeads] = useState([])
  const [users, setUsers] = useState([])
  const [stores, setStores] = useState([])
  const [wonLead, setWonLead] = useState(null)
  const [lostLead, setLostLead] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [activePeriod, setActivePeriod] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const { user } = useAuth()

  const applyPeriod = (label, dates) => { setActivePeriod(label); setFrom(dates.from); setTo(dates.to); setShowCustom(false) }
  const clearDates  = () => { setFrom(''); setTo(''); setActivePeriod(''); setShowCustom(false) }

  const load = () => {
    const p = new URLSearchParams()
    if (from) p.set('from', from)
    if (to)   p.set('to', to)
    api.get(`/leads?${p}`).then(r => setLeads(r.data || [])).catch(() => {})
    api.get('/users').then(r => setUsers(r.data || [])).catch(() => {})
    api.get('/stores').then(r => setStores(r.data || [])).catch(() => {})
  }
  useEffect(load, [from, to])

  const moveStatus = async (id, status) => {
    try { await api.patch(`/leads/${id}/status`, { status }); load(); toast.success('Status updated') }
    catch { toast.error('Failed') }
  }

  const filtered = leads.filter(l => !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search) || (l.product_interest||'').toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Leads Pipeline</h1>
          <p className="text-sm text-slate-500">{leads.length} total leads</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2"><Plus size={16}/> Add Lead</button>
      </div>

      {/* Date filter */}
      <div className="card py-3 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {QUICK_PERIODS.map(p => (
            <button key={p.label} onClick={() => applyPeriod(p.label, p.getDates())}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activePeriod===p.label?'bg-primary-600 text-white':'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {p.label}
            </button>
          ))}
          <button onClick={() => setShowCustom(!showCustom)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${showCustom?'bg-primary-600 text-white':'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            Custom
          </button>
          {(from || to) && (
            <button onClick={clearDates} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700">
              <X size={11}/> Clear dates
            </button>
          )}
        </div>
        {showCustom && (
          <div className="flex items-center gap-2 text-xs">
            <label className="text-slate-500">From</label>
            <input type="date" className="input w-32 py-1.5 text-xs" value={from} onChange={e=>{setFrom(e.target.value);setActivePeriod('Custom')}} />
            <label className="text-slate-500">To</label>
            <input type="date" className="input w-32 py-1.5 text-xs" value={to} onChange={e=>{setTo(e.target.value);setActivePeriod('Custom')}} />
          </div>
        )}
      </div>

      <input className="input max-w-xs" placeholder="Search leads..." value={search} onChange={e=>setSearch(e.target.value)} />

      {/* Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLS.map(col => {
          const colLeads = filtered.filter(l => l.status === col.key)
          return (
            <div key={col.key} className="shrink-0 w-64">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-2 h-2 rounded-full ${col.dot}`}/>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${col.color}`}>{col.label}</span>
                <span className="text-xs text-slate-400 ml-auto">{colLeads.length}</span>
              </div>
              <div className="min-h-[200px]">
                {colLeads.map(l => (
                  <LeadCard key={l.id} lead={l} users={users}
                    onMove={moveStatus}
                    onWon={lead => setWonLead(lead)}
                    onLost={lead => setLostLead(lead)}
                  />
                ))}
                {colLeads.length === 0 && <div className="text-center text-xs text-slate-300 py-8 border-2 border-dashed border-slate-100 rounded-xl">No leads</div>}
              </div>
            </div>
          )
        })}
      </div>

      {wonLead && <WonModal lead={wonLead} users={users} stores={stores} currentUser={user} onClose={() => setWonLead(null)} onSuccess={() => { setWonLead(null); load() }} />}
      {lostLead && <LostModal lead={lostLead} onClose={() => setLostLead(null)} onSuccess={() => { setLostLead(null); load() }} />}
      {showAdd && <AddLeadModal users={users} stores={stores} currentUser={user} onClose={() => setShowAdd(false)} onSuccess={() => { setShowAdd(false); load() }} />}
    </div>
  )
}
