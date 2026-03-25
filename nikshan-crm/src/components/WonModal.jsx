import { useState } from 'react'
import { X, CheckCircle, ShoppingBag } from 'lucide-react'
import api from '../lib/api'
import useAuthStore from '../store/auth'
import toast from 'react-hot-toast'

const EMI_BANKS = ['HDFC', 'SBI', 'AXIS', 'ICICI', 'Bajaj Finserv', 'TVS Credit', 'HomeCredit', 'Muthoot Finance']

export default function WonModal({ lead, onClose, onSuccess }) {
  const { user } = useAuthStore()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [wonData, setWonData] = useState(null)

  const [purchaseForm, setPurchaseForm] = useState({
    product_name: lead.product_interest || '',
    brand: '',
    model: '',
    serial_number: '',
    amount: lead.estimated_value || '',
    payment_type: 'cash',
    emi_bank: '',
    loan_amount: '',
    monthly_emi: '',
    tenure_months: '12',
    start_date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  const handleMarkWon = async () => {
    setLoading(true)
    try {
      const { data } = await api.patch(`/leads/${lead.id}/status`, {
        status: 'won',
        converted_by: user.id,
      })
      setWonData(data)
      setStep(2)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to mark lead as won')
    } finally {
      setLoading(false)
    }
  }

  const handlePurchaseSubmit = async (e) => {
    e.preventDefault()
    if (!purchaseForm.product_name || !purchaseForm.amount) {
      toast.error('Product name and amount are required')
      return
    }
    if (purchaseForm.payment_type === 'emi' && !purchaseForm.emi_bank) {
      toast.error('Please select an EMI bank')
      return
    }

    setLoading(true)
    try {
      const payload = {
        customer_id: wonData.customer.id,
        lead_id: lead.id,
        store_id: lead.store_id || user.store_id,
        sold_by: user.id,
        product_name: purchaseForm.product_name,
        brand: purchaseForm.brand,
        model: purchaseForm.model,
        serial_number: purchaseForm.serial_number,
        amount: parseFloat(purchaseForm.amount),
        payment_type: purchaseForm.payment_type,
        emi_bank: purchaseForm.payment_type === 'emi' ? purchaseForm.emi_bank : null,
        notes: purchaseForm.notes,
      }

      if (purchaseForm.payment_type === 'emi') {
        payload.bank_name = purchaseForm.emi_bank
        payload.loan_amount = parseFloat(purchaseForm.loan_amount) || parseFloat(purchaseForm.amount)
        payload.monthly_emi = parseFloat(purchaseForm.monthly_emi) || 0
        payload.tenure_months = parseInt(purchaseForm.tenure_months) || 12
        payload.start_date = purchaseForm.start_date
      }

      await api.post('/purchases', payload)
      toast.success('Purchase recorded successfully!')
      onSuccess(wonData.lead)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create purchase')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">
            {step === 1 ? 'Mark Lead as Won' : 'Record Purchase'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        {step === 1 && (
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <CheckCircle size={24} className="text-emerald-500 flex-shrink-0" />
              <div>
                <p className="font-semibold text-slate-900">Lead Won!</p>
                <p className="text-sm text-slate-500">Converting <strong>{lead.name}</strong> to a customer</p>
              </div>
            </div>
            <div className="space-y-2 mb-6 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Lead Name:</span><strong>{lead.name}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Phone:</span><strong>{lead.phone}</strong>
              </div>
              {lead.product_interest && (
                <div className="flex justify-between text-slate-600">
                  <span>Product Interest:</span><strong>{lead.product_interest}</strong>
                </div>
              )}
              {lead.estimated_value && (
                <div className="flex justify-between text-slate-600">
                  <span>Estimated Value:</span><strong>₹{Number(lead.estimated_value).toLocaleString('en-IN')}</strong>
                </div>
              )}
            </div>
            <p className="text-sm text-slate-500 mb-5">
              A customer profile will be auto-created from this lead's details. You'll then fill in the purchase details.
            </p>
            <div className="flex gap-3">
              <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleMarkWon} disabled={loading} className="btn-primary flex-1">
                {loading ? 'Processing...' : 'Confirm & Continue'}
              </button>
            </div>
          </div>
        )}

        {step === 2 && wonData && (
          <form onSubmit={handlePurchaseSubmit} className="p-5 space-y-4">
            <div className="p-3 bg-primary-50 rounded-lg border border-primary-100 text-sm text-primary-800">
              <strong>Customer Created:</strong> {wonData.customer.name} ({wonData.customer.phone})
            </div>

            <div className="flex items-center gap-2 text-slate-700 font-medium text-sm">
              <ShoppingBag size={16} />
              Purchase Details
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="label">Product Name *</label>
                <input
                  className="input"
                  value={purchaseForm.product_name}
                  onChange={e => setPurchaseForm(p => ({ ...p, product_name: e.target.value }))}
                  required
                  placeholder="e.g. Smart LED TV"
                />
              </div>
              <div>
                <label className="label">Brand</label>
                <input
                  className="input"
                  value={purchaseForm.brand}
                  onChange={e => setPurchaseForm(p => ({ ...p, brand: e.target.value }))}
                  placeholder="e.g. Samsung"
                />
              </div>
              <div>
                <label className="label">Model</label>
                <input
                  className="input"
                  value={purchaseForm.model}
                  onChange={e => setPurchaseForm(p => ({ ...p, model: e.target.value }))}
                  placeholder="e.g. UA55AU7700"
                />
              </div>
              <div>
                <label className="label">Serial Number</label>
                <input
                  className="input"
                  value={purchaseForm.serial_number}
                  onChange={e => setPurchaseForm(p => ({ ...p, serial_number: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="label">Amount (₹) *</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  value={purchaseForm.amount}
                  onChange={e => setPurchaseForm(p => ({ ...p, amount: e.target.value }))}
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="label">Payment Type</label>
                <select
                  className="input"
                  value={purchaseForm.payment_type}
                  onChange={e => setPurchaseForm(p => ({ ...p, payment_type: e.target.value }))}
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="emi">EMI</option>
                  <option value="exchange">Exchange</option>
                </select>
              </div>

              {purchaseForm.payment_type === 'emi' && (
                <>
                  <div className="col-span-2">
                    <label className="label">EMI Bank *</label>
                    <select
                      className="input"
                      value={purchaseForm.emi_bank}
                      onChange={e => setPurchaseForm(p => ({ ...p, emi_bank: e.target.value }))}
                      required
                    >
                      <option value="">Select Bank</option>
                      {EMI_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Loan Amount (₹)</label>
                    <input
                      className="input"
                      type="number"
                      value={purchaseForm.loan_amount}
                      onChange={e => setPurchaseForm(p => ({ ...p, loan_amount: e.target.value }))}
                      placeholder="Same as amount if blank"
                    />
                  </div>
                  <div>
                    <label className="label">Monthly EMI (₹) *</label>
                    <input
                      className="input"
                      type="number"
                      value={purchaseForm.monthly_emi}
                      onChange={e => setPurchaseForm(p => ({ ...p, monthly_emi: e.target.value }))}
                      required={purchaseForm.payment_type === 'emi'}
                    />
                  </div>
                  <div>
                    <label className="label">Tenure (months)</label>
                    <select
                      className="input"
                      value={purchaseForm.tenure_months}
                      onChange={e => setPurchaseForm(p => ({ ...p, tenure_months: e.target.value }))}
                    >
                      {[3, 6, 9, 12, 18, 24, 36].map(t => <option key={t} value={t}>{t} months</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Start Date</label>
                    <input
                      className="input"
                      type="date"
                      value={purchaseForm.start_date}
                      onChange={e => setPurchaseForm(p => ({ ...p, start_date: e.target.value }))}
                    />
                  </div>
                </>
              )}

              <div className="col-span-2">
                <label className="label">Notes</label>
                <textarea
                  className="input h-16 resize-none"
                  value={purchaseForm.notes}
                  onChange={e => setPurchaseForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Any additional notes..."
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">Skip</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? 'Saving...' : 'Record Purchase'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
