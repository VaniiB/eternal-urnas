import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Admin } from './pages/Admin'
import { Assistant } from './pages/Assistant'
import { CartPage } from './pages/Cart'
import { Checkout } from './pages/Checkout'
import { Home } from './pages/Home'
import { ImpactPage } from './pages/Impact'
import { OrderPage } from './pages/Order'
import { PlantPage } from './pages/Plant'
import { Plants } from './pages/Plants'
import { ProductPage } from './pages/Product'
import { Shop } from './pages/Shop'

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="tienda" element={<Shop />} />
        <Route path="tienda/:slug" element={<ProductPage />} />
        <Route path="plantas" element={<Plants />} />
        <Route path="plantas/:slug" element={<PlantPage />} />
        <Route path="cesta" element={<CartPage />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="pedido/:code" element={<OrderPage />} />
        <Route path="impacto" element={<ImpactPage />} />
        <Route path="asistente" element={<Assistant />} />
        <Route path="admin" element={<Admin />} />
      </Route>
    </Routes>
  )
}
