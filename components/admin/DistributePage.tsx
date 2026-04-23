'use client'

import { useEffect, useState } from 'react'
import { Copy, Check, Download, QrCode } from 'lucide-react'
import QRCode from 'qrcode'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'

interface DistributePageProps {
  slug: string
  pageTitle: string
}

export function DistributePage({ slug, pageTitle }: DistributePageProps) {
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedEmbed, setCopiedEmbed] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const { toast } = useToast()

  const pageUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/pay/${slug}`
      : `/pay/${slug}`

  const embedCode = `<iframe src="${pageUrl}" width="100%" height="650" frameborder="0" title="${pageTitle} Payment"></iframe>`

  useEffect(() => {
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}/pay/${slug}`
        : `http://localhost:3000/pay/${slug}`

    QRCode.toDataURL(url, { width: 256, margin: 2 })
      .then(setQrDataUrl)
      .catch(console.error)
  }, [slug])

  async function copyToClipboard(text: string, type: 'url' | 'embed') {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'url') {
        setCopiedUrl(true)
        setTimeout(() => setCopiedUrl(false), 2000)
      } else {
        setCopiedEmbed(true)
        setTimeout(() => setCopiedEmbed(false), 2000)
      }
      toast({ title: 'Copied!', description: 'Copied to clipboard.' })
    } catch {
      toast({ title: 'Failed to copy', variant: 'destructive' })
    }
  }

  function downloadQr() {
    if (!qrDataUrl) return
    const link = document.createElement('a')
    link.href = qrDataUrl
    link.download = `qr-${slug}.png`
    link.click()
  }

  return (
    <div className="space-y-6">
      {/* Direct URL */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Direct Link</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="page-url" className="sr-only">
                Payment page URL
              </Label>
              <Input
                id="page-url"
                value={pageUrl}
                readOnly
                className="font-mono text-sm"
                aria-label="Payment page direct URL"
              />
            </div>
            <Button
              onClick={() => copyToClipboard(pageUrl, 'url')}
              variant="outline"
              aria-label="Copy direct link to clipboard"
            >
              {copiedUrl ? (
                <Check className="h-4 w-4 text-green-600" aria-hidden="true" />
              ) : (
                <Copy className="h-4 w-4" aria-hidden="true" />
              )}
              <span className="ml-1.5">{copiedUrl ? 'Copied!' : 'Copy'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Embed code */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Embed Code</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Copy this code to embed the payment form on your website.
          </p>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="embed-code" className="sr-only">
                Embed iframe code
              </Label>
              <Input
                id="embed-code"
                value={embedCode}
                readOnly
                className="font-mono text-xs"
                aria-label="Iframe embed code"
              />
            </div>
            <Button
              onClick={() => copyToClipboard(embedCode, 'embed')}
              variant="outline"
              aria-label="Copy embed code to clipboard"
            >
              {copiedEmbed ? (
                <Check className="h-4 w-4 text-green-600" aria-hidden="true" />
              ) : (
                <Copy className="h-4 w-4" aria-hidden="true" />
              )}
              <span className="ml-1.5">{copiedEmbed ? 'Copied!' : 'Copy'}</span>
            </Button>
          </div>
          <div className="mt-3 p-3 bg-muted rounded-md">
            <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-all">{embedCode}</pre>
          </div>
        </CardContent>
      </Card>

      {/* QR Code */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <QrCode className="h-4 w-4" aria-hidden="true" />
            QR Code
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Share this QR code so users can scan and pay directly.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            {qrDataUrl ? (
              <div className="rounded-lg border p-3 bg-white">
                <img
                  src={qrDataUrl}
                  alt={`QR code for ${pageTitle} payment page`}
                  width={200}
                  height={200}
                  className="block"
                />
              </div>
            ) : (
              <div className="h-[200px] w-[200px] rounded-lg border bg-muted flex items-center justify-center">
                <span className="text-muted-foreground text-sm">Generating...</span>
              </div>
            )}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Scan with a mobile device to open the payment page.
              </p>
              <Button
                onClick={downloadQr}
                disabled={!qrDataUrl}
                variant="outline"
              >
                <Download className="h-4 w-4 mr-1.5" aria-hidden="true" />
                Download PNG
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
