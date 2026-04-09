import { saveShopToken } from '../../../lib/db'

export default async function handler(req, res) {
  const { shop, code } = req.query
  if (!shop || !code) return res.status(400).send('Missing parameters')
  if (!shop.match(/^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/)) return res.status(400).send('Invalid shop')

  try {
    const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET,
        code,
      }),
    })
    const data = await tokenRes.json()
    if (!data.access_token) return res.status(400).send('Failed to get access token')

    saveShopToken(shop, data.access_token, data.scope)

    // Store BOTH the shop AND the access token in cookies
    // This way even if the in-memory store resets, we can still make API calls
    res.setHeader('Set-Cookie', [
      `shop=${encodeURIComponent(shop)}; Path=/; SameSite=Lax; Max-Age=2592000`,
      `mc_token=${encodeURIComponent(data.access_token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=2592000`,
    ])
    res.redirect(302, `/?shop=${encodeURIComponent(shop)}`)
  } catch(e) {
    console.error(e)
    res.status(500).send('Installation failed. Please try again.')
  }
}
