import React, { useEffect, useState } from 'react'
import api from '../lib/api.js'
import { useAuth } from '../store/auth.js'
import toast from 'react-hot-toast'
import { Plus, X, Search } from 'lucide-react'
import { format } from 'date-fns'

const PAY_TYPES = ['cash','card','upi','emi','exchange']
const PAY_COLORS = { cash:'bg-green-100 text-green-700', card:'bg-blue-100 text-blue-700', upi:'bg-purple-100 text-purple-700', emi:'bg-orange-100 text-orange-700', exchange:'bg-slate-100 text-slate-600' }
const BANKS = ['HDFC Bank','SBI','ICICI Bank','AXIS Bank','Bajaj Finserv','TVS Credit','HomeCredit','Muthoot Finance','Kotak Mahindra Bank']
const fmt = n => `₹${Number(n).toLocaleString('en-IN')}`
const fmtDate = d => { try { return format(new Date(d), 'dd MMM yyyy') } catch { return d } }

function AddModal({ customers, stores, users, currentUser, onClose, onSuccess }) {
  const [form, setForm] = useState({ customer_id:'', store_id: currentUser.store_id||'', sold_by: currentUser.id, product_name:'', brand:'', model:'', amount:'', payment_type:'cash', emi_bank:'', purchase_date: new Date().toISOString().split('T')[0] })
  const [emiForm, setEmiForm] = useState({ loan_amount:'', monthly_emi:'', tenure_months:'12', start_date: new Date().toISOString().split('T')[0] })
  const [loading, setLoading] = useState(false)
  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true)
    try {
      const res = await api.post('/purchases', { ...form, amount: parseFloat(form.amount) })
      if (form.payment_type === 'emi') {
        await api.post('/emi', { purchase_id: res.data.id, customer_id: form.customer_id, bank_name: form.emi_bank, loan_amount: parseFloat(emiForm.loan_amount||form.amount), monthly_emi: parseFloat(emiForm.monthly_emi), tenure_months: parseInt(emiForm.tenure_months), start_date: emiForm.start_date, status:'active' })
      }
      toast.success('Purchase added!'); onSuccess()
    } catch (err) { toast.error(err?.error||'Failed') } finally { setLoading(false) }
  }
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">Add Purchase</h2>
          <button onClick={onClose}><X size={20} className="text-slate-400"/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-3">
          <div><label className="label">Customer *</label>
            <select className="select" value={form.customer_id} onChange={e=>setForm({...form,customer_id:e.target.value})} required>
              <option value="">Select customer</option>
              {customers.map(c=><option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Product *</label><input className="input" value={form.product_name} onChange={e=>setForm({...form,product_name:e.target.value})} required /></div>
            <div><label className="label">Brand</label><input className="input" value={form.brand} onChange={e=>setForm({...form,brand:e.target.value})} /></div>
            <div><label className="label">Amount (₹) *</label><input className="input" type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} required /></div>
            <div><label className="label">Payment Type</label>
              <select className="select" value={form.payment_type} onChange={e=>setForm({...form,payment_type:e.target.value})}>
                {PAY_TYPES.map(t=><option key={t} value={t}>{t.toUpperCase()}</option>)}
              </select>
            </div>
            <div><label className="label">Date</label><input className="input" type="date" value={form.purchase_date} onChange={e=>setForm({...form,purchase_date:e.target.value})} /></div>
            <div><label className="label">Sold By</label>
              <select className="select" value={form.sold_by} onChange={e=>setForm({...form,sold_by:e.target.value})}>
                {users.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>
          {form.payment_type === 'emi' && (
            <div className="bg-orange-50 rounded-xl p-4 space-y-3">
              <div className="text-sm font-semibold text-orange-800">EMI Details</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><label className="label">Bank *</label>
                  <select className="select" value={form.emi_bank} onChange={e=>setForm({...form,emi_bank:e.target.value})} required>
                    <option value="">Select Bank</option>
                    {BANKS.map(b=><option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div><label className="label">Monthly EMI (₹)</label><input className="input" type="number" value={emiForm.monthly_emi} onChange={e=>setEmiForm({...emiForm,monthly_emi:e.target.value})} /></div>
                <div><label className="label">Tenure (months)</label>
                  <select className="select" value={emiForm.tenure_months} onChange={e=>setEmiForm({...emiForm,tenure_months:e.target.value})}>
                    {[3,6,9,12,18,24,36].map(m=><option key={m} value={m}>{m} months</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">{loading?'Saving...':'Add Purchase'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Purchases() {
  const [purchases, setPurchases] = useState([])
  const [customers, setCustomers] = useState([])
  const [stores, setStores] = useState([])
  const [users, setUsers] = useState([])
  const [storeFilter, setStoreFilter] = useState('')
  const [payFilter, setPayFilter] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const load = () => {
    setLoading(true)
    const p = new URLSearchParams()
    if (storeFilter) p.set('store_id', storeFilter)
    if (payFilter) p.set('payment_type', payFilter)
    api.get(`/purchases?${p}`).then(r => setPurchases(r.data||[])).finally(()=>setLoading(false))
    api.get('/customers').then(r => setCustomers(r.data||[]))
    api.get('/stores').then(r => setStores(r.data||[]))
    api.get('/users').then(r => setUsers(r.data||[]))
  }
  useEffect(load, [storeFilter, payFilter])

  const total = purchases.reduce((s,p)=>s+parseFloat(p.amount||0),0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-slate-900">Purchases</h1><p className="text-sm text-slate-500">{purchases.length} records · Total: {fmt(total)}</p></div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2"><Plus size={16}/> Add Purchase</button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <select className="select w-48" value={storeFilter} onChange={e=>setStoreFilter(e.target.value)}>
          <option value="">All Stores</option>
          {stores.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="select w-44" value={payFilter} onChange={e=>setPayFilter(e.target.value)}>
          <option value="">All Payment Types</option>
          {PAY_TYPES.map(t=><option key={t} value={t}>{t.toUpperCase()}</option>)}
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>{['Customer','Product','Amount','Payment','Sold By','Store','Date'].map(h=><th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-500">{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="7" className="text-center py-12 text-slate-400">Loading...</td></tr>
            : purchases.length===0 ? <tr><td colSpan="7" className="text-center py-12 text-slate-400">No purchases found</td></tr>
            : purchases.map(p => (
              <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="py-3 px-4 font-semibold text-slate-800">{p.nk_customers?.name}<div className="text-xs text-slate-400">{p.nk_customers?.phone}</div></td>
                <td className="py-3 px-4 text-slate-700">{p.product_name}<div className="text-xs text-slate-400">{p.brand}</div></td>
                <td className="py-3 px-4 font-bold text-slate-900">{fmt(p.amount)}</td>
                <td className="py-3 px-4"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PAY_COLORS[p.payment_type]||''}`}>{p.payment_type?.toUpperCase()}</span>{p.emi_bank && <div className="text-xs text-slate-400 mt-0.5">{p.emi_bank}</div>}</td>
                <td className="py-3 px-4 text-slate-600">{p.nk_users?.name||'-'}</td>
                <td className="py-3 px-4 text-slate-500">{p.nk_stores?.name||'-'}</td>
                <td className="py-3 px-4 text-slate-500 text-xs">{fmtDate(p.purchase_date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showAdd && <AddModal customers={customers} stores={stores} users={users} currentUser={user} onClose={()=>setShowAdd(false)} onSuccess={()=>{setShowAdd(false);load()}} />}
    </div>
  )
}
