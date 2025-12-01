const { connect, createModels } = require('../_db')

module.exports = async function handler(req, res) {
  await connect()
  const { Quote } = createModels()

  const { id } = req.query || {}
  if (!id) return res.status(400).json({ message: 'Missing id parameter' })

  try {
    if (req.method === 'GET') {
      const quote = await Quote.findById(id)
      if (!quote) return res.status(404).json({ message: 'Quotation not found.' })
      return res.json(quote)
    }

    if (req.method === 'PUT') {
      const payload = req.body
      const updated = await Quote.findByIdAndUpdate(id, payload, { new: true, runValidators: true })
      if (!updated) return res.status(404).json({ message: 'Quotation not found.' })
      return res.json(updated)
    }

    if (req.method === 'DELETE') {
      const deleted = await Quote.findByIdAndDelete(id)
      if (!deleted) return res.status(404).json({ message: 'Quotation not found.' })
      return res.json({ message: 'Quotation deleted successfully.' })
    }

    res.setHeader('Allow', 'GET, PUT, DELETE')
    res.status(405).json({ message: 'Method Not Allowed' })
  } catch (error) {
    console.error('[api/quotes/[id]] Error:', error)
    res.status(500).json({ message: 'Failed to handle request.' })
  }
}
