import { useState } from 'react'
import Head from 'next/head'

export default function Install() {
  const [shop, setShop] = useState('')
  const [loading, setLoading] = useState(false)

  function connect() {
    if (!shop.trim()) return
    setLoading(true)
    const domain = shop.includes('.myshopify.com') ? shop.trim() : `${shop.trim()}.myshopify.com`
    window.location.href = `/api/auth/install?shop=${domain}`
  }

  return (
    <>
      <Head><title>Monochrome — Connect store</title></Head>
      <div style={{ minHeight:'100vh', background:'#0a0a0a', display:'flex', alignItems:'center', justifyContent:'center', padding:24, fontFamily:"'DM Sans',sans-serif" }}>
        <div style={{ width:'100%', maxWidth:400 }}>
          <div style={{ textAlign:'center', marginBottom:44 }}>
            <div style={{ fontSize:26, fontWeight:500, color:'#fff', letterSpacing:'-0.6px', marginBottom:10 }}>monochrome</div>
            <div style={{ fontSize:14, color:'rgba(255,255,255,0.35)', lineHeight:1.6 }}>AI inventory intelligence for apparel brands.<br/>Size curves, color scoring, market signals.</div>
          </div>

          <div style={{ background:'#161616', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:28 }}>
            <div style={{ fontSize:15, fontWeight:500, color:'#fff', marginBottom:5 }}>Connect your Shopify store</div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.35)', marginBottom:22 }}>One click. Your data syncs automatically.</div>

            <div style={{ fontSize:12, color:'rgba(255,255,255,0.3)', marginBottom:8 }}>Store name</div>
            <div style={{ display:'flex', gap:8, marginBottom:8 }}>
              <input
                value={shop} onChange={e=>setShop(e.target.value)} onKeyDown={e=>e.key==='Enter'&&connect()}
                placeholder="your-brand" autoFocus
                style={{ flex:1, padding:'10px 14px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff', fontSize:14, outline:'none', fontFamily:"'DM Sans',sans-serif" }}
              />
              <div style={{ padding:'0 12px', display:'flex', alignItems:'center', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, color:'rgba(255,255,255,0.25)', fontSize:13, whiteSpace:'nowrap' }}>
                .myshopify.com
              </div>
            </div>

            <button onClick={connect} disabled={loading} style={{ width:'100%', padding:'11px', background:loading?'rgba(255,255,255,0.08)':'#fff', color:'#0a0a0a', border:'none', borderRadius:8, fontSize:14, fontWeight:500, cursor:loading?'wait':'pointer', fontFamily:"'DM Sans',sans-serif", marginTop:6 }}>
              {loading ? 'Connecting...' : 'Connect with Shopify →'}
            </button>

            <div style={{ marginTop:22, paddingTop:22, borderTop:'1px solid rgba(255,255,255,0.06)' }}>
              {['Shopify shows you what permissions are needed','Click Approve — done in seconds','Your products, orders & variants sync instantly'].map((s,i)=>(
                <div key={i} style={{ display:'flex', gap:10, marginBottom:10, alignItems:'flex-start' }}>
                  <div style={{ width:20, height:20, borderRadius:'50%', background:'rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'rgba(255,255,255,0.3)', flexShrink:0, marginTop:1 }}>{i+1}</div>
                  <div style={{ fontSize:13, color:'rgba(255,255,255,0.35)', lineHeight:1.5 }}>{s}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ textAlign:'center', marginTop:22, fontSize:12, color:'rgba(255,255,255,0.15)' }}>
            Read-only access · No manual setup · Cancel anytime
          </div>
        </div>
      </div>
    </>
  )
}
