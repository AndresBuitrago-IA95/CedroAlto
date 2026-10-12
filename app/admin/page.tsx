import AdminDashboard from './dashboard'

export const metadata = {
  title: 'Administración | Cedro Alto',
  robots: { index: false, follow: false },
}

export default function AdminPage() {
  return <AdminDashboard />
}
