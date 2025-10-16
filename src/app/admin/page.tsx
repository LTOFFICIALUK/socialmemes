import { AdminDashboardClient } from './admin-dashboard-client'

// Remove server-side check - let client handle it
export default function AdminPage() {
  return <AdminDashboardClient />
}
