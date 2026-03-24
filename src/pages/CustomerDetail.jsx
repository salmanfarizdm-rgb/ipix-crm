import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../lib/api'

function Section({ title, children }) {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-white mb-4">{title}</h3>
      {children}
    </div>
  )
}

export default function CustomerDetail() {
  const { id } = useParams()
  const [customer, setCustomer] = useState(null)
  const [purchases, setPurchases] = useState([])
  const [emis, setEmis] = useState([])
  const [services, setServices] = useState([])
  const [followups, setFollowups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get(`/customers/${id}`),
      api.get(`/purchases?customer_id=${id}`),
      api.get(`/emi?customer_id=${id}`),
      api.get(`/service?customer_id=${id}`),
      api.get(`/followups?customer_id=${id}`),
    ]).then(([c, p, e, s, f]) => {
      setCustomer(c.data)
      setPurchases(p.data || [])
      setEmis(e.data || [])
      setServices(s.data || [])
      setFollowups(f.data || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent" /></div>
  if (!customer) return <div className="text-center text-slate-400 py-12">Customer not found</div>

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/customers" className="text-slate-400 hover:text-white text-sm">← Customers</Link>
      </div>

      {/* Profile */}
      <div className="card flex items-start gap-5">
        <div className="w-14 h-14 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 text-xl font-bold flex-shrink-0">
          {customer.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-white">{customer.name}</h1>
          <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm text-slate-400">
            <span>📞 {customer.phone}</span>
            {customer.email && <span>✉️ {customer.email}</span>}
            <span>🏪 {customer.store_name || 'Unknown store'}</span>
            <span className="capitalize">📌 {customer.source}</span>
          </div>
          {customer.notes && <p className="mt-2 text-sm text-slate-300 bg-navy-700/50 rounded-lg px-3 py-2">{customer.notes}</p>}
        </div>
        <span className={`badge ${customer.tags === 'VIP' ? 'bg-yellow-500/20 text-yellow-400' : customer.tags === 'EMI' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-300'}`}>
          {customer.tags}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Purchases */}
        <Section title={`Purchases (${purchases.length})`}>
          {purchases.length === 0 ? <p className="text-slate-500 text-sm">No purchases yet</p> : (
            <div className="space-y-2">
              {purchases.map(p => (
                <div key={p.id} className="flex justify-between items-start p-3 bg-navy-700/50 rounded-lg text-sm">
                  <div>
                    <p className="text-white font-medium">{p.product_name}</p>
                    <p className="text-slate-400 text-xs">{p.brand} • {p.category} • {p.payment_type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-orange-400 font-medium">₹{Number(p.amount).toLocaleString()}</p>
                    <p className="text-slate-500 text-xs">{new Date(p.purchase_date).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* EMI */}
        <Section title={`EMI Records (${emis.length})`}>
          {emis.length === 0 ? <p className="text-slate-500 text-sm">No EMI records</p> : (
            <div className="space-y-2">
              {emis.map(e => (
                <div key={e.id} className="p-3 bg-navy-700/50 rounded-lg text-sm">
                  <div className="flex justify-between">
                    <span className="text-white font-medium">{e.bank_name}</span>
                    <span className={`badge ${e.status === 'active' ? 'bg-green-500/20 text-green-400' : e.status === 'completed' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>{e.status}</span>
                  </div>
                  <p className="text-slate-400 text-xs mt-1">₹{Number(e.emi_amount).toLocaleString()}/mo × {e.tenure_months} months</p>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Service Requests */}
        <Section title={`Service Requests (${services.length})`}>
          {services.length === 0 ? <p className="text-slate-500 text-sm">No service requests</p> : (
            <div className="space-y-2">
              {services.map(s => (
                <div key={s.id} className="p-3 bg-navy-700/50 rounded-lg text-sm">
                  <div className="flex justify-between">
                    <span className="text-white font-medium capitalize">{s.type}</span>
                    <span className={`badge ${s.status === 'resolved' ? 'bg-green-500/20 text-green-400' : s.status === 'in-progress' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-700 text-slate-300'}`}>{s.status}</span>
                  </div>
                  <p className="text-slate-400 text-xs mt-1 truncate">{s.description}</p>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Follow-ups */}
        <Section title={`Follow-Up History (${followups.length})`}>
          {followups.length === 0 ? <p className="text-slate-500 text-sm">No follow-ups</p> : (
            <div className="space-y-2">
              {followups.map(f => (
                <div key={f.id} className="p-3 bg-navy-700/50 rounded-lg text-sm flex justify-between items-start">
                  <div>
                    <p className="text-white">{f.note}</p>
                    <p className="text-slate-400 text-xs mt-0.5">Due: {new Date(f.due_date).toLocaleDateString('en-IN')}</p>
                  </div>
                  {f.is_done && <span className="badge bg-green-500/20 text-green-400">Done</span>}
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  )
}
