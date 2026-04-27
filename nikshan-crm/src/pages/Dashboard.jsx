import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Users, TrendingUp, IndianRupee, Calendar, Wrench, Trophy, ChevronRight, Package, Truck, AlertTriangle } from 'lucide-react'
import api from '../lib/api.js'
import { useAuth } from '../store/auth.js'
import { format, parseISO } from 'date-fns'

const fmt = n => n >= 100000 ? `₹${(n/100000).toFixed(1)}L` : n >= 1000 ? `₹${(n/1000).toFixed(0)}K` : `₹${n}`
const STATUS_BADGE = { new:'badge-new', contacted:'badge-contacted', quoted:'badge-quoted', negotiating:'badge-negotiating', won:'badge-won', lost:'badge-lost' }

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} />
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <div className="text-sm text-slate-500">{label}</div>
        {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [perf, setPerf] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [pendingDeliveries, setPendingDeliveries] = useState(0)
  const { user } = useAuth()

  useEffect(() => {
    api.get('/dashboard/stats').then(r => setStats(r.data)).catch(() => {})
    api.get('/performance/team?period=month').then(r => setPerf(r.data?.slice(0,3) || [])).catch(() => {})
    api.get('/products?low_stock=true').then(r => setLowStock(r.data?.filter(p => p.stock_count <= (p.low_stock_threshold || 3)) || [])).catch(() => {})
    api.get('/deliveries?status=scheduled').then(r => setPendingDeliveries(r.data?.length || 0)).catch(() => {})
  }, [])

  if (!stats) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"/></div>

  const MEDAL = ['🥇','🥈','🥉']

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-slate-500 text-sm">Here's what's happening today</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon={Users}         label="Total Customers"      value={stats.totalCustomers}     color="bg-blue-50 text-blue-600" />
        <StatCard icon={TrendingUp}    label="Leads This Month"     value={stats.leadsThisMonth}     color="bg-violet-50 text-violet-600" />
        <StatCard icon={IndianRupee}   label="Revenue This Month"   value={fmt(stats.revenueThisMonth)} color="bg-green-50 text-green-600" />
        <StatCard icon={Trophy}        label="Won This Month"       value={stats.wonLeadsThisMonth}  color="bg-yellow-50 text-yellow-600" />
        <StatCard icon={Calendar}      label="Pending Follow-ups"   value={stats.pendingFollowups}   color="bg-orange-50 text-orange-600" />
        <StatCard icon={Wrench}        label="Open Service"         value={stats.pendingService}     color="bg-red-50 text-red-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Leads */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Recent Leads</h2>
            <Link to="/leads" className="text-xs text-primary-600 hover:underline flex items-center gap-1">View all <ChevronRight size={12}/></Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100">{['Name','Product Interest','Assigned To','Status'].map(h=><th key={h} className="text-left py-2 px-2 text-xs font-medium text-slate-500">{h}</th>)}</tr></thead>
              <tbody>
                {(stats.recentLeads || []).map(l => (
                  <tr key={l.id||l.name} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-2 font-medium text-slate-800">{l.name}</td>
                    <td className="py-2.5 px-2 text-slate-500">{l.product_interest}</td>
                    <td className="py-2.5 px-2 text-slate-500">{l.nk_users?.name || '-'}</td>
                    <td className="py-2.5 px-2"><span className={STATUS_BADGE[l.status]}>{l.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Top Performers */}
          <div className="card">
            <h2 className="font-semibold text-slate-800 mb-3">🏆 Top Performers (Month)</h2>
            {perf.length === 0 ? <p className="text-sm text-slate-400">No data yet</p> : (
              <div className="space-y-3">
                {perf.map((p, i) => (
                  <div key={p.id} className={`flex items-center gap-3 p-2 rounded-lg ${i===0 ? 'bg-yellow-50' : 'bg-slate-50'}`}>
                    <span className="text-lg">{MEDAL[i]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-800 truncate">{p.name}</div>
                      <div className="text-xs text-slate-500">{p.leads_won} won · {fmt(p.revenue_generated)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Today's Follow-ups */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-800">Today's Follow-ups</h2>
              <Link to="/followups" className="text-xs text-primary-600 hover:underline">View all</Link>
            </div>
            {(stats.todayFollowups || []).length === 0
              ? <p className="text-sm text-slate-400">No follow-ups today 🎉</p>
              : (stats.todayFollowups || []).map(f => (
                  <div key={f.id} className="flex items-start gap-2 py-2 border-b border-slate-50 last:border-0">
                    <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 shrink-0"/>
                    <div>
                      <div className="text-sm font-medium text-slate-800">{f.nk_customers?.name || f.nk_leads?.name}</div>
                      <div className="text-xs text-slate-400">{f.follow_up_type} · {f.nk_users?.name}</div>
                    </div>
                  </div>
                ))
            }
          </div>
        </div>
      </div>

      {/* Alert Widgets Row */}
      {(lowStock.length > 0 || pendingDeliveries > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pendingDeliveries > 0 && (
            <Link to="/deliveries" className="card flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                <Truck size={22} className="text-orange-600"/>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{pendingDeliveries}</div>
                <div className="text-sm text-slate-500">Pending Deliveries</div>
              </div>
              <ChevronRight size={16} className="ml-auto text-slate-400"/>
            </Link>
          )}
          {lowStock.length > 0 && (
            <Link to="/products" className="card hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                  <AlertTriangle size={16} className="text-red-500"/>
                </div>
                <div className="font-semibold text-slate-800 text-sm">Low Stock Alert</div>
                <span className="ml-auto text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">{lowStock.length} items</span>
              </div>
              <div className="space-y-1.5">
                {lowStock.slice(0,3).map(p => (
                  <div key={p.id} className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 truncate flex-1">{p.product_name}</span>
                    <span className={`ml-2 font-bold px-2 py-0.5 rounded-full ${p.stock_count === 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                      {p.stock_count === 0 ? 'OUT' : `${p.stock_count} left`}
                    </span>
                  </div>
                ))}
                {lowStock.length > 3 && <div className="text-xs text-slate-400">+{lowStock.length-3} more</div>}
              </div>
            </Link>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="card">
        <h2 className="font-semibold text-slate-800 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/customers" className="btn-primary">+ Add Customer</Link>
          <Link to="/leads" className="btn-primary">+ Add Lead</Link>
          <Link to="/service" className="btn-primary">+ Service Request</Link>
          <Link to="/followups" className="btn-secondary">+ Follow-up</Link>
          <Link to="/deliveries" className="btn-secondary">View Deliveries</Link>
        </div>
      </div>
    </div>
  )
}
