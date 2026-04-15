import { getShopToken, getShop, getAccessToken } from '../../../lib/db'

export default async function handler(req, res) {
  const shop = getShop(req)
  if (!shop) return res.status(401).json({ error: 'Not authenticated' })

  const session = await getShopToken(shop)
  const accessToken = session?.accessToken || getAccessToken(req)
  if (!accessToken) return res.status(401).json({ error: 'Not installed' })

  const { months = 3 } = req.query

  try {
    const since = new Date()
    since.setMonth(since.getMonth() - parseInt(months))

    // Fetch orders
    const ordersRes = await fetch(
      `https://${shop}/admin/api/2024-01/orders.json?status=any&limit=250&created_at_min=${since.toISOString()}`,
      { headers: { 'X-Shopify-Access-Token': accessToken } }
    )
    const { orders } = await ordersRes.json()

    let grossRevenue = 0
    let totalRefunds = 0
    let totalShippingCollected = 0
    let totalDiscounts = 0
    let totalUnits = 0
    let totalCOGS = 0
    const monthlyData = {}

    ;(orders||[]).forEach(order => {
      const month = order.created_at.substring(0, 7)
      if (!monthlyData[month]) monthlyData[month] = { revenue:0, refunds:0, units:0, shipping:0, discounts:0, cogs:0 }

      const orderRevenue = parseFloat(order.total_price || 0)
      const orderRefund = parseFloat(order.total_refunded || 0)
      const shippingCollected = parseFloat(order.total_shipping_price_set?.shop_money?.amount || 0)
      const discounts = parseFloat(order.total_discounts || 0)
      const units = order.line_items?.reduce((s,i) => s+i.quantity, 0) || 0

      // Estimate COGS at ~40% of revenue (user can override)
      const estimatedCOGS = orderRevenue * 0.4

      grossRevenue += orderRevenue
      totalRefunds += orderRefund
      totalShippingCollected += shippingCollected
      totalDiscounts += discounts
      totalUnits += units
      totalCOGS += estimatedCOGS

      monthlyData[month].revenue += orderRevenue
      monthlyData[month].refunds += orderRefund
      monthlyData[month].shipping += shippingCollected
      monthlyData[month].discounts += discounts
      monthlyData[month].units += units
      monthlyData[month].cogs += estimatedCOGS
    })

    const netRevenue = grossRevenue - totalRefunds
    const grossProfit = netRevenue - totalCOGS
    const grossMargin = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0

    const monthly = Object.entries(monthlyData)
      .sort(([a],[b]) => a.localeCompare(b))
      .map(([month, d]) => ({
        month,
        revenue: Math.round(d.revenue),
        refunds: Math.round(d.refunds),
        netRevenue: Math.round(d.revenue - d.refunds),
        cogs: Math.round(d.cogs),
        grossProfit: Math.round(d.revenue - d.refunds - d.cogs),
        units: d.units,
        shipping: Math.round(d.shipping),
        discounts: Math.round(d.discounts),
      }))

    res.json({
      period: `Last ${months} months`,
      summary: {
        grossRevenue: Math.round(grossRevenue),
        totalRefunds: Math.round(totalRefunds),
        totalDiscounts: Math.round(totalDiscounts),
        netRevenue: Math.round(netRevenue),
        totalCOGS: Math.round(totalCOGS),
        grossProfit: Math.round(grossProfit),
        grossMargin: parseFloat(grossMargin.toFixed(1)),
        totalUnits,
        totalOrders: (orders||[]).length,
        avgOrderValue: (orders||[]).length > 0 ? Math.round(grossRevenue / orders.length) : 0,
        shippingCollected: Math.round(totalShippingCollected),
      },
      monthly,
      // These fields the user fills in manually
      manualCosts: {
        adSpend: 0,
        shippingCost: 0,
        overheads: 0,
        otherCosts: 0,
      }
    })
  } catch(e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to generate P&L' })
  }
}
