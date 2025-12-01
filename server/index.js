/* eslint-env node */
import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.SERVER_PORT || 5000
const mongoUri = process.env.MONGODB_URI

if (!mongoUri) {
  console.warn(
    '[server] Missing MONGODB_URI in environment. Please add it to your .env file.',
  )
}

app.use(cors())
app.use(express.json())

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'admin' },
  },
  { timestamps: true },
)

const quoteSchema = new mongoose.Schema(
  {
    quotationNumber: { type: String, required: true, unique: true },
    customer: {
      name: { type: String, required: true },
      email: String,
      phone: String,
      address: String,
      city: String,
      state: String,
      pincode: String,
      gstin: String,
    },
    projectName: String,
    amount: { type: Number, required: true },
    items: [
      {
        category: { type: String, default: '' },
        description: { type: String, required: true },
        quantity: { type: Number, required: true },
        unitPrice: { type: Number, required: true },
      },
    ],
    status: {
      type: String,
      enum: ['Created', 'Sent', 'Delivered'],
      default: 'Created',
    },
    quotationDate: { type: Date, default: Date.now },
    deliveredOn: { type: Date, default: null },
    validityDays: Number,
    taxRate: Number,
    notes: String,
  },
  { timestamps: true },
)

const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema)
const Quote = mongoose.models.Quote || mongoose.model('Quote', quoteSchema)

app.post('/api/auth/login', async (req, res) => {
  try {
    const { name, password } = req.body
    if (!name?.trim() || !password?.trim()) {
      return res
        .status(400)
        .json({ message: 'Name and password are required to login.' })
    }

    const admin = await Admin.findOne({ name: name.trim() })
    if (!admin || admin.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials.' })
    }

    res.json({
      user: {
        id: admin._id.toString(),
        name: admin.name,
        role: admin.role,
      },
    })
  } catch (error) {
    console.error('[server] Login failed', error)
    res.status(500).json({ message: 'Unable to login right now.' })
  }
})

app.get('/api/quotes', async (req, res) => {
  try {
    const quotes = await Quote.find().sort({ createdAt: -1 })
    res.json(quotes)
  } catch (error) {
    console.error('[server] Failed to fetch quotes', error)
    res.status(500).json({ message: 'Failed to fetch quotes' })
  }
})

app.get('/api/quotes/items', async (req, res) => {
  try {
    const { type, search } = req.query
    const quotes = await Quote.find().select('items')
    
    if (type === 'categories') {
      // Get unique categories
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
      
      // Filter by search term if provided
      if (search && search.trim()) {
        const searchLower = search.toLowerCase()
        categoryArray = categoryArray.filter((cat) =>
          cat.toLowerCase().includes(searchLower),
        )
      }
      
      return res.json({ items: categoryArray })
    } else if (type === 'descriptions') {
      // Get unique descriptions
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
      
      // Filter by search term if provided
      if (search && search.trim()) {
        const searchLower = search.toLowerCase()
        descriptionArray = descriptionArray.filter((desc) =>
          desc.toLowerCase().includes(searchLower),
        )
      }
      
      return res.json({ items: descriptionArray })
    }
    
    res.status(400).json({ message: 'Invalid type parameter. Use "categories" or "descriptions".' })
  } catch (error) {
    console.error('[server] Failed to fetch items', error)
    res.status(500).json({ message: 'Failed to fetch items.' })
  }
})

app.get('/api/quotes/:id', async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id)
    if (!quote) {
      return res.status(404).json({ message: 'Quotation not found.' })
    }
    res.json(quote)
  } catch (error) {
    console.error('[server] Failed to fetch quote', error)
    res.status(500).json({ message: 'Failed to fetch quotation.' })
  }
})

app.post('/api/quotes', async (req, res) => {
  try {
    const payload = req.body
    if (!payload.quotationNumber || !payload.customer?.name) {
      return res
        .status(400)
        .json({ message: 'Quotation number and customer name are required.' })
    }

    const existing = await Quote.findOne({
      quotationNumber: payload.quotationNumber,
    })
    if (existing) {
      return res.status(409).json({
        message: 'Quotation number already exists. Please use a unique number.',
      })
    }

    const createdQuote = await Quote.create(payload)
    res.status(201).json(createdQuote)
  } catch (error) {
    console.error('[server] Failed to create quote', error)
    res
      .status(500)
      .json({ message: 'Failed to create quotation. Please try again.' })
  }
})

app.patch('/api/quotes/:id/status', async (req, res) => {
  try {
    const { status, deliveredOn } = req.body
    if (!['Created', 'Sent', 'Delivered'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' })
    }

    const updatePayload = {
      status,
      deliveredOn: deliveredOn ? new Date(deliveredOn) : null,
    }

    const updatedQuote = await Quote.findByIdAndUpdate(
      req.params.id,
      updatePayload,
      { new: true },
    )

    if (!updatedQuote) {
      return res.status(404).json({ message: 'Quotation not found.' })
    }

    res.json(updatedQuote)
  } catch (error) {
    console.error('[server] Failed to update quote status', error)
    res.status(500).json({ message: 'Failed to update quotation status.' })
  }
})

app.put('/api/quotes/:id', async (req, res) => {
  try {
    const payload = req.body
    const updatedQuote = await Quote.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true, runValidators: true },
    )

    if (!updatedQuote) {
      return res.status(404).json({ message: 'Quotation not found.' })
    }

    res.json(updatedQuote)
  } catch (error) {
    console.error('[server] Failed to update quote', error)
    res.status(500).json({ message: 'Failed to update quotation.' })
  }
})

app.delete('/api/quotes/:id', async (req, res) => {
  try {
    const deletedQuote = await Quote.findByIdAndDelete(req.params.id)

    if (!deletedQuote) {
      return res.status(404).json({ message: 'Quotation not found.' })
    }

    res.json({ message: 'Quotation deleted successfully.' })
  } catch (error) {
    console.error('[server] Failed to delete quote', error)
    res.status(500).json({ message: 'Failed to delete quotation.' })
  }
})

const startServer = async () => {
  try {
    if (!mongoUri) {
      throw new Error('MONGODB_URI not configured.')
    }

    // Add connection options for better error handling
    const mongooseOptions = {
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds socket timeout
      connectTimeoutMS: 10000, // 10 seconds connection timeout
    }

    console.log('[server] Attempting to connect to MongoDB Atlas...')
    await mongoose.connect(mongoUri, mongooseOptions)
    console.log('[server] ✅ Successfully connected to MongoDB Atlas')

    app.listen(PORT, () => {
      console.log(`[server] Listening on http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('[server] ❌ Failed to start server')
    console.error('[server] Error details:', error.message)
    
    // Provide helpful troubleshooting information
    if (error.name === 'MongooseServerSelectionError') {
      console.error('\n[server] 🔧 Troubleshooting steps:')
      console.error('1. Check your IP whitelist in MongoDB Atlas:')
      console.error('   - Go to: https://cloud.mongodb.com/')
      console.error('   - Navigate to: Network Access → IP Access List')
      console.error('   - Add your current IP address (or use 0.0.0.0/0 for development)')
      console.error('2. Verify your MONGODB_URI in .env file is correct')
      console.error('3. Check if your MongoDB Atlas cluster is running')
      console.error('4. Ensure your connection string includes proper authentication')
    }
    
    process.exit(1)
  }
}

startServer()

