'use client';

import { useState, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function TestEmailPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isTestingConnection, setIsTestingConnection] = useState(false);
    const [connectionResults, setConnectionResults] = useState<any>(null);
    const [emailData, setEmailData] = useState({
        to: 'arda.basoglu@dgmgumruk.com',
        subject: 'Poste.io Test Email',
        message: 'This is a test email from the Verida application using Poste.io server setup on Coolify.'
    });

    const handleConnectionTest = async () => {
        setIsTestingConnection(true);
        try {
            const response = await fetch('/api/test-email-connection');
            const result = await response.json();
            setConnectionResults(result);

            if (response.ok) {
                toast.success('Connection test completed');
            } else {
                toast.error('Connection test failed');
            }
        } catch (error) {
            toast.error('Failed to run connection test');
            console.error('Connection test error:', error);
        } finally {
            setIsTestingConnection(false);
        }
    };

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
                        <div className="space-y-2 text-sm">
                            <div><strong>Hosts (tried in order):</strong> posteio, posteio.coolify, localhost, 127.0.0.1</div>
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
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setEmailData({ ...emailData, to: e.target.value })}
                                placeholder="recipient@example.com"
                            />
                        </div>

                        <div>
                            <Label htmlFor="subject">Subject</Label>
                            <Input
                                id="subject"
                                value={emailData.subject}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setEmailData({ ...emailData, subject: e.target.value })}
                                placeholder="Email subject"
                            />
                        </div>

                        <div>
                            <Label htmlFor="message">Message</Label>
                            <textarea
                                id="message"
                                value={emailData.message}
                                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setEmailData({ ...emailData, message: e.target.value })}
                                placeholder="Email message content"
                                rows={4}
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>

                        <div className="space-y-2">
                            <Button
                                onClick={handleConnectionTest}
                                disabled={isTestingConnection}
                                variant="outline"
                                className="w-full"
                            >
                                {isTestingConnection ? 'Testing Connection...' : 'Test SMTP Connection'}
                            </Button>

                            <Button
                                onClick={handleSendTest}
                                disabled={isLoading}
                                className="w-full"
                            >
                                {isLoading ? 'Sending...' : 'Send Test Email'}
                            </Button>
                        </div>
                    </div>

                    {/* Connection Test Results */}
                    {connectionResults && (
                        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                            <h4 className="font-semibold mb-2">Connection Test Results</h4>
                            <div className="space-y-2 text-sm">
                                {connectionResults.connectionTests?.map((test: any, index: number) => (
                                    <div key={index} className={`p-2 rounded ${test.status === 'SUCCESS' ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                                        <div><strong>{test.host}</strong> - {test.status}</div>
                                        <div>Port 25: {test.port25}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Test Instructions</h4>
                        <ul className="text-sm space-y-1">
                            <li>• Click &quot;Send Test Email&quot; to test the Poste.io configuration</li>
                            <li>• The system will try multiple hostnames automatically</li>
                            <li>• Check the recipient&apos;s inbox for the test email</li>
                            <li>• Monitor the browser console for connection details</li>
                            <li>• If all hosts fail, check your Coolify network configuration</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}