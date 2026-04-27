import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api.js'
import { useAuth } from '../store/auth.js'
import { ShoppingBag, Search, User, Phone, ChevronRight, X } from 'lucide-react'
import NewSaleModal from '../components/NewSaleModal.jsx'

const SOURCE_COLORS = {
  'walk-in':'bg-blue-100 text-blue-700',
  referral:'bg-green-100 text-green-700',
  online:'bg-purple-100 text-purple-700',
  lead:'bg-orange-100 text-orange-700',
  default:'bg-slate-100 text-slate-600'
}

export default function Customers() {
  const [customers, setCustomers]   = useState([])
  const [stores, setStores]         = useState([])
  const [search, setSearch]         = useState('')
  const [phoneSearch, setPhoneSearch] = useState('')
  const [phoneResult, setPhoneResult] = useState(null) // customer found by phone
  const [phoneSearching, setPhoneSearching] = useState(false)
  const [storeFilter, setStoreFilter] = useState('')
  const [showNewSale, setShowNewSale] = useState(false)
  const [loading, setLoading]       = useState(true)
  const { user } = useAuth()
  const debounceRef = useRef(null)

  const load = () => {
    setLoading(true)
    const p = new URLSearchParams()
    if (search) p.set('search', search)
    if (storeFilter) p.set('store_id', storeFilter)
    api.get(`/customers?${p}`).then(r => setCustomers(r.data || [])).finally(() => setLoading(false))
    api.get('/stores').then(r => setStores(r.data || []))
  }

  useEffect(load, [search, storeFilter])

  // Phone number live search
  const handlePhoneSearch = useCallback((val) => {
    const cleaned = val.replace(/\D/g,'').slice(0,10)
    setPhoneSearch(cleaned)
    setPhoneResult(null)
    if (cleaned.length < 10) return
    clearTimeout(debounceRef.current)
    setPhoneSearching(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/customers?search=${cleaned}`)
        const match = (res.data || []).find(c => c.phone === cleaned)
        setPhoneResult(match || 'not_found')
      } catch { setPhoneResult('not_found') }
      finally { setPhoneSearching(false) }
    }, 400)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Customers</h1>
          <p className="text-sm text-slate-500">{customers.length} total customers</p>
        </div>
        <button onClick={() => setShowNewSale(true)}
          className="btn-primary flex items-center gap-2 text-sm px-5 py-2.5">
          <ShoppingBag size={16}/> New Sale
        </button>
      </div>

      {/* ── PHONE SEARCH (Repeat Customer) ── */}
      <div className="card border-2 border-primary-100 bg-primary-50/40 p-5">
        <div className="text-sm font-semibold text-primary-800 mb-3 flex items-center gap-2">
          <Phone size={15}/> Find Returning Customer by Phone
        </div>
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input
            className="input pl-9 pr-10 bg-white"
            placeholder="Type phone number..."
            value={phoneSearch}
            onChange={e => handlePhoneSearch(e.target.value)}
            maxLength={10}
          />
          {phoneSearch && (
            <button onClick={() => { setPhoneSearch(''); setPhoneResult(null) }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={14}/>
            </button>
          )}
        </div>

        {/* Phone search result */}
        {phoneSearching && <p className="text-xs text-slate-500 mt-2">Searching...</p>}
        {phoneResult && phoneResult !== 'not_found' && (
          <div className="mt-3 bg-white border border-green-200 rounded-xl p-4 flex items-center justify-between max-w-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                {phoneResult.name?.[0]}
              </div>
              <div>
                <div className="font-semibold text-slate-900 text-sm">{phoneResult.name}</div>
                <div className="text-xs text-slate-500">{phoneResult.phone} · {phoneResult.nk_stores?.name || 'No store'}</div>
              </div>
            </div>
            <Link to={`/customers/${phoneResult.id}`}
              className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
              Open Profile <ChevronRight size={12}/>
            </Link>
          </div>
        )}
        {phoneResult === 'not_found' && phoneSearch.length === 10 && (
          <div className="mt-3 flex items-center gap-3 max-w-sm">
            <div className="text-sm text-slate-500">No customer found with this number.</div>
            <button onClick={() => setShowNewSale(true)}
              className="btn-primary text-xs px-3 py-1.5 whitespace-nowrap">+ New Sale</button>
          </div>
        )}
      </div>

      {/* ── ALL CUSTOMERS LIST ── */}
      <div>
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input className="input pl-9 w-56" placeholder="Search by name..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <select className="select w-48" value={storeFilter} onChange={e=>setStoreFilter(e.target.value)}>
            <option value="">All Stores</option>
            {stores.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Customer','Phone','Store','Source','Tags','Action'].map(h =>
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-500">{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan="6" className="text-center py-12 text-slate-400">Loading...</td></tr>
                : customers.length === 0
                ? <tr><td colSpan="6" className="text-center py-12 text-slate-400">No customers yet</td></tr>
                : customers.map(c => (
                    <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold shrink-0">{c.name?.[0]}</div>
                          <span className="font-semibold text-slate-800">{c.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{c.phone}</td>
                      <td className="py-3 px-4 text-slate-500 text-xs">{c.nk_stores?.name || '-'}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SOURCE_COLORS[c.source] || SOURCE_COLORS.default}`}>{c.source}</span>
                      </td>
                      <td className="py-3 px-4">
                        {(c.tags||[]).map(t=><span key={t} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full mr-1">{t}</span>)}
                      </td>
                      <td className="py-3 px-4">
                        <Link to={`/customers/${c.id}`} className="text-primary-600 hover:underline text-xs font-medium flex items-center gap-1">
                          View Profile <ChevronRight size={11}/>
                        </Link>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {showNewSale && (
        <NewSaleModal
          stores={stores}
          currentUser={user}
          onClose={() => setShowNewSale(false)}
          onSuccess={() => { setShowNewSale(false); load() }}
        />
      )}
    </div>
  )
}
