// Meta Ad Library API - competitor research
// Uses the free public Meta Ad Library API
// Docs: https://www.facebook.com/ads/library/api/

export default async function handler(req, res) {
  const { keyword = 'apparel', country = 'US' } = req.query
  const token = process.env.META_ADS_TOKEN

  if (!token) {
    // Return demo data if no token configured
    return res.json({ ads: demoAds(keyword), hasToken: false })
  }

  try {
    const params = new URLSearchParams({
      access_token: token,
      ad_type: 'ALL',
      ad_reached_countries: country,
      search_terms: keyword,
      fields: 'id,ad_creation_time,ad_creative_bodies,ad_creative_link_captions,ad_creative_link_descriptions,ad_creative_link_titles,page_name,page_id,spend,impressions,currency',
      limit: 20,
    })

    const r = await fetch(`https://graph.facebook.com/v19.0/ads_archive?${params}`)
    const data = await r.json()

    if (data.error) {
      console.error('Meta API error:', data.error)
      return res.json({ ads: demoAds(keyword), hasToken: false, error: data.error.message })
    }

    const ads = (data.data || []).map(ad => ({
      id: ad.id,
      pageName: ad.page_name,
      createdAt: ad.ad_creation_time,
      headline: ad.ad_creative_link_titles?.[0] || ad.ad_creative_bodies?.[0]?.substring(0, 80) || 'No headline',
      body: ad.ad_creative_bodies?.[0]?.substring(0, 200) || '',
      spend: ad.spend,
      impressions: ad.impressions,
      currency: ad.currency || 'USD',
    }))

    res.json({ ads, hasToken: true })
  } catch(e) {
    console.error(e)
    res.json({ ads: demoAds(keyword), hasToken: false })
  }
}

function demoAds(keyword) {
  return [
    { id:'1', pageName:'Represent Clothing', createdAt:'2025-03-01', headline:'New Season Drop — Limited Units', body:'Our most anticipated collection yet. Premium heavyweight fleece, built to last. Free shipping on orders over $150.', spend:{lower_bound:'1000',upper_bound:'5000'}, impressions:{lower_bound:'50000',upper_bound:'200000'} },
    { id:'2', pageName:'Adanola', createdAt:'2025-03-10', headline:'The Edit — Spring 25', body:'Elevated basics for every day. New colorways dropping this week. Shop the collection before it sells out.', spend:{lower_bound:'5000',upper_bound:'10000'}, impressions:{lower_bound:'200000',upper_bound:'500000'} },
    { id:'3', pageName:'Gymshark', createdAt:'2025-03-12', headline:'New: Oversized Essentials', body:'The fit everyone\'s been asking for. Dropped in 6 colorways. Size up for that oversized look.', spend:{lower_bound:'10000',upper_bound:'50000'}, impressions:{lower_bound:'500000',upper_bound:'1000000'} },
    { id:'4', pageName:'CUTS Clothing', createdAt:'2025-03-15', headline:'Work. Weekend. Everywhere.', body:'Shirts that move with you. Anti-wrinkle, sweat-wicking, and sharp enough for any setting. Try risk-free.', spend:{lower_bound:'5000',upper_bound:'10000'}, impressions:{lower_bound:'100000',upper_bound:'500000'} },
    { id:'5', pageName:'Manière De Voir', createdAt:'2025-03-18', headline:'Premium Basics. Exceptional Quality.', body:'Crafted from the finest materials. New core collection available now. Free express delivery.', spend:{lower_bound:'1000',upper_bound:'5000'}, impressions:{lower_bound:'50000',upper_bound:'100000'} },
    { id:'6', pageName:'Castore', createdAt:'2025-03-20', headline:'Performance Meets Style', body:'Athletic wear engineered for performance. New season styles now available. Shop the drop.', spend:{lower_bound:'5000',upper_bound:'10000'}, impressions:{lower_bound:'200000',upper_bound:'500000'} },
  ]
}
