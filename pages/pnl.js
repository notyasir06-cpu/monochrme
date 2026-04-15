import Head from 'next/head'
import { useState, useEffect } from 'react'

export default function PnL({ shop }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(3)
  const [costs, setCosts] = useState({ adSpend:0, shippingCost:0, overheads:0, otherCosts:0, cogsOverride:'' })
  const [cogsMode, setCogsMode] = useState('auto') // auto = 40%, manual = user input

  useEffect(() => {
    const saved = localStorage.getItem('mc_pnl_costs')
    if (saved) setCosts(JSON.parse(saved))
    const savedCogs = localStorage.getItem('mc_pnl_cogsmode')
    if (savedCogs) setCogsMode(savedCogs)
  }, [])

  useEffect(() => {
    if (!shop) return
    setLoading(true)
    fetch(`/api/shopify/pnl?months=${period}&shop=${encodeURIComponent(shop)}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [shop, period])

  function updateCosts(k, v) {
    const updated = { ...costs, [k]: parseFloat(v) || 0 }
    setCosts(updated)
    localStorage.setItem('mc_pnl_costs', JSON.stringify(updated))
  }

  const s = data?.summary || {}

  // Calculate P&L with manual costs
  const netRevenue = s.netRevenue || 0
  const cogs = cogsMode === 'manual' && costs.cogsOverride ? parseFloat(costs.cogsOverride) || 0 : s.totalCOGS || 0
  const grossProfit = netRevenue - cogs
  const grossMargin = netRevenue > 0 ? (grossProfit / netRevenue * 100) : 0

  const totalOpEx = (costs.adSpend || 0) + (costs.shippingCost || 0) + (costs.overheads || 0) + (costs.otherCosts || 0)
  const operatingProfit = grossProfit - totalOpEx
  const netMargin = netRevenue > 0 ? (operatingProfit / netRevenue * 100) : 0

  const monthly = data?.monthly || []

  return (
    <>
      <Head><title>P&L — Monochrome</title></Head>
      <div className="ph">
        <div>
          <div className="ph-title">Profit & Loss</div>
          <div className="ph-sub">Full P&L statement · pulled from Shopify + your inputs</div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          {[1,3,6,12].map(m=>(
            <button key={m} onClick={()=>setPeriod(m)} style={{padding:'6px 12px',fontSize:12,fontWeight:500,borderRadius:6,border:'1px solid',borderColor:period===m?'#0a0a0a':'#e0e0e0',background:period===m?'#0a0a0a':'#fff',color:period===m?'#fff':'#666',cursor:'pointer'}}>
              {m}M
            </button>
          ))}
        </div>
      </div>

      <div className="pad">
        <div className="g2" style={{marginBottom:20}}>
          {/* P&L Statement */}
          <div style={{gridColumn:'1/-1'}}>
            <div className="card" style={{padding:0}}>
              <div style={{padding:'14px 20px',borderBottom:'1px solid #f0f0f0',fontWeight:500,fontSize:15}}>
                P&L Statement · Last {period} month{period>1?'s':''}
              </div>

              {loading ? (
                <div style={{padding:'40px',textAlign:'center',color:'#999'}}>Loading P&L data...</div>
              ) : (
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead>
                    <tr style={{background:'#f7f7f7'}}>
                      <th style={{textAlign:'left',padding:'10px 20px',fontSize:11,fontWeight:500,textTransform:'uppercase',letterSpacing:'0.06em',color:'#999',width:'50%'}}>Line item</th>
                      <th style={{textAlign:'right',padding:'10px 20px',fontSize:11,fontWeight:500,textTransform:'uppercase',letterSpacing:'0.06em',color:'#999'}}>Amount</th>
                      <th style={{textAlign:'right',padding:'10px 20px',fontSize:11,fontWeight:500,textTransform:'uppercase',letterSpacing:'0.06em',color:'#999'}}>% of revenue</th>
                      <th style={{textAlign:'right',padding:'10px 20px',fontSize:11,fontWeight:500,textTransform:'uppercase',letterSpacing:'0.06em',color:'#999'}}>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    <PnLSection label="Revenue" />
                    <PnLRow label="Gross revenue" value={s.grossRevenue||0} pct={100} source="Shopify" positive />
                    <PnLRow label="Refunds & returns" value={-(s.totalRefunds||0)} pct={netRevenue>0?-((s.totalRefunds||0)/netRevenue*100):0} source="Shopify" />
                    <PnLRow label="Discounts" value={-(s.totalDiscounts||0)} pct={netRevenue>0?-((s.totalDiscounts||0)/netRevenue*100):0} source="Shopify" />
                    <PnLRow label="Net revenue" value={netRevenue} pct={netRevenue>0?100:0} source="Shopify" bold />

                    <PnLSection label="Cost of goods sold" />
                    <PnLRow
                      label={cogsMode==='auto'?"COGS (est. 40% — click to edit)":"COGS (manual input)"}
                      value={-cogs}
                      pct={netRevenue>0?-(cogs/netRevenue*100):0}
                      source={cogsMode==='auto'?"Estimated":"Manual"}
                      editable
                      editValue={costs.cogsOverride}
                      onEdit={v=>{updateCosts('cogsOverride',v);setCogsMode('manual');localStorage.setItem('mc_pnl_cogsmode','manual')}}
                    />
                    <PnLRow label="Gross profit" value={grossProfit} pct={grossMargin} source="" bold highlight={grossProfit>0} />

                    <PnLSection label="Operating expenses" />
                    <EditableRow label="Ad spend" value={costs.adSpend} netRevenue={netRevenue} onChange={v=>updateCosts('adSpend',v)} />
                    <EditableRow label="Shipping & fulfilment costs" value={costs.shippingCost} netRevenue={netRevenue} onChange={v=>updateCosts('shippingCost',v)} />
                    <EditableRow label="Overheads (rent, salaries, etc.)" value={costs.overheads} netRevenue={netRevenue} onChange={v=>updateCosts('overheads',v)} />
                    <EditableRow label="Other costs" value={costs.otherCosts} netRevenue={netRevenue} onChange={v=>updateCosts('otherCosts',v)} />
                    <PnLRow label="Total operating expenses" value={-totalOpEx} pct={netRevenue>0?-(totalOpEx/netRevenue*100):0} source="" bold />

                    <PnLSection label="Net profit" />
                    <PnLRow
                      label="Operating profit (EBIT)"
                      value={operatingProfit}
                      pct={netMargin}
                      source=""
                      bold
                      large
                      highlight={operatingProfit>0}
                    />
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Summary metrics */}
        {!loading && (
          <div className="g4" style={{marginBottom:20}}>
            {[
              {label:'Net revenue',val:`$${netRevenue.toLocaleString()}`,sub:`${s.totalOrders||0} orders`},
              {label:'Gross margin',val:`${grossMargin.toFixed(1)}%`,sub:`$${grossProfit.toLocaleString()} gross profit`,green:grossMargin>50},
              {label:'Net margin',val:`${netMargin.toFixed(1)}%`,sub:`$${operatingProfit.toLocaleString()} net profit`,green:operatingProfit>0,red:operatingProfit<0},
              {label:'Avg order value',val:`$${s.avgOrderValue||0}`,sub:`${s.totalUnits||0} units sold`},
            ].map(({label,val,sub,green,red})=>(
              <div key={label} className="metric">
                <div className="metric-label">{label}</div>
                <div className="metric-value" style={{color:green?'#16a34a':red?'#dc2626':undefined}}>{val}</div>
                <div className="metric-sub">{sub}</div>
              </div>
            ))}
          </div>
        )}

        {/* Monthly breakdown */}
        {monthly.length > 0 && (
          <div className="card" style={{padding:0}}>
            <div style={{padding:'14px 20px',borderBottom:'1px solid #f0f0f0',fontWeight:500}}>Monthly breakdown</div>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:'#f7f7f7'}}>
                  {['Month','Revenue','Refunds','Net revenue','COGS','Gross profit','Units'].map(h=>(
                    <th key={h} style={{textAlign:h==='Month'?'left':'right',padding:'10px 16px',fontSize:11,fontWeight:500,textTransform:'uppercase',letterSpacing:'0.06em',color:'#999'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthly.map((m,i)=>{
                  const gp = m.netRevenue - m.cogs
                  const gm = m.netRevenue > 0 ? (gp/m.netRevenue*100).toFixed(1) : 0
                  return (
                    <tr key={i} style={{borderBottom:'1px solid #f5f5f5'}}>
                      <td style={{padding:'11px 16px',fontWeight:500}}>{m.month}</td>
                      <td style={{padding:'11px 16px',textAlign:'right'}}>${m.revenue.toLocaleString()}</td>
                      <td style={{padding:'11px 16px',textAlign:'right',color:'#dc2626'}}>-${m.refunds.toLocaleString()}</td>
                      <td style={{padding:'11px 16px',textAlign:'right',fontWeight:500}}>${m.netRevenue.toLocaleString()}</td>
                      <td style={{padding:'11px 16px',textAlign:'right',color:'#666'}}>-${m.cogs.toLocaleString()}</td>
                      <td style={{padding:'11px 16px',textAlign:'right',fontWeight:500,color:gp>0?'#16a34a':'#dc2626'}}>${gp.toLocaleString()} <span style={{fontSize:11,fontWeight:400,color:'#999'}}>({gm}%)</span></td>
                      <td style={{padding:'11px 16px',textAlign:'right',color:'#666'}}>{m.units}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

function PnLSection({ label }) {
  return (
    <tr>
      <td colSpan={4} style={{padding:'12px 20px 4px',fontSize:11,fontWeight:500,textTransform:'uppercase',letterSpacing:'0.06em',color:'#999',background:'#fafafa',borderBottom:'1px solid #f0f0f0'}}>{label}</td>
    </tr>
  )
}

function PnLRow({ label, value, pct, source, bold, large, highlight, editable, editValue, onEdit }) {
  const [editing, setEditing] = useState(false)
  const isNeg = value < 0
  return (
    <tr style={{borderBottom:'1px solid #f5f5f5',background:highlight?'#f0fdf4':undefined}}>
      <td style={{padding:'11px 20px',fontSize:bold?14:13,fontWeight:bold?500:400}}>
        {editable ? (
          <span style={{cursor:'pointer',textDecoration:'underline dotted'}} onClick={()=>setEditing(true)}>{label}</span>
        ) : label}
      </td>
      <td style={{padding:'11px 20px',textAlign:'right',fontSize:large?18:13,fontWeight:bold?500:400,color:isNeg?'#dc2626':highlight?'#16a34a':undefined}}>
        {editing ? (
          <input
            defaultValue={editValue||Math.abs(value)}
            autoFocus
            onBlur={e=>{onEdit(e.target.value);setEditing(false)}}
            onKeyDown={e=>e.key==='Enter'&&(onEdit(e.target.value)||setEditing(false))}
            style={{width:100,textAlign:'right',border:'1px solid #e0e0e0',borderRadius:4,padding:'2px 6px',fontSize:13}}
          />
        ) : (
          `${isNeg?'-':''}$${Math.abs(value).toLocaleString()}`
        )}
      </td>
      <td style={{padding:'11px 20px',textAlign:'right',fontSize:12,color:pct<0?'#dc2626':pct>30?'#16a34a':'#666'}}>
        {pct !== undefined ? `${pct < 0 ? '' : '+'}${pct.toFixed(1)}%` : ''}
      </td>
      <td style={{padding:'11px 20px',textAlign:'right',fontSize:11,color:'#bbb'}}>{source}</td>
    </tr>
  )
}

function EditableRow({ label, value, netRevenue, onChange }) {
  const [editing, setEditing] = useState(false)
  const pct = netRevenue > 0 ? -(value/netRevenue*100) : 0
  return (
    <tr style={{borderBottom:'1px solid #f5f5f5'}}>
      <td style={{padding:'11px 20px',fontSize:13}}>{label}</td>
      <td style={{padding:'11px 20px',textAlign:'right',fontSize:13,color:'#dc2626'}}>
        {editing ? (
          <input
            defaultValue={value||0}
            autoFocus
            type="number"
            onBlur={e=>{onChange(e.target.value);setEditing(false)}}
            onKeyDown={e=>e.key==='Enter'&&(onChange(e.target.value)||setEditing(false))}
            style={{width:100,textAlign:'right',border:'1px solid #e0e0e0',borderRadius:4,padding:'2px 6px',fontSize:13}}
          />
        ) : (
          <span style={{cursor:'text',borderBottom:'1px dashed #e0e0e0'}} onClick={()=>setEditing(true)}>
            {value>0?`-$${value.toLocaleString()}`:'Click to enter'}
          </span>
        )}
      </td>
      <td style={{padding:'11px 20px',textAlign:'right',fontSize:12,color:'#dc2626'}}>
        {value>0?`${pct.toFixed(1)}%`:'—'}
      </td>
      <td style={{padding:'11px 20px',textAlign:'right',fontSize:11,color:'#bbb'}}>Manual</td>
    </tr>
  )
}
