import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import DashboardShell from './components/DashboardShell'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Categories from './pages/Categories'
import Brands from './pages/Brands'
import Messages from './pages/Messages'
import OrdersApis from './pages/OrdersApis'
import Login from './pages/Login'
import { SidebarProvider } from './context/SidebarContext'
import { NotificationProvider } from './components/NotificationContext'
import { ToastProvider } from './components/ToastContext'

function App() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <SidebarProvider openMobileSidebar={() => setMobileOpen(true)}>
      <NotificationProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                element={
                  <DashboardShell mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
                }
              >
                <Route path="/" element={<Dashboard />} />
                <Route path="/products" element={<Products />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/brands" element={<Brands />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/orders-apis" element={<OrdersApis />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </NotificationProvider>
    </SidebarProvider>
  )
}

export default App
