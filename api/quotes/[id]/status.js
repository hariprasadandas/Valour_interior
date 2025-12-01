const { connect, createModels } = require('../../_db')

module.exports = async function handler(req, res) {
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH')
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const { id } = req.query || {}
  if (!id) return res.status(400).json({ message: 'Missing id parameter' })

  try {
    await connect()
    const { Quote } = createModels()
    const { status, deliveredOn } = req.body || {}
    if (!['Created', 'Sent', 'Delivered'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' })
    }

    const updatePayload = {
      status,
      deliveredOn: deliveredOn ? new Date(deliveredOn) : null,
    }

    const updatedQuote = await Quote.findByIdAndUpdate(id, updatePayload, { new: true })
    if (!updatedQuote) return res.status(404).json({ message: 'Quotation not found.' })
    return res.json(updatedQuote)
  } catch (error) {
    console.error('[api/quotes/[id]/status] Error:', error)
    res.status(500).json({ message: 'Failed to update quotation status.' })
  }
}
