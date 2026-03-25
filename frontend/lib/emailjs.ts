import emailjs from '@emailjs/browser';

const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
const resetTemplateId = process.env.NEXT_PUBLIC_EMAILJS_RESET_REQUEST_TEMPLATE_ID;
const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

const isConfigured = Boolean(serviceId && resetTemplateId && publicKey);

export const sendResetRequestEmail = async (memberEmail: string) => {
  if (!isConfigured) {
    return {
      sent: false,
      reason: 'EmailJS is not configured.',
    };
  }

  await emailjs.send(
    serviceId!,
    resetTemplateId!,
    {
      member_email: memberEmail,
      requested_at: new Date().toLocaleString(),
      message: `Password reset requested for member account ${memberEmail}.`,
    },
    {
      publicKey,
    }
  );

  return { sent: true };
};
