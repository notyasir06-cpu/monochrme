import { saveShopToken } from '../../../lib/db'

export default async function handler(req, res) {
  const { shop, code, state } = req.query
  const cookies = Object.fromEntries((req.headers.cookie||'').split(';').filter(Boolean).map(c=>c.trim().split('=')))
  if (!shop||!code) return res.status(400).send('Missing params')
  if (state !== cookies.nonce) return res.status(403).send('Invalid state')

  const r = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: process.env.SHOPIFY_API_KEY, client_secret: process.env.SHOPIFY_API_SECRET, code })
  })
  const data = await r.json()
  if (!data.access_token) return res.status(400).send('Auth failed')

  saveShopToken(shop, data.access_token, data.scope)
  res.setHeader('Set-Cookie', `shop=${encodeURIComponent(shop)}; Path=/; SameSite=Lax; Max-Age=2592000`)
  res.redirect(`/?shop=${shop}`)
}
