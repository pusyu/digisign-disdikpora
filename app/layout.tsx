import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
    title: 'Digisign - Disdikpora Kabupaten Lingga',
    description: 'Sistem Tanda Tangan Digital Disdikpora Kabupaten Lingga',
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    )
}
