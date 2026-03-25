import dynamic from 'next/dynamic';

const MemberSavingsClient = dynamic(() => import('./savings-client'), {
  ssr: false,
});

export default function MemberSavingsPage() {
  return <MemberSavingsClient />;
}
