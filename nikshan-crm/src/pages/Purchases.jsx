import React, { useEffect, useState } from 'react'
import api from '../lib/api.js'
import { useAuth } from '../store/auth.js'
import { ShoppingBag, Users, ArrowRight, X } from 'lucide-react'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'

const QUICK_PERIODS = [
  { label:'Today', getDates:()=>{ const t=new Date().toISOString().split('T')[0]; return {from:t,to:t} } },
  { label:'This Week', getDates:()=>{ const t=new Date(),f=new Date(t); f.setDate(t.getDate()-7); return {from:f.toISOString().split('T')[0],to:t.toISOString().split('T')[0]} } },
  { label:'This Month', getDates:()=>{ const n=new Date(); return {from:new Date(n.getFullYear(),n.getMonth(),1).toISOString().split('T')[0],to:n.toISOString().split('T')[0]} } },
  { label:'Last Month', getDates:()=>{ const n=new Date(),f=new Date(n.getFullYear(),n.getMonth()-1,1),t=new Date(n.getFullYear(),n.getMonth(),0); return {from:f.toISOString().split('T')[0],to:t.toISOString().split('T')[0]} } },
]

const PAY_TYPES = ['cash','card','upi','emi','exchange']
const PAY_COLORS = { cash:'bg-green-100 text-green-700', card:'bg-blue-100 text-blue-700', upi:'bg-purple-100 text-purple-700', emi:'bg-orange-100 text-orange-700', exchange:'bg-slate-100 text-slate-600' }
const fmt = n => `₹${Number(n).toLocaleString('en-IN')}`
const fmtDate = d => { try { return format(new Date(d), 'dd MMM yyyy') } catch { return d } }

export default function Purchases() {
  const [purchases, setPurchases] = useState([])
  const [stores, setStores] = useState([])
  const [storeFilter, setStoreFilter] = useState('')
  const [payFilter, setPayFilter] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [activePeriod, setActivePeriod] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const applyPeriod = (label, dates) => {
    setActivePeriod(label); setFrom(dates.from); setTo(dates.to); setShowCustom(false)
  }
  const clearDates = () => { setFrom(''); setTo(''); setActivePeriod(''); setShowCustom(false) }

  const load = () => {
    setLoading(true)
    const p = new URLSearchParams()
    if (storeFilter) p.set('store_id', storeFilter)
    if (payFilter) p.set('payment_type', payFilter)
    if (from) p.set('from', from)
    if (to) p.set('to', to)
    api.get(`/purchases?${p}`).then(r => setPurchases(r.data || [])).finally(() => setLoading(false))
    api.get('/stores').then(r => setStores(r.data || []))
  }
  useEffect(load, [storeFilter, payFilter, from, to])

  const total = purchases.reduce((s, p) => s + parseFloat(p.amount || 0), 0)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Purchases</h1>
          <p className="text-sm text-slate-500">{purchases.length} records · Total: {fmt(total)}</p>
        </div>
      </div>

      {/* How to add purchases — info banner */}
      <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex gap-3 items-start">
          <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
            <ShoppingBag size={18} className="text-primary-600"/>
          </div>
          <div>
            <div className="font-semibold text-slate-800 text-sm">Adding a Purchase</div>
            <p className="text-xs text-slate-500 mt-0.5">Purchases are added in two ways to keep records clean and avoid duplicates.</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <Link to="/customers" className="flex items-center gap-2 px-4 py-2 bg-white border border-primary-200 rounded-xl text-sm font-medium text-primary-700 hover:bg-primary-100 transition-colors">
            <Users size={14}/> New Sale <span className="text-xs text-slate-400">(new customer)</span>
            <ArrowRight size={12}/>
          </Link>
          <Link to="/customers" className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            <ShoppingBag size={14}/> Customer Profile <span className="text-xs text-slate-400">(repeat)</span>
            <ArrowRight size={12}/>
          </Link>
        </div>
      </div>

      {/* Date filter + other filters */}
      <div className="card py-3 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {QUICK_PERIODS.map(p => (
            <button key={p.label} onClick={() => applyPeriod(p.label, p.getDates())}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activePeriod===p.label?'bg-primary-600 text-white':'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {p.label}
            </button>
          ))}
          <button onClick={() => setShowCustom(!showCustom)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${showCustom?'bg-primary-600 text-white':'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            Custom
          </button>
          {(from || to) && (
            <button onClick={clearDates} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700">
              <X size={11}/> Clear dates
            </button>
          )}
        </div>
        {showCustom && (
          <div className="flex items-center gap-2 text-xs">
            <label className="text-slate-500">From</label>
            <input type="date" className="input w-32 py-1.5 text-xs" value={from} onChange={e=>{setFrom(e.target.value);setActivePeriod('Custom')}} />
            <label className="text-slate-500">To</label>
            <input type="date" className="input w-32 py-1.5 text-xs" value={to} onChange={e=>{setTo(e.target.value);setActivePeriod('Custom')}} />
          </div>
        )}
        <div className="flex gap-3 flex-wrap">
          <select className="select w-44" value={storeFilter} onChange={e => setStoreFilter(e.target.value)}>
            <option value="">All Stores</option>
            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className="select w-40" value={payFilter} onChange={e => setPayFilter(e.target.value)}>
            <option value="">All Payments</option>
            {PAY_TYPES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {['Customer', 'Product', 'Amount', 'Payment', 'Sold By', 'Store', 'Date'].map(h => (
                <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan="7" className="text-center py-12 text-slate-400">Loading...</td></tr>
              : purchases.length === 0
                ? <tr><td colSpan="7" className="text-center py-12 text-slate-400">No purchases found</td></tr>
                : purchases.map(p => (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {p.nk_customers?.id
                        ? <Link to={`/customers/${p.nk_customers.id}`} className="hover:text-primary-600 hover:underline">{p.nk_customers?.name}</Link>
                        : p.nk_customers?.name}
                      <div className="text-xs text-slate-400">{p.nk_customers?.phone}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {p.product_name}
                      <div className="text-xs text-slate-400">{p.brand}</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{fmt(p.amount)}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PAY_COLORS[p.payment_type] || ''}`}>
                        {p.payment_type?.toUpperCase()}
                      </span>
                      {p.emi_bank && <div className="text-xs text-slate-400 mt-0.5">{p.emi_bank}</div>}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{p.nk_users?.name || '-'}</td>
                    <td className="py-3 px-4 text-slate-500">{p.nk_stores?.name || '-'}</td>
                    <td className="py-3 px-4 text-slate-500 text-xs">{fmtDate(p.purchase_date)}</td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}
