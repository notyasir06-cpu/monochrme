import '../styles/globals.css'
import Sidebar from '../components/Sidebar'
import { useRouter } from 'next/router'
import { useState, useEffect, createContext, useContext } from 'react'

export const ShopContext = createContext({ shop: '', setShop: () => {} })
export const useShop = () => useContext(ShopContext)

export default function App({ Component, pageProps }) {
  const router = useRouter()
  const [shop, setShop] = useState('')
  const [notifCount, setNotifCount] = useState(0)
  const noNav = router.pathname === '/install'

  useEffect(() => {
    // Persist shop across page navigations using localStorage
    const stored = localStorage.getItem('mc_shop') || ''
    const fromUrl = new URLSearchParams(window.location.search).get('shop') || ''
    const active = fromUrl || stored
    if (active) {
      localStorage.setItem('mc_shop', active)
      setShop(active)
    }
  }, [router.pathname])

  useEffect(() => {
    if (!shop) return
    // Fetch notification count
    fetch('/api/shopify/products', {
      headers: { 'x-shop': shop }
    })
      .then(r => r.json())
      .then(d => setNotifCount(d?.summary?.notifications?.length || 0))
      .catch(() => {})
  }, [shop])

  if (noNav) return (
    <ShopContext.Provider value={{ shop, setShop }}>
      <Component {...pageProps} shop={shop} />
    </ShopContext.Provider>
  )

  return (
    <ShopContext.Provider value={{ shop, setShop }}>
      <div className="shell">
        <Sidebar shop={shop} notifCount={notifCount} />
        <main className="page">
          <Component {...pageProps} shop={shop} />
        </main>
      </div>
    </ShopContext.Provider>
  )
}
