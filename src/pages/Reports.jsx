import React, { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import api from '../lib/api'
import useAuthStore from '../store/auth'

function exportCSV(data, filename) {
  if (!data.length) return
  const keys = Object.keys(data[0])
  const rows = [keys.join(','), ...data.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))]
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export default function Reports() {
  const { isAdmin } = useAuthStore()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]
  })
  const [to, setTo] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    setLoading(true)
    api.get(`/reports/summary?from=${from}&to=${to}`)
      .then(r => setStats(r.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [from, to])

  if (!isAdmin()) return (
    <div className="flex items-center justify-center h-64 flex-col gap-3">
      <p className="text-4xl">🔒</p>
      <p className="text-slate-400">Reports are accessible to Admins only.</p>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Reports</h1>
          <p className="text-sm text-slate-400">Analytics & performance summary</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="date" className="input max-w-[140px]" value={from} onChange={e => setFrom(e.target.value)} />
          <span className="text-slate-400 text-sm">to</span>
          <input type="date" className="input max-w-[140px]" value={to} onChange={e => setTo(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent" /></div>
      ) : !stats ? (
        <div className="card text-center py-10 text-slate-500">No data available for selected period</div>
      ) : (
        <div className="space-y-6">
          {/* KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="stat-card">
              <p className="text-xs text-slate-400">Total Leads</p>
              <p className="text-2xl font-bold text-white">{stats.totalLeads ?? 0}</p>
            </div>
            <div className="stat-card">
              <p className="text-xs text-slate-400">Conversions (Won)</p>
              <p className="text-2xl font-bold text-green-400">{stats.wonLeads ?? 0}</p>
              <p className="text-xs text-slate-500">{stats.totalLeads ? Math.round((stats.wonLeads / stats.totalLeads) * 100) : 0}% rate</p>
            </div>
            <div className="stat-card">
              <p className="text-xs text-slate-400">Total Sales</p>
              <p className="text-2xl font-bold text-orange-500">₹{Number(stats.totalSales ?? 0).toLocaleString()}</p>
            </div>
            <div className="stat-card">
              <p className="text-xs text-slate-400">Active EMIs</p>
              <p className="text-2xl font-bold text-blue-400">{stats.activeEMIs ?? 0}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Store-wise performance */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white">Store Performance</h2>
                <button onClick={() => exportCSV(stats.storePerformance || [], 'store-performance.csv')} className="btn-secondary text-xs py-1">Export CSV</button>
              </div>
              {(stats.storePerformance || []).length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stats.storePerformance} margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="store" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#1a2236', border: '1px solid #334155', borderRadius: 8 }} formatter={v => [`₹${v.toLocaleString()}`, 'Sales']} />
                    <Bar dataKey="sales" radius={[4, 4, 0, 0]}>
                      {(stats.storePerformance || []).map((_, i) => <Cell key={i} fill={['#F97316','#3b82f6','#22c55e','#a855f7'][i % 4]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-slate-500 text-sm py-8 text-center">No store data</p>}
            </div>

            {/* Top products */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white">Top 5 Products Sold</h2>
                <button onClick={() => exportCSV(stats.topProducts || [], 'top-products.csv')} className="btn-secondary text-xs py-1">Export CSV</button>
              </div>
              <div className="space-y-2">
                {(stats.topProducts || []).length === 0 ? <p className="text-slate-500 text-sm py-6 text-center">No data</p> : (stats.topProducts || []).map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-5">{i + 1}.</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-white">{p.product_name}</span>
                        <span className="text-slate-400">{p.count}x</span>
                      </div>
                      <div className="h-1.5 bg-navy-700 rounded-full">
                        <div className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.min(100, (p.count / (stats.topProducts[0]?.count || 1)) * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Store table */}
          {(stats.storePerformance || []).length > 0 && (
            <div className="card">
              <h2 className="text-sm font-semibold text-white mb-4">Store-wise Performance Table</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-400 border-b border-slate-700">
                      <th className="text-left pb-2 font-medium">Store</th>
                      <th className="text-left pb-2 font-medium">Leads</th>
                      <th className="text-left pb-2 font-medium">Won</th>
                      <th className="text-left pb-2 font-medium">Sales</th>
                      <th className="text-left pb-2 font-medium">Conversion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.storePerformance.map((s, i) => (
                      <tr key={i} className="table-row">
                        <td className="py-2.5 pr-4 text-white">{s.store}</td>
                        <td className="py-2.5 pr-4 text-slate-300">{s.leads}</td>
                        <td className="py-2.5 pr-4 text-green-400">{s.won}</td>
                        <td className="py-2.5 pr-4 text-orange-400 font-medium">₹{Number(s.sales).toLocaleString()}</td>
                        <td className="py-2.5 text-slate-300">{s.leads ? Math.round((s.won / s.leads) * 100) : 0}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
