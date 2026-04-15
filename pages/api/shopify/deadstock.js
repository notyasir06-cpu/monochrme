import { getShopToken, getShop, getAccessToken } from '../../../lib/db'

export default async function handler(req, res) {
  const shop = getShop(req)
  if (!shop) return res.status(401).json({ error: 'Not authenticated' })

  const session = await getShopToken(shop)
  const accessToken = session?.accessToken || getAccessToken(req)
  if (!accessToken) return res.status(401).json({ error: 'Not installed' })

  try {
    // Get orders from last 30 days
    const since = new Date()
    since.setDate(since.getDate() - 30)

    const [productsRes, ordersRes] = await Promise.all([
      fetch(`https://${shop}/admin/api/2024-01/products.json?limit=250&status=active`, {
        headers: { 'X-Shopify-Access-Token': accessToken }
      }),
      fetch(`https://${shop}/admin/api/2024-01/orders.json?status=any&limit=250&created_at_min=${since.toISOString()}&financial_status=paid`, {
        headers: { 'X-Shopify-Access-Token': accessToken }
      })
    ])

    const { products } = await productsRes.json()
    const { orders } = await ordersRes.json()

    // Find which product IDs sold in last 30 days
    const soldProductIds = new Set()
    ;(orders||[]).forEach(order => {
      order.line_items?.forEach(item => {
        soldProductIds.add(String(item.product_id))
      })
    })

    // Find dead stock — products with inventory but 0 sales in 30 days
    const deadstock = (products||[])
      .filter(p => {
        const totalInventory = p.variants?.reduce((s,v) => s + Math.max(0, v.inventory_quantity||0), 0) || 0
        const hasSold = soldProductIds.has(String(p.id))
        return totalInventory > 0 && !hasSold
      })
      .map(p => {
        const totalInventory = p.variants?.reduce((s,v) => s + Math.max(0, v.inventory_quantity||0), 0) || 0
        const avgPrice = p.variants?.length > 0 ? parseFloat(p.variants[0].price) : 0
        const stockValue = totalInventory * avgPrice
        const daysOld = Math.floor((Date.now() - new Date(p.created_at).getTime()) / 86400000)

        return {
          id: p.id,
          title: p.title,
          image: p.image?.src,
          totalInventory,
          avgPrice,
          stockValue: Math.round(stockValue),
          daysOld,
          daysNoSales: 30,
          // Recommended action based on stock value and age
          recommendedStep: stockValue > 2000 ? 1 : stockValue > 500 ? 2 : 3,
          currentStep: 0, // User tracks this
        }
      })
      .sort((a,b) => b.stockValue - a.stockValue)

    const totalDeadValue = deadstock.reduce((s,p) => s + p.stockValue, 0)

    res.json({
      deadstock,
      count: deadstock.length,
      totalDeadValue,
      periodDays: 30,
    })
  } catch(e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to fetch deadstock' })
  }
}
