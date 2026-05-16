import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { MainLayout } from './components/layout/MainLayout'
import { ScrollRestoration } from './components/ScrollRestoration'
import { AboutPage } from './pages/AboutPage'
import { ContactPage } from './pages/ContactPage'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { SearchPage } from './pages/SearchPage'
import { TechnologyPage } from './pages/TechnologyPage'
import { TestDetailPage } from './pages/TestDetailPage'
import { TestsPage } from './pages/TestsPage'
import { EventsPage } from './pages/EventsPage'
import { AdminPage } from './pages/admin/AdminPage'
import { PartnerPortalPage } from './pages/partner/PartnerPortalPage'

export default function App() {
  return (
    <BrowserRouter>
      <ScrollRestoration />
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="tests" element={<TestsPage />} />
          <Route path="tests/:slug" element={<TestDetailPage />} />
          <Route path="technology" element={<TechnologyPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="book" element={<Navigate to="/contact" replace />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route path="admin" element={<AdminPage />} />
        <Route path="partner" element={<PartnerPortalPage />} />
      </Routes>
    </BrowserRouter>
  )
}
