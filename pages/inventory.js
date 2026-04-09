import Head from 'next/head'
import { useState, useEffect } from 'react'

export default function Inventory({ shop }) {
  const [data, setData] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    if (!shop) return
    fetch('/api/shopify/products', { headers: { 'x-shop': shop } })
      .then(r => r.json()).then(setData).catch(() => {})
  }, [shop])

  const products = data?.products || []
  const s = data?.summary || { total:0, outOfStock:0, lowStock:0, overstock:0, healthy:0, notifications:[] }

  const filtered = products.filter(p => {
    const mf = filter==='all' || p.status===filter
    const ms = !search || p.title.toLowerCase().includes(search.toLowerCase())
    return mf && ms
  })

  const statusMap = {
    healthy: { cls:'b-green', label:'Healthy' },
    low_stock: { cls:'b-yellow', label:'Low stock' },
    out_of_stock: { cls:'b-red', label:'Out of stock' },
    overstock: { cls:'b-blue', label:'Overstock' },
  }

  return (
    <>
      <Head><title>Inventory — Monochrome</title></Head>
      <div className="ph">
        <div><div className="ph-title">Inventory</div><div className="ph-sub">Size & color breakdown · variant level</div></div>
      </div>

      {/* Notifications */}
      {s.notifications?.length > 0 && (
        <div style={{ padding:'16px 28px 0' }}>
          {s.notifications.slice(0,3).map((n,i) => (
            <div key={i} className={`alert ${n.type==='danger'?'a-red':n.type==='info'?'a-blue':'a-yellow'}`} style={{ marginBottom:8 }}>
              <span>{n.type==='danger'?'🔴':n.type==='info'?'🔵':'🟡'}</span>
              <span><strong>{n.product}:</strong> {n.msg}</span>
            </div>
          ))}
        </div>
      )}

      <div className="tabs">
        {[['all',`All (${s.total})`],['healthy',`Healthy (${s.healthy})`],['low_stock',`Low stock (${s.lowStock})`],['out_of_stock',`Out of stock (${s.outOfStock})`],['overstock',`Overstock (${s.overstock})`]].map(([id,label])=>(
          <button key={id} className={`tab${filter===id?' active':''}`} onClick={()=>setFilter(id)}>{label}</button>
        ))}
      </div>

      <div className="pad">
        <input className="input" placeholder="Search products..." value={search} onChange={e=>setSearch(e.target.value)} style={{ maxWidth:300, marginBottom:16 }} />

        {products.length === 0 && data && (
          <div style={{ textAlign:'center', padding:'60px 0', color:'#999' }}>No products found in your store</div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {filtered.map(p => {
            const badge = statusMap[p.status] || statusMap.healthy
            const isOpen = expanded === p.id
            return (
              <div key={p.id} style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:10 }}>
                <div onClick={()=>setExpanded(isOpen?null:p.id)} style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:12, cursor:'pointer' }}>
                  {p.image && <img src={p.image} alt="" style={{ width:44, height:44, objectFit:'cover', borderRadius:6, flexShrink:0 }} />}
                  {!p.image && <div style={{ width:44, height:44, background:'#f5f5f5', borderRadius:6, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>👕</div>}
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:500, fontSize:14 }}>{p.title}</div>
                    <div style={{ fontSize:12, color:'#999' }}>{p.variantCount} variants · {p.totalInventory} units total</div>
                  </div>
                  {p.sellingOut?.length > 0 && <span className="badge b-yellow">Selling out: {p.sellingOut.map(s=>s.size).join(', ')}</span>}
                  <span className={`badge ${badge.cls}`}>{badge.label}</span>
                  <span style={{ color:'#ccc', marginLeft:4 }}>{isOpen?'▲':'▼'}</span>
                </div>

                {isOpen && (
                  <div style={{ padding:'0 16px 20px', borderTop:'1px solid #f5f5f5' }}>
                    {p.sizes?.length > 0 && (
                      <div style={{ marginTop:16 }}>
                        <div style={{ fontSize:11, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.06em', color:'#999', marginBottom:10 }}>Size breakdown</div>
                        <div className="size-grid">
                          {p.sizes.map(({ size, qty, pct }) => (
                            <div key={size} className="size-box" style={{ opacity:qty===0?0.35:1, borderColor:qty<5&&qty>0?'#fde047':'#e8e8e8' }}>
                              <div className="size-name">{size}</div>
                              <div className="size-qty" style={{ color:qty===0?'#dc2626':qty<5?'#d97706':undefined }}>{qty}</div>
                              <div className="size-pct">{pct}%</div>
                              {qty < 5 && qty > 0 && <div style={{ fontSize:9, color:'#d97706', marginTop:2 }}>LOW</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {p.colors?.length > 0 && (
                      <div style={{ marginTop:16 }}>
                        <div style={{ fontSize:11, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.06em', color:'#999', marginBottom:10 }}>Color breakdown & confidence</div>
                        {p.colors.map(({ color, qty, score, pct }) => (
                          <div key={color} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                            <div style={{ width:110, fontSize:13, fontWeight:500 }}>{color}</div>
                            <div style={{ flex:1 }}>
                              <div className="conf-bar">
                                <div className="conf-fill" style={{ width:`${score}%`, background:score>70?'#16a34a':score>50?'#d97706':'#dc2626' }} />
                              </div>
                            </div>
                            <div style={{ fontSize:11, width:60, color:score>70?'#16a34a':score>50?'#d97706':'#dc2626', fontWeight:500 }}>{score}% conf</div>
                            <div style={{ fontSize:12, color:'#999', width:60, textAlign:'right' }}>{qty} units</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
