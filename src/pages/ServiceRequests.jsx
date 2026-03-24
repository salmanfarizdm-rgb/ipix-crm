import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../lib/api'

const TYPES = ['installation', 'repair', 'replacement']
const STATUSES = ['pending', 'in-progress', 'resolved']

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-navy-800 border border-slate-700 rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

function ServiceForm({ customers, stores, onSave, onClose, initial = {} }) {
  const [form, setForm] = useState({
    customer_id: '', store_id: '', type: 'installation', description: '',
    assigned_technician: '', status: 'pending',
    scheduled_date: '', ...initial
  })
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
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Customer *</label>
          <select className="select" value={form.customer_id} onChange={set('customer_id')} required>
            <option value="">Select</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Store *</label>
          <select className="select" value={form.store_id} onChange={set('store_id')} required>
            <option value="">Select</option>
            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Type</label>
          <select className="select" value={form.type} onChange={set('type')}>
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Status</label>
          <select className="select" value={form.status} onChange={set('status')}>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Technician</label>
          <input className="input" value={form.assigned_technician} onChange={set('assigned_technician')} placeholder="Name" />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Scheduled Date</label>
          <input className="input" type="date" value={form.scheduled_date || ''} onChange={set('scheduled_date')} />
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-slate-400 mb-1">Description *</label>
          <textarea className="input" rows={3} value={form.description} onChange={set('description')} required />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving ? 'Saving…' : 'Save'}</button>
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
      </div>
    </form>
  )
}

export default function ServiceRequests() {
  const [requests, setRequests] = useState([])
  const [customers, setCustomers] = useState([])
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get(`/service${filterStatus ? `?status=${filterStatus}` : ''}`),
      api.get('/customers?limit=200'),
      api.get('/stores'),
    ]).then(([r, c, s]) => {
      setRequests(r.data || [])
      setCustomers(c.data || [])
      setStores(s.data || [])
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filterStatus])

  const save = async form => {
    if (form.id) {
      await api.put(`/service/${form.id}`, form)
      toast.success('Updated')
    } else {
      await api.post('/service', form)
      toast.success('Request created')
    }
    load()
  }

  const statusBadge = s => ({
    pending: 'bg-yellow-500/20 text-yellow-400',
    'in-progress': 'bg-blue-500/20 text-blue-400',
    resolved: 'bg-green-500/20 text-green-400',
  }[s] || 'bg-slate-700 text-slate-300')

  const typeBadge = t => ({
    installation: 'bg-purple-500/20 text-purple-400',
    repair: 'bg-orange-500/20 text-orange-400',
    replacement: 'bg-red-500/20 text-red-400',
  }[t] || 'bg-slate-700 text-slate-300')

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Service Requests</h1>
          <p className="text-sm text-slate-400">{requests.length} requests</p>
        </div>
        <button onClick={() => { setEditing(null); setShowAdd(true) }} className="btn-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Request
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['', ...STATUSES].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${filterStatus === s ? 'bg-orange-500 text-white' : 'bg-navy-700 text-slate-400 hover:text-white'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-slate-400 border-b border-slate-700 bg-navy-700/30">
                <th className="text-left px-5 py-3 font-medium">Customer</th>
                <th className="text-left px-5 py-3 font-medium">Type</th>
                <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">Description</th>
                <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Technician</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Scheduled</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center text-slate-400">Loading…</td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-slate-500">No service requests</td></tr>
              ) : requests.map(r => (
                <tr key={r.id} className="table-row">
                  <td className="px-5 py-3 text-sm text-white">{r.customer_name || '—'}</td>
                  <td className="px-5 py-3"><span className={`badge ${typeBadge(r.type)}`}>{r.type}</span></td>
                  <td className="px-5 py-3 text-sm text-slate-400 hidden sm:table-cell max-w-[200px]"><span className="truncate block">{r.description}</span></td>
                  <td className="px-5 py-3 text-sm text-slate-400 hidden md:table-cell">{r.assigned_technician || '—'}</td>
                  <td className="px-5 py-3"><span className={`badge ${statusBadge(r.status)}`}>{r.status}</span></td>
                  <td className="px-5 py-3 text-xs text-slate-400 hidden md:table-cell">{r.scheduled_date ? new Date(r.scheduled_date).toLocaleDateString('en-IN') : '—'}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => { setEditing(r); setShowAdd(true) }} className="text-xs text-slate-400 hover:text-white">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <Modal title={editing ? 'Edit Request' : 'New Service Request'} onClose={() => { setShowAdd(false); setEditing(null) }}>
          <ServiceForm customers={customers} stores={stores} onSave={save} onClose={() => { setShowAdd(false); setEditing(null) }} initial={editing || {}} />
        </Modal>
      )}
    </div>
  )
}
