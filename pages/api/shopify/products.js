import { getShopToken, getShop } from '../../../lib/db'

const COLOR_SCORES = { Black:94, White:88, Navy:82, Grey:79, Gray:79, Olive:71, Cream:65, Sage:44, Sand:38, Brown:72, Khaki:68, Burgundy:76, Forest:69 }
const SIZE_ORDER = ['XXS','XS','S','M','L','XL','XXL','3XL','28','30','32','34','36','38','One Size']

export default async function handler(req, res) {
  const shop = getShop(req)
  if (!shop) return res.status(401).json({ error: 'Not authenticated' })
  const session = getShopToken(shop)
  if (!session) return res.status(401).json({ error: 'Not installed' })

  try {
    const r = await fetch(`https://${shop}/admin/api/2024-01/products.json?limit=250&status=active`, {
      headers: { 'X-Shopify-Access-Token': session.accessToken }
    })
    const { products } = await r.json()

    const enriched = (products||[]).map(p => {
      const variants = p.variants || []
      const sizeOpt = p.options?.find(o => ['size','Size','SIZE'].includes(o.name))
      const colorOpt = p.options?.find(o => ['color','Color','COLOR','colour','Colour'].includes(o.name))

      const sizeTotals = {}, colorTotals = {}
      let totalInventory = 0

      variants.forEach(v => {
        const qty = Math.max(0, v.inventory_quantity || 0)
        totalInventory += qty
        const size = sizeOpt ? v[`option${sizeOpt.position}`] : null
        const color = colorOpt ? v[`option${colorOpt.position}`] : null
        if (size) sizeTotals[size] = (sizeTotals[size]||0) + qty
        if (color) colorTotals[color] = (colorTotals[color]||0) + qty
      })

      const sizes = Object.entries(sizeTotals)
        .sort((a,b) => SIZE_ORDER.indexOf(a[0]) - SIZE_ORDER.indexOf(b[0]))
        .map(([size, qty]) => ({ size, qty, pct: totalInventory ? Math.round(qty/totalInventory*100) : 0 }))

      const colors = Object.entries(colorTotals).map(([color, qty]) => ({
        color, qty,
        score: COLOR_SCORES[color] || 60,
        pct: totalInventory ? Math.round(qty/totalInventory*100) : 0
      })).sort((a,b) => b.score - a.score)

      let status = 'healthy'
      if (totalInventory === 0) status = 'out_of_stock'
      else if (totalInventory < 15) status = 'low_stock'
      else if (totalInventory > 400) status = 'overstock'

      // Selling out = any size under 5 units
      const sellingOut = sizes.filter(s => s.qty > 0 && s.qty < 5)

      return {
        id: p.id, title: p.title, productType: p.product_type,
        image: p.image?.src, totalInventory, variantCount: variants.length,
        status, sizes, colors, sellingOut,
        createdAt: p.created_at
      }
    })

    const summary = {
      total: enriched.length,
      outOfStock: enriched.filter(p=>p.status==='out_of_stock').length,
      lowStock: enriched.filter(p=>p.status==='low_stock').length,
      overstock: enriched.filter(p=>p.status==='overstock').length,
      healthy: enriched.filter(p=>p.status==='healthy').length,
      totalUnits: enriched.reduce((s,p)=>s+p.totalInventory,0),
      sellingOut: enriched.filter(p=>p.sellingOut?.length>0).length,
      notifications: [
        ...enriched.filter(p=>p.status==='out_of_stock').map(p=>({ type:'danger', product:p.title, msg:`Out of stock — reorder immediately` })),
        ...enriched.filter(p=>p.status==='low_stock').map(p=>({ type:'warning', product:p.title, msg:`Low stock — ${p.totalInventory} units remaining` })),
        ...enriched.filter(p=>p.sellingOut?.length>0).map(p=>({ type:'warning', product:p.title, msg:`Selling out fast — ${p.sellingOut.map(s=>s.size).join(', ')} almost gone` })),
        ...enriched.filter(p=>p.status==='overstock').map(p=>({ type:'info', product:p.title, msg:`Overstocked — review before next PO` })),
      ].slice(0, 20)
    }

    res.json({ products: enriched, summary })
  } catch(e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to fetch products' })
  }
}
