import React, { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import api from '../lib/api.js'
import { Download, TrendingUp, Users, ShoppingBag, CreditCard, Wrench, FileText, ChevronDown, ChevronUp } from 'lucide-react'

const fmt = n => `₹${Number(n||0).toLocaleString('en-IN')}`
const COLORS = ['#432a6f','#6b4fa8','#9b7fd4','#c9bbea','#059669','#d97706','#dc2626','#0891b2']
const PERIOD_OPTS = [
  { label: 'This Week',   days: 7 },
  { label: 'This Month',  days: 0, month: true },
  { label: 'Last Month',  days: 0, lastMonth: true },
  { label: 'This Quarter',days: 0, quarter: true },
  { label: 'Custom',      days: 0, custom: true },
]

function SectionHeader({ icon: Icon, title, color = 'text-primary-700' }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
        <Icon size={16} className="text-primary-600" />
      </div>
      <h2 className={`font-bold text-slate-800 text-base ${color}`}>{title}</h2>
    </div>
  )
}

function KPI({ label, value, sub, color = 'text-slate-900' }) {
  return (
    <div className="card text-center py-4">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  )
}

export default function Reports() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('This Month')
  const [from, setFrom] = useState(() => {
    const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
  })
  const [to, setTo] = useState(new Date().toISOString().split('T')[0])
  const [openSection, setOpenSection] = useState('sales')

  const applyPeriod = (label) => {
    const now = new Date()
    if (label === 'This Week') {
      const d = new Date(); d.setDate(d.getDate() - 7)
      setFrom(d.toISOString().split('T')[0]); setTo(now.toISOString().split('T')[0])
    } else if (label === 'This Month') {
      setFrom(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0])
      setTo(now.toISOString().split('T')[0])
    } else if (label === 'Last Month') {
      const f = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const t = new Date(now.getFullYear(), now.getMonth(), 0)
      setFrom(f.toISOString().split('T')[0]); setTo(t.toISOString().split('T')[0])
    } else if (label === 'This Quarter') {
      const q = Math.floor(now.getMonth() / 3)
      setFrom(new Date(now.getFullYear(), q * 3, 1).toISOString().split('T')[0])
      setTo(now.toISOString().split('T')[0])
    }
    setPeriod(label)
  }

  const load = () => {
    setLoading(true)
    api.get(`/reports/summary?from=${from}&to=${to}`).then(r => setData(r.data)).finally(() => setLoading(false))
  }
  useEffect(load, [from, to])

  const exportCSV = (rows, filename) => {
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a')
    a.href = url; a.download = filename + '.csv'; a.click()
  }

  const toggle = key => setOpenSection(s => s === key ? null : key)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Reports</h1>
          <p className="text-sm text-slate-500">Business analytics · {from} to {to}</p>
        </div>
      </div>

      {/* Date filter */}
      <div className="card py-3 flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          {PERIOD_OPTS.filter(p => !p.custom).map(p => (
            <button key={p.label} onClick={() => applyPeriod(p.label)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${period === p.label ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {p.label}
            </button>
          ))}
          <button onClick={() => setPeriod('Custom')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${period === 'Custom' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            Custom
          </button>
        </div>
        {period === 'Custom' && (
          <div className="flex items-center gap-2 text-xs">
            <label className="text-slate-500">From</label>
            <input type="date" className="input w-32 py-1.5 text-xs" value={from} onChange={e => setFrom(e.target.value)} />
            <label className="text-slate-500">To</label>
            <input type="date" className="input w-32 py-1.5 text-xs" value={to} onChange={e => setTo(e.target.value)} />
            <button onClick={load} className="btn-primary py-1.5 px-3 text-xs">Apply</button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"/></div>
      ) : !data ? null : (
        <div className="space-y-3">

          {/* ── SECTION A: Sales Summary ── */}
          <div className="card p-0 overflow-hidden">
            <button onClick={() => toggle('sales')} className="w-full flex items-center justify-between p-4 hover:bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center"><TrendingUp size={15} className="text-green-600"/></div>
                <span className="font-bold text-slate-800">Sales Summary</span>
                <span className="text-xs text-slate-400 ml-1">{fmt(data.totalSales)} total · {data.totalTransactions} transactions</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={e=>{e.stopPropagation();exportCSV([['Product','Brand','Qty','Revenue'],...(data.topProducts||[]).map(x=>[x.name,x.brand,x.qty,x.revenue])],'sales-report')}} className="text-xs text-primary-600 hover:underline flex items-center gap-1"><Download size={12}/>CSV</button>
                {openSection==='sales'?<ChevronUp size={16} className="text-slate-400"/>:<ChevronDown size={16} className="text-slate-400"/>}
              </div>
            </button>
            {openSection === 'sales' && (
              <div className="p-4 border-t border-slate-100 space-y-5">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <KPI label="Total Revenue" value={fmt(data.totalSales)} color="text-green-700"/>
                  <KPI label="Cash Sales" value={fmt(data.cashSales)}/>
                  <KPI label="EMI Sales" value={fmt(data.emiSales)}/>
                  <KPI label="Card / UPI" value={fmt(data.cardSales)}/>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  <KPI label="Total Transactions" value={data.totalTransactions} color="text-primary-700"/>
                  <KPI label="Average Order Value" value={fmt(data.avgOrder)}/>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Store Performance Chart */}
                  <div>
                    <div className="text-sm font-semibold text-slate-700 mb-3">Store-wise Revenue</div>
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.storePerformance||[]} barSize={36}>
                          <XAxis dataKey="name" tick={{fontSize:10}}/>
                          <YAxis tick={{fontSize:10}} tickFormatter={v=>fmt(v)}/>
                          <Tooltip formatter={v=>[fmt(v),'Revenue']}/>
                          <Bar dataKey="sales" fill="#432a6f" radius={[4,4,0,0]}/>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  {/* Payment Type Pie */}
                  <div>
                    <div className="text-sm font-semibold text-slate-700 mb-3">Payment Type Breakdown</div>
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={data.payBreakdown||[]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                            {(data.payBreakdown||[]).map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                          </Pie>
                          <Tooltip formatter={v=>[fmt(v)]}/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Top Products */}
                {(data.topProducts||[]).length > 0 && (
                  <div>
                    <div className="text-sm font-semibold text-slate-700 mb-2">Top Products</div>
                    <table className="w-full text-xs">
                      <thead><tr className="border-b border-slate-100">{['Product','Brand','Qty Sold','Revenue'].map(h=><th key={h} className="text-left py-2 font-medium text-slate-500">{h}</th>)}</tr></thead>
                      <tbody>{data.topProducts.slice(0,10).map((p,i)=>(
                        <tr key={i} className="border-b border-slate-50">
                          <td className="py-2 font-medium text-slate-800">{p.name}</td>
                          <td className="py-2 text-slate-500">{p.brand||'—'}</td>
                          <td className="py-2 text-center font-bold text-primary-700">{p.qty}</td>
                          <td className="py-2 font-semibold text-green-700">{fmt(p.revenue)}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}

                {/* Top Staff */}
                {(data.topStaff||[]).length > 0 && (
                  <div>
                    <div className="text-sm font-semibold text-slate-700 mb-2">Top 5 Sales Staff</div>
                    <div className="space-y-1.5">
                      {data.topStaff.map((s,i)=>(
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-sm font-bold text-slate-400 w-4">{i+1}</span>
                          <div className="flex-1 text-sm font-medium text-slate-700">{s.name}</div>
                          <div className="font-bold text-green-700 text-sm">{fmt(s.revenue)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── SECTION B: Customer Analytics ── */}
          <div className="card p-0 overflow-hidden">
            <button onClick={() => toggle('customers')} className="w-full flex items-center justify-between p-4 hover:bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center"><Users size={15} className="text-blue-600"/></div>
                <span className="font-bold text-slate-800">Customer Analytics</span>
                <span className="text-xs text-slate-400 ml-1">{data.newCustomers} new · {data.repeatRate}% repeat rate</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={e=>{e.stopPropagation();exportCSV([['Customer','Phone','Total Spent'],...(data.topCustomers||[]).map(x=>[x.name,x.phone,x.total])],'customers-report')}} className="text-xs text-primary-600 hover:underline flex items-center gap-1"><Download size={12}/>CSV</button>
                {openSection==='customers'?<ChevronUp size={16} className="text-slate-400"/>:<ChevronDown size={16} className="text-slate-400"/>}
              </div>
            </button>
            {openSection === 'customers' && (
              <div className="p-4 border-t border-slate-100 space-y-5">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  <KPI label="New Customers" value={data.newCustomers} color="text-blue-700"/>
                  <KPI label="Repeat Customer Rate" value={`${data.repeatRate}%`} color="text-green-700"/>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div>
                    <div className="text-sm font-semibold text-slate-700 mb-3">Customers by Source</div>
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={data.sourceBreakdown||[]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={55} label={({name,value})=>`${name}: ${value}`} labelLine={false}>
                            {(data.sourceBreakdown||[]).map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                          </Pie>
                          <Tooltip/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-slate-700 mb-2">Top 10 Customers by Lifetime Value</div>
                    <div className="space-y-1">
                      {(data.topCustomers||[]).slice(0,10).map((c,i)=>(
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className="text-slate-400 w-4">{i+1}</span>
                          <span className="flex-1 font-medium text-slate-700">{c.name}</span>
                          <span className="text-slate-400">{c.phone}</span>
                          <span className="font-bold text-green-700">{fmt(c.total)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── SECTION C: Lead Analytics ── */}
          <div className="card p-0 overflow-hidden">
            <button onClick={() => toggle('leads')} className="w-full flex items-center justify-between p-4 hover:bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center"><TrendingUp size={15} className="text-orange-600"/></div>
                <span className="font-bold text-slate-800">Lead Analytics</span>
                <span className="text-xs text-slate-400 ml-1">{data.totalLeads} leads · {data.conversionRate}% conversion</span>
              </div>
              {openSection==='leads'?<ChevronUp size={16} className="text-slate-400"/>:<ChevronDown size={16} className="text-slate-400"/>}
            </button>
            {openSection === 'leads' && (
              <div className="p-4 border-t border-slate-100 space-y-5">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <KPI label="Total Leads" value={data.totalLeads} color="text-primary-700"/>
                  <KPI label="Won Leads" value={data.wonLeads} color="text-green-700"/>
                  <KPI label="Conversion Rate" value={`${data.conversionRate}%`} color={data.conversionRate >= 30 ? 'text-green-700' : 'text-orange-600'}/>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-700 mb-3">Lead Funnel</div>
                  <div className="space-y-2">
                    {(data.leadsByStatus||[]).map((s, i) => {
                      const max = Math.max(...(data.leadsByStatus||[]).map(x=>x.count), 1)
                      return (
                        <div key={s.status} className="flex items-center gap-3">
                          <div className="text-xs font-medium text-slate-500 w-24 text-right capitalize">{s.status}</div>
                          <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width:`${(s.count/max)*100}%`, background: COLORS[i%COLORS.length] }} />
                          </div>
                          <div className="text-xs font-bold text-slate-700 w-6 text-right">{s.count}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                {(data.lostReasonBreakdown||[]).length > 0 && (
                  <div>
                    <div className="text-sm font-semibold text-slate-700 mb-2">Lost Reasons</div>
                    <div className="space-y-1">
                      {data.lostReasonBreakdown.map((r,i)=>(
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-slate-600 capitalize">{r.reason}</span>
                          <span className="font-bold text-slate-700">{r.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── SECTION D: EMI Report ── */}
          <div className="card p-0 overflow-hidden">
            <button onClick={() => toggle('emi')} className="w-full flex items-center justify-between p-4 hover:bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center"><CreditCard size={15} className="text-yellow-600"/></div>
                <span className="font-bold text-slate-800">EMI Report</span>
                <span className="text-xs text-slate-400 ml-1">{data.activeEMIs} active · {fmt(data.totalEmiValue)} outstanding</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={e=>{e.stopPropagation();exportCSV([['Customer','Phone','Bank','Monthly EMI','Tenure','Status'],...(data.emiList||[]).map(e=>[e.name,e.phone,e.bank,e.monthly,e.tenure,e.status])],'emi-report')}} className="text-xs text-primary-600 hover:underline flex items-center gap-1"><Download size={12}/>CSV</button>
                {openSection==='emi'?<ChevronUp size={16} className="text-slate-400"/>:<ChevronDown size={16} className="text-slate-400"/>}
              </div>
            </button>
            {openSection === 'emi' && (
              <div className="p-4 border-t border-slate-100 space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  <KPI label="Active EMI Customers" value={data.activeEMIs} color="text-yellow-700"/>
                  <KPI label="Total Outstanding" value={fmt(data.totalEmiValue)} color="text-orange-700"/>
                  <KPI label="Total EMI Records" value={data.totalEMIs}/>
                </div>

                {(data.emiList||[]).length > 0 && (
                  <table className="w-full text-xs">
                    <thead><tr className="border-b border-slate-100">{['Customer','Phone','Bank','Monthly','Tenure','Status'].map(h=><th key={h} className="text-left py-2 font-medium text-slate-500">{h}</th>)}</tr></thead>
                    <tbody>{data.emiList.map((e,i)=>(
                      <tr key={i} className="border-b border-slate-50">
                        <td className="py-2 font-medium text-slate-800">{e.name}</td>
                        <td className="py-2 text-slate-500">{e.phone}</td>
                        <td className="py-2 text-slate-600">{e.bank}</td>
                        <td className="py-2 font-semibold text-orange-700">{fmt(e.monthly)}/mo</td>
                        <td className="py-2 text-slate-500">{e.tenure} mo</td>
                        <td className="py-2"><span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">{e.status}</span></td>
                      </tr>
                    ))}</tbody>
                  </table>
                )}
              </div>
            )}
          </div>

          {/* ── SECTION E: Service Report ── */}
          <div className="card p-0 overflow-hidden">
            <button onClick={() => toggle('service')} className="w-full flex items-center justify-between p-4 hover:bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center"><Wrench size={15} className="text-slate-600"/></div>
                <span className="font-bold text-slate-800">Service Report</span>
                <span className="text-xs text-slate-400 ml-1">{data.totalService} requests · {data.resolvedService} resolved</span>
              </div>
              {openSection==='service'?<ChevronUp size={16} className="text-slate-400"/>:<ChevronDown size={16} className="text-slate-400"/>}
            </button>
            {openSection === 'service' && (
              <div className="p-4 border-t border-slate-100 space-y-5">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  <KPI label="Total Requests" value={data.totalService} color="text-primary-700"/>
                  <KPI label="Resolved" value={data.resolvedService} color="text-green-700"/>
                  <KPI label="Pending" value={data.totalService - data.resolvedService} color="text-orange-600"/>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div>
                    <div className="text-sm font-semibold text-slate-700 mb-3">By Request Type</div>
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={(data.svcByType||[]).filter(x=>x.count>0)} barSize={32}>
                          <XAxis dataKey="type" tick={{fontSize:10}}/>
                          <YAxis tick={{fontSize:10}}/>
                          <Tooltip/>
                          <Bar dataKey="count" fill="#432a6f" radius={[4,4,0,0]}>
                            {(data.svcByType||[]).map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-700 mb-2">Technician Performance</div>
                    <table className="w-full text-xs">
                      <thead><tr className="border-b border-slate-100">{['Technician','Assigned','Resolved'].map(h=><th key={h} className="text-left py-2 font-medium text-slate-500">{h}</th>)}</tr></thead>
                      <tbody>{(data.techPerformance||[]).map((t,i)=>(
                        <tr key={i} className="border-b border-slate-50">
                          <td className="py-2 font-medium text-slate-700">{t.name}</td>
                          <td className="py-2 text-center text-primary-700 font-bold">{t.assigned}</td>
                          <td className="py-2 text-center text-green-700 font-bold">{t.resolved}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
