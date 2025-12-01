const { connect, createModels } = require('../_db')

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  // Helpful guard for common deployment issue
  if (!process.env.MONGODB_URI) {
    console.error('[api/auth/login] Missing MONGODB_URI environment variable')
    return res.status(500).json({ message: 'Server misconfiguration: MONGODB_URI is not set.' })
  }

  try {
    await connect()
    const { Admin } = createModels()

    const { name, password } = req.body || {}
    if (!name?.trim() || !password?.trim()) {
      return res.status(400).json({ message: 'Name and password are required to login.' })
    }

    const admin = await Admin.findOne({ name: name.trim() })
    if (!admin || admin.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials.' })
    }

    return res.json({ user: { id: admin._id.toString(), name: admin.name, role: admin.role } })
  } catch (error) {
    console.error('[api/auth/login] Error:', error)
    // Surface a bit more detail in the response to aid debugging (safe for private deployments)
    return res.status(500).json({ message: 'Unable to login right now.', error: String(error.message || error) })
  }
}
