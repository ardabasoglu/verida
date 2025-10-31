'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface EmailStatus {
  provider: string
  environment: string
  configured: boolean
  resendConfigured: boolean
  smtpConfigured: boolean
}

export default function EmailTestPage() {
  const { data: session, status } = useSession()
  const [email, setEmail] = useState('')
  const [emailType, setEmailType] = useState('custom')
  const [loading, setLoading] = useState(false)
  const [emailStatus, setEmailStatus] = useState<EmailStatus | null>(null)

  useEffect(() => {
    fetchEmailStatus()
  }, [])

  const fetchEmailStatus = async () => {
    try {
      const response = await fetch('/api/test-email')
      const data = await response.json()
      setEmailStatus(data)
    } catch (error) {
      console.error('Failed to fetch email status:', error)
    }
  }

  const sendTestEmail = async () => {
    if (!email) {
      toast.error('Please enter an email address')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: emailType,
          email,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Email sent successfully via ${data.provider}!`)
        if (data.previewUrl) {
          toast.info('Check console for preview URL (development only)')
          console.log('Email preview URL:', data.previewUrl)
        }
      } else {
        toast.error(data.error || 'Failed to send email')
      }
    } catch (error) {
      toast.error('Failed to send email')
      console.error('Email send error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return <div className="p-8">Loading...</div>
  }

  if (!session || session.user.role !== 'ADMIN') {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You need admin privileges to access this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Email Service Test</h1>
          <p className="text-muted-foreground">
            Test the email service configuration and send test emails.
          </p>
        </div>

        {emailStatus && (
          <Card>
            <CardHeader>
              <CardTitle>Email Service Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-medium">Provider:</span>
                <Badge 
                  label={emailStatus.provider}
                  color={emailStatus.provider === 'none' ? 'red' : 'green'}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Environment:</span>
                <Badge label={emailStatus.environment} color="gray" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Resend:</span>
                <Badge 
                  label={emailStatus.resendConfigured ? 'Configured' : 'Not configured'}
                  color={emailStatus.resendConfigured ? 'green' : 'gray'}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">SMTP:</span>
                <Badge 
                  label={emailStatus.smtpConfigured ? 'Configured' : 'Not configured'}
                  color={emailStatus.smtpConfigured ? 'green' : 'gray'}
                />
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Send Test Email</CardTitle>
            <CardDescription>
              Send a test email to verify the email service is working correctly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="test@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="type" className="text-sm font-medium">
                Email Type
              </label>
              <Select value={emailType} onValueChange={setEmailType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom Test Email</SelectItem>
                  <SelectItem value="verification">Verification Email</SelectItem>
                  <SelectItem value="welcome">Welcome Email</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={sendTestEmail} 
              disabled={loading || !emailStatus?.configured}
              className="w-full"
            >
              {loading ? 'Sending...' : 'Send Test Email'}
            </Button>

            {!emailStatus?.configured && (
              <p className="text-sm text-muted-foreground">
                Email service is not configured. Check your environment variables.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-medium">Development (Ethereal Email)</h4>
              <p className="text-sm text-muted-foreground">
                Run <code className="bg-muted px-1 rounded">npm run setup:ethereal</code> to configure development email testing.
              </p>
            </div>
            <div>
              <h4 className="font-medium">Production (Resend)</h4>
              <p className="text-sm text-muted-foreground">
                Run <code className="bg-muted px-1 rounded">npm run setup:resend</code> for Resend setup instructions.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}