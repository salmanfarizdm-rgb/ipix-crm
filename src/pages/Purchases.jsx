import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../lib/api'

const CATEGORIES = ['TV', 'Refrigerator', 'Washing Machine', 'AC', 'Mobile', 'Laptop', 'Audio', 'Kitchen Appliance', 'Other']
const PAYMENT_TYPES = ['cash', 'card', 'emi', 'online']

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

function PurchaseForm({ customers, stores, onSave, onClose }) {
  const [form, setForm] = useState({
    customer_id: '', store_id: '', product_name: '', brand: '', category: 'TV',
    amount: '', payment_type: 'cash', purchase_date: new Date().toISOString().split('T')[0],
    invoice_number: ''
  })
  const [emi, setEmi] = useState({ bank_name: '', tenure_months: 6, emi_amount: '', start_date: new Date().toISOString().split('T')[0] })
  const [saving, setSaving] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const setE = k => e => setEmi(f => ({ ...f, [k]: e.target.value }))

  const submit = async e => {
    e.preventDefault(); setSaving(true)
    try {
      await onSave(form, form.payment_type === 'emi' ? emi : null)
      onClose()
    } catch (err) { toast.error(err?.error || 'Failed') }
    finally { setSaving(false) }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Customer *</label>
          <select className="select" value={form.customer_id} onChange={set('customer_id')} required>
            <option value="">Select customer</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Store *</label>
          <select className="select" value={form.store_id} onChange={set('store_id')} required>
            <option value="">Select store</option>
            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Product Name *</label>
          <input className="input" value={form.product_name} onChange={set('product_name')} required />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Brand</label>
          <input className="input" value={form.brand} onChange={set('brand')} placeholder="Samsung, LG…" />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Category</label>
          <select className="select" value={form.category} onChange={set('category')}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Amount (₹) *</label>
          <input className="input" type="number" value={form.amount} onChange={set('amount')} required />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Payment Type *</label>
          <select className="select" value={form.payment_type} onChange={set('payment_type')}>
            {PAYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Purchase Date</label>
          <input className="input" type="date" value={form.purchase_date} onChange={set('purchase_date')} />
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-slate-400 mb-1">Invoice Number</label>
          <input className="input" value={form.invoice_number} onChange={set('invoice_number')} />
        </div>
      </div>

      {form.payment_type === 'emi' && (
        <div className="border border-blue-500/30 rounded-lg p-3 bg-blue-500/5 space-y-3">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">EMI Details</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Bank Name *</label>
              <input className="input" value={emi.bank_name} onChange={setE('bank_name')} required />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Tenure (months)</label>
              <select className="select" value={emi.tenure_months} onChange={setE('tenure_months')}>
                {[3,6,9,12,18,24,36].map(n => <option key={n} value={n}>{n} months</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">EMI Amount/mo (₹)</label>
              <input className="input" type="number" value={emi.emi_amount} onChange={setE('emi_amount')} required />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Start Date</label>
              <input className="input" type="date" value={emi.start_date} onChange={setE('start_date')} />
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving ? 'Saving…' : 'Log Purchase'}</button>
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
      </div>
    </form>
  )
}

export default function Purchases() {
  const [purchases, setPurchases] = useState([])
  const [customers, setCustomers] = useState([])
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get(`/purchases${search ? `?search=${search}` : ''}`),
      api.get('/customers?limit=200'),
      api.get('/stores'),
    ]).then(([p, c, s]) => {
      setPurchases(p.data || [])
      setCustomers(c.data || [])
      setStores(s.data || [])
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [search])

  const savePurchase = async (form, emiData) => {
    const res = await api.post('/purchases', form)
    if (emiData) {
      await api.post('/emi', { ...emiData, purchase_id: res.data.id, customer_id: form.customer_id, status: 'active' })
    }
    toast.success('Purchase logged')
    load()
  }

  const paymentBadge = t => ({
    cash: 'bg-green-500/20 text-green-400',
    card: 'bg-blue-500/20 text-blue-400',
    emi: 'bg-purple-500/20 text-purple-400',
    online: 'bg-yellow-500/20 text-yellow-400',
  }[t] || 'bg-slate-700 text-slate-300')

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Purchases</h1>
          <p className="text-sm text-slate-400">{purchases.length} records</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Log Purchase
        </button>
      </div>

      <input className="input max-w-xs" placeholder="Search product, customer…" value={search} onChange={e => setSearch(e.target.value)} />

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-slate-400 border-b border-slate-700 bg-navy-700/30">
                <th className="text-left px-5 py-3 font-medium">Customer</th>
                <th className="text-left px-5 py-3 font-medium">Product</th>
                <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">Category</th>
                <th className="text-left px-5 py-3 font-medium">Amount</th>
                <th className="text-left px-5 py-3 font-medium">Payment</th>
                <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Date</th>
                <th className="text-left px-5 py-3 font-medium hidden lg:table-cell">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center text-slate-400">Loading…</td></tr>
              ) : purchases.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-slate-500">No purchases found</td></tr>
              ) : purchases.map(p => (
                <tr key={p.id} className="table-row">
                  <td className="px-5 py-3 text-sm text-white">{p.customer_name || '—'}</td>
                  <td className="px-5 py-3">
                    <p className="text-sm text-white">{p.product_name}</p>
                    <p className="text-xs text-slate-400">{p.brand}</p>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-400 hidden sm:table-cell">{p.category}</td>
                  <td className="px-5 py-3 text-sm font-medium text-orange-400">₹{Number(p.amount).toLocaleString()}</td>
                  <td className="px-5 py-3"><span className={`badge ${paymentBadge(p.payment_type)}`}>{p.payment_type}</span></td>
                  <td className="px-5 py-3 text-xs text-slate-400 hidden md:table-cell">{new Date(p.purchase_date).toLocaleDateString('en-IN')}</td>
                  <td className="px-5 py-3 text-xs text-slate-400 hidden lg:table-cell">{p.invoice_number || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <Modal title="Log Purchase" onClose={() => setShowAdd(false)}>
          <PurchaseForm customers={customers} stores={stores} onSave={savePurchase} onClose={() => setShowAdd(false)} />
        </Modal>
      )}
    </div>
  )
}
