import React, { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import api from '../lib/api.js'
import { FileText, Download } from 'lucide-react'

const fmt = n => `₹${Number(n).toLocaleString('en-IN')}`
const COLORS = ['#2563eb','#7c3aed','#059669','#d97706','#dc2626','#0891b2','#be185d']

export default function Reports() {
  const [data, setData] = useState(null)
  const [from, setFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
  const [to, setTo] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    api.get(`/reports/summary?from=${from}&to=${to}`).then(r => setData(r.data)).finally(()=>setLoading(false))
  }
  useEffect(load, [from, to])

  const exportCSV = () => {
    if (!data) return
    const rows = [['Metric','Value'],['Total Sales',data.totalSales],['Cash Sales',data.cashSales],['EMI Sales',data.emiSales],['Card/UPI Sales',data.cardSales],['Total Leads',data.totalLeads],['Won Leads',data.wonLeads],['Total EMIs',data.totalEMIs],['Total Service',data.totalService]]
    const csv = rows.map(r=>r.join(',')).join('\n')
    const blob = new Blob([csv], {type:'text/csv'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href=url; a.download=`report-${from}-${to}.csv`; a.click()
  }

  const bankChartData = data ? Object.entries(data.bankBreakdown||{}).map(([name,count])=>({name,count})) : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-slate-900">Reports</h1><p className="text-sm text-slate-500">Business analytics</p></div>
        <button onClick={exportCSV} className="btn-secondary flex items-center gap-2"><Download size={15}/> Export CSV</button>
      </div>

      {/* Date filter */}
      <div className="card flex items-center gap-4 flex-wrap py-4">
        <FileText size={18} className="text-primary-600"/>
        <div className="flex items-center gap-2 text-sm"><label className="text-slate-500">From</label><input type="date" className="input w-36" value={from} onChange={e=>setFrom(e.target.value)} /></div>
        <div className="flex items-center gap-2 text-sm"><label className="text-slate-500">To</label><input type="date" className="input w-36" value={to} onChange={e=>setTo(e.target.value)} /></div>
        <button onClick={load} className="btn-primary">Apply</button>
      </div>

      {loading ? <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"/></div> : !data ? null : (
        <>
          {/* KPI */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label:'Total Sales', value:fmt(data.totalSales), color:'bg-green-50 border-green-200' },
              { label:'Cash Sales', value:fmt(data.cashSales), color:'bg-blue-50 border-blue-200' },
              { label:'EMI Sales', value:fmt(data.emiSales), color:'bg-orange-50 border-orange-200' },
              { label:'Card/UPI Sales', value:fmt(data.cardSales), color:'bg-purple-50 border-purple-200' },
            ].map(k=>(
              <div key={k.label} className={`card border ${k.color}`}>
                <div className="text-2xl font-bold text-slate-900">{k.value}</div>
                <div className="text-sm text-slate-500 mt-1">{k.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label:'Total Transactions', value:data.totalTransactions },
              { label:'Total Leads', value:data.totalLeads },
              { label:'Won Leads', value:data.wonLeads },
              { label:'Service Requests', value:data.totalService },
            ].map(k=>(
              <div key={k.label} className="card text-center">
                <div className="text-3xl font-bold text-primary-700">{k.value}</div>
                <div className="text-sm text-slate-500 mt-1">{k.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Store Performance */}
            <div className="card">
              <h2 className="font-semibold text-slate-800 mb-4">Store Performance</h2>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.storePerformance||[]} barSize={40}>
                    <XAxis dataKey="name" tick={{fontSize:11}} />
                    <YAxis tick={{fontSize:11}} tickFormatter={v=>fmt(v)} />
                    <Tooltip formatter={v=>[fmt(v),'Sales']} />
                    <Bar dataKey="sales" fill="#2563eb" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <table className="w-full text-sm mt-4">
                <thead><tr className="border-b border-slate-100">{['Store','Sales','Leads','Won'].map(h=><th key={h} className="text-left py-2 text-xs font-medium text-slate-500">{h}</th>)}</tr></thead>
                <tbody>{(data.storePerformance||[]).map(s=><tr key={s.name} className="border-b border-slate-50"><td className="py-2 font-medium text-slate-800">{s.name}</td><td className="py-2 text-green-700 font-semibold">{fmt(s.sales)}</td><td className="py-2 text-slate-600">{s.leads}</td><td className="py-2 text-slate-600">{s.won}</td></tr>)}</tbody>
              </table>
            </div>

            {/* Lead Funnel */}
            <div className="card">
              <h2 className="font-semibold text-slate-800 mb-4">Lead Funnel</h2>
              <div className="space-y-2">
                {(data.leadsByStatus||[]).map((s, i) => {
                  const max = Math.max(...data.leadsByStatus.map(x=>x.count), 1)
                  return (
                    <div key={s.status} className="flex items-center gap-3">
                      <div className="text-xs font-medium text-slate-500 w-20 text-right capitalize">{s.status}</div>
                      <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width:`${(s.count/max)*100}%`, background: COLORS[i] }} />
                      </div>
                      <div className="text-xs font-bold text-slate-700 w-6 text-right">{s.count}</div>
                    </div>
                  )
                })}
              </div>

              {bankChartData.length > 0 && (
                <>
                  <h2 className="font-semibold text-slate-800 mt-6 mb-3">EMI by Bank</h2>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={bankChartData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={({name,count})=>`${name}: ${count}`} labelLine={false}>
                          {bankChartData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
