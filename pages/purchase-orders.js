import Head from 'next/head'
import { useState } from 'react'

const SIZE_CURVE = { XS:0.05, S:0.18, M:0.30, L:0.28, XL:0.14, XXL:0.05 }
const COLOR_SCORES = { Black:94, White:88, Navy:82, Grey:79, Gray:79, Olive:71, Cream:65, Sage:44, Sand:38, Brown:72, Burgundy:76 }
const ALL_COLORS = ['Black','White','Navy','Grey','Olive','Sage','Sand','Cream','Brown','Burgundy']

const demoPOs = [
  { id:'001', supplier:'Karachi Textiles', product:'Classic Hoodie', units:300, cost:18, lead:55, status:'confirmed', confidence:88, cash:5400 },
  { id:'002', supplier:'Karachi Textiles', product:'Cargo Trousers', units:180, cost:24, lead:60, status:'in_transit', confidence:74, cash:4320 },
  { id:'003', supplier:'Karachi Textiles', product:'Core Tee', units:500, cost:9, lead:45, status:'draft', confidence:91, cash:4500 },
]

const statusStyle = {
  confirmed: { cls:'b-green', label:'Confirmed' },
  in_transit: { cls:'b-blue', label:'In transit' },
  draft: { cls:'b-gray', label:'Draft' },
  arrived: { cls:'b-purple', label:'Arrived' },
}

export default function PurchaseOrders({ shop }) {
  const [view, setView] = useState('list')
  const [pos, setPOs] = useState(demoPOs)
  const [form, setForm] = useState({ supplier:'', product:'', units:200, cost:18, lead:45, colors:['Black'], revenueTarget:'' })
  const [rec, setRec] = useState(null)

  const set = (k,v) => setForm(f=>({...f,[k]:v}))
  const toggleColor = c => setForm(f=>({ ...f, colors: f.colors.includes(c)?f.colors.filter(x=>x!==c):[...f.colors,c] }))

  function generate() {
    const sizes = Object.entries(SIZE_CURVE).map(([size,pct])=>({ size, qty:Math.round(form.units*pct), pct:Math.round(pct*100) }))
    const colors = form.colors.map(c=>({ color:c, score:COLOR_SCORES[c]||60, action:(COLOR_SCORES[c]||60)>70?'Order confidently':(COLOR_SCORES[c]||60)>50?'Order conservatively':'Skip or minimum' }))
    const avgScore = colors.reduce((s,c)=>s+c.score,0)/colors.length
    const confidence = Math.round(avgScore)
    const totalCost = form.units * form.cost
    const cashDueDate = new Date(Date.now() + (form.lead-14)*86400000)
    const arrivalDate = new Date(Date.now() + form.lead*86400000)
    const markdownRisk = colors.some(c=>c.score<50) ? 'high' : colors.some(c=>c.score<70) ? 'medium' : 'low'
    setRec({ sizes, colors, confidence, totalCost, cashDueDate, arrivalDate, markdownRisk })
    setView('review')
  }

  function confirm() {
    const newPO = { id:String(pos.length+1).padStart(3,'0'), ...form, status:'draft', confidence:rec.confidence, cash:rec.totalCost }
    setPOs(p=>[newPO,...p])
    setView('list')
    setRec(null)
    setForm({ supplier:'', product:'', units:200, cost:18, lead:45, colors:['Black'], revenueTarget:'' })
  }

  if (view==='review'&&rec) return <Review form={form} rec={rec} onBack={()=>setView('new')} onConfirm={confirm} />
  if (view==='new') return <NewForm form={form} set={set} toggleColor={toggleColor} colors={ALL_COLORS} onBack={()=>setView('list')} onGenerate={generate} />

  const totalCash = pos.filter(p=>p.status!=='arrived').reduce((s,p)=>s+p.cash,0)

  return (
    <>
      <Head><title>Purchase orders — Monochrome</title></Head>
      <div className="ph">
        <div><div className="ph-title">Purchase orders</div><div className="ph-sub">{pos.length} orders · ${totalCash.toLocaleString()} committed</div></div>
        <button onClick={()=>setView('new')} className="btn btn-dark">+ New PO</button>
      </div>

      <div className="pad">
        {/* Cash summary */}
        <div className="g3" style={{ marginBottom:16 }}>
          <div className="metric">
            <div className="metric-label">Total committed</div>
            <div className="metric-value">${totalCash.toLocaleString()}</div>
            <div className="metric-sub">Across {pos.filter(p=>p.status!=='arrived').length} active orders</div>
          </div>
          <div className="metric">
            <div className="metric-label">Units on order</div>
            <div className="metric-value">{pos.filter(p=>p.status!=='arrived').reduce((s,p)=>s+p.units,0)}</div>
            <div className="metric-sub">In production or transit</div>
          </div>
          <div className="metric">
            <div className="metric-label">Avg confidence</div>
            <div className="metric-value">{Math.round(pos.reduce((s,p)=>s+p.confidence,0)/pos.length)}%</div>
            <div className="metric-sub">AI recommendation score</div>
          </div>
        </div>

        <div className="card" style={{ padding:0 }}>
          <table className="tbl">
            <thead>
              <tr>
                {['PO','Supplier','Product','Units','Total cost','Cash due','Status','Confidence'].map(h=>(
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pos.map(po => {
                const badge = statusStyle[po.status]||statusStyle.draft
                const cashDue = new Date(Date.now()+(po.lead-14)*86400000)
                return (
                  <tr key={po.id}>
                    <td style={{ fontFamily:'monospace', fontSize:12, color:'#666' }}>PO-{po.id}</td>
                    <td>{po.supplier||'—'}</td>
                    <td style={{ fontWeight:500 }}>{po.product}</td>
                    <td>{po.units}</td>
                    <td style={{ fontWeight:500 }}>${(po.units*po.cost).toLocaleString()}</td>
                    <td style={{ fontSize:12, color:'#dc2626' }}>{cashDue.toLocaleDateString('en-US',{month:'short',day:'numeric'})}</td>
                    <td><span className={`badge ${badge.cls}`}>{badge.label}</span></td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <div style={{ width:60, height:4, background:'#f0f0f0', borderRadius:2, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${po.confidence}%`, background:'#0a0a0a', borderRadius:2 }} />
                        </div>
                        <span style={{ fontSize:12, fontFamily:'monospace' }}>{po.confidence}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function F({ label, children }) {
  return <div className="field"><div className="field-label">{label}</div>{children}</div>
}

function NewForm({ form, set, toggleColor, colors, onBack, onGenerate }) {
  const total = form.units * form.cost
  const arrival = new Date(Date.now()+form.lead*86400000)
  return (
    <>
      <Head><title>New PO — Monochrome</title></Head>
      <div className="ph">
        <div>
          <button onClick={onBack} style={{ background:'none',border:'none',fontSize:13,color:'#999',cursor:'pointer',padding:0,marginBottom:6 }}>← Back</button>
          <div className="ph-title">New purchase order</div>
          <div className="ph-sub">AI will recommend sizes, score colors, and calculate cash needs</div>
        </div>
      </div>

      <div className="pad" style={{ maxWidth:640 }}>
        <div className="card" style={{ marginBottom:14 }}>
          <div style={{ fontWeight:500, marginBottom:16 }}>Order details</div>
          <div className="g2" style={{ marginBottom:12 }}>
            <F label="Supplier"><input className="input" value={form.supplier} onChange={e=>set('supplier',e.target.value)} placeholder="e.g. Karachi Textiles" /></F>
            <F label="Product name"><input className="input" value={form.product} onChange={e=>set('product',e.target.value)} placeholder="e.g. Classic Hoodie" /></F>
          </div>
          <div className="g3">
            <F label="Total units"><input className="input" type="number" value={form.units} onChange={e=>set('units',parseInt(e.target.value)||0)} /></F>
            <F label="Cost per unit ($)"><input className="input" type="number" value={form.cost} onChange={e=>set('cost',parseFloat(e.target.value)||0)} /></F>
            <F label="Lead time (days)"><input className="input" type="number" value={form.lead} onChange={e=>set('lead',parseInt(e.target.value)||0)} /></F>
          </div>
        </div>

        <div className="card" style={{ marginBottom:14 }}>
          <div style={{ fontWeight:500, marginBottom:4 }}>Colors to order</div>
          <div style={{ fontSize:12, color:'#999', marginBottom:14 }}>AI will score each color based on sell-through history</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {colors.map(c=>(
              <button key={c} onClick={()=>toggleColor(c)} style={{ padding:'6px 14px', fontSize:12, fontWeight:500, borderRadius:6, border:'1px solid', borderColor:form.colors.includes(c)?'#0a0a0a':'#e0e0e0', background:form.colors.includes(c)?'#0a0a0a':'#fff', color:form.colors.includes(c)?'#fff':'#0a0a0a', cursor:'pointer' }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div style={{ background:'#f7f7f7', borderRadius:10, padding:16, marginBottom:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <div style={{ fontSize:12, color:'#999', marginBottom:4 }}>Order total</div>
              <div style={{ fontSize:26, fontWeight:500, letterSpacing:'-0.5px' }}>${total.toLocaleString()}</div>
              <div style={{ fontSize:12, color:'#999', marginTop:4 }}>Cash due ~{new Date(Date.now()+(form.lead-14)*86400000).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:12, color:'#999', marginBottom:4 }}>Expected arrival</div>
              <div style={{ fontSize:16, fontWeight:500 }}>{arrival.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div>
              <div style={{ fontSize:12, color:'#999', marginTop:4 }}>{form.lead} day lead time</div>
            </div>
          </div>
        </div>

        <button onClick={onGenerate} className="btn btn-dark" style={{ width:'100%', justifyContent:'center', padding:'12px 16px', fontSize:14 }}>
          Generate AI recommendation →
        </button>
      </div>
    </>
  )
}

function Review({ form, rec, onBack, onConfirm }) {
  const markdownColor = rec.markdownRisk==='high'?'#dc2626':rec.markdownRisk==='medium'?'#d97706':'#16a34a'
  return (
    <>
      <Head><title>Review PO — Monochrome</title></Head>
      <div className="ph">
        <div>
          <button onClick={onBack} style={{ background:'none',border:'none',fontSize:13,color:'#999',cursor:'pointer',padding:0,marginBottom:6 }}>← Edit order</button>
          <div className="ph-title">AI recommendation</div>
          <div className="ph-sub">{form.product}{form.supplier?` · ${form.supplier}`:''}</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onBack} className="btn btn-outline">Adjust</button>
          <button onClick={onConfirm} className="btn btn-dark">Confirm PO</button>
        </div>
      </div>

      <div className="pad">
        {/* Confidence + cash header */}
        <div className="card" style={{ marginBottom:16, display:'flex', gap:24, alignItems:'center', flexWrap:'wrap' }}>
          <div>
            <div style={{ fontSize:56, fontWeight:500, letterSpacing:'-2px', lineHeight:1 }}>{rec.confidence}%</div>
            <div style={{ fontSize:12, color:'#999', marginTop:4 }}>AI confidence score</div>
          </div>
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ fontSize:13, color:'#666', lineHeight:1.6, marginBottom:10 }}>
              Based on your sell-through history, seasonal patterns, and color performance data. Designed to maximise margin and minimise overstock risk.
            </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              <span className="badge b-gray">Markdown risk: <span style={{ color:markdownColor, marginLeft:3 }}>{rec.markdownRisk}</span></span>
              <span className="badge b-gray">{form.units} units · {Object.keys(SIZE_CURVE).length} sizes</span>
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:28, fontWeight:500, letterSpacing:'-0.8px' }}>${rec.totalCost.toLocaleString()}</div>
            <div style={{ fontSize:12, color:'#999' }}>Total commitment</div>
            <div style={{ fontSize:13, color:'#dc2626', fontWeight:500, marginTop:6 }}>Cash due {rec.cashDueDate.toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div>
            <div style={{ fontSize:12, color:'#999' }}>Arrives {rec.arrivalDate.toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div>
          </div>
        </div>

        <div className="g2" style={{ marginBottom:16 }}>
          {/* Size recommendation */}
          <div className="card">
            <div style={{ fontWeight:500, marginBottom:4 }}>Recommended size breakdown</div>
            <div style={{ fontSize:12, color:'#999', marginBottom:16 }}>Based on your category sell-through curve</div>
            <div className="size-grid">
              {rec.sizes.map(({ size, qty, pct }) => (
                <div key={size} className="size-box">
                  <div className="size-name">{size}</div>
                  <div className="size-qty">{qty}</div>
                  <div className="size-pct">{pct}%</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid #f0f0f0', fontSize:12, color:'#999' }}>
              Total: {form.units} units across {rec.sizes.length} sizes
            </div>
          </div>

          {/* Color confidence */}
          <div className="card">
            <div style={{ fontWeight:500, marginBottom:4 }}>Color confidence</div>
            <div style={{ fontSize:12, color:'#999', marginBottom:16 }}>Scored from your sell-through by colorway</div>
            {rec.colors.map(({ color, score, action }) => (
              <div key={color} style={{ marginBottom:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:13, fontWeight:500 }}>{color}</span>
                  <span style={{ fontSize:12, fontFamily:'monospace' }}>{score}%</span>
                </div>
                <div className="conf-bar">
                  <div className="conf-fill" style={{ width:`${score}%`, background:score>70?'#16a34a':score>50?'#d97706':'#dc2626' }} />
                </div>
                <div style={{ fontSize:11, marginTop:3, color:score>70?'#16a34a':score>50?'#d97706':'#dc2626' }}>{action}</div>
              </div>
            ))}
          </div>
        </div>

        {form.lead > 60 && (
          <div className="alert a-yellow" style={{ marginBottom:12 }}>
            <span>⚠</span>
            <span>Lead time over 60 days — given current Pakistan shipping unpredictability, add a 2–3 week buffer. Consider placing this order sooner.</span>
          </div>
        )}
        {rec.markdownRisk === 'high' && (
          <div className="alert a-red">
            <span>🔴</span>
            <span>High markdown risk — one or more colors have low confidence scores. Consider reducing quantities on Sage and Sand, or skipping them entirely.</span>
          </div>
        )}
      </div>
    </>
  )
}

// Expose SIZE_CURVE for review
const g3 = { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }
