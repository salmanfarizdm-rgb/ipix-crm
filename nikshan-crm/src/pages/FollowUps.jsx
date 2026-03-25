import React, { useEffect, useState } from 'react'
import api from '../lib/api.js'
import { useAuth } from '../store/auth.js'
import toast from 'react-hot-toast'
import { Plus, X, Check, Calendar, Clock, AlertCircle } from 'lucide-react'
import { format, isPast, isToday, parseISO } from 'date-fns'

const TYPES = ['call','visit','demo','service_check','whatsapp']
const fmtDate = d => { try { return format(parseISO(d), 'dd MMM yyyy') } catch { return d } }

function AddModal({ customers, users, currentUser, onClose, onSuccess }) {
  const [form, setForm] = useState({ customer_id:'', lead_id:null, assigned_to: currentUser.id, created_by: currentUser.id, follow_up_type:'call', due_date: new Date().toISOString().split('T')[0], notes:'' })
  const [loading, setLoading] = useState(false)
  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true)
    try { await api.post('/followups', form); toast.success('Follow-up scheduled!'); onSuccess() }
    catch { toast.error('Failed') } finally { setLoading(false) }
  }
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-slate-800">Schedule Follow-up</h2>
          <button onClick={onClose}><X size={20} className="text-slate-400"/></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="label">Customer</label>
            <select className="select" value={form.customer_id} onChange={e=>setForm({...form,customer_id:e.target.value})}>
              <option value="">Select customer</option>
              {customers.map(c=><option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Type</label><select className="select" value={form.follow_up_type} onChange={e=>setForm({...form,follow_up_type:e.target.value})}>{TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
            <div><label className="label">Due Date *</label><input className="input" type="date" value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})} required /></div>
            <div className="col-span-2"><label className="label">Assign To</label>
              <select className="select" value={form.assigned_to} onChange={e=>setForm({...form,assigned_to:e.target.value})}>
                {users.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="col-span-2"><label className="label">Notes</label><textarea className="input h-20 resize-none" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} /></div>
          </div>
          <div className="flex gap-3"><button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button><button type="submit" disabled={loading} className="btn-primary flex-1">{loading?'Saving...':'Schedule'}</button></div>
        </form>
      </div>
    </div>
  )
}

function FollowUpCard({ f, onDone }) {
  const [showOutcome, setShowOutcome] = useState(false)
  const [outcome, setOutcome] = useState('')
  const [loading, setLoading] = useState(false)

  const handleDone = async () => {
    setLoading(true)
    try { await onDone(f.id, outcome); setShowOutcome(false) } finally { setLoading(false) }
  }

  const isOverdue = !f.done && isPast(parseISO(f.due_date + 'T23:59:59')) && !isToday(parseISO(f.due_date))
  const todayDue = !f.done && isToday(parseISO(f.due_date))

  return (
    <div className={`p-4 rounded-xl border transition-all ${f.done?'bg-slate-50 border-slate-100 opacity-60':isOverdue?'bg-red-50 border-red-200':todayDue?'bg-blue-50 border-blue-200':'bg-white border-slate-100 shadow-sm'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {isOverdue && <AlertCircle size={14} className="text-red-500 shrink-0"/>}
            {todayDue && <Clock size={14} className="text-blue-500 shrink-0"/>}
            {f.done && <Check size={14} className="text-green-500 shrink-0"/>}
            <span className="font-semibold text-sm text-slate-800">{f.nk_customers?.name || f.nk_leads?.name || 'Unknown'}</span>
          </div>
          <div className="text-xs text-slate-500 flex flex-wrap gap-3">
            <span>{f.follow_up_type}</span>
            <span>Assigned to: {f.nk_users?.name}</span>
            <span className={`font-medium ${isOverdue?'text-red-600':todayDue?'text-blue-600':'text-slate-500'}`}>{fmtDate(f.due_date)}</span>
          </div>
          {f.notes && <div className="text-xs text-slate-400 mt-1">{f.notes}</div>}
          {f.done && f.outcome && <div className="text-xs text-green-700 mt-1 italic">"{f.outcome}"</div>}
        </div>
        {!f.done && (
          <button onClick={() => setShowOutcome(!showOutcome)} className="shrink-0 flex items-center gap-1 text-xs text-green-700 bg-green-100 hover:bg-green-200 px-3 py-1.5 rounded-lg transition-colors">
            <Check size={13}/> Done
          </button>
        )}
      </div>
      {showOutcome && !f.done && (
        <div className="mt-3 flex gap-2">
          <input className="input text-xs flex-1" placeholder="Outcome / notes (optional)" value={outcome} onChange={e=>setOutcome(e.target.value)} />
          <button onClick={handleDone} disabled={loading} className="btn-primary text-xs px-3">{loading?'...':'Confirm'}</button>
        </div>
      )}
    </div>
  )
}

export default function FollowUps() {
  const [followups, setFollowups] = useState([])
  const [customers, setCustomers] = useState([])
  const [users, setUsers] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [myOnly, setMyOnly] = useState(false)
  const [showDone, setShowDone] = useState(false)
  const [loading, setLoading] = useState(true)
  const { user, canSeeAll } = useAuth()

  const load = () => {
    setLoading(true)
    const p = new URLSearchParams()
    if (myOnly && user) p.set('assigned_to', user.id)
    api.get(`/followups?${p}`).then(r => setFollowups(r.data||[])).finally(()=>setLoading(false))
    api.get('/customers').then(r => setCustomers(r.data||[]))
    api.get('/users').then(r => setUsers(r.data||[]))
  }
  useEffect(load, [myOnly])

  const markDone = async (id, outcome) => {
    await api.patch(`/followups/${id}/done`, { outcome })
    toast.success('Marked as done! ✓')
    load()
  }

  const today = new Date().toISOString().split('T')[0]
  const all = showDone ? followups : followups.filter(f => !f.done)
  const todayItems  = all.filter(f => f.due_date === today && !f.done)
  const overdueItems = all.filter(f => f.due_date < today && !f.done)
  const upcomingItems = all.filter(f => f.due_date > today && !f.done)
  const doneItems = followups.filter(f => f.done)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-slate-900">Follow-ups</h1><p className="text-sm text-slate-500">{all.length} pending</p></div>
        <div className="flex items-center gap-3">
          {canSeeAll() && <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={myOnly} onChange={e=>setMyOnly(e.target.checked)} className="rounded"/>My only</label>}
          <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={showDone} onChange={e=>setShowDone(e.target.checked)} className="rounded"/>Show done</label>
          <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2"><Plus size={16}/> Schedule</button>
        </div>
      </div>

      {loading ? <div className="text-center py-8 text-slate-400">Loading...</div> : (
        <div className="space-y-6">
          {todayItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3"><Calendar size={16} className="text-blue-500"/><h2 className="font-semibold text-slate-700">Today ({todayItems.length})</h2></div>
              <div className="space-y-2">{todayItems.map(f=><FollowUpCard key={f.id} f={f} onDone={markDone}/>)}</div>
            </div>
          )}
          {overdueItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3"><AlertCircle size={16} className="text-red-500"/><h2 className="font-semibold text-red-700">Overdue ({overdueItems.length})</h2></div>
              <div className="space-y-2">{overdueItems.map(f=><FollowUpCard key={f.id} f={f} onDone={markDone}/>)}</div>
            </div>
          )}
          {upcomingItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3"><Calendar size={16} className="text-slate-400"/><h2 className="font-semibold text-slate-700">Upcoming ({upcomingItems.length})</h2></div>
              <div className="space-y-2">{upcomingItems.map(f=><FollowUpCard key={f.id} f={f} onDone={markDone}/>)}</div>
            </div>
          )}
          {showDone && doneItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3"><Check size={16} className="text-green-500"/><h2 className="font-semibold text-slate-500">Completed ({doneItems.length})</h2></div>
              <div className="space-y-2">{doneItems.map(f=><FollowUpCard key={f.id} f={f} onDone={markDone}/>)}</div>
            </div>
          )}
          {todayItems.length===0 && overdueItems.length===0 && upcomingItems.length===0 && !showDone && (
            <div className="text-center py-16 text-slate-400"><Calendar size={40} className="mx-auto mb-3 text-slate-200"/><p>No pending follow-ups 🎉</p></div>
          )}
        </div>
      )}
      {showAdd && <AddModal customers={customers} users={users} currentUser={user} onClose={()=>setShowAdd(false)} onSuccess={()=>{setShowAdd(false);load()}} />}
    </div>
  )
}
