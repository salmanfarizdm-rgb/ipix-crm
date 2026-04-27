import React, { useEffect, useState, useCallback, useRef } from 'react'
import api from '../lib/api.js'
import { useAuth } from '../store/auth.js'
import toast from 'react-hot-toast'
import { Plus, X, Search, Phone, AlertCircle, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'

const QUICK_PERIODS = [
  { label:'Today',      getDates:()=>{ const t=new Date().toISOString().split('T')[0]; return {from:t,to:t} } },
  { label:'This Week',  getDates:()=>{ const t=new Date(),f=new Date(t); f.setDate(t.getDate()-7); return {from:f.toISOString().split('T')[0],to:t.toISOString().split('T')[0]} } },
  { label:'This Month', getDates:()=>{ const n=new Date(); return {from:new Date(n.getFullYear(),n.getMonth(),1).toISOString().split('T')[0],to:n.toISOString().split('T')[0]} } },
  { label:'Last Month', getDates:()=>{ const n=new Date(),f=new Date(n.getFullYear(),n.getMonth()-1,1),t=new Date(n.getFullYear(),n.getMonth(),0); return {from:f.toISOString().split('T')[0],to:t.toISOString().split('T')[0]} } },
]

const TYPES     = ['installation','repair','complaint','return','replacement']
const TYPE_LABELS = { installation:'Installation', repair:'Repair', complaint:'Complaint', return:'Return', replacement:'Replacement' }
const PRIORITIES  = ['low','normal','high','urgent']
const PRIORITY_COLORS = { low:'bg-slate-100 text-slate-600', normal:'bg-blue-100 text-blue-700', high:'bg-orange-100 text-orange-700', urgent:'bg-red-100 text-red-700' }
const STATUS_COLORS   = { pending:'bg-yellow-100 text-yellow-700', in_progress:'bg-blue-100 text-blue-700', resolved:'bg-green-100 text-green-700', cancelled:'bg-slate-100 text-slate-500' }
const fmtDate = d => { try { return format(new Date(d), 'dd MMM yyyy') } catch { return d } }

/* ── Phone search hook ── */
function usePhoneSearch() {
  const [phone, setPhone]         = useState('')
  const [customer, setCustomer]   = useState(null)  // found customer
  const [purchases, setPurchases] = useState([])
  const [status, setStatus]       = useState(null)  // null | 'searching' | 'found' | 'not_found'
  const debRef = useRef(null)

  const search = useCallback(val => {
    const cleaned = val.replace(/\D/g,'').slice(0,10)
    setPhone(cleaned); setCustomer(null); setPurchases([]); setStatus(null)
    if (cleaned.length < 10) return
    clearTimeout(debRef.current)
    setStatus('searching')
    debRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/customers?search=${cleaned}`)
        const match = (res.data||[]).find(c=>c.phone===cleaned)
        if (match) {
          setCustomer(match); setStatus('found')
          const pRes = await api.get(`/purchases?customer_id=${match.id}`)
          setPurchases(pRes.data||[])
        } else {
          setStatus('not_found')
        }
      } catch { setStatus('not_found') }
    }, 500)
  }, [])

  return { phone, customer, purchases, status, search }
}

/* ── New Service Request Modal ── */
function AddModal({ users, stores, currentUser, onClose, onSuccess }) {
  const { phone, customer, purchases, status, search } = usePhoneSearch()
  const [selectedPurchaseId, setSelectedPurchaseId] = useState('')
  const [walkInProduct, setWalkInProduct]           = useState('')
  const [warrantyStatus, setWarrantyStatus]         = useState(null)
  const [policyCheck, setPolicyCheck]               = useState(null)
  const RETURN_WINDOW      = 15  // days
  const REPLACEMENT_WINDOW = 30  // days
  const [form, setForm] = useState({
    store_id:         currentUser.store_id || '',
    assigned_to:      '',
    created_by:       currentUser.id,
    request_type:     'repair',
    product_name:     '',
    issue_description:'',
    priority:         'normal',
    status:           'pending',
  })
  const [loading, setLoading] = useState(false)
  const techs = users.filter(u => u.role === 'technician')

  // Auto-fill product name from selected purchase + warranty check
  const handlePurchaseSelect = e => {
    const pid = e.target.value
    setSelectedPurchaseId(pid)
    const p = purchases.find(x => x.id === pid)
    if (p) {
      setForm(f => ({ ...f, product_name: [p.brand, p.product_name].filter(Boolean).join(' ') }))
      // Check warranty
      if (p.warranty_expiry) {
        const daysLeft = Math.ceil((new Date(p.warranty_expiry) - new Date()) / (1000 * 60 * 60 * 24))
        setWarrantyStatus({ daysLeft, expiry: p.warranty_expiry, inWarranty: daysLeft > 0 })
      } else {
        setWarrantyStatus(null)
      }
    }
  }

  // Policy check effect for return/replacement
  useEffect(() => {
    if (!selectedPurchaseId || !['return','replacement'].includes(form.request_type)) {
      setPolicyCheck(null)
      return
    }
    const p = purchases.find(x => x.id === selectedPurchaseId)
    if (!p?.purchase_date) { setPolicyCheck(null); return }
    const daysSince = Math.ceil((new Date() - new Date(p.purchase_date)) / (1000 * 60 * 60 * 24))
    const window = form.request_type === 'return' ? RETURN_WINDOW : REPLACEMENT_WINDOW
    const status = daysSince <= window ? 'ok' : 'expired'
    const lastDay = daysSince === window
    setPolicyCheck({ daysSince, window, status, lastDay, purchaseDate: p.purchase_date })
  }, [selectedPurchaseId, form.request_type, purchases])

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true)
    try {
      const body = {
        ...form,
        customer_id:  customer?.id || null,
        purchase_id:  selectedPurchaseId || null,
        product_name: form.product_name || walkInProduct,
        // Walk-in fields (stored if no customer)
        walk_in_name:    customer ? null : form._walk_in_name || null,
        walk_in_phone:   customer ? null : phone || null,
        walk_in_product: customer ? null : walkInProduct || null,
      }
      delete body._walk_in_name
      await api.post('/service', body)
      toast.success('Service request created!'); onSuccess()
    } catch (err) { toast.error(err?.response?.data?.error || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">New Service Request</h2>
          <button onClick={onClose}><X size={20} className="text-slate-400"/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* ── Customer Phone Search ── */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <div className="text-xs font-semibold text-slate-600 flex items-center gap-2"><Phone size={13}/> Find Customer by Phone</div>
            <div className="relative">
              <input
                className={`input bg-white pr-10 ${status==='found'?'border-green-400':status==='not_found'?'border-orange-300':''}`}
                placeholder="Enter customer phone number"
                value={phone}
                onChange={e => search(e.target.value)}
                maxLength={10}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {status==='searching'  && <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"/>}
                {status==='found'      && <CheckCircle size={16} className="text-green-500"/>}
                {status==='not_found'  && <AlertCircle size={16} className="text-orange-400"/>}
              </div>
            </div>

            {/* Customer found */}
            {status==='found' && customer && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="font-semibold text-green-800 text-sm">{customer.name}</div>
                <div className="text-xs text-green-600">{customer.phone} · {customer.nk_stores?.name||''}</div>
                {purchases.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-slate-500 mb-1">Select product with issue:</div>
                    <select className="select bg-white text-xs py-1.5" value={selectedPurchaseId} onChange={handlePurchaseSelect}>
                      <option value="">Not from purchase history</option>
                      {purchases.map(p=><option key={p.id} value={p.id}>{p.brand} {p.product_name} · {fmtDate(p.purchase_date)}</option>)}
                    </select>
                  </div>
                )}
                {warrantyStatus && (
                  <div className={`mt-2 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                    warrantyStatus.inWarranty ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                  }`}>
                    {warrantyStatus.inWarranty ? '✅ IN WARRANTY' : '❌ OUT OF WARRANTY'}
                    <span className="font-normal">
                      {warrantyStatus.inWarranty
                        ? `${warrantyStatus.daysLeft} days left (expires ${fmtDate(warrantyStatus.expiry)})`
                        : `Expired ${fmtDate(warrantyStatus.expiry)}`}
                    </span>
                  </div>
                )}
                {policyCheck && (
                  <div className={`mt-2 px-3 py-2 rounded-lg text-xs font-semibold ${
                    policyCheck.status === 'ok' ? policyCheck.lastDay ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-600'
                  }`}>
                    {policyCheck.status === 'ok' && !policyCheck.lastDay && `✅ Purchased ${policyCheck.daysSince} day(s) ago — Within ${form.request_type} window (${policyCheck.window} days)`}
                    {policyCheck.status === 'ok' && policyCheck.lastDay && `⚠️ Purchased ${policyCheck.daysSince} day(s) ago — LAST DAY of ${form.request_type} window!`}
                    {policyCheck.status === 'expired' && `❌ Purchased ${policyCheck.daysSince} day(s) ago — ${form.request_type} window closed (${policyCheck.window} days)`}
                  </div>
                )}
              </div>
            )}

            {/* Walk-in: customer not found */}
            {status==='not_found' && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 space-y-2">
                <div className="text-xs text-orange-700 font-medium">No customer found — entering walk-in details</div>
                <input className="input bg-white text-sm" placeholder="Customer name" value={form._walk_in_name||''} onChange={e=>setForm({...form,_walk_in_name:e.target.value})} />
                <input className="input bg-white text-sm" placeholder="Product / device brought in" value={walkInProduct} onChange={e=>setWalkInProduct(e.target.value)} />
              </div>
            )}
          </div>

          {/* ── Service Details ── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Request Type</label>
              <select className="select" value={form.request_type} onChange={e=>setForm({...form,request_type:e.target.value})}>
                {TYPES.map(t=><option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="select" value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>
                {PRIORITIES.map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Product / Device Name *</label>
            <input className="input" placeholder="e.g. Samsung 55 QLED TV" value={form.product_name} onChange={e=>setForm({...form,product_name:e.target.value})} required />
          </div>

          <div>
            <label className="label">Issue Description *</label>
            <textarea className="input h-20 resize-none" placeholder="Describe the problem..." value={form.issue_description} onChange={e=>setForm({...form,issue_description:e.target.value})} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Assign Technician</label>
              <select className="select" value={form.assigned_to} onChange={e=>setForm({...form,assigned_to:e.target.value})}>
                <option value="">Unassigned</option>
                {techs.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Store</label>
              <select className="select" value={form.store_id} onChange={e=>setForm({...form,store_id:e.target.value})}>
                <option value="">Select store</option>
                {stores.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">{loading?'Saving...':'Create Request'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Edit Status Modal ── */
function EditStatusModal({ req, onClose, onSuccess }) {
  const [status, setStatus] = useState(req.status)
  const [notes,  setNotes]  = useState(req.resolution_notes||'')
  const [loading, setLoading] = useState(false)

  const handleWhatsApp = () => {
    const phone = req.nk_customers?.phone?.replace(/\D/g, '')
    if (!phone) return
    const msg = `Dear ${req.nk_customers?.name || 'Customer'}, your service request at Nikshan has been resolved ✅\n\nIssue: ${req.issue_description}\nProduct: ${req.product_name}\n\nPlease visit us or call if you need further assistance.\n\nThank you, Nikshan Electronics`
    window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true)
    try { await api.put(`/service/${req.id}`, { status, resolution_notes:notes }); toast.success('Updated!'); onSuccess() }
    catch { toast.error('Failed') } finally { setLoading(false) }
  }
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-slate-800">Update Status</h2>
          <button onClick={onClose}><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><label className="label">Status</label>
            <select className="select" value={status} onChange={e=>setStatus(e.target.value)}>
              {['pending','in_progress','resolved','cancelled'].map(s=><option key={s} value={s}>{s.replace('_',' ')}</option>)}
            </select>
          </div>
          <div><label className="label">Resolution Notes</label><textarea className="input h-20 resize-none" value={notes} onChange={e=>setNotes(e.target.value)}/></div>
          {status === 'resolved' && req.nk_customers?.phone && (
            <button type="button" onClick={handleWhatsApp}
              className="w-full flex items-center justify-center gap-2 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700">
              Send WhatsApp to Customer
            </button>
          )}
          <div className="flex gap-3"><button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button><button type="submit" disabled={loading} className="btn-primary flex-1">{loading?'Saving...':'Update'}</button></div>
        </form>
      </div>
    </div>
  )
}

/* ── Main Page ── */
export default function ServiceRequests() {
  const [requests, setRequests] = useState([])
  const [users, setUsers]       = useState([])
  const [stores, setStores]     = useState([])
  const [statusFilter, setStatusFilter]   = useState('all')
  const [typeFilter, setTypeFilter]       = useState('all')
  const [from, setFrom]         = useState('')
  const [to, setTo]             = useState('')
  const [activePeriod, setActivePeriod]   = useState('')
  const [showCustom, setShowCustom]       = useState(false)
  const [editing, setEditing]   = useState(null)
  const [showAdd, setShowAdd]   = useState(false)
  const [loading, setLoading]   = useState(true)
  const { user } = useAuth()

  const applyPeriod = (label, dates) => { setActivePeriod(label); setFrom(dates.from); setTo(dates.to); setShowCustom(false) }
  const clearDates  = () => { setFrom(''); setTo(''); setActivePeriod(''); setShowCustom(false) }

  const load = () => {
    setLoading(true)
    const p = new URLSearchParams()
    if (statusFilter !== 'all') p.set('status', statusFilter)
    if (typeFilter !== 'all')   p.set('request_type', typeFilter)
    if (from) p.set('from', from)
    if (to)   p.set('to', to)
    api.get(`/service?${p}`).then(r=>setRequests(r.data||[])).finally(()=>setLoading(false))
    api.get('/users').then(r=>setUsers(r.data||[]))
    api.get('/stores').then(r=>setStores(r.data||[]))
  }
  useEffect(load, [statusFilter, typeFilter, from, to])

  const STATUS_TABS = ['all','pending','in_progress','resolved','cancelled']

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-slate-900">Service Requests</h1><p className="text-sm text-slate-500">{requests.length} records</p></div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2"><Plus size={16}/> New Request</button>
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

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map(t=>(
          <button key={t} onClick={()=>setStatusFilter(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${statusFilter===t?'bg-primary-600 text-white':'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
            {t.replace('_',' ')}
          </button>
        ))}
        <div className="ml-2">
          <select className="select py-1.5 text-sm w-40" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}>
            <option value="all">All Types</option>
            {TYPES.map(t=><option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
          </select>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>{['Customer','Product','Issue','Type','Priority','Technician','Status','Date','Action'].map(h=><th key={h} className="text-left py-3 px-3 text-xs font-semibold text-slate-500">{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="9" className="text-center py-12 text-slate-400">Loading...</td></tr>
            : requests.length===0 ? <tr><td colSpan="9" className="text-center py-12 text-slate-400">No requests found</td></tr>
            : requests.map(r => (
              <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="py-3 px-3 text-xs">
                  {r.nk_customers ? (
                    <div><div className="font-semibold text-slate-800">{r.nk_customers.name}</div><div className="text-slate-400">{r.nk_customers.phone}</div></div>
                  ) : (
                    <div><div className="font-semibold text-slate-800">{r.walk_in_name||'Walk-in'}</div><div className="text-slate-400">{r.walk_in_phone||'—'}</div></div>
                  )}
                </td>
                <td className="py-3 px-3 text-slate-700 text-xs">{r.product_name}</td>
                <td className="py-3 px-3 text-slate-500 text-xs max-w-[120px] truncate" title={r.issue_description}>{r.issue_description}</td>
                <td className="py-3 px-3">
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{TYPE_LABELS[r.request_type]||r.request_type}</span>
                </td>
                <td className="py-3 px-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[r.priority]}`}>{r.priority}</span></td>
                <td className="py-3 px-3 text-slate-500 text-xs">{r.nk_users?.name||'Unassigned'}</td>
                <td className="py-3 px-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[r.status]||''}`}>{r.status?.replace('_',' ')}</span></td>
                <td className="py-3 px-3 text-slate-400 text-xs">{fmtDate(r.created_at)}</td>
                <td className="py-3 px-3"><button onClick={()=>setEditing(r)} className="text-xs text-primary-600 hover:underline">Update</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && <EditStatusModal req={editing} onClose={()=>setEditing(null)} onSuccess={()=>{setEditing(null);load()}} />}
      {showAdd  && <AddModal users={users} stores={stores} currentUser={user} onClose={()=>setShowAdd(false)} onSuccess={()=>{setShowAdd(false);load()}} />}
    </div>
  )
}
