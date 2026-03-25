import dynamic from 'next/dynamic';

const MemberDashboardClientPage = dynamic(() => import('./dashboard-client'), {
  ssr: false,
});

export default function MemberDashboardPage() {
  return <MemberDashboardClientPage />;
}
