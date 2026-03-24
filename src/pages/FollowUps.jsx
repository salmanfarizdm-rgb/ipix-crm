import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import { isBefore, parseISO, isToday } from 'date-fns'

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-navy-800 border border-slate-700 rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

function AddForm({ customers, leads, onSave, onClose }) {
  const [form, setForm] = useState({ customer_id: '', lead_id: '', note: '', due_date: new Date().toISOString().split('T')[0] })
  const [saving, setSaving] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async e => {
    e.preventDefault(); setSaving(true)
    try { await onSave(form); onClose() }
    catch (err) { toast.error(err?.error || 'Failed') }
    finally { setSaving(false) }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="block text-xs text-slate-400 mb-1">Customer</label>
        <select className="select" value={form.customer_id} onChange={set('customer_id')}>
          <option value="">Select customer</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs text-slate-400 mb-1">Or Lead</label>
        <select className="select" value={form.lead_id} onChange={set('lead_id')}>
          <option value="">Select lead</option>
          {leads.map(l => <option key={l.id} value={l.id}>{l.customer_name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs text-slate-400 mb-1">Note *</label>
        <textarea className="input" rows={3} value={form.note} onChange={set('note')} required />
      </div>
      <div>
        <label className="block text-xs text-slate-400 mb-1">Due Date *</label>
        <input className="input" type="date" value={form.due_date} onChange={set('due_date')} required />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving ? 'Saving…' : 'Add Follow-Up'}</button>
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
      </div>
    </form>
  )
}

export default function FollowUps() {
  const [followups, setFollowups] = useState([])
  const [customers, setCustomers] = useState([])
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showAdd, setShowAdd] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get('/followups'),
      api.get('/customers?limit=200'),
      api.get('/leads'),
    ]).then(([f, c, l]) => {
      setFollowups(f.data || [])
      setCustomers(c.data || [])
      setLeads(l.data || [])
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const markDone = async id => {
    try {
      await api.patch(`/followups/${id}/done`)
      toast.success('Marked as done')
      load()
    } catch { toast.error('Failed') }
  }

  const addFollowup = async form => {
    await api.post('/followups', form)
    toast.success('Follow-up added')
    load()
  }

  const isOverdue = f => !f.is_done && (() => { try { return isBefore(parseISO(f.due_date), new Date()) && !isToday(parseISO(f.due_date)) } catch { return false } })()
  const isTodayDue = f => !f.is_done && (() => { try { return isToday(parseISO(f.due_date)) } catch { return false } })()

  const filtered = followups.filter(f => {
    if (filter === 'today') return isTodayDue(f)
    if (filter === 'overdue') return isOverdue(f)
    if (filter === 'pending') return !f.is_done
    if (filter === 'done') return f.is_done
    return true
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Follow-Ups</h1>
          <p className="text-sm text-slate-400">{followups.filter(f => !f.is_done).length} pending</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Follow-Up
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[['all','All'],['today','Today'],['overdue','Overdue'],['pending','Pending'],['done','Done']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === v ? 'bg-orange-500 text-white' : 'bg-navy-700 text-slate-400 hover:text-white'} ${v === 'overdue' && filter !== v ? 'border border-red-500/30' : ''}`}>
            {l}
            {v === 'today' && <span className="ml-1 bg-white/20 rounded-full px-1.5">{followups.filter(isTodayDue).length}</span>}
            {v === 'overdue' && <span className="ml-1 bg-red-500/30 rounded-full px-1.5 text-red-300">{followups.filter(isOverdue).length}</span>}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-7 w-7 border-2 border-orange-500 border-t-transparent" /></div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-10 text-slate-500">No follow-ups found</div>
        ) : filtered.map(f => (
          <div key={f.id} className={`card flex items-start gap-4 ${isOverdue(f) ? 'border-red-500/40 bg-red-500/5' : isTodayDue(f) ? 'border-orange-500/40 bg-orange-500/5' : ''}`}>
            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${f.is_done ? 'bg-green-500' : isOverdue(f) ? 'bg-red-500' : isTodayDue(f) ? 'bg-orange-500 animate-pulse' : 'bg-slate-500'}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-white">{f.customer_name || f.lead_name || 'Unknown'}</p>
                  <p className="text-sm text-slate-300 mt-0.5">{f.note}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-xs font-medium ${isOverdue(f) ? 'text-red-400' : isTodayDue(f) ? 'text-orange-400' : 'text-slate-400'}`}>
                    {isOverdue(f) ? '⚠️ Overdue' : isTodayDue(f) ? '📅 Today' : ''} {new Date(f.due_date).toLocaleDateString('en-IN')}
                  </p>
                  {f.is_done && <span className="badge bg-green-500/20 text-green-400 mt-1">Done</span>}
                </div>
              </div>
            </div>
            {!f.is_done && (
              <button onClick={() => markDone(f.id)} className="text-xs text-green-400 hover:text-green-300 flex-shrink-0 border border-green-500/30 px-2 py-1 rounded-lg transition-colors">
                Mark Done
              </button>
            )}
          </div>
        ))}
      </div>

      {showAdd && (
        <Modal title="Add Follow-Up" onClose={() => setShowAdd(false)}>
          <AddForm customers={customers} leads={leads} onSave={addFollowup} onClose={() => setShowAdd(false)} />
        </Modal>
      )}
    </div>
  )
}
