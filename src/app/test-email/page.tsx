'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function TestEmailPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailData, setEmailData] = useState({
    to: 'arda.basoglu@dgmgumruk.com',
    subject: 'Poste.io Test Email',
    message: 'This is a test email from the Verida application using Poste.io server setup on Coolify.'
  });

  const handleSendTest = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Test email sent successfully!');
      } else {
        toast.error(`Failed to send email: ${result.error}`);
      }
    } catch (error) {
      toast.error('Network error occurred while sending email');
      console.error('Email test error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Poste.io Email Server Test</CardTitle>
          <CardDescription>
            Test your Poste.io server configuration on Coolify
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Server Configuration Display */}
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Server Configuration</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><strong>Host:</strong> posteio</div>
              <div><strong>Port:</strong> 25</div>
              <div><strong>Encryption:</strong> None</div>
              <div><strong>From Name:</strong> VERIDA</div>
              <div><strong>From Address:</strong> no-reply@verida.dgmgumruk.com</div>
            </div>
          </div>

          {/* Email Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="to">To Email</Label>
              <Input
                id="to"
                type="email"
                value={emailData.to}
                onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
                placeholder="recipient@example.com"
              />
            </div>

            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={emailData.subject}
                onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                placeholder="Email subject"
              />
            </div>

            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={emailData.message}
                onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
                placeholder="Email message content"
                rows={4}
              />
            </div>

            <Button 
              onClick={handleSendTest} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Sending...' : 'Send Test Email'}
            </Button>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Test Instructions</h4>
            <ul className="text-sm space-y-1">
              <li>• Click "Send Test Email" to test the Poste.io configuration</li>
              <li>• Check the recipient's inbox for the test email</li>
              <li>• Monitor the browser console for any error details</li>
              <li>• Verify that the email appears to come from VERIDA &lt;no-reply@verida.dgmgumruk.com&gt;</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}