import { getShopToken, getShop } from '../../../lib/db'

export default async function handler(req, res) {
  const shop = getShop(req)
  if (!shop) return res.status(401).json({ error: 'Not authenticated' })
  const session = getShopToken(shop)
  if (!session) return res.status(401).json({ error: 'Not installed' })

  const { target } = req.query
  const revenueTarget = parseFloat(target) || 100000

  try {
    // Get 90 days of orders
    const since = new Date()
    since.setDate(since.getDate() - 90)
    const r = await fetch(
      `https://${shop}/admin/api/2024-01/orders.json?status=any&limit=250&created_at_min=${since.toISOString()}&financial_status=paid`,
      { headers: { 'X-Shopify-Access-Token': session.accessToken } }
    )
    const { orders } = await r.json()

    let totalRevenue = 0
    let totalUnits = 0
    const productRevenue = {}

    ;(orders||[]).forEach(order => {
      order.line_items?.forEach(item => {
        const rev = parseFloat(item.price) * item.quantity
        totalRevenue += rev
        totalUnits += item.quantity
        if (!productRevenue[item.product_id]) productRevenue[item.product_id] = { title: item.title, revenue: 0, units: 0 }
        productRevenue[item.product_id].revenue += rev
        productRevenue[item.product_id].units += item.quantity
      })
    })

    const dailyRevenue = totalRevenue / 90
    const avgUnitPrice = totalUnits > 0 ? totalRevenue / totalUnits : 45
    const dailyUnits = totalUnits / 90

    // How many days to hit target at current velocity
    const daysToTarget = dailyRevenue > 0 ? Math.ceil(revenueTarget / dailyRevenue) : 365
    const unitsNeeded = Math.ceil(revenueTarget / avgUnitPrice)
    const currentProjection = Math.round(dailyRevenue * 365)
    const gap = Math.max(0, revenueTarget - currentProjection)
    const gapUnits = Math.ceil(gap / avgUnitPrice)

    // Top products by revenue share
    const topProducts = Object.values(productRevenue)
      .map(p => ({ ...p, pct: totalRevenue > 0 ? Math.round(p.revenue/totalRevenue*100) : 0 }))
      .sort((a,b) => b.revenue - a.revenue)
      .slice(0, 5)

    // What they need to order to hit target
    const weeklyTarget = revenueTarget / 52
    const weeklyUnitsNeeded = Math.ceil(weeklyTarget / avgUnitPrice)

    res.json({
      target: revenueTarget,
      currentDailyRevenue: Math.round(dailyRevenue),
      currentAnnualProjection: currentProjection,
      gap: Math.round(gap),
      gapPct: currentProjection > 0 ? Math.round((gap/revenueTarget)*100) : 100,
      avgUnitPrice: Math.round(avgUnitPrice),
      unitsNeeded,
      weeklyUnitsNeeded,
      daysToTarget,
      topProducts,
      onTrack: currentProjection >= revenueTarget,
    })
  } catch(e) {
    res.status(500).json({ error: 'Failed to calculate forecast' })
  }
}
