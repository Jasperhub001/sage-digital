import { ADMIN_NAV } from '../../admin/nav'
import './AdminPlaceholderPage.css'

interface AdminPlaceholderPageProps {
  section: 'projects' | 'services' | 'media' | 'inquiries'
}

const SECTION_PATH: Record<AdminPlaceholderPageProps['section'], string> = {
  projects: '/admin/projects',
  services: '/admin/services',
  media: '/admin/media',
  inquiries: '/admin/inquiries',
}

function AdminPlaceholderPage({ section }: AdminPlaceholderPageProps) {
  const meta = ADMIN_NAV.find((item) => item.to === SECTION_PATH[section])

  return (
    <div className="admin-placeholder">
      <p className="admin-placeholder__eyebrow">Coming in a later stage</p>
      <h2 className="admin-placeholder__title">{meta?.label ?? 'Section'}</h2>
      <p className="admin-placeholder__copy">
        {meta?.description ?? 'This section is not available yet.'} Management
        tools for this area have not been built yet — this page is a protected
        placeholder only.
      </p>
      <p className="admin-placeholder__badge" role="status">
        No CRUD or uploads on this screen
      </p>
    </div>
  )
}

export default AdminPlaceholderPage
