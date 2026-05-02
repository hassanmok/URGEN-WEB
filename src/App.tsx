import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { MainLayout } from './components/layout/MainLayout'
import { ScrollRestoration } from './components/ScrollRestoration'
import { AboutPage } from './pages/AboutPage'
import { BookPage } from './pages/BookPage'
import { ContactPage } from './pages/ContactPage'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PricesPage } from './pages/PricesPage'
import { TestDetailPage } from './pages/TestDetailPage'
import { TestsPage } from './pages/TestsPage'

export default function App() {
  return (
    <BrowserRouter>
      <ScrollRestoration />
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="tests" element={<TestsPage />} />
          <Route path="tests/:slug" element={<TestDetailPage />} />
          <Route path="prices" element={<PricesPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="book" element={<BookPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
