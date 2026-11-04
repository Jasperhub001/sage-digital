import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom'
import AdminLayout from './components/admin/AdminLayout'
import RequireAdmin from './components/admin/RequireAdmin'
import Navbar from './components/Navbar'
import SiteFooter from './components/SiteFooter'
import { AuthProvider } from './context/AuthProvider'
import { useHashScroll } from './hooks/useHashScroll'
import { SiteSettingsProvider } from './context/SiteSettingsProvider'
import AdminInquiriesPage from './pages/admin/AdminInquiriesPage'
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminMediaPage from './pages/admin/AdminMediaPage'
import AdminOverviewPage from './pages/admin/AdminOverviewPage'
import AdminSettingsPage from './pages/admin/AdminSettingsPage'
import AdminProjectFormPage from './pages/admin/AdminProjectFormPage'
import AdminProjectsPage from './pages/admin/AdminProjectsPage'
import AdminServiceFormPage from './pages/admin/AdminServiceFormPage'
import AdminServicesPage from './pages/admin/AdminServicesPage'
import HomePage from './pages/HomePage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import './App.css'

function PublicLayout() {
  useHashScroll()

  return (
    <SiteSettingsProvider>
      <div className="app">
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <Navbar />
        <main id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
        <SiteFooter />
      </div>
    </SiteSettingsProvider>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/work/:slug" element={<ProjectDetailPage />} />
          </Route>

          <Route path="/admin/login" element={<AdminLoginPage />} />

          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminOverviewPage />} />
              <Route path="projects" element={<AdminProjectsPage />} />
              <Route
                path="projects/new"
                element={<AdminProjectFormPage mode="create" />}
              />
              <Route
                path="projects/:id/edit"
                element={<AdminProjectFormPage mode="edit" />}
              />
              <Route path="services" element={<AdminServicesPage />} />
              <Route
                path="services/new"
                element={<AdminServiceFormPage mode="create" />}
              />
              <Route
                path="services/:id/edit"
                element={<AdminServiceFormPage mode="edit" />}
              />
              <Route path="media" element={<AdminMediaPage />} />
              <Route path="inquiries" element={<AdminInquiriesPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
