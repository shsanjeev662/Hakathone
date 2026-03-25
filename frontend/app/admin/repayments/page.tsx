import dynamic from 'next/dynamic';

const RepaymentsClientPage = dynamic(() => import('./repayments-client'), {
  ssr: false,
});

export default function RepaymentsPage() {
  return <RepaymentsClientPage />;
}
