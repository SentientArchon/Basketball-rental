const { MongoClient, ObjectId } = require('mongodb')

const uri = process.env.MONGODB_URI
let cachedClient = null

async function getClient() {
  if (cachedClient) return cachedClient
  const client = new MongoClient(uri)
  await client.connect()
  cachedClient = client
  return client
}

function checkAuth(req) {
  const auth = req.headers['authorization'] || ''
  const token = auth.replace('Bearer ', '').trim()
  return token && token === process.env.ADMIN_PASSWORD
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()

  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const client = await getClient()
    const db = client.db('hoopitup')
    const bookings = db.collection('bookings')

    if (req.method === 'GET') {
      const all = await bookings
        .find({})
        .sort({ submittedAt: -1 })
        .toArray()
      return res.status(200).json({ bookings: all })
    }

    if (req.method === 'DELETE') {
      const { id } = req.query
      if (!id) return res.status(400).json({ error: 'Missing id' })

      let objectId
      try {
        objectId = new ObjectId(id)
      } catch {
        return res.status(400).json({ error: 'Invalid id' })
      }

      const result = await bookings.deleteOne({ _id: objectId })
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Not found' })
      }
      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'server_error' })
  }
}
