import Link from 'next/link'
import { useRouter } from 'next/router'

export default function Sidebar({ shop, notifCount = 0 }) {
  const { pathname } = useRouter()
  const active = (p) => pathname === p ? 'nav-item active' : 'nav-item'

  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-name">monochrome</div>
        {shop && <div className="logo-shop">{shop}</div>}
      </div>

      <div className="nav-group">
        <div className="nav-label">Overview</div>
        <Link href="/" className={active('/')}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="8.5" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="1" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2"/></svg>
          Dashboard
          {notifCount > 0 && <span className="notif">{notifCount}</span>}
        </Link>
        <Link href="/inventory" className={active('/inventory')}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 1L13 4.5V10.5L7.5 14L2 10.5V4.5L7.5 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M7.5 1V14M2 4.5L7.5 8L13 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
          Inventory
        </Link>
      </div>

      <div className="nav-group">
        <div className="nav-label">Buying</div>
        <Link href="/purchase-orders" className={active('/purchase-orders')}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="2" y="1" width="9" height="13" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M5 4.5H8M5 7H10M5 9.5H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
          Purchase orders
        </Link>
        <Link href="/calendar" className={active('/calendar')}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1.5" y="2.5" width="12" height="11" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M5 1.5V3.5M10 1.5V3.5M1.5 6H13.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
          PO calendar
        </Link>
      </div>

      <div className="nav-group">
        <div className="nav-label">Intelligence</div>
        <Link href="/intelligence" className={active('/intelligence')}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M1 11C2.5 9 4.5 8 7.5 8C10.5 8 12.5 9 14 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M3 9C4 7.5 5.5 6.5 7.5 6.5C9.5 6.5 11 7.5 12 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M5.5 7C6.2 6 6.8 5.5 7.5 5.5C8.2 5.5 8.8 6 9.5 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><circle cx="7.5" cy="12" r="1" fill="currentColor"/></svg>
          Market signals
        </Link>
      </div>

      <div className="sidebar-footer">v0.1 · monochrome.com</div>
    </aside>
  )
}
