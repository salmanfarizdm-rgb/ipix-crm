import React, { useEffect, useState } from 'react'
import api from '../lib/api.js'
import { useAuth } from '../store/auth.js'
import toast from 'react-hot-toast'
import { Plus, X } from 'lucide-react'
import { format } from 'date-fns'

const TYPES = ['repair','installation','replacement','warranty','general']
const PRIORITIES = ['low','normal','high','urgent']
const PRIORITY_COLORS = { low:'bg-slate-100 text-slate-600', normal:'bg-blue-100 text-blue-700', high:'bg-orange-100 text-orange-700', urgent:'bg-red-100 text-red-700' }
const STATUS_COLORS = { pending:'bg-yellow-100 text-yellow-700', in_progress:'bg-blue-100 text-blue-700', resolved:'bg-green-100 text-green-700', cancelled:'bg-slate-100 text-slate-500' }
const fmtDate = d => { try { return format(new Date(d), 'dd MMM yyyy') } catch { return d } }

function AddModal({ customers, users, stores, currentUser, onClose, onSuccess }) {
  const [form, setForm] = useState({ customer_id:'', store_id: currentUser.store_id||'', assigned_to:'', created_by: currentUser.id, request_type:'repair', product_name:'', issue_description:'', priority:'normal', status:'pending' })
  const [loading, setLoading] = useState(false)
  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true)
    try { await api.post('/service', form); toast.success('Service request created!'); onSuccess() }
    catch (err) { toast.error(err?.error||'Failed') } finally { setLoading(false) }
  }
  const techs = users.filter(u => u.role === 'technician')
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">New Service Request</h2>
          <button onClick={onClose}><X size={20} className="text-slate-400"/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div><label className="label">Customer *</label>
            <select className="select" value={form.customer_id} onChange={e=>setForm({...form,customer_id:e.target.value})} required>
              <option value="">Select customer</option>
              {customers.map(c=><option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Type</label><select className="select" value={form.request_type} onChange={e=>setForm({...form,request_type:e.target.value})}>{TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
            <div><label className="label">Priority</label><select className="select" value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>{PRIORITIES.map(p=><option key={p} value={p}>{p}</option>)}</select></div>
            <div className="col-span-2"><label className="label">Product *</label><input className="input" placeholder="Product name" value={form.product_name} onChange={e=>setForm({...form,product_name:e.target.value})} required /></div>
            <div className="col-span-2"><label className="label">Issue Description *</label><textarea className="input h-20 resize-none" value={form.issue_description} onChange={e=>setForm({...form,issue_description:e.target.value})} required /></div>
            <div><label className="label">Assign Technician</label>
              <select className="select" value={form.assigned_to} onChange={e=>setForm({...form,assigned_to:e.target.value})}>
                <option value="">Unassigned</option>
                {techs.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div><label className="label">Store</label>
              <select className="select" value={form.store_id} onChange={e=>setForm({...form,store_id:e.target.value})}>
                <option value="">Select store</option>
                {stores.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">{loading?'Saving...':'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditStatusModal({ req, onClose, onSuccess }) {
  const [status, setStatus] = useState(req.status)
  const [notes, setNotes] = useState(req.resolution_notes||'')
  const [loading, setLoading] = useState(false)
  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true)
    try { await api.put(`/service/${req.id}`, { status, resolution_notes: notes }); toast.success('Updated!'); onSuccess() }
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
          <div><label className="label">Resolution Notes</label><textarea className="input h-20 resize-none" value={notes} onChange={e=>setNotes(e.target.value)} /></div>
          <div className="flex gap-3"><button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button><button type="submit" disabled={loading} className="btn-primary flex-1">{loading?'Saving...':'Update'}</button></div>
        </form>
      </div>
    </div>
  )
}

export default function ServiceRequests() {
  const [requests, setRequests] = useState([])
  const [customers, setCustomers] = useState([])
  const [users, setUsers] = useState([])
  const [stores, setStores] = useState([])
  const [tabFilter, setTabFilter] = useState('all')
  const [editing, setEditing] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const load = () => {
    setLoading(true)
    const p = new URLSearchParams()
    if (tabFilter !== 'all') p.set('status', tabFilter)
    api.get(`/service?${p}`).then(r=>setRequests(r.data||[])).finally(()=>setLoading(false))
    api.get('/customers').then(r=>setCustomers(r.data||[]))
    api.get('/users').then(r=>setUsers(r.data||[]))
    api.get('/stores').then(r=>setStores(r.data||[]))
  }
  useEffect(load, [tabFilter])

  const TABS = ['all','pending','in_progress','resolved']

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-slate-900">Service Requests</h1><p className="text-sm text-slate-500">{requests.length} records</p></div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2"><Plus size={16}/> New Request</button>
      </div>

      <div className="flex gap-2">
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTabFilter(t)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${tabFilter===t?'bg-primary-600 text-white':'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
            {t.replace('_',' ')}
          </button>
        ))}
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
                <td className="py-3 px-3 font-semibold text-slate-800 text-xs">{r.nk_customers?.name}<div className="text-slate-400">{r.nk_customers?.phone}</div></td>
                <td className="py-3 px-3 text-slate-700 text-xs">{r.product_name}</td>
                <td className="py-3 px-3 text-slate-500 text-xs max-w-[120px] truncate" title={r.issue_description}>{r.issue_description}</td>
                <td className="py-3 px-3 text-xs text-slate-500">{r.request_type}</td>
                <td className="py-3 px-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[r.priority]}`}>{r.priority}</span></td>
                <td className="py-3 px-3 text-slate-500 text-xs">{r.nk_users?.name||'Unassigned'}</td>
                <td className="py-3 px-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[r.status]||''}`}>{r.status?.replace('_',' ')}</span></td>
                <td className="py-3 px-3 text-slate-400 text-xs">{fmtDate(r.created_at)}</td>
                <td className="py-3 px-3"><button onClick={()=>setEditing(r)} className="text-xs text-primary-600 hover:underline">Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && <EditStatusModal req={editing} onClose={()=>setEditing(null)} onSuccess={()=>{setEditing(null);load()}} />}
      {showAdd && <AddModal customers={customers} users={users} stores={stores} currentUser={user} onClose={()=>setShowAdd(false)} onSuccess={()=>{setShowAdd(false);load()}} />}
    </div>
  )
}
