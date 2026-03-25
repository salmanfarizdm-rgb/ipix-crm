import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../lib/api.js'
import { useAuth } from '../store/auth.js'
import toast from 'react-hot-toast'
import { ArrowLeft, Phone, Mail, MapPin, Tag, Plus, X } from 'lucide-react'
import { format } from 'date-fns'

const fmt = n => `₹${Number(n).toLocaleString('en-IN')}`
const fmtDate = d => { try { return format(new Date(d), 'dd MMM yyyy') } catch { return d } }
const STATUS = { pending:'badge-pending', in_progress:'badge-in_progress', resolved:'badge-resolved' }
const PAY_COLORS = { cash:'bg-green-100 text-green-700', card:'bg-blue-100 text-blue-700', upi:'bg-purple-100 text-purple-700', emi:'bg-orange-100 text-orange-700', exchange:'bg-slate-100 text-slate-600' }

export default function CustomerDetail() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [tab, setTab] = useState('purchases')
  const [showInteraction, setShowInteraction] = useState(false)
  const [iNote, setINote] = useState('')
  const [iType, setIType] = useState('visit')
  const { user } = useAuth()

  const load = () => api.get(`/customers/${id}`).then(r => setData(r.data)).catch(() => {})
  useEffect(load, [id])

  const addInteraction = async () => {
    try {
      await api.post(`/customers/${id}/interactions`, { user_id: user.id, interaction_type: iType, notes: iNote })
      toast.success('Interaction logged')
      setShowInteraction(false); setINote(''); load()
    } catch { toast.error('Failed') }
  }

  if (!data) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"/></div>

  const TABS = [
    { key:'purchases',     label:`Purchases (${data.purchases?.length||0})` },
    { key:'emi',           label:`EMI (${data.emi?.length||0})` },
    { key:'service',       label:`Service (${data.service?.length||0})` },
    { key:'followups',     label:`Follow-ups (${data.followups?.length||0})` },
    { key:'interactions',  label:`Interactions (${data.interactions?.length||0})` },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/customers" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft size={18} className="text-slate-500"/></Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{data.name}</h1>
          <p className="text-sm text-slate-500">Customer Profile</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <div className="card space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xl">
              {data.name?.[0]}
            </div>
            <div>
              <div className="font-bold text-slate-900">{data.name}</div>
              <div className="text-xs text-slate-500">{data.nk_stores?.name || 'No store'}</div>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-slate-600"><Phone size={14}/>{data.phone}</div>
            {data.email && <div className="flex items-center gap-2 text-slate-600"><Mail size={14}/>{data.email}</div>}
            {data.address && <div className="flex items-center gap-2 text-slate-600"><MapPin size={14}/>{data.address}</div>}
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 mb-1">Source</div>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{data.source}</span>
          </div>
          {(data.tags||[]).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {data.tags.map(t => <span key={t} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{t}</span>)}
            </div>
          )}
          <div className="text-xs text-slate-400">Added {fmtDate(data.created_at)}</div>
        </div>

        {/* Stats */}
        <div className="lg:col-span-2 grid grid-cols-3 gap-4">
          <div className="card text-center"><div className="text-2xl font-bold text-slate-900">{data.purchases?.length||0}</div><div className="text-xs text-slate-500 mt-1">Total Purchases</div></div>
          <div className="card text-center"><div className="text-2xl font-bold text-green-700">{fmt((data.purchases||[]).reduce((s,p)=>s+parseFloat(p.amount||0),0))}</div><div className="text-xs text-slate-500 mt-1">Total Spent</div></div>
          <div className="card text-center"><div className="text-2xl font-bold text-orange-600">{data.emi?.filter(e=>e.status==='active').length||0}</div><div className="text-xs text-slate-500 mt-1">Active EMIs</div></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card p-0 overflow-hidden">
        <div className="flex border-b border-slate-100 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${tab===t.key ? 'text-primary-700 border-b-2 border-primary-600 bg-primary-50' : 'text-slate-500 hover:text-slate-700'}`}>
              {t.label}
            </button>
          ))}
          {tab==='interactions' && (
            <button onClick={() => setShowInteraction(true)} className="ml-auto px-4 py-3 text-xs text-primary-600 hover:bg-primary-50 flex items-center gap-1">
              <Plus size={13}/> Log
            </button>
          )}
        </div>

        <div className="p-4">
          {tab === 'purchases' && (
            <div className="space-y-2">
              {(data.purchases||[]).length===0 ? <p className="text-slate-400 text-sm text-center py-6">No purchases yet</p>
              : (data.purchases||[]).map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div>
                    <div className="font-medium text-sm text-slate-800">{p.product_name}</div>
                    <div className="text-xs text-slate-500">{p.brand} · Sold by {p.nk_users?.name} · {fmtDate(p.purchase_date)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">{fmt(p.amount)}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${PAY_COLORS[p.payment_type]||''}`}>{p.payment_type?.toUpperCase()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab === 'emi' && (
            <div className="space-y-2">
              {(data.emi||[]).length===0 ? <p className="text-slate-400 text-sm text-center py-6">No EMI records</p>
              : (data.emi||[]).map(e => (
                <div key={e.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div>
                    <div className="font-medium text-sm text-slate-800">{e.bank_name}</div>
                    <div className="text-xs text-slate-500">{e.tenure_months} months · Started {fmtDate(e.start_date)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">{fmt(e.monthly_emi)}/mo</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${e.status==='active'?'bg-green-100 text-green-700':e.status==='closed'?'bg-slate-100 text-slate-600':'bg-red-100 text-red-700'}`}>{e.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab === 'service' && (
            <div className="space-y-2">
              {(data.service||[]).length===0 ? <p className="text-slate-400 text-sm text-center py-6">No service requests</p>
              : (data.service||[]).map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div>
                    <div className="font-medium text-sm text-slate-800">{s.product_name}</div>
                    <div className="text-xs text-slate-500">{s.issue_description} · {s.nk_users?.name}</div>
                  </div>
                  <span className={STATUS[s.status]||'badge-new'}>{s.status?.replace('_',' ')}</span>
                </div>
              ))}
            </div>
          )}
          {tab === 'followups' && (
            <div className="space-y-2">
              {(data.followups||[]).length===0 ? <p className="text-slate-400 text-sm text-center py-6">No follow-ups</p>
              : (data.followups||[]).map(f => (
                <div key={f.id} className={`flex items-center justify-between p-3 rounded-xl ${f.done?'bg-slate-50 opacity-60':'bg-blue-50'}`}>
                  <div>
                    <div className="font-medium text-sm text-slate-800">{f.follow_up_type} · {f.nk_users?.name}</div>
                    <div className="text-xs text-slate-500">{f.notes}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium text-slate-700">{fmtDate(f.due_date)}</div>
                    {f.done && <span className="text-xs text-green-600">✓ Done</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab === 'interactions' && (
            <div>
              {showInteraction && (
                <div className="bg-blue-50 rounded-xl p-4 mb-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="font-medium text-sm text-slate-800">Log Interaction</div>
                    <button onClick={() => setShowInteraction(false)}><X size={14}/></button>
                  </div>
                  <select className="select" value={iType} onChange={e=>setIType(e.target.value)}>
                    {['visit','call','follow_up','sale','service'].map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                  <textarea className="input h-20 resize-none" placeholder="Notes about this interaction..." value={iNote} onChange={e=>setINote(e.target.value)} />
                  <button onClick={addInteraction} className="btn-primary">Save</button>
                </div>
              )}
              <div className="space-y-3">
                {(data.interactions||[]).length===0 ? <p className="text-slate-400 text-sm text-center py-6">No interactions logged</p>
                : (data.interactions||[]).map(i => (
                  <div key={i.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold shrink-0">{i.nk_users?.name?.[0]||'?'}</div>
                    <div className="flex-1 bg-slate-50 rounded-xl p-3">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-slate-800">{i.nk_users?.name}</span>
                        <span className="text-xs text-slate-400">{fmtDate(i.created_at)}</span>
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full mr-2">{i.interaction_type}</span>
                      <p className="text-sm text-slate-600 mt-1">{i.notes}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
