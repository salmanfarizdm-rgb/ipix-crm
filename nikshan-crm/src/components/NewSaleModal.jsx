import React, { useState, useCallback, useRef, useEffect } from 'react'
import { X, Search, AlertCircle, CheckCircle, Plus, Trash2, Gift, ShoppingCart } from 'lucide-react'
import api from '../lib/api.js'
import toast from 'react-hot-toast'
import InvoiceReceipt from './InvoiceReceipt.jsx'

const BANKS      = ['HDFC Bank','SBI','ICICI Bank','AXIS Bank','Bajaj Finserv','TVS Credit','HomeCredit','Muthoot Finance','Kotak Mahindra Bank','IndusInd Bank']
const DISC_TYPES = ['none','percentage','fixed','seasonal']

const fmt = n => `₹${Number(n||0).toLocaleString('en-IN')}`

function calcFinalPrice(item) {
  const ap = parseFloat(item.actual_price || 0)
  const dv = parseFloat(item.discount_value || 0)
  if (item.is_gift) return 0
  if (item.discount_type === 'percentage') return Math.max(0, ap - (ap * dv / 100))
  if (item.discount_type === 'fixed' || item.discount_type === 'seasonal') return Math.max(0, ap - dv)
  return ap
}

function CartItem({ item, index, onUpdate, onRemove }) {
  const [productSearch, setProductSearch] = useState(item.model_number || '')
  const [suggestions, setSuggestions]     = useState([])
  const [showSugg, setShowSugg]           = useState(false)
  const debRef = useRef(null)

  const searchProducts = useCallback(val => {
    setProductSearch(val)
    onUpdate(index, { model_number: val })
    setSuggestions([]); setShowSugg(false)
    if (val.length < 2) return
    clearTimeout(debRef.current)
    debRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/products?search=${val}`)
        setSuggestions(res.data || [])
        setShowSugg(true)
      } catch { setSuggestions([]) }
    }, 300)
  }, [index, onUpdate])

  const selectProduct = p => {
    setProductSearch(p.model_number || p.product_name)
    setShowSugg(false)
    onUpdate(index, {
      product_id:   p.id,
      model_number: p.model_number || '',
      product_name: p.product_name,
      brand:        p.brand || '',
      category:     p.category || '',
      actual_price: p.actual_price || '',
      final_price:  p.actual_price || '',
    })
  }

  const finalPrice = calcFinalPrice(item)
  const savings    = parseFloat(item.actual_price || 0) - finalPrice

  return (
    <div className={`border rounded-xl p-4 space-y-3 relative ${item.is_gift ? 'border-pink-200 bg-pink-50' : 'border-slate-200 bg-white'}`}>
      {/* Gift badge */}
      {item.is_gift && (
        <div className="absolute top-3 right-12 flex items-center gap-1 bg-pink-500 text-white text-xs px-2 py-0.5 rounded-full">
          <Gift size={10}/> GIFT
        </div>
      )}
      <button type="button" onClick={() => onRemove(index)} className="absolute top-3 right-3 text-slate-400 hover:text-red-500">
        <Trash2 size={15}/>
      </button>

      {/* Product search */}
      <div className="relative">
        <label className="label">Model No. / Product Name *</label>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input
            className="input pl-8 text-sm"
            placeholder="Type model number to auto-fill..."
            value={productSearch}
            onChange={e => searchProducts(e.target.value)}
          />
        </div>
        {showSugg && suggestions.length > 0 && (
          <div className="absolute z-20 top-full left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
            {suggestions.map(p => (
              <button key={p.id} type="button" onClick={() => selectProduct(p)}
                className="w-full text-left px-4 py-2.5 hover:bg-primary-50 text-sm border-b border-slate-50 last:border-0">
                <div className="font-medium text-slate-800">{p.product_name}</div>
                <div className="text-xs text-slate-500">{p.brand} · {p.model_number} · {fmt(p.actual_price)}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product details row */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="label">Product Name *</label>
          <input className="input text-sm" placeholder="Name" value={item.product_name} onChange={e=>onUpdate(index,{product_name:e.target.value})} required />
        </div>
        <div>
          <label className="label">Brand</label>
          <input className="input text-sm" placeholder="Brand" value={item.brand||''} onChange={e=>onUpdate(index,{brand:e.target.value})} />
        </div>
        <div>
          <label className="label">Qty</label>
          <input className="input text-sm" type="number" min="1" value={item.quantity||1} onChange={e=>onUpdate(index,{quantity:parseInt(e.target.value)||1})} />
        </div>
      </div>

      {/* Pricing */}
      {!item.is_gift && (
        <div className="grid grid-cols-4 gap-2 items-end">
          <div>
            <label className="label">Actual Price (₹) *</label>
            <input className="input text-sm" type="number" placeholder="0" value={item.actual_price||''} onChange={e=>{
              const ap = e.target.value
              onUpdate(index, { actual_price: ap, final_price: calcFinalPrice({...item, actual_price:ap}) })
            }} required />
          </div>
          <div>
            <label className="label">Discount</label>
            <select className="select text-sm" value={item.discount_type||'none'} onChange={e=>onUpdate(index,{discount_type:e.target.value, discount_value:0, final_price:parseFloat(item.actual_price||0)})}>
              <option value="none">No Discount</option>
              <option value="percentage">% Off</option>
              <option value="fixed">₹ Off</option>
              <option value="seasonal">Seasonal</option>
            </select>
          </div>
          {item.discount_type && item.discount_type !== 'none' && (
            <div>
              <label className="label">{item.discount_type==='percentage'?'% Value':'₹ Amount'}</label>
              <input className="input text-sm" type="number" placeholder="0" value={item.discount_value||''} onChange={e=>{
                const dv = e.target.value
                onUpdate(index, { discount_value:dv, final_price:calcFinalPrice({...item,discount_value:dv}) })
              }} />
            </div>
          )}
          <div>
            <label className="label">Final Price</label>
            <div className={`input text-sm font-semibold text-green-700 bg-green-50 ${item.discount_type==='none'||!item.discount_type?'col-span-2':''}`}>
              {fmt(finalPrice)}
              {savings > 0 && <div className="text-xs text-green-500">Save {fmt(savings)}</div>}
            </div>
          </div>
        </div>
      )}
      {item.is_gift && (
        <div className="text-sm text-pink-600 font-medium">Gift item — ₹0 on bill</div>
      )}

      {/* Gift toggle */}
      <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600">
        <input type="checkbox" checked={!!item.is_gift} onChange={e=>onUpdate(index,{is_gift:e.target.checked, final_price:e.target.checked?0:calcFinalPrice(item)})} className="rounded"/>
        <Gift size={14} className="text-pink-500"/> Mark as Gift Item (₹0, appears with GIFT badge on bill)
      </label>
    </div>
  )
}

const emptyItem = () => ({ product_id:null, model_number:'', product_name:'', brand:'', category:'', actual_price:'', discount_type:'none', discount_value:'', final_price:'', quantity:1, is_gift:false })

export default function NewSaleModal({ stores, currentUser, onClose, onSuccess }) {
  // Customer
  const [phone, setPhone]               = useState('')
  const [phoneStatus, setPhoneStatus]   = useState(null)
  const [existingCustomer, setExistingCust] = useState(null)
  const [custForm, setCustForm]         = useState({ name:'', email:'', address:'' })

  // Cart
  const [items, setItems]               = useState([emptyItem()])
  const [paymentType, setPaymentType]   = useState('cash')
  const [emiBank, setEmiBank]           = useState('')
  const [notes, setNotes]               = useState('')

  const [loading, setLoading]           = useState(false)
  const [receipt, setReceipt]           = useState(null)
  const debRef                          = useRef(null)

  const checkPhone = useCallback(val => {
    const cleaned = val.replace(/\D/g,'').slice(0,10)
    setPhone(cleaned); setPhoneStatus(null); setExistingCust(null)
    if (cleaned.length < 10) return
    clearTimeout(debRef.current)
    debRef.current = setTimeout(async () => {
      setPhoneStatus('checking')
      try {
        const res = await api.get(`/customers?search=${cleaned}`)
        const match = (res.data||[]).find(c=>c.phone===cleaned)
        match ? (setPhoneStatus('exists'), setExistingCust(match)) : setPhoneStatus('new')
      } catch { setPhoneStatus('new') }
    }, 500)
  }, [])

  const updateItem = (idx, patch) => {
    setItems(prev => prev.map((it,i) => i===idx ? {...it,...patch} : it))
  }
  const removeItem  = idx => setItems(prev => prev.filter((_,i) => i!==idx))
  const addItem     = ()  => setItems(prev => [...prev, emptyItem()])

  // Totals
  const nonGiftItems  = items.filter(i => !i.is_gift)
  const subtotal      = nonGiftItems.reduce((s,i) => s + parseFloat(i.actual_price||0)*(i.quantity||1), 0)
  const totalDiscount = nonGiftItems.reduce((s,i) => s + (parseFloat(i.actual_price||0)*(i.quantity||1) - calcFinalPrice(i)*(i.quantity||1)), 0)
  const grandTotal    = nonGiftItems.reduce((s,i) => s + calcFinalPrice(i)*(i.quantity||1), 0)

  const handleSubmit = async e => {
    e.preventDefault()
    if (!phone || phone.length < 10) { toast.error('Enter valid 10-digit phone'); return }
    if (phoneStatus==='exists' && !existingCustomer) { toast.error('Resolve duplicate'); return }
    if (items.some(i => !i.product_name || (!i.is_gift && !i.actual_price))) { toast.error('Fill product name and price for all items'); return }
    setLoading(true)
    try {
      let customer
      if ((phoneStatus==='exists'||phoneStatus==='use-existing') && existingCustomer) {
        customer = existingCustomer
      } else {
        if (!custForm.name.trim()) { toast.error('Customer name required'); setLoading(false); return }
        const { data } = await api.post('/customers', {
          name: custForm.name.trim(), phone,
          email: custForm.email||null, address: custForm.address||null,
          store_id: currentUser.store_id||null, source:'walk-in', created_by: currentUser.id
        })
        customer = data
      }

      // Cart submission
      const enrichedItems = items.map(item => ({
        ...item,
        final_price: calcFinalPrice(item)
      }))

      const { data: result } = await api.post('/purchases/cart', {
        customer_id:  customer.id,
        store_id:     customer.store_id || currentUser.store_id,
        sold_by:      currentUser.id,
        payment_type: paymentType,
        emi_bank:     paymentType==='emi' ? emiBank : null,
        items:        enrichedItems,
        notes:        notes || null,
        purchase_date: new Date().toISOString().split('T')[0]
      })

      // EMI record
      if (paymentType==='emi' && emiBank) {
        await api.post('/emi', {
          purchase_id:    result.purchases[0]?.id,
          customer_id:    customer.id,
          bank_name:      emiBank,
          loan_amount:    grandTotal,
          monthly_emi:    0,
          tenure_months:  12,
          start_date:     new Date().toISOString().split('T')[0],
          status:         'active'
        }).catch(()=>{})
      }

      toast.success('✅ Sale saved!')
      const storeRes = await api.get('/stores').catch(()=>({data:[]}))
      const store = (storeRes.data||[]).find(s => s.id===(customer.store_id||currentUser.store_id))
      setReceipt({ invoice: result.invoice, purchases: result.purchases, customer, store })
      onSuccess()
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to save sale')
    } finally { setLoading(false) }
  }

  if (receipt) {
    return <InvoiceReceipt invoice={receipt.invoice} purchases={receipt.purchases} customer={receipt.customer} store={receipt.store} onClose={onClose} />
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-white flex justify-between items-center px-6 py-4 border-b border-slate-100 rounded-t-2xl z-10">
          <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2"><ShoppingCart size={18} className="text-primary-600"/> New Sale</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={18} className="text-slate-400"/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* ── SECTION A: Customer ── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold">A</div>
              <h3 className="font-semibold text-slate-800">Customer</h3>
            </div>

            <div className="mb-3">
              <label className="label">Phone Number *</label>
              <div className="relative">
                <input
                  className={`input pr-10 ${phoneStatus==='exists'?'border-orange-400 bg-orange-50':phoneStatus==='new'?'border-green-400 bg-green-50':''}`}
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={e=>checkPhone(e.target.value)}
                  maxLength={10} required
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {phoneStatus==='checking'     && <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"/>}
                  {phoneStatus==='new'           && <CheckCircle size={16} className="text-green-500"/>}
                  {phoneStatus==='exists'        && <AlertCircle size={16} className="text-orange-500"/>}
                  {phoneStatus==='use-existing'  && <CheckCircle size={16} className="text-green-500"/>}
                </div>
              </div>
            </div>

            {phoneStatus==='exists' && existingCustomer && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-3">
                <div className="flex items-start gap-3">
                  <AlertCircle size={18} className="text-orange-500 mt-0.5 shrink-0"/>
                  <div className="flex-1">
                    <div className="font-semibold text-orange-800 text-sm">Existing Customer Found</div>
                    <div className="text-sm text-orange-700 mt-1"><strong>{existingCustomer.name}</strong> · {existingCustomer.phone}</div>
                    <div className="flex gap-2 mt-3">
                      <a href={`/customers/${existingCustomer.id}`} target="_blank" rel="noreferrer" className="btn-secondary text-xs py-1.5 px-3">View Profile →</a>
                      <button type="button" onClick={()=>setPhoneStatus('use-existing')} className="text-xs py-1.5 px-3 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-medium">
                        Add Purchase to This Customer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {phoneStatus==='use-existing' && existingCustomer && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-3 flex items-center gap-3">
                <CheckCircle size={16} className="text-green-600"/>
                <div className="text-sm text-green-800">Adding purchase to <strong>{existingCustomer.name}</strong></div>
                <button type="button" onClick={()=>setPhoneStatus('exists')} className="ml-auto text-xs text-slate-400 hover:text-slate-600">Change</button>
              </div>
            )}
            {(phoneStatus==='new'||!phoneStatus) && (
              <div className="space-y-3 bg-slate-50 rounded-xl p-4">
                <div><label className="label">Customer Name *</label><input className="input bg-white" placeholder="Full name" value={custForm.name} onChange={e=>setCustForm({...custForm,name:e.target.value})} required={phoneStatus==='new'}/></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Email <span className="text-slate-400">(optional)</span></label><input className="input bg-white" type="email" placeholder="email@example.com" value={custForm.email} onChange={e=>setCustForm({...custForm,email:e.target.value})}/></div>
                  <div><label className="label">Address <span className="text-slate-400">(optional)</span></label><input className="input bg-white" placeholder="City, Area" value={custForm.address} onChange={e=>setCustForm({...custForm,address:e.target.value})}/></div>
                </div>
              </div>
            )}
          </div>

          {/* ── SECTION B: Cart ── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold">B</div>
                <h3 className="font-semibold text-slate-800">Products ({items.length})</h3>
              </div>
              <button type="button" onClick={addItem} className="btn-secondary text-xs flex items-center gap-1 py-1.5">
                <Plus size={13}/> Add Product
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item,idx) => (
                <CartItem key={idx} item={item} index={idx} onUpdate={updateItem} onRemove={removeItem}/>
              ))}
            </div>

            {/* Cart totals */}
            {items.length > 0 && (
              <div className="mt-4 bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
                {totalDiscount > 0 && <div className="flex justify-between text-green-600"><span>Total Discount</span><span>-{fmt(totalDiscount)}</span></div>}
                {items.filter(i=>i.is_gift).length > 0 && (
                  <div className="flex justify-between text-pink-600"><span>Gift Items</span><span>{items.filter(i=>i.is_gift).length} item(s)</span></div>
                )}
                <div className="flex justify-between font-bold text-slate-900 text-base border-t border-slate-200 pt-2 mt-2">
                  <span>Grand Total</span><span className="text-primary-700">{fmt(grandTotal)}</span>
                </div>
              </div>
            )}
          </div>

          {/* ── SECTION C: Payment ── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold">C</div>
              <h3 className="font-semibold text-slate-800">Payment</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Payment Type *</label>
                <select className="select" value={paymentType} onChange={e=>setPaymentType(e.target.value)}>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI / Online</option>
                  <option value="emi">EMI</option>
                  <option value="exchange">Exchange</option>
                </select>
              </div>
              {paymentType==='emi' && (
                <div>
                  <label className="label">Bank / Financier *</label>
                  <select className="select" value={emiBank} onChange={e=>setEmiBank(e.target.value)} required={paymentType==='emi'}>
                    <option value="">Select Bank</option>
                    {BANKS.map(b=><option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              )}
              <div className="col-span-2">
                <label className="label">Notes <span className="text-slate-400">(optional)</span></label>
                <input className="input" placeholder="Any additional notes..." value={notes} onChange={e=>setNotes(e.target.value)}/>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || phoneStatus==='checking' || phoneStatus==='exists'}
            className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-base"
          >
            {loading ? 'Saving...' : `Save & Generate Bill · ${fmt(grandTotal)}`}
          </button>
          {phoneStatus==='exists' && <p className="text-center text-xs text-orange-600">⚠ Resolve the existing customer warning above before saving</p>}
        </form>
      </div>
    </div>
  )
}
