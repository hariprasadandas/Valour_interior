import { useEffect, useMemo, useState } from 'react'
import apiFetch from '../lib/api'
import PageShell from './PageShell.jsx'

const statusPills = {
  Created: 'bg-slate-200 text-slate-700',
  Sent: 'bg-amber-200 text-amber-900',
  Delivered: 'bg-emerald-200 text-emerald-800',
}

const normalizeStatus = (value = 'Created') => {
  const lowered = value.toLowerCase()
  if (lowered === 'delivered') return 'Delivered'
  if (lowered === 'sent') return 'Sent'
  return 'Created'
}

const mapQuote = (quote) => {
  const status = normalizeStatus(quote.status)
  return {
    id: quote.quotationNumber || quote.id || quote._id || 'N/A',
    customer:
      quote.customer?.name || quote.customer || quote.customerName || 'Unknown',
    project: quote.projectName || quote.project || '—',
    amount: Number(quote.amount || 0),
    status,
    createdOn:
      quote.quotationDate ||
      quote.createdOn ||
      quote.createdAt ||
      new Date().toISOString(),
    deliveredOn: quote.deliveredOn || null,
  }
}

const QuotationHistory = () => {
  const [statusFilter, setStatusFilter] = useState('All')
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const fetchQuotes = async () => {
      try {
        setLoading(true)
        setError('')
        const response = await apiFetch('/api/quotes', {
          signal: controller.signal,
        })
        if (!response.ok) {
          throw new Error('Failed to fetch quotations from database')
        }
        const data = await response.json()
        if (Array.isArray(data)) {
          setQuotes(data.map(mapQuote))
        } else {
          setQuotes([])
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('[QuotationHistory] Fetch error:', err)
          setError(
            'Unable to load quotations from database. Please check your connection and try again.',
          )
          setQuotes([])
        }
      } finally {
        setLoading(false)
      }
    }

    fetchQuotes()
    return () => controller.abort()
  }, [])

  const dataset = quotes

  const stats = useMemo(() => {
    const created = dataset.filter((q) => q.status === 'Created').length
    const sent = dataset.filter((q) => q.status === 'Sent').length
    const delivered = dataset.filter((q) => q.status === 'Delivered').length
    const totalValue = dataset.reduce((sum, q) => sum + q.amount, 0)
    return { created, sent, delivered, totalValue }
  }, [dataset])

  const filteredQuotes = useMemo(() => {
    if (statusFilter === 'All') return dataset
    return dataset.filter((quote) => quote.status === statusFilter)
  }, [statusFilter, dataset])

  return (
    <PageShell
      title="Quotation History"
      description="Review created and delivered quotations. All data is stored and retrieved from MongoDB database."
    >
      <div className="space-y-8">
        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            Fetching quotations from MongoDB...
          </div>
        )}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
              Created
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {stats.created}
            </p>
            <p className="text-sm text-slate-500">Awaiting review</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
              Sent
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {stats.sent}
            </p>
            <p className="text-sm text-slate-500">With clients</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
              Delivered
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {stats.delivered}
            </p>
            <p className="text-sm text-slate-500">Closed</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
              Value
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              ₹{stats.totalValue.toLocaleString('en-IN')}
            </p>
            <p className="text-sm text-slate-500">Across all quotes</p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Activity
              </h2>
              <p className="text-sm text-slate-500">
                Filter by status to review recent documents
              </p>
            </div>
            <div className="flex gap-2">
              {['All', 'Created', 'Sent', 'Delivered'].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                    statusFilter === status
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm text-slate-600">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-3">Quote ID</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Project</th>
                  <th className="pb-3 text-right">Amount</th>
                  <th className="pb-3">Created</th>
                  <th className="pb-3">Delivered</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQuotes.map((quote) => (
                  <tr key={quote.id}>
                    <td className="py-3 font-semibold text-slate-900">
                      {quote.id}
                    </td>
                    <td className="py-3">{quote.customer}</td>
                    <td className="py-3">{quote.project}</td>
                    <td className="py-3 text-right font-semibold text-slate-900">
                      ₹{quote.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3">
                      {new Date(quote.createdOn).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      {quote.deliveredOn
                        ? new Date(quote.deliveredOn).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="py-3 text-right">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusPills[quote.status]}`}
                      >
                        {quote.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {dataset.length === 0 && !loading && (
            <p className="mt-4 text-center text-sm text-slate-500">
              No quotations found. Create your first quotation to get started.
            </p>
          )}
        </section>
      </div>
    </PageShell>
  )
}

export default QuotationHistory

