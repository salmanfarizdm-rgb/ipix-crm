import React, { useState, useRef } from 'react'
import api from '../lib/api.js'
import { Sparkles, Send, Download, Loader2, RotateCcw } from 'lucide-react'
import { format } from 'date-fns'

const EXAMPLE_QUERIES = [
  'Show me all Samsung mobile purchases this month',
  'Which store had the highest sales last month?',
  'List all pending EMI customers',
  'How many ACs were sold this week?',
  'Show all service complaints raised in March',
  'Which salesperson closed the most deals this quarter?',
  'Show all cancelled orders with reasons',
  'List customers who bought on EMI from HDFC Bank',
]

const fmt = n => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—'
const fmtDate = d => { try { return format(new Date(d), 'dd MMM yyyy') } catch { return d || '' } }

function flattenRow(row) {
  const out = {}
  for (const [k, v] of Object.entries(row)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      for (const [k2, v2] of Object.entries(v)) out[`${k}.${k2}`] = v2
    } else if (!Array.isArray(v)) {
      out[k] = v
    }
  }
  return out
}

function exportCSV(data, query) {
  if (!data?.length) return
  const rows = data.map(flattenRow)
  const cols = Object.keys(rows[0])
  const csv  = [cols.join(','), ...rows.map(r => cols.map(c => JSON.stringify(r[c] ?? '')).join(','))].join('\n')
  const a    = document.createElement('a')
  a.href     = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  a.download = `report_${Date.now()}.csv`
  a.click()
}

function DataTable({ data }) {
  if (!data?.length) return null
  const rows = data.map(flattenRow)
  const allCols = Object.keys(rows[0])
  // Prefer clean columns
  const preferCols = ['name','phone','product_name','brand','category','amount','final_price','grand_total','payment_type','purchase_date','created_at','status','request_type','invoice_number']
  const cols = [...preferCols.filter(c => allCols.includes(c)), ...allCols.filter(c => !preferCols.includes(c) && !c.includes('.id') && !['id','customer_id','store_id','sold_by','invoice_id','created_by','assigned_to','product_id'].includes(c))].slice(0, 10)

  const fmtCell = (col, val) => {
    if (val == null) return '—'
    if (typeof val === 'boolean') return val ? 'Yes' : 'No'
    if (col.includes('amount') || col.includes('price') || col.includes('total') || col.includes('subtotal') || col.includes('emi')) return fmt(val)
    if (col.includes('date') || col.includes('_at')) return fmtDate(val)
    return String(val)
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-xs">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>{cols.map(c=><th key={c} className="text-left py-2.5 px-3 font-semibold text-slate-500 whitespace-nowrap">{c.replace(/_/g,' ').replace(/\./g,' → ')}</th>)}</tr>
        </thead>
        <tbody>
          {rows.slice(0,100).map((r,i)=>(
            <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
              {cols.map(c=><td key={c} className="py-2.5 px-3 text-slate-700">{fmtCell(c, r[c])}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 100 && <div className="py-2 text-center text-xs text-slate-400">Showing 100 of {rows.length} records</div>}
    </div>
  )
}

export default function AIReports() {
  const [query, setQuery]   = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError]   = useState(null)
  const inputRef            = useRef(null)

  const handleSubmit = async e => {
    e?.preventDefault()
    if (!query.trim() || loading) return
    setLoading(true); setResult(null); setError(null)
    try {
      const res = await api.post('/ai-reports/query', { query: query.trim() })
      setResult(res.data)
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to get answer. Check ANTHROPIC_API_KEY is set.')
    } finally { setLoading(false) }
  }

  const handleExample = q => { setQuery(q); setTimeout(() => inputRef.current?.focus(), 50) }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white">
          <Sparkles size={20}/>
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">AI Reports</h1>
          <p className="text-sm text-slate-500">Ask anything about your CRM data in plain English</p>
        </div>
      </div>

      {/* Query input */}
      <div className="card p-5">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            ref={inputRef}
            className="input flex-1 text-base"
            placeholder='e.g. "Show all Samsung TV sales this month" or "Which salesperson has highest conversions?"'
            value={query}
            onChange={e=>setQuery(e.target.value)}
            disabled={loading}
          />
          <button type="submit" disabled={!query.trim() || loading}
            className="btn-primary flex items-center gap-2 px-5 disabled:opacity-50">
            {loading ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>}
            {loading ? 'Analyzing...' : 'Ask'}
          </button>
        </form>

        {/* Example queries */}
        <div className="mt-4">
          <div className="text-xs text-slate-400 font-medium mb-2">Try these examples:</div>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUERIES.map(q => (
              <button key={q} onClick={() => handleExample(q)}
                className="text-xs px-3 py-1.5 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-full transition-colors border border-primary-100">
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="card border-red-200 bg-red-50 text-red-700 text-sm p-4">
          ⚠ {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-4">
          {/* Answer text */}
          <div className="card bg-primary-50 border-primary-200">
            <div className="flex items-start gap-3">
              <Sparkles size={18} className="text-primary-600 mt-0.5 shrink-0"/>
              <div>
                <div className="text-sm font-semibold text-primary-900 mb-1">Answer</div>
                <p className="text-sm text-primary-800">{result.answer}</p>
              </div>
            </div>
          </div>

          {/* Data table */}
          {result.data?.length > 0 && (
            <div className="card p-0 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                <div className="font-semibold text-slate-800 text-sm">{result.data.length} records found</div>
                <div className="flex gap-2">
                  <button onClick={() => exportCSV(result.data, result.query)}
                    className="btn-secondary flex items-center gap-2 text-xs py-1.5">
                    <Download size={13}/> Export CSV
                  </button>
                  <button onClick={() => { setResult(null); setQuery('') }}
                    className="btn-secondary flex items-center gap-2 text-xs py-1.5">
                    <RotateCcw size={13}/> New Query
                  </button>
                </div>
              </div>
              <div className="p-4">
                <DataTable data={result.data} />
              </div>
            </div>
          )}

          {result.data?.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-sm">No records found for this query.</div>
          )}
        </div>
      )}
    </div>
  )
}
