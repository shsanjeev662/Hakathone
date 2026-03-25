export default function FeedbackBanner({
  message,
  tone = 'info',
}: {
  message: string;
  tone?: 'success' | 'warning' | 'danger' | 'info';
}) {
  const styles = {
    success: 'border-teal-200 bg-teal-50 text-teal-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    danger: 'border-rose-200 bg-rose-50 text-rose-800',
    info: 'border-sky-200 bg-sky-50 text-sky-800',
  };

  return <div className={`rounded-[1.25rem] border px-4 py-3 text-sm shadow-sm ${styles[tone]}`}>{message}</div>;
}
