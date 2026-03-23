import './globals.css'

export const metadata = {
  title: '🔱 مجلس المحاسبة الاحترافي العالمي',
  description: 'GPAC — Global Professional Accounting Council',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
