import DashboardLayout from '@/components/dashboard-layout'

export default function TrackerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayout>{children}</DashboardLayout>
}