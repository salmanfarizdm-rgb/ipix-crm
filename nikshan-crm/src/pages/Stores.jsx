import React, { useEffect, useState } from 'react'
import api from '../lib/api.js'
import { useAuth } from '../store/auth.js'
import toast from 'react-hot-toast'
import { Plus, X, Store, MapPin, Phone, Mail, Edit2, Trash2 } from 'lucide-react'

function StoreModal({ store, onClose, onSuccess }) {
  const isEdit = !!store
  const [form, setForm] = useState({
    name:     store?.name     || '',
    location: store?.location || '',
    address:  store?.address  || '',
    phone:    store?.phone    || '',
    email:    store?.email    || '',
    gstin:    store?.gstin    || '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true)
    try {
      if (isEdit) { await api.put(`/stores/${store.id}`, form) }
      else         { await api.post('/stores', form) }
      toast.success(isEdit ? 'Store updated!' : 'Store added!')
      onSuccess()
    } catch (err) { toast.error(err?.response?.data?.error || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">{isEdit ? 'Edit Store' : 'Add New Store'}</h2>
          <button onClick={onClose}><X size={20} className="text-slate-400"/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Store Name *</label>
            <input className="input" placeholder="e.g. Nikshan Kannur Main" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">City / Location</label>
              <input className="input" placeholder="e.g. Kannur" value={form.location} onChange={e=>setForm({...form,location:e.target.value})} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" placeholder="Store phone number" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} />
            </div>
          </div>
          <div>
            <label className="label">Full Address</label>
            <input className="input" placeholder="Street, Area, District" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" placeholder="store@nikshan.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
          </div>
          <div>
            <label className="label">GSTIN <span className="text-slate-400 text-xs">(optional)</span></label>
            <input
              className="input"
              placeholder="e.g. 32AAAAA0000A1Z5"
              value={form.gstin || ''}
              onChange={e => setForm({...form, gstin: e.target.value.toUpperCase()})}
              maxLength={15}
            />
            <p className="text-xs text-slate-400 mt-1">15-character GST Identification Number. Printed on invoices.</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Saving...' : isEdit ? 'Update Store' : 'Add Store'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Stores() {
  const [stores, setStores]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]     = useState(null)
  const { user } = useAuth()

  const isAdmin = ['admin', 'branch_manager'].includes(user?.role)

  const load = () => {
    setLoading(true)
    api.get('/stores').then(r => setStores(r.data || [])).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Deactivate store "${name}"?`)) return
    try {
      await api.delete(`/stores/${id}`)
      toast.success('Store deactivated')
      load()
    } catch { toast.error('Failed') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Stores</h1>
          <p className="text-sm text-slate-500">{stores.length} stores configured</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16}/> Add Store
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stores.map(s => (
            <div key={s.id} className="card space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700">
                    <Store size={20}/>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{s.name}</div>
                    <div className="text-xs text-slate-500">{s.location || 'No city set'}</div>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-1">
                    <button onClick={() => setEditing(s)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"><Edit2 size={14}/></button>
                    <button onClick={() => handleDelete(s.id, s.name)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400"><Trash2 size={14}/></button>
                  </div>
                )}
              </div>
              <div className="space-y-1.5 text-sm">
                {s.address && <div className="flex items-center gap-2 text-slate-500"><MapPin size={13}/>{s.address}</div>}
                {s.phone   && <div className="flex items-center gap-2 text-slate-500"><Phone size={13}/>{s.phone}</div>}
                {s.email   && <div className="flex items-center gap-2 text-slate-500"><Mail size={13}/>{s.email}</div>}
                {s.gstin   && (
                  <div className="flex items-center gap-2 text-xs text-primary-700 font-medium bg-primary-50 px-2 py-1 rounded-lg">
                    GSTIN: {s.gstin}
                  </div>
                )}
                {s.nk_users?.name && <div className="text-xs text-primary-600 font-medium">Manager: {s.nk_users.name}</div>}
              </div>
              <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.active !== false ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                {s.active !== false ? 'Active' : 'Inactive'}
              </div>
            </div>
          ))}
        </div>
      )}

      {(showModal) && <StoreModal onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); load() }} />}
      {editing    && <StoreModal store={editing} onClose={() => setEditing(null)} onSuccess={() => { setEditing(null); load() }} />}
    </div>
  )
}
