import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../lib/api'

const SOURCES = ['walk-in', 'online', 'whatsapp', 'referral']
const TAGS = ['VIP', 'EMI', 'regular']

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

function CustomerForm({ initial = {}, onSave, onClose, stores = [] }) {
  const [form, setForm] = useState({
    name: '', phone: '', email: '', store_id: '', source: 'walk-in', tags: 'regular', notes: '',
    ...initial
  })
  const [saving, setSaving] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave(form)
      onClose()
    } catch (err) {
      toast.error(err?.error || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Name *</label>
          <input className="input" value={form.name} onChange={set('name')} required />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Phone *</label>
          <input className="input" value={form.phone} onChange={set('phone')} required />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Email</label>
          <input className="input" type="email" value={form.email} onChange={set('email')} />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Store</label>
          <select className="select" value={form.store_id} onChange={set('store_id')}>
            <option value="">Select store</option>
            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Source</label>
          <select className="select" value={form.source} onChange={set('source')}>
            {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Tag</label>
          <select className="select" value={form.tags} onChange={set('tags')}>
            {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs text-slate-400 mb-1">Notes</label>
        <textarea className="input" rows={3} value={form.notes} onChange={set('notes')} />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
          {saving ? 'Saving…' : 'Save Customer'}
        </button>
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
      </div>
    </form>
  )
}

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStore, setFilterStore] = useState('')
  const [filterTag, setFilterTag] = useState('')
  const [filterSource, setFilterSource] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (filterStore) params.set('store_id', filterStore)
    if (filterTag) params.set('tags', filterTag)
    if (filterSource) params.set('source', filterSource)
    Promise.all([
      api.get(`/customers?${params}`),
      api.get('/stores')
    ]).then(([c, s]) => {
      setCustomers(c.data || [])
      setStores(s.data || [])
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [search, filterStore, filterTag, filterSource])

  const addCustomer = async form => {
    await api.post('/customers', form)
    toast.success('Customer added')
    load()
  }

  const tagColor = t => t === 'VIP' ? 'bg-yellow-500/20 text-yellow-400' : t === 'EMI' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-300'

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Customers</h1>
          <p className="text-sm text-slate-400">{customers.length} total</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Customer
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          className="input max-w-xs"
          placeholder="Search name, phone, email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="select max-w-[150px]" value={filterStore} onChange={e => setFilterStore(e.target.value)}>
          <option value="">All Stores</option>
          {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="select max-w-[130px]" value={filterTag} onChange={e => setFilterTag(e.target.value)}>
          <option value="">All Tags</option>
          {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="select max-w-[140px]" value={filterSource} onChange={e => setFilterSource(e.target.value)}>
          <option value="">All Sources</option>
          {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-slate-400 border-b border-slate-700 bg-navy-700/30">
                <th className="text-left px-5 py-3 font-medium">Name</th>
                <th className="text-left px-5 py-3 font-medium">Phone</th>
                <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">Email</th>
                <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Store</th>
                <th className="text-left px-5 py-3 font-medium">Source</th>
                <th className="text-left px-5 py-3 font-medium">Tag</th>
                <th className="text-left px-5 py-3 font-medium">Added</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center text-slate-400">Loading…</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-slate-500">No customers found</td></tr>
              ) : customers.map(c => (
                <tr key={c.id} className="table-row">
                  <td className="px-5 py-3">
                    <Link to={`/customers/${c.id}`} className="text-sm text-white hover:text-orange-400 font-medium">{c.name}</Link>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-300">{c.phone}</td>
                  <td className="px-5 py-3 text-sm text-slate-400 hidden sm:table-cell">{c.email || '—'}</td>
                  <td className="px-5 py-3 text-sm text-slate-400 hidden md:table-cell">{c.store_name || '—'}</td>
                  <td className="px-5 py-3 text-sm text-slate-400 capitalize">{c.source}</td>
                  <td className="px-5 py-3">
                    <span className={`badge ${tagColor(c.tags)}`}>{c.tags}</span>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500">{new Date(c.created_at).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <Modal title="Add Customer" onClose={() => setShowAdd(false)}>
          <CustomerForm stores={stores} onSave={addCustomer} onClose={() => setShowAdd(false)} />
        </Modal>
      )}
    </div>
  )
}
