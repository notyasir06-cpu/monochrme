import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'

function useFetch(url, shop) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!shop || !url) return
    setLoading(true)
    fetch(url, { headers: { 'x-shop': shop } })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [url, shop])
  return { data, loading }
}

export default function Dashboard({ shop }) {
  const [target, setTarget] = useState(100000)
  const [editing, setEditing] = useState(false)
  const inputRef = useRef(null)
  const { data: products } = useFetch('/api/shopify/products', shop)
  const { data: orders } = useFetch('/api/shopify/orders?days=30', shop)
  const { data: forecast } = useFetch(`/api/shopify/forecast?target=${target}`, shop)
  const { data: news } = useFetch('/api/news', shop)

  useEffect(() => {
    const saved = localStorage.getItem('mc_target')
    if (saved) setTarget(parseFloat(saved))
  }, [])

  function saveTarget(val) {
    const v = parseFloat(val.replace(/[^0-9.]/g,'')) || 100000
    setTarget(v)
    localStorage.setItem('mc_target', v)
    setEditing(false)
  }

  if (!shop) return <ConnectScreen />

  const s = products?.summary || {}
  const notifs = s.notifications || []
  const rev = orders?.totalRevenue || 0
  const orderCount = orders?.totalOrders || 0
  const warnings = news?.warnings || []
  const topVariants = orders?.topVariants || []

  const projectedAnnual = forecast?.currentAnnualProjection || 0
  const gap = forecast?.gap || 0
  const onTrack = forecast?.onTrack

  return (
    <>
      <Head><title>Dashboard — Monochrome</title></Head>

      <div className="ph">
        <div>
          <div className="ph-title">Dashboard</div>
          <div className="ph-sub">Last 30 days · {shop}</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <Link href="/inventory"><button className="btn btn-outline btn-sm">View inventory</button></Link>
          <Link href="/purchase-orders"><button className="btn btn-dark btn-sm">+ New PO</button></Link>
        </div>
      </div>

      <div className="pad">

        {/* Warnings from intelligence */}
        {warnings.slice(0,1).map((w,i) => (
          <div key={i} className={`alert ${w.type==='danger'?'a-red':'a-yellow'}`} style={{ marginBottom:12 }}>
            <span>⚠</span>
            <span>{w.message} <Link href="/intelligence" style={{ fontWeight:500, textDecoration:'underline' }}>See signals →</Link></span>
          </div>
        ))}

        {/* Revenue target */}
        <div className="card" style={{ marginBottom:16, background:'#0a0a0a', border:'none' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.08em', color:'rgba(255,255,255,0.3)', marginBottom:6 }}>Revenue target</div>
              {editing ? (
                <input ref={inputRef} defaultValue={target} autoFocus
                  onBlur={e=>saveTarget(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&saveTarget(e.target.value)}
                  style={{ fontSize:32, fontWeight:500, letterSpacing:'-1px', background:'transparent', border:'none', outline:'none', color:'#fff', width:200, fontFamily:"'DM Sans',sans-serif" }}
                />
              ) : (
                <div onClick={()=>setEditing(true)} style={{ fontSize:32, fontWeight:500, letterSpacing:'-1px', color:'#fff', cursor:'text' }}>
                  ${target.toLocaleString()}
                  <span style={{ fontSize:13, color:'rgba(255,255,255,0.3)', marginLeft:8 }}>click to edit</span>
                </div>
              )}
            </div>

            <div style={{ display:'flex', gap:24 }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.06em' }}>Projected annual</div>
                <div style={{ fontSize:22, fontWeight:500, color: onTrack?'#4ade80':'#f87171', letterSpacing:'-0.5px' }}>${projectedAnnual.toLocaleString()}</div>
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.06em' }}>Gap to target</div>
                <div style={{ fontSize:22, fontWeight:500, color: gap===0?'#4ade80':'#fbbf24', letterSpacing:'-0.5px' }}>{gap===0?'On track':'$'+gap.toLocaleString()}</div>
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.06em' }}>Weekly units needed</div>
                <div style={{ fontSize:22, fontWeight:500, color:'#fff', letterSpacing:'-0.5px' }}>{forecast?.weeklyUnitsNeeded || '—'}</div>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ marginTop:20, height:6, background:'rgba(255,255,255,0.08)', borderRadius:3, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${Math.min(100, projectedAnnual/target*100)}%`, background: onTrack?'#4ade80':'#fbbf24', borderRadius:3, transition:'width 0.8s' }} />
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.3)' }}>Current pace: ${Math.round((forecast?.currentDailyRevenue||0)*365).toLocaleString()}/year</span>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.3)' }}>Target: ${target.toLocaleString()}</span>
          </div>
        </div>

        {/* Key metrics */}
        <div className="g4" style={{ marginBottom:16 }}>
          <div className="metric">
            <div className="metric-label">Revenue (30d)</div>
            <div className="metric-value">${rev.toLocaleString()}</div>
            <div className="metric-sub">{orderCount} orders</div>
          </div>
          <div className="metric">
            <div className="metric-label">Total products</div>
            <div className="metric-value">{s.total||0}</div>
            <div className="metric-sub">{s.totalUnits||0} units in stock</div>
          </div>
          <div className="metric">
            <div className="metric-label">Needs reorder</div>
            <div className="metric-value" style={{ color:(s.outOfStock||0)+(s.lowStock||0)>0?'#dc2626':undefined }}>{(s.outOfStock||0)+(s.lowStock||0)}</div>
            <div className="metric-sub">Out of stock or low</div>
          </div>
          <div className="metric">
            <div className="metric-label">Selling out fast</div>
            <div className="metric-value" style={{ color:(s.sellingOut||0)>0?'#d97706':undefined }}>{s.sellingOut||0}</div>
            <div className="metric-sub">Variants under 5 units</div>
          </div>
        </div>

        <div className="g2">
          {/* Notifications */}
          <div className="card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div style={{ fontWeight:500 }}>Notifications</div>
              {notifs.length > 0 && <span className="badge b-red">{notifs.length} alerts</span>}
            </div>
            {notifs.length === 0 && (
              <div style={{ color:'#999', fontSize:13, textAlign:'center', padding:'20px 0' }}>All good — no alerts right now</div>
            )}
            <div>
              {notifs.slice(0,6).map((n,i) => (
                <div key={i} className="notif-item">
                  <div className="notif-icon" style={{ background: n.type==='danger'?'#fee2e2':n.type==='warning'?'#fef9c3':'#dbeafe' }}>
                    {n.type==='danger'?'🔴':n.type==='warning'?'🟡':'🔵'}
                  </div>
                  <div>
                    <div style={{ fontWeight:500, fontSize:13 }}>{n.product}</div>
                    <div style={{ fontSize:12, color:'#666' }}>{n.msg}</div>
                  </div>
                </div>
              ))}
            </div>
            {notifs.length > 6 && (
              <Link href="/inventory"><div style={{ fontSize:12, color:'#999', marginTop:8, cursor:'pointer' }}>+{notifs.length-6} more → View all</div></Link>
            )}
          </div>

          {/* Top selling variants */}
          <div className="card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div style={{ fontWeight:500 }}>Top variants (30d)</div>
              <Link href="/inventory" style={{ fontSize:12, color:'#999' }}>View all →</Link>
            </div>
            {topVariants.slice(0,5).map((v,i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid #f5f5f5' }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:500 }}>{v.title}</div>
                  <div style={{ fontSize:12, color:'#999' }}>{v.variant}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:13, fontWeight:500 }}>{v.sold} sold</div>
                  <div style={{ fontSize:11, color: v.velocity>1.5?'#16a34a':v.velocity<0.5?'#dc2626':'#999' }}>
                    {v.velocity}/day {v.velocity>1.5?'↑':v.velocity<0.5?'↓':'→'}
                  </div>
                </div>
              </div>
            ))}
            {topVariants.length===0 && <div style={{ color:'#999', fontSize:13, textAlign:'center', padding:'20px 0' }}>No order data yet</div>}
          </div>
        </div>

        {/* Quick actions */}
        <div className="g3" style={{ marginTop:16 }}>
          {[
            { href:'/purchase-orders', label:'Create purchase order', sub:'AI size curves · color scoring · cash requirement', icon:'📋' },
            { href:'/calendar', label:'View PO calendar', sub:'12-month order & arrival dates overview', icon:'📅' },
            { href:'/intelligence', label:'Market signals', sub:'Tariffs · shipping · trend intelligence', icon:'📡' },
          ].map(({ href, label, sub, icon }) => (
            <Link key={href} href={href}>
              <div className="card" style={{ cursor:'pointer', transition:'border-color 0.15s' }}
                onMouseEnter={e=>e.currentTarget.style.borderColor='#bbb'}
                onMouseLeave={e=>e.currentTarget.style.borderColor='#e8e8e8'}
              >
                <div style={{ fontSize:24, marginBottom:10 }}>{icon}</div>
                <div style={{ fontWeight:500, marginBottom:4 }}>{label}</div>
                <div style={{ fontSize:12, color:'#999' }}>{sub}</div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </>
  )
}

function ConnectScreen() {
  const [shop, setShop] = useState('')
  const go = () => {
    if (!shop.trim()) return
    const domain = shop.includes('.myshopify.com') ? shop.trim() : `${shop.trim()}.myshopify.com`
    window.location.href = `/api/auth/install?shop=${domain}`
  }
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ maxWidth:360, width:'100%', textAlign:'center' }}>
        <div style={{ fontSize:24, fontWeight:500, letterSpacing:'-0.6px', marginBottom:8 }}>monochrome</div>
        <div style={{ color:'#999', marginBottom:32, fontSize:14 }}>Inventory intelligence for apparel brands</div>
        <div className="card" style={{ textAlign:'left' }}>
          <div style={{ fontWeight:500, marginBottom:4 }}>Connect your Shopify store</div>
          <div style={{ fontSize:12, color:'#999', marginBottom:16 }}>One click. No manual setup.</div>
          <input className="input" placeholder="your-store" value={shop} onChange={e=>setShop(e.target.value)} onKeyDown={e=>e.key==='Enter'&&go()} style={{ marginBottom:8 }} />
          <div style={{ fontSize:11, color:'#bbb', marginBottom:14 }}>your-store.myshopify.com</div>
          <button onClick={go} style={{ width:'100%', padding:10, background:'#0a0a0a', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer' }}>
            Connect with Shopify →
          </button>
        </div>
        <div style={{ marginTop:16, fontSize:12, color:'#bbb' }}>Or go to <Link href="/install" style={{ textDecoration:'underline' }}>/install</Link></div>
      </div>
    </div>
  )
}
