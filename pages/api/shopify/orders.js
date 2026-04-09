import { getShopToken, getShop, getAccessToken } from '../../../lib/db'

export default async function handler(req, res) {
  const shop = getShop(req)
  if (!shop) return res.status(401).json({ error: 'Not authenticated' })

  const session = getShopToken(shop)
  const accessToken = session?.accessToken || getAccessToken(req)
  if (!accessToken) return res.status(401).json({ error: 'Not installed' })

  const { days = 30 } = req.query
  const since = new Date()
  since.setDate(since.getDate() - parseInt(days))

  try {
    const r = await fetch(
      `https://${shop}/admin/api/2024-01/orders.json?status=any&limit=250&created_at_min=${since.toISOString()}&financial_status=paid`,
      { headers: { 'X-Shopify-Access-Token': accessToken } }
    )
    const { orders } = await r.json()

    const variantMap = {}
    const monthlyRevenue = {}
    let totalRevenue = 0

    ;(orders||[]).forEach(order => {
      const month = order.created_at.substring(0,7)
      if (!monthlyRevenue[month]) monthlyRevenue[month] = 0
      order.line_items?.forEach(item => {
        const rev = parseFloat(item.price) * item.quantity
        totalRevenue += rev
        monthlyRevenue[month] += rev
        const key = `${item.product_id}:${item.variant_id}`
        if (!variantMap[key]) variantMap[key] = { title:item.title, variant:item.variant_title, sold:0, revenue:0, orders:0 }
        variantMap[key].sold += item.quantity
        variantMap[key].revenue += rev
        variantMap[key].orders += 1
      })
    })

    const topVariants = Object.values(variantMap)
      .map(v => ({ ...v, velocity: parseFloat((v.sold/parseInt(days)).toFixed(2)) }))
      .sort((a,b) => b.sold - a.sold)
      .slice(0,20)

    const monthly = Object.entries(monthlyRevenue)
      .sort(([a],[b]) => a.localeCompare(b))
      .map(([month,revenue]) => ({ month, revenue: Math.round(revenue) }))

    res.json({ totalOrders:(orders||[]).length, totalRevenue:Math.round(totalRevenue), topVariants, monthly })
  } catch(e) {
    res.status(500).json({ error: 'Failed to fetch orders' })
  }
}
