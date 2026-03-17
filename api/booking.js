const { MongoClient } = require('mongodb')

const uri = process.env.MONGODB_URI
let cachedClient = null

async function getClient() {
  if (cachedClient) return cachedClient
  const client = new MongoClient(uri)
  await client.connect()
  cachedClient = client
  return client
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { phone, date, time, address, notes } = req.body

  if (!phone || !date || !time || !address) {
    return res.status(400).json({ error: 'missing_fields' })
  }

  try {
    const client = await getClient()
    const db = client.db('hoopitup')
    const bookings = db.collection('bookings')

    // Normalize phone number for reliable duplicate checking
    const normalizedPhone = phone.replace(/\D/g, '')

    const existing = await bookings.findOne({ normalizedPhone })
    if (existing) {
      return res.status(409).json({
        error: 'already_booked',
        booking: {
          date:    existing.date,
          time:    existing.time,
          phone:   existing.phone,
          address: existing.address,
        },
      })
    }

    await bookings.insertOne({
      phone,
      normalizedPhone,
      date,
      time,
      address,
      notes: notes || '',
      submittedAt: new Date(),
    })

    res.status(200).json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'server_error' })
  }
}
