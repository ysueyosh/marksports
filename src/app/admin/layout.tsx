import { AdminLayoutWrapper } from './admin-layout-wrapper';

export const metadata = {
  title: 'MS Admin',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutWrapper>{children}</AdminLayoutWrapper>;
}
