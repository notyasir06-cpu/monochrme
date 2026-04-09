import Head from 'next/head'
import { useState, useEffect } from 'react'

const TAG = {
  tariff:  { bg:'#fee2e2', color:'#991b1b', label:'Tariff alert' },
  shipping:{ bg:'#fef9c3', color:'#854d0e', label:'Shipping' },
  trend:   { bg:'#dbeafe', color:'#1d4ed8', label:'Trend signal' },
  supplier:{ bg:'#f3e8ff', color:'#7e22ce', label:'Supplier news' },
}

export default function Intelligence({ shop }) {
  const [data, setData] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetch('/api/news', { headers: { 'x-shop': shop||'' } })
      .then(r=>r.json()).then(setData).catch(()=>{})
  }, [shop])

  const articles = data?.articles || demoArticles
  const warnings = data?.warnings || demoWarnings
  const filtered = filter==='all' ? articles : articles.filter(a=>a.tag===filter)

  const counts = ['tariff','shipping','trend','supplier'].reduce((acc,t)=>({...acc,[t]:articles.filter(a=>a.tag===t).length}),{})

  const timeAgo = d => {
    const h = Math.floor((Date.now()-new Date(d))/3600000)
    const days = Math.floor(h/24)
    return days>0?`${days}d ago`:h>0?`${h}h ago`:'Just now'
  }

  return (
    <>
      <Head><title>Market signals — Monochrome</title></Head>
      <div className="ph">
        <div>
          <div className="ph-title">Market signals</div>
          <div className="ph-sub">Live tariff, shipping & apparel trend intelligence</div>
        </div>
        <div style={{ fontSize:12, color:'#999' }}>Updated {timeAgo(new Date().toISOString())}</div>
      </div>

      <div className="pad">
        {/* PO warnings - connected to the PO flow */}
        {warnings.length > 0 && (
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.06em', color:'#999', marginBottom:10 }}>Active PO warnings</div>
            {warnings.map((w,i)=>(
              <div key={i} className={`alert ${w.type==='danger'?'a-red':'a-yellow'}`} style={{ marginBottom:8 }}>
                <span>{w.type==='danger'?'🔴':'⚠'}</span>
                <div>
                  <strong>Action required:</strong> {w.message}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filter pills */}
        <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
          {[['all','All',articles.length],['tariff','Tariffs',counts.tariff],['shipping','Shipping',counts.shipping],['trend','Trends',counts.trend],['supplier','Suppliers',counts.supplier]].map(([id,label,count])=>(
            <button key={id} onClick={()=>setFilter(id)} style={{ padding:'6px 14px', borderRadius:20, border:'1px solid', borderColor:filter===id?'#0a0a0a':'#e0e0e0', background:filter===id?'#0a0a0a':'#fff', color:filter===id?'#fff':'#666', fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
              {label} {count>0&&<span style={{ opacity:0.6 }}>({count})</span>}
            </button>
          ))}
        </div>

        {/* News grid */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {filtered.map((a,i)=>{
            const t = TAG[a.tag]||TAG.trend
            const timeAgoStr = timeAgo(a.publishedAt)
            return (
              <a key={i} href={a.url!=='#'?a.url:undefined} target="_blank" rel="noopener noreferrer" style={{ textDecoration:'none' }}>
                <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:10, padding:16, cursor:'pointer', transition:'border-color 0.15s', height:'100%' }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor='#bbb'}
                  onMouseLeave={e=>e.currentTarget.style.borderColor='#e8e8e8'}
                >
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                    <span style={{ fontSize:10, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.05em', padding:'2px 7px', borderRadius:20, background:t.bg, color:t.color }}>{t.label}</span>
                    <span style={{ fontSize:11, color:'#999' }}>{timeAgoStr}</span>
                  </div>
                  <div style={{ fontSize:14, fontWeight:500, color:'#0a0a0a', lineHeight:1.4, marginBottom:8 }}>{a.title}</div>
                  {a.description && (
                    <div style={{ fontSize:12, color:'#666', lineHeight:1.5, marginBottom:10, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{a.description}</div>
                  )}
                  <div style={{ fontSize:11, color:'#bbb' }}>{a.source}</div>
                </div>
              </a>
            )
          })}
        </div>

        {filtered.length===0&&(
          <div style={{ textAlign:'center', padding:'60px 0', color:'#999' }}>No signals in this category right now</div>
        )}
      </div>
    </>
  )
}

const demoWarnings = [
  { type:'danger', message:'Shipping from Pakistan flagged as unpredictable — add 2–3 week buffer to lead times before confirming next PO' },
  { type:'warning', message:'US tariff review on South Asian textile imports underway — verify landed costs before placing Pakistan orders' },
]

const demoArticles = [
  { tag:'tariff', title:'US reviews tariff rates on South Asian textile imports', description:'Trade officials reviewing rates on apparel imports from Pakistan and Bangladesh, potentially affecting costs for brands sourcing from the region.', source:'Reuters', publishedAt:new Date().toISOString(), url:'#' },
  { tag:'shipping', title:'Karachi port delays extend 8–12 days amid peak congestion', description:'Above-average delays at Karachi port due to peak manufacturing season coinciding with increased vessel traffic. Brands should add buffer.', source:'FreightWaves', publishedAt:new Date(Date.now()-3600000*5).toISOString(), url:'#' },
  { tag:'trend', title:'Oversized silhouettes continue to dominate spring demand', description:'Strong full-price sell-through on relaxed-fit garments continues. Brands with heavyweight fleece seeing particularly strong performance.', source:'Business of Fashion', publishedAt:new Date(Date.now()-86400000).toISOString(), url:'#' },
  { tag:'supplier', title:'Pakistan textile exports reach multi-year high in Q1', description:'Manufacturing output from Pakistan\'s textile sector surged in Q1, with export volumes up 18% year-on-year. Lead times remain extended.', source:'WWD', publishedAt:new Date(Date.now()-86400000*2).toISOString(), url:'#' },
  { tag:'trend', title:'Earth tones accelerating — olive searches up 34% YoY', description:'Consumer search data shows accelerating interest in earth-tone colorways. Olive is up 34% YoY, signaling shift away from neutral grays.', source:'Trendalytics', publishedAt:new Date(Date.now()-86400000*3).toISOString(), url:'#' },
  { tag:'shipping', title:'Container rates stabilize after Q1 Red Sea disruptions', description:'Freight rates on major trade lanes have leveled off following elevated shipping costs earlier in the year.', source:'Freight Journal', publishedAt:new Date(Date.now()-86400000*4).toISOString(), url:'#' },
]
