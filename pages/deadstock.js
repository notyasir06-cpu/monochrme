import Head from 'next/head'
import { useState, useEffect } from 'react'

const STEPS = [
  { num:1, label:'Markdown', color:'#d97706', bg:'#fef9c3', desc:'Reduce price by 20–30% to stimulate sales. Set a time limit of 2 weeks.', action:'Apply discount code or update Shopify price' },
  { num:2, label:'Bundle', color:'#2563eb', bg:'#dbeafe', desc:'Bundle with a bestseller to move units. Create a value pack in Shopify.', action:'Create product bundle in Shopify' },
  { num:3, label:'Liquidate', color:'#dc2626', bg:'#fee2e2', desc:'Sell at cost or below to recover cash. Consider wholesale, sample sales, or donation.', action:'List on wholesale platform or run flash sale' },
]

export default function Deadstock({ shop }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [productSteps, setProductSteps] = useState({})
  const [customActions, setCustomActions] = useState({})
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    if (!shop) return
    fetch(`/api/shopify/deadstock?shop=${encodeURIComponent(shop)}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))

    // Load saved steps from localStorage
    const saved = localStorage.getItem('mc_deadstock_steps')
    if (saved) setProductSteps(JSON.parse(saved))
    const savedActions = localStorage.getItem('mc_deadstock_actions')
    if (savedActions) setCustomActions(JSON.parse(savedActions))
  }, [shop])

  function setStep(productId, step) {
    const updated = { ...productSteps, [productId]: step }
    setProductSteps(updated)
    localStorage.setItem('mc_deadstock_steps', JSON.stringify(updated))
  }

  function saveAction(productId, stepNum, action) {
    const key = `${productId}:${stepNum}`
    const updated = { ...customActions, [key]: action }
    setCustomActions(updated)
    localStorage.setItem('mc_deadstock_actions', JSON.stringify(updated))
    setEditing(null)
  }

  const products = data?.deadstock || demoDeadstock
  const totalValue = data?.totalDeadValue || demoDeadstock.reduce((s,p)=>s+p.stockValue,0)

  return (
    <>
      <Head><title>Dead stock plan — Monochrome</title></Head>
      <div className="ph">
        <div>
          <div className="ph-title">Dead stock plan</div>
          <div className="ph-sub">Products with no sales in 30 days · 3-step action plan</div>
        </div>
        <div style={{background:'#fee2e2',color:'#b91c1c',padding:'8px 14px',borderRadius:8,fontSize:13,fontWeight:500}}>
          ${totalValue.toLocaleString()} tied up in dead stock
        </div>
      </div>

      {/* Steps legend */}
      <div style={{padding:'16px 28px',background:'#fff',borderBottom:'1px solid #e8e8e8',display:'flex',gap:12,flexWrap:'wrap'}}>
        {STEPS.map(s => (
          <div key={s.num} style={{display:'flex',gap:8,alignItems:'center',padding:'8px 14px',borderRadius:8,background:s.bg,border:`1px solid ${s.color}22`}}>
            <div style={{width:22,height:22,borderRadius:'50%',background:s.color,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:500,flexShrink:0}}>{s.num}</div>
            <div>
              <div style={{fontSize:13,fontWeight:500,color:s.color}}>{s.label}</div>
              <div style={{fontSize:11,color:'#666'}}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="pad">
        {loading && <div style={{textAlign:'center',padding:'60px 0',color:'#999'}}>Loading dead stock data...</div>}

        {!loading && products.length === 0 && (
          <div className="alert a-green">
            <span>✓</span>
            <span>No dead stock — every product has sold in the last 30 days. Great work.</span>
          </div>
        )}

        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {products.map(p => {
            const currentStep = productSteps[p.id] || 0
            const isComplete = currentStep === 3

            return (
              <div key={p.id} className="card" style={{opacity:isComplete?0.6:1}}>
                <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
                  {p.image && <img src={p.image} alt="" style={{width:52,height:52,objectFit:'cover',borderRadius:6,flexShrink:0}}/>}
                  {!p.image && <div style={{width:52,height:52,background:'#f5f5f5',borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>👕</div>}

                  <div style={{flex:1}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
                      <div>
                        <div style={{fontWeight:500,fontSize:14}}>{p.title}</div>
                        <div style={{fontSize:12,color:'#999',marginTop:2}}>
                          {p.totalInventory} units · ${p.avgPrice} avg price · <span style={{color:'#dc2626',fontWeight:500}}>${p.stockValue.toLocaleString()} at risk</span>
                        </div>
                      </div>
                      {isComplete && <span className="badge b-green">Resolved</span>}
                    </div>

                    {/* 3-step progress */}
                    <div style={{display:'flex',gap:8,marginTop:12,flexWrap:'wrap'}}>
                      {STEPS.map(s => {
                        const isDone = currentStep >= s.num
                        const isCurrent = currentStep === s.num - 1
                        const actionKey = `${p.id}:${s.num}`
                        const customAction = customActions[actionKey]

                        return (
                          <div key={s.num} style={{flex:1,minWidth:140,padding:'10px 12px',borderRadius:8,border:`1px solid ${isDone?s.color:isCurrent?s.color+'44':'#e8e8e8'}`,background:isDone?s.bg:isCurrent?s.bg+'66':'#fafafa',opacity:!isDone&&!isCurrent?0.5:1}}>
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                              <div style={{display:'flex',gap:6,alignItems:'center'}}>
                                <div style={{width:18,height:18,borderRadius:'50%',background:isDone?s.color:'#e0e0e0',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:500}}>
                                  {isDone?'✓':s.num}
                                </div>
                                <span style={{fontSize:12,fontWeight:500,color:isDone?s.color:'#666'}}>{s.label}</span>
                              </div>
                            </div>

                            {editing === actionKey ? (
                              <div>
                                <input
                                  defaultValue={customAction || s.action}
                                  autoFocus
                                  onBlur={e=>saveAction(p.id, s.num, e.target.value)}
                                  onKeyDown={e=>e.key==='Enter'&&saveAction(p.id, s.num, e.target.value)}
                                  style={{width:'100%',fontSize:11,padding:'4px 6px',border:'1px solid #e0e0e0',borderRadius:4,outline:'none'}}
                                />
                              </div>
                            ) : (
                              <div style={{fontSize:11,color:'#666',cursor:'text'}} onClick={()=>setEditing(actionKey)}>
                                {customAction || s.action}
                                <span style={{color:'#bbb',marginLeft:4}}>✏</span>
                              </div>
                            )}

                            {isCurrent && (
                              <button onClick={()=>setStep(p.id, s.num)} style={{marginTop:8,width:'100%',padding:'5px',background:s.color,color:'#fff',border:'none',borderRadius:5,fontSize:11,fontWeight:500,cursor:'pointer'}}>
                                Mark as done →
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

const demoDeadstock = [
  { id:1, title:'Sand Cargo Trousers', image:null, totalInventory:48, avgPrice:89, stockValue:4272, daysOld:120, daysNoSales:30 },
  { id:2, title:'Sage Oversized Hoodie', image:null, totalInventory:32, avgPrice:95, stockValue:3040, daysOld:90, daysNoSales:30 },
  { id:3, title:'Cream Coach Jacket', image:null, totalInventory:18, avgPrice:145, stockValue:2610, daysOld:60, daysNoSales:30 },
]
