import './globals.css';
import ToastProvider from '@/components/ui/ToastProvider';

export const metadata = {
  title: "Starehe Booking Management System",
  description: "Digital booking, requisition and approval workflow for school resources.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider />
        {children}
      </body>
    </html>
  );
}
