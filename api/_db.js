const mongoose = require('mongoose')

const MONGODB_URI = process.env.MONGODB_URI || ''

if (!MONGODB_URI) {
  console.warn('[vercel-api] Missing MONGODB_URI environment variable')
}

const mongooseOptions = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
}

let cached = global.__mongoose_cache ??= { conn: null, promise: null }

async function connect() {
  if (cached.conn) return cached.conn
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, mongooseOptions).then((m) => m)
  }
  cached.conn = await cached.promise
  return cached.conn
}

function createModels() {
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

  return { Admin, Quote }
}

module.exports = { connect, createModels }
