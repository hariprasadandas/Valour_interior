const { connect, createModels } = require('../_db')

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  try {
    await connect()
    const { Quote } = createModels()
    const { type, search } = req.query || {}

    const quotes = await Quote.find().select('items')

    if (type === 'categories') {
      const categories = new Set()
      quotes.forEach((quote) => {
        if (quote.items && Array.isArray(quote.items)) {
          quote.items.forEach((item) => {
            if (item.category && item.category.trim()) {
              categories.add(item.category.trim())
            }
          })
        }
      })
      let categoryArray = Array.from(categories).sort()
      if (search && search.trim()) {
        const searchLower = search.toLowerCase()
        categoryArray = categoryArray.filter((cat) => cat.toLowerCase().includes(searchLower))
      }
      return res.json({ items: categoryArray })
    }

    if (type === 'descriptions') {
      const descriptions = new Set()
      quotes.forEach((quote) => {
        if (quote.items && Array.isArray(quote.items)) {
          quote.items.forEach((item) => {
            if (item.description && item.description.trim()) {
              descriptions.add(item.description.trim())
            }
          })
        }
      })
      let descriptionArray = Array.from(descriptions).sort()
      if (search && search.trim()) {
        const searchLower = search.toLowerCase()
        descriptionArray = descriptionArray.filter((desc) => desc.toLowerCase().includes(searchLower))
      }
      return res.json({ items: descriptionArray })
    }

    return res.status(400).json({ message: 'Invalid type parameter. Use "categories" or "descriptions".' })
  } catch (error) {
    console.error('[api/quotes/items] Error:', error)
    res.status(500).json({ message: 'Failed to fetch items.' })
  }
}
