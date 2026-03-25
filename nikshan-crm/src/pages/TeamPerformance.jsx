import React, { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import api from '../lib/api.js'
import { Trophy, TrendingUp, Users, IndianRupee } from 'lucide-react'

const fmt = n => n >= 100000 ? `₹${(n/100000).toFixed(1)}L` : n >= 1000 ? `₹${(n/1000).toFixed(0)}K` : `₹${n}`
const ROLE_LABELS = { admin:'Admin', branch_manager:'Branch Mgr', sales_manager:'Sales Mgr', sales_exec:'Sales Exec', technician:'Technician' }
const MEDAL = ['🥇','🥈','🥉']
const COLORS = ['#2563eb','#7c3aed','#059669','#d97706','#dc2626','#0891b2']

export default function TeamPerformance() {
  const [data, setData] = useState([])
  const [period, setPeriod] = useState('month')
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    api.get(`/performance/team?period=${period}`).then(r => setData(r.data||[])).finally(()=>setLoading(false))
  }
  useEffect(load, [period])

  const top = data[0]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-slate-900">Team Performance</h1><p className="text-sm text-slate-500">Sales team analytics</p></div>
        <div className="flex gap-2">
          {['week','month','quarter'].map(p=>(
            <button key={p} onClick={()=>setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${period===p?'bg-primary-600 text-white':'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              This {p.charAt(0).toUpperCase()+p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"/></div> : (
        <>
          {/* Best Employee */}
          {top && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="text-5xl">🏆</div>
                <div>
                  <div className="text-xs font-semibold text-yellow-700 uppercase tracking-wide mb-1">Best Performer This {period}</div>
                  <div className="text-2xl font-bold text-slate-900">{top.name}</div>
                  <div className="text-sm text-slate-600">{ROLE_LABELS[top.role]} · {top.store}</div>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span className="font-semibold text-green-700">{top.leads_won} leads won</span>
                    <span className="text-slate-500">·</span>
                    <span className="font-semibold text-blue-700">{fmt(top.revenue_generated)} revenue</span>
                    <span className="text-slate-500">·</span>
                    <span className="font-semibold text-purple-700">{top.conversion_rate}% conversion</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard */}
          <div className="card">
            <h2 className="font-semibold text-slate-800 mb-4">Leaderboard</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100">
                  <tr>{['Rank','Employee','Role','Store','Leads Assigned','Leads Won','Conversion %','Customers Attended','Revenue'].map(h=><th key={h} className="text-left py-2 px-3 text-xs font-semibold text-slate-500">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {data.map((row, i) => (
                    <tr key={row.id} className={`border-b border-slate-50 ${i===0?'bg-yellow-50':''}`}>
                      <td className="py-3 px-3 text-lg">{MEDAL[i] || i+1}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold">{row.name[0]}</div>
                          <span className="font-semibold text-slate-800">{row.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-500 text-xs">{ROLE_LABELS[row.role]}</td>
                      <td className="py-3 px-3 text-slate-500 text-xs">{row.store}</td>
                      <td className="py-3 px-3 text-center font-medium text-slate-700">{row.leads_assigned}</td>
                      <td className="py-3 px-3 text-center font-bold text-green-700">{row.leads_won}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${row.conversion_rate>=50?'bg-green-100 text-green-700':row.conversion_rate>=25?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-700'}`}>
                          {row.conversion_rate}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600">{row.customers_attended}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{fmt(row.revenue_generated)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="font-semibold text-slate-800 mb-4">Leads Won by Employee</h2>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} barSize={32}>
                    <XAxis dataKey="name" tick={{fontSize:10}} />
                    <YAxis tick={{fontSize:10}} />
                    <Tooltip formatter={v=>[`${v} leads`,'Won']} />
                    <Bar dataKey="leads_won" radius={[4,4,0,0]}>
                      {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card">
              <h2 className="font-semibold text-slate-800 mb-4">Revenue by Employee</h2>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} barSize={32}>
                    <XAxis dataKey="name" tick={{fontSize:10}} />
                    <YAxis tick={{fontSize:10}} tickFormatter={v=>fmt(v)} />
                    <Tooltip formatter={v=>[fmt(v),'Revenue']} />
                    <Bar dataKey="revenue_generated" radius={[4,4,0,0]}>
                      {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
