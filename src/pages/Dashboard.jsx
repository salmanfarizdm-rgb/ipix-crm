import React, { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Link } from 'react-router-dom'
import api from '../lib/api'

function StatCard({ label, value, sub, color = 'text-orange-500' }) {
  return (
    <div className="stat-card">
      <p className="text-xs text-slate-400 font-medium">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [customers, setCustomers] = useState([])
  const [followups, setFollowups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/customers?limit=5&order=created_at'),
      api.get('/followups?due=today&done=false'),
    ]).then(([s, c, f]) => {
      setStats(s.data)
      setCustomers(c.data?.slice(0, 5) || [])
      setFollowups(f.data?.slice(0, 5) || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent" />
    </div>
  )

  const storeChartData = stats?.storeWiseSales || []
  const convRate = stats?.totalLeads ? Math.round((stats.wonLeads / stats.totalLeads) * 100) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-slate-400 mt-0.5">Overview for {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Leads This Month" value={stats?.leadsThisMonth ?? '—'} sub="New leads" />
        <StatCard label="Conversion Rate" value={`${convRate}%`} sub="Won / Total" color="text-green-400" />
        <StatCard label="Pending Follow-Ups" value={stats?.pendingFollowUps ?? '—'} sub="Due today" color="text-yellow-400" />
        <StatCard label="Pending Service" value={stats?.pendingService ?? '—'} sub="Open requests" color="text-red-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store-wise sales chart */}
        <div className="card">
          <h2 className="text-sm font-semibold text-white mb-4">Store-Wise Sales</h2>
          {storeChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={storeChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="store" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#1a2236', border: '1px solid #334155', borderRadius: 8 }}
                  labelStyle={{ color: '#fff' }}
                  formatter={v => [`₹${v.toLocaleString()}`, 'Sales']}
                />
                <Bar dataKey="sales" radius={[4, 4, 0, 0]}>
                  {storeChartData.map((_, i) => (
                    <Cell key={i} fill={i % 2 === 0 ? '#F97316' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-500 text-sm">No sales data yet</div>
          )}
        </div>

        {/* Today's follow-ups */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Today's Follow-Ups</h2>
            <Link to="/followups" className="text-xs text-orange-500 hover:text-orange-400">View all</Link>
          </div>
          {followups.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-500 text-sm">No follow-ups today 🎉</div>
          ) : (
            <div className="space-y-2">
              {followups.map(f => (
                <div key={f.id} className="flex items-start gap-3 p-3 rounded-lg bg-navy-700/50">
                  <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{f.customer_name || f.lead_name || 'Unknown'}</p>
                    <p className="text-xs text-slate-400 truncate">{f.note}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent customers */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">Recent Customers</h2>
          <Link to="/customers" className="text-xs text-orange-500 hover:text-orange-400">View all</Link>
        </div>
        {customers.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm">No customers yet</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-xs text-slate-400 border-b border-slate-700">
                <th className="text-left pb-2 font-medium">Name</th>
                <th className="text-left pb-2 font-medium">Phone</th>
                <th className="text-left pb-2 font-medium hidden sm:table-cell">Source</th>
                <th className="text-left pb-2 font-medium hidden md:table-cell">Tag</th>
                <th className="text-left pb-2 font-medium">Added</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id} className="table-row text-sm">
                  <td className="py-2.5 pr-4">
                    <Link to={`/customers/${c.id}`} className="text-white hover:text-orange-400">{c.name}</Link>
                  </td>
                  <td className="py-2.5 pr-4 text-slate-300">{c.phone}</td>
                  <td className="py-2.5 pr-4 text-slate-400 hidden sm:table-cell capitalize">{c.source}</td>
                  <td className="py-2.5 pr-4 hidden md:table-cell">
                    <span className={`badge ${c.tags === 'VIP' ? 'bg-yellow-500/20 text-yellow-400' : c.tags === 'EMI' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-300'}`}>
                      {c.tags || 'regular'}
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-400 text-xs">{new Date(c.created_at).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
