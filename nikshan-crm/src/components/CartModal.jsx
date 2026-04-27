/**
 * CartModal — Multi-product purchase cart
 * Used from: CustomerDetail (repeat customer) + NewSaleModal (new/found customer)
 *
 * Props:
 *   customer    { id, name, phone }
 *   stores      []
 *   users       []
 *   currentUser
 *   onClose     fn
 *   onSuccess   fn(invoice)
 *
 * Features:
 *   - GST per product line (auto-filled from product DB, editable)
 *   - Warranty per product line (auto-filled, warranty_expiry computed on submit)
 *   - Split Payment (two payment methods + amounts, validated against grand total)
 *   - Seasonal discounts, gift items, sold-by locking (preserved)
 */
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { X, Plus, Trash2, Search, Gift, ShoppingCart } from 'lucide-react'
import api from '../lib/api.js'
import toast from 'react-hot-toast'
import { useAuth } from '../store/auth.js'
import Receipt from './Receipt.jsx'

const fmt = n => `₹${Number(n || 0).toLocaleString('en-IN')}`

const DISCOUNT_TYPES = [
  { value: 'none',     label: 'No Discount' },
  { value: 'percent',  label: '% Off' },
  { value: 'fixed',    label: '₹ Off' },
  { value: 'seasonal', label: 'Seasonal Offer' },
]

const KERALA_SEASONS = [
  { id: 'onam',    name: 'Onam Offer',          pct: 15 },
  { id: 'xmas',    name: 'Christmas & New Year', pct: 12 },
  { id: 'vishu',   name: 'Vishu Special',        pct: 10 },
  { id: 'eid',     name: 'Eid Special',          pct: 10 },
  { id: 'yearend', name: 'Year End Sale',        pct: 8  },
  { id: 'summer',  name: 'Summer Sale',          pct: 7  },
]

const PAY_TYPES = ['cash', 'card', 'upi', 'emi']
const SPLIT_PAY_TYPES = ['cash', 'card', 'upi']
const GST_RATES = [0, 5, 12, 18, 28]

// ── Product Row ──────────────────────────────────────────────
function ProductRow({ row, onChange, onDelete, canDelete, seasons }) {
  const [query, setQuery] = useState(row.product_name || '')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [open, setOpen] = useState(false)
  const debounce = useRef(null)
  const wrapRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    const h = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const search = useCallback(val => {
    setQuery(val)
    // If we already have a selected product, changing text clears selection
    if (row.product_id) onChange({ ...row, product_id: null, product_name: '', brand: '', actual_price: 0, final_price: 0 })
    clearTimeout(debounce.current)
    if (val.length < 1) { setResults([]); setOpen(false); return }
    setSearching(true)
    debounce.current = setTimeout(async () => {
      try {
        const res = await api.get(`/products?search=${encodeURIComponent(val)}`)
        setResults(res.data || [])
        setOpen(true)
      } catch { setResults([]) }
      finally { setSearching(false) }
    }, 280)
  }, [row, onChange])

  const select = p => {
    setQuery(`${p.model_number} — ${p.product_name}`)
    setOpen(false)
    setResults([])
    const updated = {
      ...row,
      product_id: p.id,
      model_number: p.model_number,
      product_name: p.product_name,
      brand: p.brand,
      category: p.category,
      actual_price: parseFloat(p.actual_price || 0),
      discount_type: row.discount_type || 'none',
      discount_value: row.discount_value || 0,
      is_gift: false,
      gst_percentage: p.gst_percentage ?? 18,
      warranty_months: p.warranty_months ?? 12,
    }
    updated.final_price = calcFinal(updated)
    onChange(updated)
  }

  const calcFinal = r => {
    if (r.is_gift) return 0
    const base = parseFloat(r.actual_price || 0) * (r.quantity || 1)
    if (r.discount_type === 'percent')  return Math.max(0, base - base * parseFloat(r.discount_value || 0) / 100)
    if (r.discount_type === 'fixed')    return Math.max(0, base - parseFloat(r.discount_value || 0))
    if (r.discount_type === 'seasonal') {
      const s = seasons.find(x => x.id === r.season_id)
      const pct = r.discount_value || (s?.pct || 0)
      return Math.max(0, base - base * parseFloat(pct) / 100)
    }
    return base
  }

  const update = patch => {
    const next = { ...row, ...patch }
    if (patch.is_gift) next.final_price = 0
    else next.final_price = calcFinal(next)
    onChange(next)
  }

  const savings = row.is_gift ? row.actual_price * (row.quantity || 1) : ((row.actual_price * (row.quantity || 1)) - row.final_price)
  const gstAmount = row.is_gift ? 0 : (row.final_price * (row.gst_percentage || 0) / 100)
  const totalWithGst = row.final_price + gstAmount

  return (
    <div className={`border rounded-xl p-4 space-y-3 relative ${row.is_gift ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-white'}`}>
      {/* Gift badge */}
      {row.is_gift && (
        <div className="absolute top-3 right-10 bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">GIFT</div>
      )}

      {/* Delete */}
      {canDelete && (
        <button onClick={onDelete} className="absolute top-3 right-3 text-slate-300 hover:text-red-500"><Trash2 size={15}/></button>
      )}

      {/* Model search */}
      <div ref={wrapRef} className="relative">
        <label className="label">Model No. / Product <span className="text-red-500">*</span></label>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input
            className={`input pl-8 ${row.product_id ? 'border-green-400 bg-green-50' : ''}`}
            placeholder="Search model no, product name, brand..."
            value={query}
            onChange={e => search(e.target.value)}
          />
          {searching && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">Searching...</span>}
        </div>
        {!row.product_id && query.length >= 2 && !searching && results.length === 0 && (
          <p className="text-xs text-red-500 mt-1">Product not found. Ask admin to add it to Products DB.</p>
        )}
        {open && results.length > 0 && (
          <div className="absolute z-50 top-full left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl mt-1 max-h-52 overflow-y-auto">
            {results.map(p => (
              <button key={p.id} onMouseDown={() => select(p)}
                className="w-full text-left px-3 py-2.5 hover:bg-primary-50 border-b border-slate-50 last:border-0">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs text-slate-500 mr-2">{p.model_number}</span>
                    <span className="font-semibold text-slate-800 text-sm">{p.product_name}</span>
                    <span className="text-xs text-slate-500 ml-2">{p.brand}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-primary-700 font-bold text-sm">{fmt(p.actual_price)}</div>
                    {p.gst_percentage != null && (
                      <div className="text-xs text-slate-400">GST {p.gst_percentage}%</div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Auto-filled fields */}
      {row.product_id && (
        <>
          <div className="grid grid-cols-3 gap-3 text-xs text-slate-500 bg-slate-50 rounded-lg p-2.5">
            <div><span className="font-medium text-slate-700">Brand:</span> {row.brand}</div>
            <div><span className="font-medium text-slate-700">Category:</span> {row.category || '—'}</div>
            <div><span className="font-medium text-slate-700">MRP:</span> {fmt(row.actual_price)}</div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Qty */}
            <div>
              <label className="label">Qty</label>
              <input type="number" min={1} className="input" value={row.quantity || 1}
                onChange={e => update({ quantity: parseInt(e.target.value) || 1 })} />
            </div>

            {/* Discount Type */}
            <div>
              <label className="label">Discount</label>
              <select className="select" value={row.discount_type || 'none'}
                onChange={e => update({ discount_type: e.target.value, discount_value: 0, season_id: null })} disabled={row.is_gift}>
                {DISCOUNT_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>

            {/* Discount Value / Season selector */}
            {row.discount_type === 'seasonal' ? (
              <div>
                <label className="label">Season</label>
                <select className="select" value={row.season_id || ''}
                  onChange={e => {
                    const s = seasons.find(x => x.id === e.target.value) || KERALA_SEASONS.find(x => x.id === e.target.value)
                    update({ season_id: e.target.value, discount_value: s?.pct || s?.default_pct || 0 })
                  }}>
                  <option value="">Select season</option>
                  {(seasons.length ? seasons : KERALA_SEASONS).map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.pct || s.default_pct}%)</option>
                  ))}
                </select>
              </div>
            ) : row.discount_type !== 'none' ? (
              <div>
                <label className="label">{row.discount_type === 'percent' ? '% Off' : '₹ Off'}</label>
                <input type="number" min={0} className="input" value={row.discount_value || ''}
                  onChange={e => update({ discount_value: parseFloat(e.target.value) || 0 })} disabled={row.is_gift} />
              </div>
            ) : <div/>}

            {/* Final Price */}
            <div>
              <label className="label">Final Price (ex-GST)</label>
              <div className={`input font-bold text-base flex flex-col items-start justify-center ${row.is_gift ? 'text-green-600' : 'text-green-700'} bg-green-50 border-green-200`}>
                {row.is_gift ? (
                  <span>FREE</span>
                ) : (
                  <>
                    <span>{fmt(row.final_price)}</span>
                    {row.gst_percentage > 0 && (
                      <span className="text-xs font-normal text-blue-600">+{fmt(gstAmount)} GST → {fmt(totalWithGst)}</span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* GST % and Warranty */}
          {!row.is_gift && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">GST %</label>
                <select className="select" value={row.gst_percentage} onChange={e => update({ gst_percentage: parseFloat(e.target.value) })}>
                  {GST_RATES.map(p => <option key={p} value={p}>{p}%</option>)}
                </select>
              </div>
              <div>
                <label className="label">Warranty (months)</label>
                <input type="number" min={0} className="input" value={row.warranty_months}
                  onChange={e => update({ warranty_months: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
          )}

          {/* Savings + Gift toggle */}
          <div className="flex items-center justify-between">
            {savings > 0 && !row.is_gift && (
              <span className="text-xs text-green-600 font-medium">You save {fmt(savings)}</span>
            )}
            {row.is_gift && <span className="text-xs text-green-600 font-medium">Gift item — not counted in total</span>}
            <label className="flex items-center gap-2 ml-auto cursor-pointer">
              <input type="checkbox" checked={!!row.is_gift} onChange={e => update({ is_gift: e.target.checked, discount_type: 'none', discount_value: 0 })} className="w-3.5 h-3.5 rounded"/>
              <Gift size={13} className="text-green-600"/>
              <span className="text-xs text-slate-600">Gift Item</span>
            </label>
          </div>
        </>
      )}
    </div>
  )
}

// ── Main CartModal ────────────────────────────────────────────
const emptyRow = () => ({
  _id: Math.random().toString(36).slice(2),
  product_id: null, product_name: '', brand: '', category: '',
  model_number: '', actual_price: 0, final_price: 0,
  discount_type: 'none', discount_value: 0, is_gift: false, quantity: 1,
  gst_percentage: 18, warranty_months: 12,
})

// Compute warranty expiry date string from purchase_date + warranty_months
const warrantyExpiry = (row, purchase_date) => {
  if (!row.warranty_months || row.is_gift) return null
  const d = new Date(purchase_date)
  d.setMonth(d.getMonth() + row.warranty_months)
  return d.toISOString().split('T')[0]
}

export default function CartModal({ customer, stores = [], users = [], currentUser, onClose, onSuccess }) {
  const { isManager } = useAuth()
  const [rows, setRows] = useState([emptyRow()])
  const [payment_type, setPaymentType] = useState('cash')
  const [emi_bank, setEmiBank] = useState('')
  const [emi_tenure, setEmiTenure] = useState(12)
  const [emi_monthly, setEmiMonthly] = useState('')
  const [sold_by, setSoldBy] = useState(currentUser?.id || '')
  const [purchase_date, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [seasons, setSeasons] = useState(KERALA_SEASONS)
  const [saving, setSaving] = useState(false)
  const [receipt, setReceipt] = useState(null)

  // Split payment state
  const [splitEnabled, setSplitEnabled] = useState(false)
  const [payment_type2, setPaymentType2] = useState('card')
  const [splitAmount1, setSplitAmount1] = useState('')
  const [splitAmount2, setSplitAmount2] = useState('')

  useEffect(() => {
    api.get('/seasons').then(r => { if (r.data?.length) setSeasons(r.data) }).catch(() => {})
  }, [])

  // Reset split when EMI is selected
  useEffect(() => {
    if (payment_type === 'emi') setSplitEnabled(false)
  }, [payment_type])

  const updateRow = (idx, updated) => setRows(r => r.map((x, i) => i === idx ? updated : x))
  const addRow = () => setRows(r => [...r, emptyRow()])
  const delRow = idx => setRows(r => r.filter((_, i) => i !== idx))

  const validRows  = rows.filter(r => r.product_id)
  const nonGift    = validRows.filter(r => !r.is_gift)
  const giftRows   = validRows.filter(r => r.is_gift)
  const subtotal   = nonGift.reduce((s, r) => s + r.actual_price * (r.quantity || 1), 0)
  const totalDisc  = nonGift.reduce((s, r) => s + Math.max(0, r.actual_price * (r.quantity || 1) - r.final_price), 0)
  const taxable    = nonGift.reduce((s, r) => s + r.final_price, 0)
  const totalGst   = nonGift.reduce((s, r) => s + (r.final_price * (r.gst_percentage || 0) / 100), 0)
  const grandTotal = taxable + totalGst

  const splitSum = parseFloat(splitAmount1 || 0) + parseFloat(splitAmount2 || 0)
  const splitValid = !splitEnabled || Math.abs(splitSum - grandTotal) < 1

  const canSubmit = validRows.length > 0 && sold_by &&
    (payment_type !== 'emi' || emi_bank) && splitValid

  // Build GST breakdown lines for summary display
  const gstByRate = nonGift.reduce((acc, r) => {
    const rate = r.gst_percentage || 0
    if (rate === 0) return acc
    if (!acc[rate]) acc[rate] = { base: 0, gst: 0 }
    acc[rate].base += r.final_price
    acc[rate].gst  += r.final_price * rate / 100
    return acc
  }, {})

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSaving(true)
    try {
      const store_id = users.find(u => u.id === sold_by)?.store_id || currentUser?.store_id
      const res = await api.post('/purchases/cart', {
        customer_id: customer.id, store_id, sold_by,
        payment_type, emi_bank: payment_type === 'emi' ? emi_bank : null,
        emi_tenure: payment_type === 'emi' ? emi_tenure : null,
        emi_monthly: payment_type === 'emi' ? (emi_monthly ? parseFloat(emi_monthly) : null) : null,
        notes, purchase_date,
        // Split payment fields
        split_payment: splitEnabled,
        payment_type2: splitEnabled ? payment_type2 : null,
        amount1: splitEnabled ? parseFloat(splitAmount1) : null,
        amount2: splitEnabled ? parseFloat(splitAmount2) : null,
        items: validRows.map(r => ({
          product_id: r.product_id, product_name: r.product_name, brand: r.brand,
          model_number: r.model_number, category: r.category,
          actual_price: r.actual_price, discount_type: r.discount_type,
          discount_value: r.discount_value, final_price: r.final_price,
          is_gift: r.is_gift, quantity: r.quantity || 1, season_id: r.season_id || null,
          // New fields
          gst_percentage: r.gst_percentage || 0,
          gst_amount: r.is_gift ? 0 : (r.final_price * (r.gst_percentage || 0) / 100),
          warranty_months: r.is_gift ? 0 : (r.warranty_months || 0),
          warranty_expiry: warrantyExpiry(r, purchase_date),
        }))
      })
      toast.success('Purchase saved!')
      setReceipt({ invoice: res.invoice, purchases: res.purchases, customer })
    } catch (err) {
      toast.error(err?.error || 'Failed to save purchase')
    } finally { setSaving(false) }
  }

  if (receipt) {
    return <Receipt invoice={receipt.invoice} purchases={receipt.purchases} customer={receipt.customer}
      onClose={() => { onSuccess(receipt.invoice); onClose() }} />
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center"><ShoppingCart size={18} className="text-primary-600"/></div>
            <div>
              <div className="font-bold text-slate-900">Add Purchase</div>
              <div className="text-xs text-slate-500">{customer.name} · {customer.phone}</div>
            </div>
          </div>
          <button onClick={onClose}><X size={20} className="text-slate-400"/></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Product Rows */}
          <div className="space-y-3">
            {rows.map((row, idx) => (
              <ProductRow key={row._id} row={row} seasons={seasons}
                onChange={updated => updateRow(idx, updated)}
                onDelete={() => delRow(idx)}
                canDelete={rows.length > 1} />
            ))}
          </div>

          <button onClick={addRow} className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-primary-200 rounded-xl text-primary-700 hover:border-primary-400 hover:bg-primary-50 text-sm font-medium transition-colors">
            <Plus size={15}/> Add Another Product
          </button>

          {/* Cart Summary */}
          {validRows.length > 0 && (
            <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
              {/* Subtotal (before GST) */}
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (before GST)</span>
                <span>{fmt(subtotal)}</span>
              </div>

              {/* Discount */}
              {totalDisc > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Total Discount</span>
                  <span>-{fmt(totalDisc)}</span>
                </div>
              )}

              {/* Gift items */}
              {giftRows.length > 0 && (
                <div className="flex justify-between text-slate-400 text-xs">
                  <span>Gift Items ({giftRows.length})</span>
                  <span>FREE</span>
                </div>
              )}

              <div className="border-t border-slate-200 pt-2 mt-1 space-y-1">
                {/* Taxable Amount */}
                <div className="flex justify-between text-slate-700 font-medium">
                  <span>Taxable Amount</span>
                  <span>{fmt(taxable)}</span>
                </div>

                {/* GST breakdown */}
                {totalGst > 0 && (
                  <div className="space-y-0.5">
                    {Object.entries(gstByRate).map(([rate, { base, gst }]) => (
                      <div key={rate} className="flex justify-between text-blue-700 text-xs">
                        <span>{rate}% GST on {fmt(base)}</span>
                        <span>+{fmt(gst)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-blue-800 font-medium text-xs">
                      <span>Total GST</span>
                      <span>+{fmt(totalGst)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Grand Total */}
              <div className="flex justify-between font-bold text-slate-900 text-base border-t border-slate-200 pt-2 mt-2">
                <span>Grand Total (incl. GST)</span>
                <span className="text-primary-700">{fmt(grandTotal)}</span>
              </div>
            </div>
          )}

          {/* Payment & Details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Payment Type *</label>
              <select className="select" value={payment_type} onChange={e => setPaymentType(e.target.value)}>
                {PAY_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Purchase Date</label>
              <input type="date" className="input" value={purchase_date} onChange={e => setPurchaseDate(e.target.value)} />
            </div>

            {/* Split Payment toggle (hidden for EMI) */}
            {payment_type !== 'emi' && (
              <div className="col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={splitEnabled} onChange={e => setSplitEnabled(e.target.checked)} />
                  <span className="text-sm text-slate-700">Split Payment</span>
                </label>
              </div>
            )}
          </div>

          {/* EMI fields */}
          {payment_type === 'emi' && (
            <div className="grid grid-cols-3 gap-3">
              <div><label className="label">Bank Name *</label><input className="input" placeholder="e.g. HDFC Bank" value={emi_bank} onChange={e=>setEmiBank(e.target.value)}/></div>
              <div><label className="label">Tenure (months)</label><input type="number" className="input" value={emi_tenure} onChange={e=>setEmiTenure(parseInt(e.target.value)||12)}/></div>
              <div><label className="label">Monthly EMI ₹</label><input type="number" className="input" placeholder="auto" value={emi_monthly} onChange={e=>setEmiMonthly(e.target.value)}/></div>
            </div>
          )}

          {/* Split payment detail rows */}
          {splitEnabled && payment_type !== 'emi' && (
            <div className="bg-blue-50 rounded-xl p-4 space-y-3">
              <div className="text-xs font-semibold text-blue-800">Split Payment Details</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Payment 1 Type</label>
                  <select className="select" value={payment_type} onChange={e => setPaymentType(e.target.value)}>
                    {SPLIT_PAY_TYPES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Amount 1 (₹)</label>
                  <input type="number" className="input" value={splitAmount1} onChange={e => setSplitAmount1(e.target.value)} placeholder="0" />
                </div>
                <div>
                  <label className="label">Payment 2 Type</label>
                  <select className="select" value={payment_type2} onChange={e => setPaymentType2(e.target.value)}>
                    {SPLIT_PAY_TYPES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Amount 2 (₹)</label>
                  <input type="number" className="input" value={splitAmount2} onChange={e => setSplitAmount2(e.target.value)} placeholder="0" />
                </div>
              </div>

              {/* Split validation */}
              {splitAmount1 && splitAmount2 && (
                <div className={`text-xs font-medium ${Math.abs(splitSum - grandTotal) < 1 ? 'text-green-600' : 'text-red-500'}`}>
                  {Math.abs(splitSum - grandTotal) < 1
                    ? '✓ Amounts match grand total'
                    : `Amounts total ${fmt(splitSum)} — Grand Total is ${fmt(grandTotal)}`
                  }
                </div>
              )}

              {/* Bill preview line */}
              {splitAmount1 && splitAmount2 && Math.abs(splitSum - grandTotal) < 1 && (
                <div className="text-xs text-blue-700 bg-blue-100 rounded-lg px-3 py-1.5">
                  Bill will show: Paid: {fmt(parseFloat(splitAmount1))} {payment_type.toUpperCase()} + {fmt(parseFloat(splitAmount2))} {payment_type2.toUpperCase()}
                </div>
              )}
            </div>
          )}

          {/* Sold By + Notes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Sold By *</label>
              {isManager() || currentUser?.role === 'admin' ? (
                <select className="select" value={sold_by} onChange={e => setSoldBy(e.target.value)}>
                  <option value="">Select staff</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role?.replace('_',' ')})</option>)}
                </select>
              ) : (
                <div className="input bg-slate-50 text-slate-700">{currentUser?.name} <span className="text-xs text-slate-400">(you)</span></div>
              )}
            </div>
            <div><label className="label">Notes</label><input className="input" placeholder="Optional" value={notes} onChange={e=>setNotes(e.target.value)}/></div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-slate-100">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSubmit} disabled={!canSubmit || saving}
            className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
            {saving ? 'Saving...' : `Save & Generate Bill`}
            {!saving && validRows.length > 0 && <span className="text-xs opacity-75">({validRows.length} item{validRows.length>1?'s':''})</span>}
          </button>
        </div>
      </div>
    </div>
  )
}
