import React, { useEffect, useState } from 'react'
import api from '../lib/api.js'
import { useAuth } from '../store/auth.js'
import toast from 'react-hot-toast'
import { Truck, Plus, X, MapPin, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

const fmtDate = d => { try { return format(new Date(d), 'dd MMM yyyy') } catch { return d || '—' } }

const STATUS_CONFIG = {
  scheduled:        { label:'Scheduled',        color:'bg-blue-100 text-blue-700',   icon:Clock },
  out_for_delivery: { label:'Out for Delivery', color:'bg-orange-100 text-orange-700', icon:Truck },
  delivered:        { label:'Delivered',        color:'bg-green-100 text-green-700',  icon:CheckCircle },
  failed:           { label:'Failed',           color:'bg-red-100 text-red-700',      icon:AlertCircle },
}

const QUICK_PERIODS = [
  { label:'Today',      getDates:()=>{ const t=new Date().toISOString().split('T')[0]; return {from:t,to:t} } },
  { label:'This Week',  getDates:()=>{ const t=new Date(),f=new Date(t); f.setDate(t.getDate()-7); return {from:f.toISOString().split('T')[0],to:t.toISOString().split('T')[0]} } },
  { label:'This Month', getDates:()=>{ const n=new Date(); return {from:new Date(n.getFullYear(),n.getMonth(),1).toISOString().split('T')[0],to:n.toISOString().split('T')[0]} } },
]

function StatusModal({ delivery, onClose, onSuccess }) {
  const [status, setStatus] = useState(delivery.status)
  const [loading, setLoading] = useState(false)

  const handleWhatsApp = () => {
    const phone = delivery.nk_customers?.phone?.replace(/\D/g, '')
    if (!phone) return
    const products = delivery.nk_invoices?.nk_purchases?.map(p => p.product_name).join(', ') || 'your product'
    const msg = `Dear ${delivery.nk_customers?.name || 'Customer'}, your ${products} has been delivered! 🎉\n\nPlease contact us for installation or assistance.\n\nThank you, Nikshan ${delivery.nk_stores?.name || 'Electronics'}`
    window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true)
    try {
      await api.patch(`/deliveries/${delivery.id}/status`, { status })
      toast.success('Delivery status updated!')
      onSuccess()
    } catch { toast.error('Failed') } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-slate-800">Update Delivery Status</h2>
          <button onClick={onClose}><X size={18} className="text-slate-400"/></button>
        </div>
        <div className="mb-4 bg-slate-50 rounded-xl p-3 text-sm">
          <div className="font-semibold text-slate-800">{delivery.nk_customers?.name}</div>
          <div className="text-slate-500 text-xs mt-0.5">{delivery.delivery_address}</div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label">Status</label>
            <select className="select" value={status} onChange={e => setStatus(e.target.value)}>
              {Object.entries(STATUS_CONFIG).map(([k,v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          {status === 'delivered' && delivery.nk_customers?.phone && (
            <button type="button" onClick={handleWhatsApp}
              className="w-full flex items-center justify-center gap-2 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700">
              Notify Customer via WhatsApp
            </button>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Saving...' : 'Update'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Deliveries() {
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [activePeriod, setActivePeriod] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [editing, setEditing] = useState(null)
  const { user } = useAuth()

  const applyPeriod = (label, dates) => { setActivePeriod(label); setFrom(dates.from); setTo(dates.to); setShowCustom(false) }
  const clearDates  = () => { setFrom(''); setTo(''); setActivePeriod(''); setShowCustom(false) }

  const load = () => {
    setLoading(true)
    const p = new URLSearchParams()
    if (statusFilter) p.set('status', statusFilter)
    if (from) p.set('from', from)
    if (to)   p.set('to', to)
    api.get(`/deliveries?${p}`).then(r => setDeliveries(r.data || [])).finally(() => setLoading(false))
  }
  useEffect(load, [statusFilter, from, to])

  const pending   = deliveries.filter(d => d.status === 'scheduled' || d.status === 'out_for_delivery')
  const delivered = deliveries.filter(d => d.status === 'delivered')

  const STATUS_TABS = ['', 'scheduled', 'out_for_delivery', 'delivered', 'failed']

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Deliveries</h1>
          <p className="text-sm text-slate-500">{pending.length} pending · {delivered.length} delivered</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label:'Scheduled', count: deliveries.filter(d=>d.status==='scheduled').length, color:'bg-blue-50 text-blue-600' },
          { label:'Out for Delivery', count: deliveries.filter(d=>d.status==='out_for_delivery').length, color:'bg-orange-50 text-orange-600' },
          { label:'Delivered', count: deliveries.filter(d=>d.status==='delivered').length, color:'bg-green-50 text-green-600' },
          { label:'Failed', count: deliveries.filter(d=>d.status==='failed').length, color:'bg-red-50 text-red-600' },
        ].map(s => (
          <div key={s.label} className="card text-center py-3">
            <div className={`text-2xl font-bold ${s.color.split(' ')[1]}`}>{s.count}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Date filter */}
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
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map(t => (
          <button key={t} onClick={() => setStatusFilter(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${statusFilter===t?'bg-primary-600 text-white':'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
            {t ? STATUS_CONFIG[t]?.label : 'All'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {['Customer','Products','Address','Scheduled Date','Assigned To','Status','Action'].map(h => (
                <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan="7" className="text-center py-12 text-slate-400">Loading...</td></tr>
              : deliveries.length === 0
                ? <tr><td colSpan="7" className="text-center py-12 text-slate-400">
                    <Truck size={32} className="mx-auto mb-2 text-slate-200"/>
                    No deliveries found
                  </td></tr>
                : deliveries.map(d => {
                  const cfg = STATUS_CONFIG[d.status] || STATUS_CONFIG.scheduled
                  const products = d.nk_invoices?.nk_purchases?.map(p => p.product_name).join(', ') || '—'
                  const isOverdue = d.scheduled_date < new Date().toISOString().split('T')[0] && d.status === 'scheduled'
                  return (
                    <tr key={d.id} className={`border-b border-slate-50 hover:bg-slate-50 ${isOverdue ? 'bg-red-50' : ''}`}>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{d.nk_customers?.name || '—'}</div>
                        <div className="text-xs text-slate-400">{d.nk_customers?.phone}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-xs max-w-[140px] truncate" title={products}>{products}</td>
                      <td className="py-3 px-4 text-slate-500 text-xs">
                        <div className="flex items-start gap-1"><MapPin size={11} className="shrink-0 mt-0.5 text-slate-400"/>{d.delivery_address || '—'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className={`text-xs font-medium ${isOverdue ? 'text-red-600' : 'text-slate-600'}`}>
                          {fmtDate(d.scheduled_date)}
                          {isOverdue && <span className="ml-1 text-red-500 font-bold">OVERDUE</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs">{d.nk_users?.name || 'Unassigned'}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>{cfg.label}</span>
                      </td>
                      <td className="py-3 px-4">
                        {d.status !== 'delivered' && (
                          <button onClick={() => setEditing(d)} className="text-xs text-primary-600 hover:underline">Update</button>
                        )}
                      </td>
                    </tr>
                  )
                })
            }
          </tbody>
        </table>
      </div>

      {editing && <StatusModal delivery={editing} onClose={() => setEditing(null)} onSuccess={() => { setEditing(null); load() }} />}
    </div>
  )
}
