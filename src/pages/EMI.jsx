import React, { useEffect, useState } from 'react'
import { differenceInMonths, parseISO, addMonths, isBefore } from 'date-fns'
import api from '../lib/api'

function isOverdue(emi) {
  if (emi.status !== 'active') return false
  try {
    const endDate = addMonths(parseISO(emi.start_date), emi.tenure_months)
    return isBefore(endDate, new Date())
  } catch { return false }
}

export default function EMI() {
  const [emis, setEmis] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    api.get('/emi').then(r => setEmis(r.data || [])).finally(() => setLoading(false))
  }, [])

  const filtered = emis.filter(e => {
    if (filter === 'active') return e.status === 'active'
    if (filter === 'overdue') return isOverdue(e)
    if (filter === 'completed') return e.status === 'completed'
    if (filter === 'defaulted') return e.status === 'defaulted'
    return true
  })

  const statusBadge = e => {
    if (isOverdue(e)) return 'bg-red-500/20 text-red-400'
    return { active: 'bg-green-500/20 text-green-400', completed: 'bg-blue-500/20 text-blue-400', defaulted: 'bg-red-500/20 text-red-400' }[e.status] || 'bg-slate-700 text-slate-300'
  }

  const statusLabel = e => isOverdue(e) ? 'Overdue' : e.status

  const totalActive = emis.filter(e => e.status === 'active').length
  const totalOverdue = emis.filter(isOverdue).length
  const totalMonthly = emis.filter(e => e.status === 'active').reduce((s, e) => s + Number(e.emi_amount || 0), 0)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">EMI Tracker</h1>
        <p className="text-sm text-slate-400">Monitor all EMI accounts</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="text-xs text-slate-400">Active EMIs</p>
          <p className="text-2xl font-bold text-green-400">{totalActive}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-slate-400">Overdue</p>
          <p className="text-2xl font-bold text-red-400">{totalOverdue}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-slate-400">Monthly Collection</p>
          <p className="text-2xl font-bold text-orange-500">₹{totalMonthly.toLocaleString()}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all','active','overdue','completed','defaulted'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${filter === f ? 'bg-orange-500 text-white' : 'bg-navy-700 text-slate-400 hover:text-white'}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-slate-400 border-b border-slate-700 bg-navy-700/30">
                <th className="text-left px-5 py-3 font-medium">Customer</th>
                <th className="text-left px-5 py-3 font-medium">Bank</th>
                <th className="text-left px-5 py-3 font-medium">EMI/mo</th>
                <th className="text-left px-5 py-3 font-medium">Tenure</th>
                <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Start Date</th>
                <th className="text-left px-5 py-3 font-medium hidden md:table-cell">End Date</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center text-slate-400">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-slate-500">No EMI records found</td></tr>
              ) : filtered.map(e => {
                const endDate = (() => { try { return addMonths(parseISO(e.start_date), e.tenure_months) } catch { return null } })()
                return (
                  <tr key={e.id} className={`table-row ${isOverdue(e) ? 'bg-red-500/5' : ''}`}>
                    <td className="px-5 py-3 text-sm text-white">{e.customer_name || '—'}</td>
                    <td className="px-5 py-3 text-sm text-slate-300">{e.bank_name}</td>
                    <td className="px-5 py-3 text-sm font-medium text-orange-400">₹{Number(e.emi_amount).toLocaleString()}</td>
                    <td className="px-5 py-3 text-sm text-slate-400">{e.tenure_months} months</td>
                    <td className="px-5 py-3 text-xs text-slate-400 hidden md:table-cell">{e.start_date ? new Date(e.start_date).toLocaleDateString('en-IN') : '—'}</td>
                    <td className="px-5 py-3 text-xs text-slate-400 hidden md:table-cell">{endDate ? endDate.toLocaleDateString('en-IN') : '—'}</td>
                    <td className="px-5 py-3"><span className={`badge ${statusBadge(e)}`}>{statusLabel(e)}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
