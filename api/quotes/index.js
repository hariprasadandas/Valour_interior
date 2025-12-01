const { connect, createModels } = require('../_db')

module.exports = async function handler(req, res) {
  await connect()
  const { Quote } = createModels()

  try {
    if (req.method === 'GET') {
      const quotes = await Quote.find().sort({ createdAt: -1 })
      return res.json(quotes)
    }

    if (req.method === 'POST') {
      const payload = req.body
      if (!payload.quotationNumber || !payload.customer?.name) {
        return res.status(400).json({ message: 'Quotation number and customer name are required.' })
      }

      const existing = await Quote.findOne({ quotationNumber: payload.quotationNumber })
      if (existing) {
        return res.status(409).json({ message: 'Quotation number already exists. Please use a unique number.' })
      }

      const createdQuote = await Quote.create(payload)
      return res.status(201).json(createdQuote)
    }

    res.setHeader('Allow', 'GET, POST')
    res.status(405).json({ message: 'Method Not Allowed' })
  } catch (error) {
    console.error('[api/quotes/index] Error:', error)
    res.status(500).json({ message: 'Failed to handle quotes request.' })
  }
}
