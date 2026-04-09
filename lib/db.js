const store = global._mcStore || (global._mcStore = {})

export function saveShopToken(shop, accessToken, scope) {
  store[shop] = { shop, accessToken, scope, installedAt: Date.now() }
}

export function getShopToken(shop) {
  return store[shop] || null
}

export function getShop(req) {
  // Support cookie, query param, or header (for client-side fetches)
  const cookies = Object.fromEntries(
    (req.headers.cookie||'').split(';').filter(Boolean)
      .map(c => { const [k,...v]=c.trim().split('='); return [k, decodeURIComponent(v.join('='))] })
  )
  return req.query.shop || req.headers['x-shop'] || cookies.shop || null
}
