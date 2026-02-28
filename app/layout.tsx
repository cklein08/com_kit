import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { UniversalEditorConnection } from '@/components/universal-editor-connection'
import { DEFAULT_AEM_EDITOR_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'wknd.running',
  description: 'Running the WKND',
  generator: 'v0.dev',
  other: {
    'urn:adobe:aue:system:aemconnection': `aem:${DEFAULT_AEM_EDITOR_URL}`,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <UniversalEditorConnection />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
