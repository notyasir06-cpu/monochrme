import Link from 'next/link'
import { useRouter } from 'next/router'

const NAV = [
  { section:'Overview', items:[
    { label:'Dashboard', href:'/' },
    { label:'Inventory', href:'/inventory' },
  ]},
  { section:'Buying', items:[
    { label:'Purchase orders', href:'/purchase-orders' },
    { label:'PO calendar', href:'/calendar' },
    { label:'Dead stock plan', href:'/deadstock' },
  ]},
  { section:'Intelligence', items:[
    { label:'Market signals', href:'/intelligence' },
    { label:'Meta Ads Library', href:'/meta-ads' },
  ]},
  { section:'Finance', items:[
    { label:'P&L statement', href:'/pnl' },
  ]},
]

export default function Sidebar({ shop, notifCount = 0 }) {
  const { pathname } = useRouter()
  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-name">monochrome</div>
        {shop && <div className="logo-shop">{shop}</div>}
      </div>
      <nav style={{flex:1,paddingTop:8}}>
        {NAV.map(({ section, items }) => (
          <div key={section}>
            <div className="nav-label">{section}</div>
            {items.map(({ label, href }) => (
              <Link key={href} href={href} className={`nav-item${pathname===href?' active':''}`}>
                {label}
                {href==='/'&&notifCount>0&&<span className="notif">{notifCount}</span>}
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">v0.1 · monochrome.com</div>
    </aside>
  )
}