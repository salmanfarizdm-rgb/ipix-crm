import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../lib/api'

const STAGES = ['new', 'contacted', 'quoted', 'won', 'lost']
const STAGE_COLORS = {
  new: 'border-slate-500',
  contacted: 'border-blue-500',
  quoted: 'border-yellow-500',
  won: 'border-green-500',
  lost: 'border-red-500',
}
const STAGE_LABELS = { new: 'New', contacted: 'Contacted', quoted: 'Quoted', won: 'Won', lost: 'Lost' }

function LeadCard({ lead, onMove, onEdit }) {
  return (
    <div className="bg-navy-700/60 border border-slate-700/50 rounded-lg p-3 cursor-pointer hover:border-orange-500/50 transition-colors"
      onClick={() => onEdit(lead)}>
      <div className="flex justify-between items-start mb-2">
        <p className="text-sm font-medium text-white leading-tight">{lead.customer_name}</p>
        {lead.follow_up_date && (
          <span className="text-xs text-slate-400 flex-shrink-0 ml-2">
            {new Date(lead.follow_up_date) < new Date() ? '🔴' : '📅'} {new Date(lead.follow_up_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
          </span>
        )}
      </div>
      <p className="text-xs text-slate-400 mb-1">{lead.phone}</p>
      {lead.product_interest && <p className="text-xs text-orange-400 truncate">{lead.product_interest}</p>}
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-slate-500 capitalize">{lead.source}</span>
        {lead.assigned_name && <span className="text-xs text-slate-500">{lead.assigned_name}</span>}
      </div>
      <div className="flex gap-1 mt-2 flex-wrap">
        {STAGES.filter(s => s !== lead.status).slice(0, 2).map(s => (
          <button key={s} onClick={e => { e.stopPropagation(); onMove(lead.id, s) }}
            className="text-xs px-2 py-0.5 rounded bg-navy-800 text-slate-400 hover:text-white hover:bg-navy-600 transition-colors">
            → {STAGE_LABELS[s]}
          </button>
        ))}
      </div>
    </div>
  )
}

function LeadModal({ lead, stores, users, onSave, onClose }) {
  const [form, setForm] = useState({
    customer_name: '', phone: '', email: '', store_id: '', assigned_to: '',
    status: 'new', product_interest: '', source: 'walk-in', follow_up_date: '',
    notes: '', lost_reason: '', ...lead
  })
  const [saving, setSaving] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setSaving(true)
    try { await onSave(form); onClose() }
    catch (err) { toast.error(err?.error || 'Failed') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-navy-800 border border-slate-700 rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h2 className="text-base font-semibold text-white">{lead?.id ? 'Edit Lead' : 'New Lead'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>
        <form onSubmit={submit} className="p-5 overflow-y-auto space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-slate-400 mb-1">Name *</label><input className="input" value={form.customer_name} onChange={set('customer_name')} required /></div>
            <div><label className="block text-xs text-slate-400 mb-1">Phone *</label><input className="input" value={form.phone} onChange={set('phone')} required /></div>
            <div><label className="block text-xs text-slate-400 mb-1">Email</label><input className="input" type="email" value={form.email} onChange={set('email')} /></div>
            <div><label className="block text-xs text-slate-400 mb-1">Product Interest</label><input className="input" value={form.product_interest} onChange={set('product_interest')} /></div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Store</label>
              <select className="select" value={form.store_id} onChange={set('store_id')}>
                <option value="">Select</option>
                {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Assigned To</label>
              <select className="select" value={form.assigned_to} onChange={set('assigned_to')}>
                <option value="">Unassigned</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Source</label>
              <select className="select" value={form.source} onChange={set('source')}>
                {['walk-in','online','whatsapp','referral','cold-call'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Status</label>
              <select className="select" value={form.status} onChange={set('status')}>
                {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-slate-400 mb-1">Follow-Up Date</label>
              <input className="input" type="date" value={form.follow_up_date || ''} onChange={set('follow_up_date')} />
            </div>
          </div>
          {form.status === 'lost' && (
            <div><label className="block text-xs text-slate-400 mb-1">Lost Reason</label><input className="input" value={form.lost_reason} onChange={set('lost_reason')} /></div>
          )}
          <div><label className="block text-xs text-slate-400 mb-1">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={set('notes')} /></div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving ? 'Saving…' : 'Save Lead'}</button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Leads() {
  const [leads, setLeads] = useState([])
  const [stores, setStores] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalLead, setModalLead] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get('/leads'),
      api.get('/stores'),
      api.get('/users'),
    ]).then(([l, s, u]) => {
      setLeads(l.data || [])
      setStores(s.data || [])
      setUsers(u.data || [])
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const moveLead = async (id, status) => {
    try {
      await api.patch(`/leads/${id}/status`, { status })
      toast.success(`Moved to ${STAGE_LABELS[status]}`)
      load()
    } catch { toast.error('Failed to move lead') }
  }

  const saveLead = async form => {
    if (form.id) {
      await api.put(`/leads/${form.id}`, form)
      toast.success('Lead updated')
    } else {
      await api.post('/leads', form)
      toast.success('Lead created')
    }
    load()
  }

  const openNew = () => { setModalLead(null); setShowModal(true) }
  const openEdit = lead => { setModalLead(lead); setShowModal(true) }

  const grouped = STAGES.reduce((acc, s) => {
    acc[s] = leads.filter(l => l.status === s)
    return acc
  }, {})

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Leads</h1>
          <p className="text-sm text-slate-400">{leads.length} total leads</p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Lead
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent" /></div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map(stage => (
            <div key={stage} className={`flex-shrink-0 w-64 border-t-2 ${STAGE_COLORS[stage]}`}>
              <div className="bg-navy-800 rounded-b-xl rounded-tr-xl p-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{STAGE_LABELS[stage]}</h3>
                  <span className="text-xs bg-navy-700 text-slate-400 rounded-full px-2 py-0.5">{grouped[stage].length}</span>
                </div>
                <div className="space-y-2">
                  {grouped[stage].map(lead => (
                    <LeadCard key={lead.id} lead={lead} onMove={moveLead} onEdit={openEdit} />
                  ))}
                  {grouped[stage].length === 0 && (
                    <div className="py-6 text-center text-slate-600 text-xs">Empty</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <LeadModal
          lead={modalLead}
          stores={stores}
          users={users}
          onSave={saveLead}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
