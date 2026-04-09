export default function handler(req, res) {
  const { shop } = req.query
  if (!shop) return res.status(400).send('Missing shop')
  const nonce = Math.random().toString(36).substring(2)
  const redirect = `${process.env.HOST}/api/auth/callback`
  res.setHeader('Set-Cookie', `nonce=${nonce}; HttpOnly; SameSite=Lax; Path=/; Max-Age=600`)
  res.redirect(302, `https://${shop}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_API_KEY}&scope=${process.env.SHOPIFY_SCOPES}&redirect_uri=${encodeURIComponent(redirect)}&state=${nonce}`)
}
