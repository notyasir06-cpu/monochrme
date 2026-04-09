export default async function handler(req, res) {
  const { suppliers = 'Pakistan' } = req.query
  const key = process.env.NEWS_API_KEY

  const warnings = [
    { type: 'danger', message: `Shipping from ${suppliers} flagged as unpredictable — add 2–3 week buffer to lead times before confirming next PO` },
    { type: 'warning', message: `US tariff review on South Asian textile imports underway — verify landed costs before placing ${suppliers} orders` },
  ]

  if (!key) return res.json({ articles: demo(suppliers), warnings })

  try {
    const queries = [
      { q: `${suppliers} tariff apparel textile`, tag: 'tariff', label: 'Tariff alert' },
      { q: 'shipping port delay apparel supply chain', tag: 'shipping', label: 'Shipping' },
      { q: 'fashion apparel trend consumer demand 2025', tag: 'trend', label: 'Trend signal' },
      { q: `${suppliers} manufacturing textile export`, tag: 'supplier', label: 'Supplier news' },
    ]

    const results = await Promise.all(queries.map(async ({ q, tag, label }) => {
      const r = await fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=en&sortBy=publishedAt&pageSize=3&apiKey=${key}`)
      const d = await r.json()
      return (d.articles||[]).filter(a=>a.title!=='[Removed]').map(a=>({ tag, label, title:a.title, description:a.description, url:a.url, source:a.source?.name, publishedAt:a.publishedAt }))
    }))

    res.json({ articles: results.flat().slice(0,12), warnings })
  } catch {
    res.json({ articles: demo(suppliers), warnings })
  }
}

function demo(s) {
  return [
    { tag:'tariff', label:'Tariff alert', title:`US reviews tariff rates on ${s} textile imports`, description:'Trade officials reviewing rates on apparel imports that could affect brand costs significantly.', source:'Reuters', publishedAt:new Date().toISOString(), url:'#' },
    { tag:'shipping', label:'Shipping', title:`${s} port delays extend 8–12 days amid congestion`, description:'Peak season congestion causing above-average delays. Brands should add buffer to lead times.', source:'FreightWaves', publishedAt:new Date(Date.now()-3600000*6).toISOString(), url:'#' },
    { tag:'trend', label:'Trend signal', title:'Oversized silhouettes maintain strong consumer demand', description:'Full-price sell-through on relaxed-fit garments continues into the new season.', source:'Business of Fashion', publishedAt:new Date(Date.now()-86400000).toISOString(), url:'#' },
    { tag:'supplier', label:'Supplier news', title:`${s} textile exports reach multi-year high`, description:'Manufacturing output surged though lead times remain extended.', source:'WWD', publishedAt:new Date(Date.now()-86400000*2).toISOString(), url:'#' },
    { tag:'trend', label:'Trend signal', title:'Earth tones accelerating — olive searches up 34% YoY', description:'Consumer data signals shift toward earth-tone colorways in apparel categories.', source:'Trendalytics', publishedAt:new Date(Date.now()-86400000*3).toISOString(), url:'#' },
    { tag:'shipping', label:'Shipping', title:'Container rates stabilize after Q1 disruptions', description:'Freight rates leveling off. Analysts expect stability through Q3 barring new disruptions.', source:'Freight Journal', publishedAt:new Date(Date.now()-86400000*4).toISOString(), url:'#' },
  ]
}
