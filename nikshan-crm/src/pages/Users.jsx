import React, { useEffect, useState } from 'react'
import api from '../lib/api.js'
import { useAuth } from '../store/auth.js'
import toast from 'react-hot-toast'
import { Plus, X, Edit2, UserCheck, UserX, Shield, ChevronDown } from 'lucide-react'

const ROLES = ['admin','branch_manager','sales_manager','sales_exec','technician']
const ROLE_LABELS = { admin:'Admin', branch_manager:'Branch Manager', sales_manager:'Sales Manager', sales_exec:'Sales Executive', technician:'Technician' }
const ROLE_COLORS = { admin:'bg-red-100 text-red-700', branch_manager:'bg-purple-100 text-purple-700', sales_manager:'bg-blue-100 text-blue-700', sales_exec:'bg-green-100 text-green-700', technician:'bg-orange-100 text-orange-700' }

function UserModal({ user: editUser, stores, onClose, onSuccess }) {
  const isEdit = !!editUser
  const [form, setForm] = useState(editUser || { name:'', email:'', phone:'', role:'sales_exec', store_id:'', password:'', active:true })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.name || !form.email || !form.role || (!isEdit && !form.password)) return toast.error('Fill all required fields')
    setLoading(true)
    try {
      if (isEdit) {
        const { password, ...rest } = form
        await api.put(`/users/${editUser.id}`, rest)
        toast.success('User updated!')
      } else {
        await api.post('/users', form)
        toast.success('User created! They can now log in.')
      }
      onSuccess()
    } catch (err) { toast.error(err?.error || 'Failed to save user') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Shield size={18} className="text-primary-600"/>{isEdit ? 'Edit User' : 'Add New User'}
          </h2>
          <button onClick={onClose}><X size={20} className="text-slate-400"/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Full Name *</label>
              <input className="input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/>
            </div>
            <div>
              <label className="label">Email * {isEdit && <span className="text-slate-400 font-normal">(login email)</span>}</label>
              <input className="input" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/>
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone||''} onChange={e=>setForm({...form,phone:e.target.value})}/>
            </div>
            <div>
              <label className="label">Role *</label>
              <select className="select" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
                {ROLES.map(r=><option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Store *</label>
              <select className="select" value={form.store_id||''} onChange={e=>setForm({...form,store_id:e.target.value})}>
                <option value="">Select store</option>
                {stores.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            {!isEdit && (
              <div className="col-span-2">
                <label className="label">Temporary Password *</label>
                <input className="input" type="password" placeholder="Min 8 characters" value={form.password||''} onChange={e=>setForm({...form,password:e.target.value})} required/>
                <p className="text-xs text-slate-400 mt-1">User should change this on first login.</p>
              </div>
            )}
            {isEdit && (
              <div className="col-span-2 flex items-center gap-3">
                <label className="text-sm text-slate-700 font-medium">Active</label>
                <button type="button" onClick={()=>setForm({...form,active:!form.active})}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.active?'bg-primary-600':'bg-slate-200'}`}>
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${form.active?'translate-x-6':'translate-x-1'}`}/>
                </button>
                <span className="text-xs text-slate-500">{form.active ? 'Account active' : 'Account deactivated'}</span>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Saving...' : isEdit ? 'Update User' : 'Create User'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Users() {
  const [users, setUsers] = useState([])
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [roleFilter, setRoleFilter] = useState('')
  const { user: me } = useAuth()

  const load = () => {
    setLoading(true)
    Promise.all([api.get('/users'), api.get('/stores')])
      .then(([u, s]) => { setUsers(u.data || []); setStores(s.data || []) })
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const filtered = roleFilter ? users.filter(u => u.role === roleFilter) : users

  const toggleActive = async (u) => {
    await api.put(`/users/${u.id}`, { active: !u.active })
    toast.success(u.active ? 'User deactivated' : 'User activated')
    load()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">User Management</h1>
          <p className="text-sm text-slate-500">{users.length} total users</p>
        </div>
        <button onClick={() => { setEditUser(null); setShowModal(true) }}
          className="btn-primary flex items-center gap-2"><Plus size={16}/> Add User</button>
      </div>

      {/* Role filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {['', ...ROLES].map(r => (
          <button key={r} onClick={() => setRoleFilter(r)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${roleFilter === r ? 'bg-primary-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {r ? ROLE_LABELS[r] : 'All Users'}
            <span className="ml-1.5 text-xs opacity-70">{r ? users.filter(u=>u.role===r).length : users.length}</span>
          </button>
        ))}
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>{['Name','Email','Role','Store','Status','Actions'].map(h =>
              <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-500">{h}</th>
            )}</tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan="6" className="text-center py-12 text-slate-400">Loading...</td></tr>
              : filtered.length === 0
              ? <tr><td colSpan="6" className="text-center py-12 text-slate-400">No users found</td></tr>
              : filtered.map(u => (
                <tr key={u.id} className={`border-b border-slate-50 hover:bg-slate-50 ${!u.active?'opacity-50':''}`}>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold">{u.name?.[0]}</div>
                      <div>
                        <div className="font-semibold text-slate-800">{u.name}</div>
                        {u.phone && <div className="text-xs text-slate-400">{u.phone}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-xs">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[u.role] || 'bg-slate-100 text-slate-600'}`}>
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-xs">{u.nk_stores?.name || '—'}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {u.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setEditUser(u); setShowModal(true) }}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-primary-600" title="Edit">
                        <Edit2 size={13}/>
                      </button>
                      {u.id !== me?.id && (
                        <button onClick={() => toggleActive(u)}
                          className={`p-1.5 hover:bg-slate-100 rounded-lg ${u.active ? 'text-red-400 hover:text-red-600' : 'text-green-500 hover:text-green-700'}`}
                          title={u.active ? 'Deactivate' : 'Activate'}>
                          {u.active ? <UserX size={13}/> : <UserCheck size={13}/>}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {showModal && (
        <UserModal user={editUser} stores={stores}
          onClose={() => { setShowModal(false); setEditUser(null) }}
          onSuccess={() => { setShowModal(false); setEditUser(null); load() }}
        />
      )}
    </div>
  )
}
