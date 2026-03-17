module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')    return res.status(405).end()

  const { password } = req.body

  if (!process.env.ADMIN_PASSWORD) {
    return res.status(500).json({ error: 'Admin password not configured on server.' })
  }

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Incorrect password.' })
  }

  // Token is the password itself — simple and secure for single-user
  res.status(200).json({ token: process.env.ADMIN_PASSWORD })
}
