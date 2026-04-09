import { getShopToken, getShop, getAccessToken } from '../../../lib/db'

export default async function handler(req, res) {
  const shop = getShop(req)
  if (!shop) return res.status(401).json({ error: 'Not authenticated' })

  const session = getShopToken(shop)
  const accessToken = session?.accessToken || getAccessToken(req)
  if (!accessToken) return res.status(401).json({ error: 'Not installed' })

  const target = parseFloat(req.query.target) || 100000

  try {
    const since = new Date()
    since.setDate(since.getDate() - 90)
    const r = await fetch(
      `https://${shop}/admin/api/2024-01/orders.json?status=any&limit=250&created_at_min=${since.toISOString()}&financial_status=paid`,
      { headers: { 'X-Shopify-Access-Token': accessToken } }
    )
    const { orders } = await r.json()

    if (!orders?.length) {
      return res.json({ target, currentDailyRevenue:0, currentAnnualProjection:0, gap:target, gapPct:100, avgUnitPrice:0, unitsNeeded:0, weeklyUnitsNeeded:0, topProducts:[], onTrack:false, hasData:false })
    }

    let totalRevenue = 0, totalUnits = 0
    const productRevenue = {}

    orders.forEach(order => {
      order.line_items?.forEach(item => {
        const rev = parseFloat(item.price) * item.quantity
        totalRevenue += rev
        totalUnits += item.quantity
        if (!productRevenue[item.product_id]) productRevenue[item.product_id] = { title:item.title, revenue:0, units:0 }
        productRevenue[item.product_id].revenue += rev
        productRevenue[item.product_id].units += item.quantity
      })
    })

    const dailyRevenue = totalRevenue / 90
    const avgUnitPrice = totalUnits > 0 ? totalRevenue / totalUnits : 0
    const currentProjection = Math.round(dailyRevenue * 365)
    const gap = Math.max(0, target - currentProjection)
    const weeklyUnitsNeeded = avgUnitPrice > 0 ? Math.ceil((target/52) / avgUnitPrice) : 0
    const topProducts = Object.values(productRevenue).map(p => ({ ...p, pct: Math.round(p.revenue/totalRevenue*100) })).sort((a,b)=>b.revenue-a.revenue).slice(0,5)

    res.json({
      target, currentDailyRevenue:Math.round(dailyRevenue),
      currentAnnualProjection:currentProjection, gap:Math.round(gap),
      gapPct: target > 0 ? Math.round(gap/target*100) : 0,
      avgUnitPrice:Math.round(avgUnitPrice), weeklyUnitsNeeded,
      topProducts, onTrack:currentProjection>=target, hasData:true,
      totalRevenue90d:Math.round(totalRevenue),
    })
  } catch(e) {
    res.status(500).json({ error: 'Failed to calculate forecast' })
  }
}
