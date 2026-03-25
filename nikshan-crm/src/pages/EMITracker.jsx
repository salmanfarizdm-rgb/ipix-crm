import React, { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../lib/api.js'
import toast from 'react-hot-toast'
import { CreditCard, TrendingUp, Building } from 'lucide-react'

const fmt = n => `₹${Number(n).toLocaleString('en-IN')}`

export default function EMITracker() {
  const [records, setRecords] = useState([])
  const [bankFilter, setBankFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    const p = new URLSearchParams()
    if (bankFilter) p.set('bank_name', bankFilter)
    if (statusFilter) p.set('status', statusFilter)
    api.get(`/emi?${p}`).then(r => setRecords(r.data||[])).finally(()=>setLoading(false))
  }
  useEffect(load, [bankFilter, statusFilter])

  const active = records.filter(r=>r.status==='active')
  const totalMonthly = active.reduce((s,r)=>s+parseFloat(r.monthly_emi||0),0)
  const banks = [...new Set(records.map(r=>r.bank_name))]
  const bankData = banks.map(b=>({ name:b, count: records.filter(r=>r.bank_name===b).length, amount: records.filter(r=>r.bank_name===b).reduce((s,r)=>s+parseFloat(r.monthly_emi||0),0) }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">EMI Tracker</h1>
        <p className="text-sm text-slate-500">Bank-wise EMI overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center"><CreditCard size={22} className="text-blue-600"/></div>
          <div><div className="text-2xl font-bold text-slate-900">{active.length}</div><div className="text-sm text-slate-500">Active EMIs</div></div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center"><TrendingUp size={22} className="text-green-600"/></div>
          <div><div className="text-2xl font-bold text-slate-900">{fmt(totalMonthly)}</div><div className="text-sm text-slate-500">Monthly Collection</div></div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center"><Building size={22} className="text-purple-600"/></div>
          <div><div className="text-2xl font-bold text-slate-900">{banks.length}</div><div className="text-sm text-slate-500">Partner Banks</div></div>
        </div>
      </div>

      {/* Bank chart */}
      {bankData.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4">EMI by Bank</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bankData} barSize={36}>
                <XAxis dataKey="name" tick={{fontSize:11}} />
                <YAxis tick={{fontSize:11}} />
                <Tooltip formatter={(v,n)=>[n==='count'?`${v} EMIs`:fmt(v), n==='count'?'Count':'Monthly']} />
                <Bar dataKey="count" fill="#2563eb" radius={[4,4,0,0]} name="count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select className="select w-48" value={bankFilter} onChange={e=>setBankFilter(e.target.value)}>
          <option value="">All Banks</option>
          {banks.map(b=><option key={b} value={b}>{b}</option>)}
        </select>
        <select className="select w-40" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
          <option value="defaulted">Defaulted</option>
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>{['Customer','Bank','Product','Loan Amount','Monthly EMI','Tenure','Start Date','Status'].map(h=><th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-500">{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="8" className="text-center py-12 text-slate-400">Loading...</td></tr>
            : records.length===0 ? <tr><td colSpan="8" className="text-center py-12 text-slate-400">No EMI records</td></tr>
            : records.map(r => (
              <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="py-3 px-4 font-semibold text-slate-800">{r.nk_customers?.name}<div className="text-xs text-slate-400">{r.nk_customers?.phone}</div></td>
                <td className="py-3 px-4"><span className="font-medium text-slate-700">{r.bank_name}</span></td>
                <td className="py-3 px-4 text-slate-600 text-xs">{r.nk_purchases?.product_name||'-'}</td>
                <td className="py-3 px-4 font-medium text-slate-800">{fmt(r.loan_amount)}</td>
                <td className="py-3 px-4 font-bold text-primary-700">{fmt(r.monthly_emi)}</td>
                <td className="py-3 px-4 text-slate-500">{r.tenure_months} mo</td>
                <td className="py-3 px-4 text-slate-500 text-xs">{r.start_date}</td>
                <td className="py-3 px-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.status==='active'?'bg-green-100 text-green-700':r.status==='closed'?'bg-slate-100 text-slate-600':'bg-red-100 text-red-700'}`}>{r.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
