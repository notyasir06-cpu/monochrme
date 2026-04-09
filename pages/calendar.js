import Head from 'next/head'
import { useState } from 'react'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// Generate calendar events from POs
function generateEvents(pos) {
  const events = {}
  MONTHS.forEach((_,i) => { events[i] = [] })

  pos.forEach(po => {
    const now = new Date()

    // Order placed date (today for demo)
    const orderMonth = now.getMonth()
    if (events[orderMonth]) {
      events[orderMonth].push({ type:'order', label:`Order: ${po.product}`, po })
    }

    // Cash due date (lead - 14 days)
    const cashDate = new Date(now.getTime() + (po.lead - 14) * 86400000)
    const cashMonth = cashDate.getMonth()
    if (events[cashMonth]) {
      events[cashMonth].push({ type:'cash', label:`Cash due: ${po.product} $${(po.units*po.cost).toLocaleString()}`, po })
    }

    // Arrival date
    const arrivalDate = new Date(now.getTime() + po.lead * 86400000)
    const arrivalMonth = arrivalDate.getMonth()
    if (events[arrivalMonth]) {
      events[arrivalMonth].push({ type:'arrive', label:`Arrives: ${po.product}`, po })
    }
  })

  return events
}

const demoPOs = [
  { id:'001', supplier:'Karachi Textiles', product:'Classic Hoodie', units:300, cost:18, lead:55, status:'confirmed', confidence:88 },
  { id:'002', supplier:'Karachi Textiles', product:'Cargo Trousers', units:180, cost:24, lead:75, status:'in_transit', confidence:74 },
  { id:'003', supplier:'Karachi Textiles', product:'Core Tee', units:500, cost:9, lead:45, status:'draft', confidence:91 },
  { id:'004', supplier:'Karachi Textiles', product:'Track Jacket', units:200, cost:28, lead:90, status:'draft', confidence:78 },
]

export default function Calendar() {
  const [pos] = useState(demoPOs)
  const [selected, setSelected] = useState(null)
  const events = generateEvents(pos)
  const currentMonth = new Date().getMonth()

  const totalCash = pos.reduce((s,p)=>s+(p.units*p.cost),0)
  const totalUnits = pos.reduce((s,p)=>s+p.units,0)

  return (
    <>
      <Head><title>PO Calendar — Monochrome</title></Head>
      <div className="ph">
        <div>
          <div className="ph-title">PO calendar</div>
          <div className="ph-sub">12-month view · orders, arrivals & cash due dates</div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ padding:'14px 28px', background:'#fff', borderBottom:'1px solid #e8e8e8', display:'flex', gap:20, alignItems:'center', flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:6, alignItems:'center' }}><div style={{ width:12, height:12, borderRadius:3, background:'#dbeafe' }}></div><span style={{ fontSize:12, color:'#666' }}>Order placed</span></div>
        <div style={{ display:'flex', gap:6, alignItems:'center' }}><div style={{ width:12, height:12, borderRadius:3, background:'#fee2e2' }}></div><span style={{ fontSize:12, color:'#666' }}>Cash due</span></div>
        <div style={{ display:'flex', gap:6, alignItems:'center' }}><div style={{ width:12, height:12, borderRadius:3, background:'#dcfce7' }}></div><span style={{ fontSize:12, color:'#666' }}>Arrival</span></div>
        <div style={{ marginLeft:'auto', display:'flex', gap:20 }}>
          <div style={{ fontSize:12, color:'#999' }}>Total committed: <strong style={{ color:'#0a0a0a' }}>${totalCash.toLocaleString()}</strong></div>
          <div style={{ fontSize:12, color:'#999' }}>Total units: <strong style={{ color:'#0a0a0a' }}>{totalUnits.toLocaleString()}</strong></div>
        </div>
      </div>

      <div className="pad">
        {/* 12-month grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
          {MONTHS.map((month, i) => {
            const monthEvents = events[i] || []
            const isCurrentMonth = i === currentMonth
            const isPast = i < currentMonth
            return (
              <div key={month} style={{
                background:'#fff',
                border:`1px solid ${isCurrentMonth?'#0a0a0a':'#e8e8e8'}`,
                borderRadius:10,
                padding:14,
                minHeight:120,
                opacity: isPast ? 0.5 : 1,
              }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                  <div style={{ fontSize:12, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.06em', color: isCurrentMonth?'#0a0a0a':'#999' }}>
                    {month} {new Date().getFullYear()}
                  </div>
                  {isCurrentMonth && <span style={{ fontSize:10, fontWeight:500, background:'#0a0a0a', color:'#fff', padding:'1px 6px', borderRadius:10 }}>Now</span>}
                </div>

                {monthEvents.length === 0 && (
                  <div style={{ fontSize:11, color:'#ccc', textAlign:'center', paddingTop:16 }}>No events</div>
                )}

                {monthEvents.map((ev, j) => (
                  <div key={j} onClick={()=>setSelected(ev.po)} style={{
                    fontSize:11,
                    padding:'4px 7px',
                    borderRadius:4,
                    marginBottom:4,
                    cursor:'pointer',
                    lineHeight:1.4,
                    background: ev.type==='order'?'#dbeafe':ev.type==='cash'?'#fee2e2':'#dcfce7',
                    color: ev.type==='order'?'#1d4ed8':ev.type==='cash'?'#b91c1c':'#15803d',
                  }}>
                    {ev.label}
                  </div>
                ))}
              </div>
            )
          })}
        </div>

        {/* PO list */}
        <div className="card" style={{ padding:0 }}>
          <div style={{ padding:'14px 16px', borderBottom:'1px solid #f0f0f0', fontWeight:500 }}>All purchase orders</div>
          <table className="tbl">
            <thead>
              <tr>
                {['PO','Product','Units','Total cost','Cash due','Arrival','Status','Confidence'].map(h=>(
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pos.map(po => {
                const cashDue = new Date(Date.now()+(po.lead-14)*86400000)
                const arrival = new Date(Date.now()+po.lead*86400000)
                const statusStyle = { confirmed:'b-green', in_transit:'b-blue', draft:'b-gray' }
                return (
                  <tr key={po.id} onClick={()=>setSelected(po)} style={{ cursor:'pointer' }}>
                    <td style={{ fontFamily:'monospace', fontSize:12, color:'#666' }}>PO-{po.id}</td>
                    <td style={{ fontWeight:500 }}>{po.product}</td>
                    <td>{po.units}</td>
                    <td style={{ fontWeight:500 }}>${(po.units*po.cost).toLocaleString()}</td>
                    <td style={{ color:'#dc2626', fontWeight:500 }}>{cashDue.toLocaleDateString('en-US',{month:'short',day:'numeric'})}</td>
                    <td>{arrival.toLocaleDateString('en-US',{month:'short',day:'numeric'})}</td>
                    <td><span className={`badge ${statusStyle[po.status]||'b-gray'}`}>{po.status}</span></td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <div style={{ width:50, height:4, background:'#f0f0f0', borderRadius:2, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${po.confidence}%`, background:'#0a0a0a' }} />
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

        {/* PO detail panel */}
        {selected && (
          <div style={{ position:'fixed', right:0, top:0, bottom:0, width:340, background:'#fff', borderLeft:'1px solid #e8e8e8', padding:24, overflowY:'auto', zIndex:200 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
              <div style={{ fontWeight:500, fontSize:15 }}>PO-{selected.id}</div>
              <button onClick={()=>setSelected(null)} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#999' }}>×</button>
            </div>
            <div style={{ fontSize:18, fontWeight:500, marginBottom:4 }}>{selected.product}</div>
            <div style={{ fontSize:13, color:'#999', marginBottom:20 }}>{selected.supplier}</div>

            {[
              { label:'Units ordered', val:selected.units },
              { label:'Cost per unit', val:`$${selected.cost}` },
              { label:'Total cost', val:`$${(selected.units*selected.cost).toLocaleString()}`, bold:true },
              { label:'Cash due', val:new Date(Date.now()+(selected.lead-14)*86400000).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}), red:true },
              { label:'Expected arrival', val:new Date(Date.now()+selected.lead*86400000).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}) },
              { label:'Lead time', val:`${selected.lead} days` },
              { label:'AI confidence', val:`${selected.confidence}%` },
            ].map(({ label, val, bold, red }) => (
              <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #f5f5f5' }}>
                <span style={{ fontSize:13, color:'#999' }}>{label}</span>
                <span style={{ fontSize:13, fontWeight:bold?500:400, color:red?'#dc2626':'#0a0a0a' }}>{val}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
