import React from 'react'
import { format } from 'date-fns'
import { Printer, X, MessageCircle } from 'lucide-react'

const fmt = n => `\u20B9${Number(n || 0).toLocaleString('en-IN')}`

export default function Receipt({ invoice, purchases, purchase, customer, store, onClose, toast: toastFn }) {
  const isInvoiceMode = !!invoice
  const invoiceNo = isInvoiceMode
    ? invoice.invoice_number
    : `INV-${format(new Date(), 'yyyyMMdd')}-${String(purchase?.id || '').slice(-4).toUpperCase() || Math.floor(Math.random()*9000+1000)}`

  const items = isInvoiceMode ? (purchases || []) : (purchase ? [purchase] : [])
  const cust  = customer
  const storeName    = isInvoiceMode ? (invoice?.nk_stores?.name || 'Nikshan Electronics') : (store?.name || 'Nikshan Electronics')
  const storePhone   = invoice?.nk_stores?.phone
  const storeGstin   = invoice?.nk_stores?.gstin
  const storeAddress = invoice?.nk_stores?.address
  const grandTotal = isInvoiceMode ? invoice.grand_total : (purchase?.amount || 0)
  const payType    = isInvoiceMode ? invoice.payment_type : purchase?.payment_type
  const emiBank    = isInvoiceMode ? invoice.emi_bank : purchase?.emi_bank
  const txDate     = isInvoiceMode ? invoice.purchase_date : (purchase?.purchase_date || new Date().toISOString().split('T')[0])
  const subtotal   = isInvoiceMode ? (invoice.subtotal || grandTotal) : grandTotal
  const totalDisc  = isInvoiceMode ? (invoice.total_discount || 0) : 0
  const gstTotal   = isInvoiceMode ? (invoice.gst_total || 0) : 0
  const subtotalBeforeGst = isInvoiceMode ? (invoice.subtotal_before_gst || 0) : 0

  const dateStr = (() => { try { return format(new Date(txDate), 'dd MMM yyyy') } catch { return txDate } })()

  const handleWhatsApp = () => {
    const phone = cust?.phone?.replace(/\D/g, '')
    if (!phone) return (toastFn ? toastFn('No phone number for this customer') : alert('No phone number for this customer'))

    const itemLines = items.map(i =>
      `\u2022 ${i.product_name}${i.is_gift ? ' (GIFT)' : ''} \u2014 ${i.is_gift ? 'FREE' : fmt(i.final_price || i.amount)}`
    ).join('\n')

    const paymentText = invoice?.split_payment
      ? `${fmt(invoice.amount1)} ${invoice.payment_type?.toUpperCase()} + ${fmt(invoice.amount2)} ${invoice.payment_type2?.toUpperCase()}`
      : (payType || '').toUpperCase()

    const msg = `Dear ${cust?.name || 'Customer'}, thank you for shopping at Nikshan ${storeName}! \uD83D\uDECD\uFE0F\n\nInvoice: #${invoiceNo}\nDate: ${dateStr || ''}\n\nProducts:\n${itemLines}\n\nTotal: ${fmt(grandTotal)}\nPayment: ${paymentText}\n\nFor service & support: ${storePhone || 'visit nearest Nikshan store'}\n\nThank you for choosing Nikshan Electronics! \u2B50`

    const url = `https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
  }

  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=800,height=700')
    const css = `
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Helvetica Neue',Arial,sans-serif;color:#1e293b;background:#fff;padding:40px;max-width:680px;margin:0 auto}
      .header{text-align:center;margin-bottom:28px;border-bottom:2px solid #432a6f;padding-bottom:20px}
      .logo{font-size:26px;font-weight:800;color:#432a6f;letter-spacing:-1px}
      .store-name{font-size:15px;font-weight:700;color:#1e293b;margin-top:4px}
      .store-details{font-size:11px;color:#64748b;margin-top:3px;line-height:1.6}
      .store-gstin{font-size:11px;color:#432a6f;font-weight:600;margin-top:4px}
      .invoice-title{font-size:18px;font-weight:700;margin:18px 0 4px;color:#0f172a}
      .invoice-no{font-size:12px;color:#64748b}
      .section-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#94a3b8;margin:16px 0 8px}
      .info-row{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #f1f5f9}
      .info-label{font-size:12px;color:#64748b}.info-value{font-size:12px;font-weight:600;color:#0f172a}
      table{width:100%;border-collapse:collapse;margin:12px 0}
      th{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;padding:8px 0;border-bottom:1px solid #e2e8f0;text-align:left}
      td{padding:9px 0;border-bottom:1px solid #f8fafc;font-size:12px;vertical-align:top}
      .gift-badge{display:inline-block;background:#dcfce7;color:#166534;font-size:10px;font-weight:700;padding:1px 6px;border-radius:10px;margin-left:4px}
      .warranty-text{font-size:10px;color:#94a3b8;margin-top:3px}
      .totals{margin:16px 0;padding:12px;background:#f8fafc;border-radius:8px}
      .totals-row{display:flex;justify-content:space-between;padding:4px 0;font-size:13px;color:#475569}
      .totals-grand{display:flex;justify-content:space-between;padding:10px 0 0;font-size:17px;font-weight:800;color:#432a6f;border-top:1px solid #e2e8f0;margin-top:6px}
      .pay-badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;background:#ede9f9;color:#432a6f;margin-top:8px}
      .footer{text-align:center;margin-top:28px;padding-top:16px;border-top:1px solid #e2e8f0}
      .thank-you{font-size:14px;font-weight:700;color:#432a6f;margin-bottom:5px}
      .footer p{font-size:11px;color:#94a3b8}
      @media print{body{padding:20px}}
    `
    const doc = win.document
    doc.title = 'Receipt \u2014 ' + invoiceNo
    const styleEl = doc.createElement('style')
    styleEl.textContent = css
    doc.head.appendChild(styleEl)

    const body = doc.body

    // Header with store details and GSTIN — built with DOM methods to avoid innerHTML XSS
    const headerDiv = doc.createElement('div')
    headerDiv.className = 'header'

    const logoDiv = doc.createElement('div')
    logoDiv.className = 'logo'
    logoDiv.textContent = 'NIKSHAN ELECTRONICS'
    headerDiv.appendChild(logoDiv)

    const storeNameDiv = doc.createElement('div')
    storeNameDiv.className = 'store-name'
    storeNameDiv.textContent = storeName
    headerDiv.appendChild(storeNameDiv)

    if (storeAddress) {
      const addrDiv = doc.createElement('div')
      addrDiv.className = 'store-details'
      addrDiv.textContent = storeAddress
      headerDiv.appendChild(addrDiv)
    }

    if (storePhone) {
      const phoneDiv = doc.createElement('div')
      phoneDiv.className = 'store-details'
      phoneDiv.textContent = 'Ph: ' + storePhone
      headerDiv.appendChild(phoneDiv)
    }

    if (storeGstin) {
      const gstinDiv = doc.createElement('div')
      gstinDiv.className = 'store-gstin'
      gstinDiv.textContent = 'GSTIN: ' + storeGstin
      headerDiv.appendChild(gstinDiv)
    }

    const titleDiv = doc.createElement('div')
    titleDiv.className = 'invoice-title'
    titleDiv.textContent = 'SALES INVOICE'
    headerDiv.appendChild(titleDiv)

    const invNoDiv = doc.createElement('div')
    invNoDiv.className = 'invoice-no'
    const invStrong = doc.createElement('strong')
    invStrong.textContent = invoiceNo
    invNoDiv.textContent = 'Invoice: '
    invNoDiv.appendChild(invStrong)
    const invDateSpan = doc.createElement('span')
    invDateSpan.textContent = ' \u00A0|\u00A0 Date: ' + dateStr
    invNoDiv.appendChild(invDateSpan)
    headerDiv.appendChild(invNoDiv)

    body.appendChild(headerDiv)

    // Customer section
    const st1 = doc.createElement('div')
    st1.className = 'section-title'
    st1.textContent = 'Customer'
    body.appendChild(st1)

    const custRows = [['Name', cust?.name || '\u2014'], ['Phone', cust?.phone || '\u2014'], ...(cust?.address ? [['Address', cust.address]] : [])]
    custRows.forEach(([l, v]) => {
      const row = doc.createElement('div')
      row.className = 'info-row'
      const labelSpan = doc.createElement('span')
      labelSpan.className = 'info-label'
      labelSpan.textContent = l
      const valSpan = doc.createElement('span')
      valSpan.className = 'info-value'
      valSpan.textContent = v
      row.appendChild(labelSpan)
      row.appendChild(valSpan)
      body.appendChild(row)
    })

    // Items table
    const st2 = doc.createElement('div')
    st2.className = 'section-title'
    st2.textContent = 'Items Purchased'
    body.appendChild(st2)

    const tbl = doc.createElement('table')
    const thead = tbl.createTHead()
    const hrow = thead.insertRow()
    ;['Product', 'Model', 'MRP', 'GST%', 'GST Amt', 'Final'].forEach((colH, i) => {
      const th = doc.createElement('th')
      th.textContent = colH
      if (i >= 2) th.style.textAlign = 'right'
      hrow.appendChild(th)
    })
    const tbody = tbl.createTBody()
    items.forEach(item => {
      const tr = tbody.insertRow()

      const td1 = tr.insertCell()
      const nameStrong = doc.createElement('strong')
      nameStrong.textContent = item.product_name || '\u2014'
      td1.appendChild(nameStrong)
      if (item.brand) {
        const br = doc.createElement('br')
        td1.appendChild(br)
        const brandSpan = doc.createElement('span')
        brandSpan.style.cssText = 'font-size:11px;color:#94a3b8'
        brandSpan.textContent = item.brand
        td1.appendChild(brandSpan)
      }
      if (item.is_gift) {
        const giftSpan = doc.createElement('span')
        giftSpan.className = 'gift-badge'
        giftSpan.textContent = 'GIFT'
        td1.appendChild(giftSpan)
      }
      if (item.warranty_months) {
        const wDiv = doc.createElement('div')
        wDiv.className = 'warranty-text'
        let wText = `Warranty: ${item.warranty_months} months`
        if (item.warranty_expiry) {
          try { wText += ` | Expires: ${format(new Date(item.warranty_expiry), 'dd MMM yyyy')}` }
          catch { wText += ` | Expires: ${item.warranty_expiry}` }
        }
        wDiv.textContent = wText
        td1.appendChild(wDiv)
      }

      const td2 = tr.insertCell()
      td2.textContent = item.model || item.model_number || '\u2014'
      td2.style.cssText = 'font-size:11px;color:#64748b;font-family:monospace'

      const td3 = tr.insertCell()
      td3.textContent = fmt(item.actual_price)
      td3.style.cssText = 'text-align:right;color:#94a3b8'

      const td4 = tr.insertCell()
      td4.textContent = item.gst_percentage != null ? `${item.gst_percentage}%` : '\u2014'
      td4.style.cssText = 'text-align:right;color:#64748b'

      const td5 = tr.insertCell()
      td5.textContent = item.gst_amount != null ? fmt(item.gst_amount) : '\u2014'
      td5.style.cssText = 'text-align:right;color:#64748b'

      const td6 = tr.insertCell()
      td6.textContent = item.is_gift ? 'FREE' : fmt(item.final_price || item.amount)
      td6.style.cssText = `text-align:right;font-weight:700;color:${item.is_gift ? '#16a34a' : '#0f172a'}`
    })
    body.appendChild(tbl)

    // Totals
    const totalsDiv = doc.createElement('div')
    totalsDiv.className = 'totals'

    const addTotalsRow = (label, value, style) => {
      const row = doc.createElement('div')
      row.className = 'totals-row'
      if (style) row.style.cssText = style
      const lSpan = doc.createElement('span')
      lSpan.textContent = label
      const vSpan = doc.createElement('span')
      vSpan.textContent = value
      row.appendChild(lSpan)
      row.appendChild(vSpan)
      totalsDiv.appendChild(row)
    }

    if (gstTotal > 0) {
      addTotalsRow('Subtotal (excl. GST)', fmt(subtotalBeforeGst || subtotal))
      addTotalsRow('Total GST', fmt(gstTotal))
    } else if (subtotal !== grandTotal) {
      addTotalsRow('Subtotal', fmt(subtotal))
    }
    if (totalDisc > 0) {
      addTotalsRow('Total Discount', `-${fmt(totalDisc)}`, 'color:#16a34a')
    }

    const grandRow = doc.createElement('div')
    grandRow.className = 'totals-grand'
    const gl = doc.createElement('span')
    gl.textContent = 'Grand Total'
    const gv = doc.createElement('span')
    gv.textContent = fmt(grandTotal)
    grandRow.appendChild(gl)
    grandRow.appendChild(gv)
    totalsDiv.appendChild(grandRow)

    body.appendChild(totalsDiv)

    // Payment badge
    const payDiv = doc.createElement('div')
    payDiv.style.textAlign = 'center'
    const badge = doc.createElement('span')
    badge.className = 'pay-badge'
    if (invoice?.split_payment) {
      badge.textContent = `${fmt(invoice.amount1)} ${(invoice.payment_type || '').toUpperCase()} + ${fmt(invoice.amount2)} ${(invoice.payment_type2 || '').toUpperCase()}`
    } else {
      badge.textContent = (payType || '').toUpperCase()
    }
    payDiv.appendChild(badge)
    if (emiBank && !invoice?.split_payment) {
      const bankSpan = doc.createElement('span')
      bankSpan.style.cssText = 'font-size:11px;color:#94a3b8;margin-left:8px'
      bankSpan.textContent = 'via ' + emiBank
      payDiv.appendChild(bankSpan)
    }
    body.appendChild(payDiv)

    const footer = doc.createElement('div')
    footer.className = 'footer'
    const thankDiv = doc.createElement('div')
    thankDiv.className = 'thank-you'
    thankDiv.textContent = 'Thank you for shopping at Nikshan!'
    footer.appendChild(thankDiv)
    const supportP = doc.createElement('p')
    supportP.textContent = `For service & support: ${storePhone || 'visit your nearest Nikshan store'}`
    footer.appendChild(supportP)
    const genP = doc.createElement('p')
    genP.style.cssText = 'margin-top:6px;color:#cbd5e1'
    genP.textContent = 'Generated by IPIX CRM'
    footer.appendChild(genP)
    body.appendChild(footer)

    win.focus()
    setTimeout(() => { win.print(); win.close() }, 500)
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Receipt Ready</h2>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="btn-primary flex items-center gap-2 text-sm"><Printer size={15}/> Print Bill</button>
            <button
              onClick={handleWhatsApp}
              className="flex items-center gap-2 text-sm px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
            >
              <MessageCircle size={15}/> Send on WhatsApp
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X size={16} className="text-slate-400"/></button>
          </div>
        </div>
        <div className="p-5 space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <div className="text-green-700 font-bold text-lg">{fmt(grandTotal)}</div>
            <div className="text-xs text-green-600 mt-1">Purchase recorded &middot; Invoice {invoiceNo}</div>
          </div>
          <div className="text-sm text-slate-600 space-y-1.5">
            <div className="flex justify-between"><span className="text-slate-400">Customer</span><span className="font-medium">{cust?.name}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Items</span><span className="font-medium">{items.length} product{items.length!==1?'s':''}</span></div>
            {gstTotal > 0 && (
              <div className="flex justify-between text-sm text-slate-500">
                <span>GST</span><span>+{fmt(gstTotal)}</span>
              </div>
            )}
            {invoice?.split_payment ? (
              <div className="flex justify-between">
                <span className="text-slate-400">Payment</span>
                <span className="font-medium text-xs">{fmt(invoice.amount1)} {invoice.payment_type?.toUpperCase()} + {fmt(invoice.amount2)} {invoice.payment_type2?.toUpperCase()}</span>
              </div>
            ) : (
              <div className="flex justify-between"><span className="text-slate-400">Payment</span><span className="font-medium capitalize">{payType}</span></div>
            )}
            {emiBank && !invoice?.split_payment && <div className="flex justify-between"><span className="text-slate-400">Bank</span><span className="font-medium">{emiBank}</span></div>}
          </div>
          <p className="text-xs text-slate-400 text-center">Click &ldquo;Print Bill&rdquo; to open a printable copy</p>
        </div>
      </div>
    </div>
  )
}
