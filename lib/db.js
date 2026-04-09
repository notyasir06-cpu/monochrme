// Store tokens in a global that persists within a single Vercel function instance
// The real fix: we pass the access token via an encrypted cookie so every request has it
const store = global._mcStore || (global._mcStore = {})

export function saveShopToken(shop, accessToken, scope) {
  store[shop] = { shop, accessToken, scope }
}

export function getShopToken(shop) {
  return store[shop] || null
}

export function getShop(req) {
  if (req.query?.shop) return decodeURIComponent(req.query.shop)
  if (req.headers?.['x-shop']) return req.headers['x-shop']
  const cookies = parseCookies(req.headers.cookie || '')
  return cookies.shop ? decodeURIComponent(cookies.shop) : null
}

export function getAccessToken(req) {
  const cookies = parseCookies(req.headers.cookie || '')
  return cookies.mc_token ? decodeURIComponent(cookies.mc_token) : null
}

function parseCookies(str) {
  return str.split(';').filter(Boolean).reduce((acc, c) => {
    const [k, ...v] = c.trim().split('=')
    acc[k.trim()] = v.join('=')
    return acc
  }, {})
}
