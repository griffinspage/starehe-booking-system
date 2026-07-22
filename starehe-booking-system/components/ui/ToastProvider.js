'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#ffffff',
          color: '#1c2530',
          border: '1px solid #e2e6ec',
          borderRadius: '10px',
          fontSize: '14px',
          boxShadow: '0 4px 16px rgba(15,23,42,0.08)',
        },
        success: { iconTheme: { primary: '#1a7a4c', secondary: '#ffffff' } },
        error: { iconTheme: { primary: '#b3261e', secondary: '#ffffff' } },
      }}
    />
  );
}
