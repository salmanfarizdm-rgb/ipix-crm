import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api.js'
import { useAuth } from '../store/auth.js'
import toast from 'react-hot-toast'
import { Plus, Search, X } from 'lucide-react'

const SOURCES = ['walk-in','referral','online','social_media','exhibition','lead']
const TAGS = ['premium','repeat','emi-customer','vip','high-value']

function AddModal({ stores, currentUser, onClose, onSuccess }) {
  const [form, setForm] = useState({ name:'', phone:'', email:'', address:'', store_id: currentUser.store_id || '', source:'walk-in', notes:'', created_by: currentUser.id })
  const [loading, setLoading] = useState(false)
  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true)
    try { await api.post('/customers', form); toast.success('Customer added!'); onSuccess() }
    catch (err) { toast.error(err?.error || 'Failed') } finally { setLoading(false) }
  }
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">Add Customer</h2>
          <button onClick={onClose}><X size={20} className="text-slate-400"/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Name *</label><input className="input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required /></div>
            <div><label className="label">Phone *</label><input className="input" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} required /></div>
            <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} /></div>
            <div><label className="label">Source</label><select className="select" value={form.source} onChange={e=>setForm({...form,source:e.target.value})}>{SOURCES.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
            <div className="col-span-2"><label className="label">Address</label><input className="input" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} /></div>
            <div><label className="label">Store</label>
              <select className="select" value={form.store_id} onChange={e=>setForm({...form,store_id:e.target.value})}>
                <option value="">Select store</option>
                {stores.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div><label className="label">Notes</label><input className="input" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} /></div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">{loading?'Saving...':'Add Customer'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [stores, setStores] = useState([])
  const [search, setSearch] = useState('')
  const [storeFilter, setStoreFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (storeFilter) params.set('store_id', storeFilter)
    if (sourceFilter) params.set('source', sourceFilter)
    api.get(`/customers?${params}`).then(r => setCustomers(r.data || [])).finally(() => setLoading(false))
    api.get('/stores').then(r => setStores(r.data || []))
  }

  useEffect(load, [search, storeFilter, sourceFilter])

  const SOURCE_COLORS = { 'walk-in':'bg-blue-100 text-blue-700', referral:'bg-green-100 text-green-700', online:'bg-purple-100 text-purple-700', lead:'bg-orange-100 text-orange-700', default:'bg-slate-100 text-slate-600' }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Customers</h1>
          <p className="text-sm text-slate-500">{customers.length} total customers</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2"><Plus size={16}/> Add Customer</button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input className="input pl-9 w-56" placeholder="Search name or phone..." value={search} onChange={e=>setSearch(e.target.value)} /></div>
        <select className="select w-48" value={storeFilter} onChange={e=>setStoreFilter(e.target.value)}>
          <option value="">All Stores</option>
          {stores.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="select w-44" value={sourceFilter} onChange={e=>setSourceFilter(e.target.value)}>
          <option value="">All Sources</option>
          {SOURCES.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>{['Name','Phone','Store','Source','Tags','Added By','Action'].map(h=><th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-500">{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="text-center py-12 text-slate-400">Loading...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan="7" className="text-center py-12 text-slate-400">No customers found</td></tr>
            ) : customers.map(c => (
              <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="py-3 px-4 font-semibold text-slate-800">{c.name}</td>
                <td className="py-3 px-4 text-slate-600">{c.phone}</td>
                <td className="py-3 px-4 text-slate-500">{c.nk_stores?.name || '-'}</td>
                <td className="py-3 px-4"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SOURCE_COLORS[c.source] || SOURCE_COLORS.default}`}>{c.source}</span></td>
                <td className="py-3 px-4">{(c.tags||[]).map(t=><span key={t} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full mr-1">{t}</span>)}</td>
                <td className="py-3 px-4 text-slate-400 text-xs">{c['nk_users']?.name || '-'}</td>
                <td className="py-3 px-4"><Link to={`/customers/${c.id}`} className="text-primary-600 hover:underline text-xs font-medium">View →</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && <AddModal stores={stores} currentUser={user} onClose={() => setShowAdd(false)} onSuccess={() => { setShowAdd(false); load() }} />}
    </div>
  )
}
