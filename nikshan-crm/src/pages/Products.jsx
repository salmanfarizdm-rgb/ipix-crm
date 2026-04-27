import React, { useEffect, useState } from 'react'
import api from '../lib/api.js'
import { useAuth } from '../store/auth.js'
import toast from 'react-hot-toast'
import { Plus, X, Search, Edit2, Trash2, Package } from 'lucide-react'

const CATEGORIES = ['Television','Air Conditioner','Refrigerator','Washing Machine','Smartphone','Laptop','Audio','Kitchen Appliance','Other']
const fmt = n => `\u20B9${Number(n).toLocaleString('en-IN')}`

function ProductModal({ product, onClose, onSuccess }) {
  const isEdit = !!product
  const [form, setForm] = useState({
    model_number:        product?.model_number        || '',
    product_name:        product?.product_name        || '',
    brand:               product?.brand               || '',
    category:            product?.category            || '',
    actual_price:        product?.actual_price        || '',
    serial_number:       product?.serial_number       || '',
    image_url:           product?.image_url           || '',
    gst_percentage:      product?.gst_percentage      ?? 18,
    warranty_months:     product?.warranty_months     ?? 12,
    stock_count:         product?.stock_count         ?? 0,
    low_stock_threshold: product?.low_stock_threshold ?? 3,
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true)
    try {
      if (isEdit) await api.put(`/products/${product.id}`, form)
      else         await api.post('/products', form)
      toast.success(isEdit ? 'Product updated!' : 'Product added!')
      onSuccess()
    } catch (err) { toast.error(err?.response?.data?.error || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">{isEdit ? 'Edit Product' : 'Add Product'}</h2>
          <button onClick={onClose}><X size={20} className="text-slate-400"/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Model Number *</label>
              <input className="input" placeholder="e.g. SAM-QN55Q80C" value={form.model_number} onChange={e=>setForm({...form,model_number:e.target.value})} required />
            </div>
            <div>
              <label className="label">Brand *</label>
              <input className="input" placeholder="e.g. Samsung" value={form.brand} onChange={e=>setForm({...form,brand:e.target.value})} required />
            </div>
          </div>
          <div>
            <label className="label">Product Name *</label>
            <input className="input" placeholder="e.g. Samsung 55 inch QLED 4K Smart TV" value={form.product_name} onChange={e=>setForm({...form,product_name:e.target.value})} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <select className="select" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                <option value="">Select</option>
                {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Actual Price (\u20B9) *</label>
              <input className="input" type="number" placeholder="89990" value={form.actual_price} onChange={e=>setForm({...form,actual_price:e.target.value})} required />
            </div>
          </div>
          <div>
            <label className="label">Serial Number <span className="text-slate-400">(optional)</span></label>
            <input className="input" placeholder="Serial / SKU number" value={form.serial_number} onChange={e=>setForm({...form,serial_number:e.target.value})} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">GST %</label>
              <select className="select" value={form.gst_percentage ?? 18} onChange={e=>setForm({...form,gst_percentage:parseFloat(e.target.value)})}>
                {[0,5,12,18,28].map(p=><option key={p} value={p}>{p}%</option>)}
              </select>
            </div>
            <div>
              <label className="label">Warranty (months)</label>
              <input className="input" type="number" min={0} placeholder="12" value={form.warranty_months ?? 12} onChange={e=>setForm({...form,warranty_months:parseInt(e.target.value)||0})} />
            </div>
            <div>
              <label className="label">Stock Count</label>
              <input className="input" type="number" min={0} placeholder="0" value={form.stock_count ?? 0} onChange={e=>setForm({...form,stock_count:parseInt(e.target.value)||0})} />
            </div>
          </div>
          <div>
            <label className="label">Low Stock Alert (threshold)</label>
            <input className="input" type="number" min={0} placeholder="3" value={form.low_stock_threshold ?? 3} onChange={e=>setForm({...form,low_stock_threshold:parseInt(e.target.value)||3})} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Saving...' : isEdit ? 'Update' : 'Add Product'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Products() {
  const [products, setProducts]   = useState([])
  const [search, setSearch]       = useState('')
  const [category, setCategory]   = useState('')
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]     = useState(null)
  const { user } = useAuth()
  const isAdmin = ['admin','branch_manager'].includes(user?.role)

  const load = () => {
    setLoading(true)
    const p = new URLSearchParams()
    if (search)   p.set('search', search)
    if (category) p.set('category', category)
    api.get(`/products?${p}`).then(r => setProducts(r.data || [])).finally(() => setLoading(false))
  }
  useEffect(load, [search, category])

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove "${name}" from product database?`)) return
    try { await api.delete(`/products/${id}`); toast.success('Removed'); load() }
    catch { toast.error('Failed') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Product Database</h1>
          <p className="text-sm text-slate-500">{products.length} products &middot; Used for auto-fill in purchase forms</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16}/> Add Product
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input className="input pl-9 w-64" placeholder="Search model, name, brand..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <select className="select w-48" value={category} onChange={e=>setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {['Model No.','Product Name','Brand','Category','Actual Price','GST','Warranty','Stock','Action'].map(h=>
                <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-500">{h}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" className="text-center py-12 text-slate-400">Loading...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan="9" className="text-center py-12 text-slate-400">
                <Package size={32} className="mx-auto mb-2 text-slate-200"/>
                No products yet
              </td></tr>
            ) : products.map(p => (
              <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="py-3 px-4 font-mono text-xs text-slate-600">{p.model_number || '\u2014'}</td>
                <td className="py-3 px-4 font-medium text-slate-800">{p.product_name}</td>
                <td className="py-3 px-4 text-slate-600">{p.brand || '\u2014'}</td>
                <td className="py-3 px-4">
                  {p.category && <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">{p.category}</span>}
                </td>
                <td className="py-3 px-4 font-semibold text-slate-900">{p.actual_price ? fmt(p.actual_price) : '\u2014'}</td>
                <td className="py-3 px-4 text-slate-600">{p.gst_percentage != null ? `${p.gst_percentage}%` : '\u2014'}</td>
                <td className="py-3 px-4 text-xs text-slate-500">{p.warranty_months || 12}m</td>
                <td className="py-3 px-4">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    p.stock_count === 0 ? 'bg-red-100 text-red-700'
                    : p.stock_count <= (p.low_stock_threshold || 3) ? 'bg-orange-100 text-orange-700'
                    : 'bg-green-100 text-green-700'
                  }`}>
                    {p.stock_count === 0 ? 'Out of stock' : `${p.stock_count} in stock`}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {isAdmin && (
                    <div className="flex gap-2">
                      <button onClick={() => setEditing(p)} className="text-primary-600 hover:text-primary-800"><Edit2 size={14}/></button>
                      <button
                        onClick={() => {
                          const v = prompt(`Update stock for ${p.product_name}:`, p.stock_count)
                          if (v !== null) api.put(`/products/${p.id}`, { stock_count: parseInt(v) || 0 }).then(load)
                        }}
                        className="text-orange-500 hover:text-orange-700"
                        title="Update Stock"
                      >
                        <Package size={14}/>
                      </button>
                      <button onClick={() => handleDelete(p.id, p.product_name)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && <ProductModal onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); load() }} />}
      {editing   && <ProductModal product={editing} onClose={() => setEditing(null)} onSuccess={() => { setEditing(null); load() }} />}
    </div>
  )
}
