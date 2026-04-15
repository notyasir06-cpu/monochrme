import Head from 'next/head'
import { useState, useEffect } from 'react'

const CATEGORIES = [
  'hoodie apparel streetwear',
  'oversized clothing drop',
  'premium basics clothing',
  'cargo trousers fashion',
  'apparel new collection',
  'clothing sale discount',
]

export default function MetaAds({ shop }) {
  const [ads, setAds] = useState([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('hoodie apparel streetwear')
  const [hasToken, setHasToken] = useState(false)
  const [searching, setSearching] = useState(false)

  function fetchAds(kw) {
    setSearching(true)
    fetch(`/api/meta-ads?keyword=${encodeURIComponent(kw)}&shop=${encodeURIComponent(shop||'')}`)
      .then(r => r.json())
      .then(d => { setAds(d.ads||[]); setHasToken(d.hasToken); setSearching(false); setLoading(false) })
      .catch(() => setSearching(false))
  }

  useEffect(() => { fetchAds(keyword) }, [])

  const formatSpend = (spend) => {
    if (!spend) return 'Not disclosed'
    const lo = parseInt(spend.lower_bound||0)
    const hi = parseInt(spend.upper_bound||0)
    if (!lo && !hi) return 'Not disclosed'
    return `$${lo.toLocaleString()} – $${hi.toLocaleString()}`
  }

  const formatImpressions = (imp) => {
    if (!imp) return '—'
    const hi = parseInt(imp.upper_bound||0)
    if (hi > 1000000) return `${(hi/1000000).toFixed(1)}M+`
    if (hi > 1000) return `${(hi/1000).toFixed(0)}K+`
    return `${hi}+`
  }

  return (
    <>
      <Head><title>Meta Ads Library — Monochrome</title></Head>
      <div className="ph">
        <div>
          <div className="ph-title">Meta Ads Library</div>
          <div className="ph-sub">See what competitors are running · spot trends before they peak</div>
        </div>
        {!hasToken && (
          <div style={{fontSize:12,color:'#d97706',background:'#fef9c3',padding:'6px 12px',borderRadius:6,border:'1px solid #fde047'}}>
            Demo mode · Add META_ADS_TOKEN to Vercel for live data
          </div>
        )}
      </div>

      <div className="pad">
        {!hasToken && (
          <div className="alert a-blue" style={{marginBottom:20}}>
            <span>ℹ</span>
            <div>
              <strong>To get live Meta Ads data:</strong> Go to <a href="https://developers.facebook.com" target="_blank" style={{fontWeight:500,textDecoration:'underline'}}>developers.facebook.com</a>, create an app, get an access token, then add it to Vercel as <strong>META_ADS_TOKEN</strong>. Until then you're seeing demo ads.
            </div>
          </div>
        )}

        {/* Search */}
        <div className="card" style={{marginBottom:20}}>
          <div style={{fontWeight:500,marginBottom:12}}>Search competitor ads</div>
          <div style={{display:'flex',gap:10,marginBottom:14}}>
            <input
              className="input"
              value={keyword}
              onChange={e=>setKeyword(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&fetchAds(keyword)}
              placeholder="e.g. hoodie streetwear drop"
              style={{flex:1}}
            />
            <button onClick={()=>fetchAds(keyword)} className="btn btn-dark" style={{whiteSpace:'nowrap'}}>
              {searching ? 'Searching...' : 'Search ads'}
            </button>
          </div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={()=>{setKeyword(cat);fetchAds(cat)}} style={{padding:'4px 10px',fontSize:11,fontWeight:500,borderRadius:20,border:'1px solid #e0e0e0',background:keyword===cat?'#0a0a0a':'#fff',color:keyword===cat?'#fff':'#666',cursor:'pointer'}}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Insights */}
        {ads.length > 0 && (
          <div className="g3" style={{marginBottom:20}}>
            <div className="metric">
              <div className="metric-label">Ads found</div>
              <div className="metric-value">{ads.length}</div>
              <div className="metric-sub">Running right now</div>
            </div>
            <div className="metric">
              <div className="metric-label">Brands running</div>
              <div className="metric-value">{new Set(ads.map(a=>a.pageName)).size}</div>
              <div className="metric-sub">Unique advertisers</div>
            </div>
            <div className="metric">
              <div className="metric-label">Top format</div>
              <div className="metric-value" style={{fontSize:18}}>Product drops</div>
              <div className="metric-sub">Most common angle</div>
            </div>
          </div>
        )}

        {/* Trend signals from ads */}
        {ads.length > 0 && (
          <div className="card" style={{marginBottom:20,background:'#0a0a0a',border:'none'}}>
            <div style={{fontSize:11,fontWeight:500,textTransform:'uppercase',letterSpacing:'0.08em',color:'rgba(255,255,255,0.3)',marginBottom:12}}>What competitors are pushing right now</div>
            <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
              {['Oversized fits','New season drops','Free shipping offers','Limited stock urgency','Premium quality messaging','Colorway launches'].map(t=>(
                <div key={t} style={{padding:'6px 12px',background:'rgba(255,255,255,0.08)',borderRadius:6,fontSize:13,color:'rgba(255,255,255,0.7)'}}>
                  {t}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ads grid */}
        {loading ? (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            {[1,2,3,4].map(i=>(
              <div key={i} className="card">
                <div className="skeleton" style={{height:14,width:120,marginBottom:10}}/>
                <div className="skeleton" style={{height:18,width:'90%',marginBottom:8}}/>
                <div className="skeleton" style={{height:14,width:'70%'}}/>
              </div>
            ))}
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            {ads.map((ad,i) => (
              <div key={i} className="card" style={{borderLeft:'3px solid #0a0a0a'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                  <div>
                    <div style={{fontWeight:500,fontSize:14}}>{ad.pageName}</div>
                    <div style={{fontSize:11,color:'#999',marginTop:2}}>{new Date(ad.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div>
                  </div>
                  <span className="badge b-gray">Active</span>
                </div>

                <div style={{fontSize:14,fontWeight:500,color:'#0a0a0a',marginBottom:8,lineHeight:1.4}}>{ad.headline}</div>
                {ad.body && <div style={{fontSize:12,color:'#666',lineHeight:1.5,marginBottom:12,display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{ad.body}</div>}

                <div style={{display:'flex',gap:16,paddingTop:10,borderTop:'1px solid #f0f0f0'}}>
                  <div>
                    <div style={{fontSize:10,color:'#999',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:3}}>Est. spend</div>
                    <div style={{fontSize:12,fontWeight:500}}>{formatSpend(ad.spend)}</div>
                  </div>
                  <div>
                    <div style={{fontSize:10,color:'#999',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:3}}>Impressions</div>
                    <div style={{fontSize:12,fontWeight:500}}>{formatImpressions(ad.impressions)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
