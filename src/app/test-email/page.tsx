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
    const [connectionResults, setConnectionResults] = useState<{
        connectionTests?: Array<{
            host: string;
            status: string;
            port25: string;
            dns?: string;
            error?: string;
        }>;
    } | null>(null);
    const [isTestingDomains, setIsTestingDomains] = useState(false);
    const [domainResults, setDomainResults] = useState<{
        results?: Array<{
            email: string;
            status: string;
            error?: string;
            errorType?: string;
            messageId?: string;
            response?: string;
        }>;
        recommendations?: string[];
        workingHost?: string;
        testDomain?: string;
    } | null>(null);
    const [emailData, setEmailData] = useState({
        to: 'test@localhost',
        subject: 'Poste.io Test Email',
        message: 'This is a test email from the Verida application using Poste.io server setup on Coolify.',
        testRecipient: 'test@verida.dgmgumruk.com' // Alternative test recipient
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

    const handleDomainTest = async () => {
        setIsTestingDomains(true);
        try {
            const response = await fetch('/api/test-email-domains', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ testDomain: 'verida.dgmgumruk.com' }),
            });
            const result = await response.json();
            setDomainResults(result);

            if (response.ok) {
                toast.success('Domain test completed');
            } else {
                toast.error('Domain test failed');
            }
        } catch (error) {
            toast.error('Failed to run domain test');
            console.error('Domain test error:', error);
        } finally {
            setIsTestingDomains(false);
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
                    <CardTitle>Postfix Email Server Test</CardTitle>
                    <CardDescription>
                        Test your Postfix server configuration on Coolify
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Server Configuration Display */}
                    <div className="bg-muted p-4 rounded-lg">
                        <h3 className="font-semibold mb-2">Server Configuration</h3>
                        <div className="space-y-2 text-sm">
                            <div><strong>Hosts (tried in order):</strong> postfix, postfix.coolify, 10.0.1.11</div>
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
                            <div className="mt-2 space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setEmailData({ ...emailData, to: emailData.testRecipient })}
                                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                                >
                                    Use test@verida.dgmgumruk.com
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEmailData({ ...emailData, to: 'no-reply@verida.dgmgumruk.com' })}
                                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                                >
                                    Use no-reply@verida.dgmgumruk.com
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEmailData({ ...emailData, to: 'postmaster@verida.dgmgumruk.com' })}
                                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                                >
                                    Use postmaster@verida.dgmgumruk.com
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEmailData({ ...emailData, to: 'test@gmail.com' })}
                                    className="text-xs text-orange-600 hover:text-orange-800 underline"
                                >
                                    Try external (test@gmail.com)
                                </button>
                            </div>
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
                                onClick={handleDomainTest}
                                disabled={isTestingDomains}
                                variant="outline"
                                className="w-full"
                            >
                                {isTestingDomains ? 'Testing Domains...' : 'Test Email Domains'}
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
                                {connectionResults.connectionTests?.map((test, index: number) => (
                                    <div key={index} className={`p-2 rounded ${test.status === 'SUCCESS' ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                                        <div><strong>{test.host}</strong> - {test.status}</div>
                                        <div>Port 25: {test.port25}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Domain Test Results */}
                    {domainResults && (
                        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                            <h4 className="font-semibold mb-2">Domain Test Results</h4>
                            <div className="space-y-2 text-sm">
                                {domainResults.results?.map((test, index: number) => (
                                    <div key={index} className={`p-2 rounded ${test.status === 'SUCCESS' ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                                        <div><strong>{test.email}</strong> - {test.status}</div>
                                        {test.error && <div className="text-xs text-red-600 dark:text-red-400">{test.error}</div>}
                                        {test.errorType && <div className="text-xs">Type: {test.errorType}</div>}
                                    </div>
                                ))}
                                {domainResults.recommendations && domainResults.recommendations.length > 0 && (
                                    <div className="mt-3 p-2 bg-blue-100 dark:bg-blue-900 rounded">
                                        <div className="font-semibold text-blue-800 dark:text-blue-200">Recommendations:</div>
                                        {domainResults.recommendations.map((rec: string, index: number) => (
                                            <div key={index} className="text-xs text-blue-700 dark:text-blue-300">• {rec}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Test Instructions</h4>
                        <ul className="text-sm space-y-1">
                            <li>• Click &quot;Test SMTP Connection&quot; first to verify connectivity</li>
                            <li>• Try different recipient addresses if you get 550 errors</li>
                            <li>• For Postfix: configure relay or local delivery</li>
                            <li>• Check the recipient&apos;s inbox for the test email</li>
                            <li>• Monitor the browser console for detailed error messages</li>
                        </ul>

                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded border-l-4 border-red-400">
                            <h5 className="font-semibold text-red-800 dark:text-red-200 mb-1">550 Error - Postfix Configuration:</h5>
                            <ul className="text-xs text-red-700 dark:text-red-300 space-y-1">
                                <li>• <strong>Option 1:</strong> Configure RELAYHOST to use external SMTP</li>
                                <li>• <strong>Option 2:</strong> Set up local delivery for verida.dgmgumruk.com</li>
                                <li>• <strong>Option 3:</strong> Configure Postfix as relay for external domains</li>
                                <li>• <strong>Current:</strong> MAILNAME=verida.dgmgumruk.com, RELAYHOST=empty</li>
                            </ul>
                        </div>

                        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border-l-4 border-blue-400">
                            <h5 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">Postfix Solutions:</h5>
                            <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                                <div><strong>Quick Fix:</strong> Set RELAYHOST to external SMTP (Gmail, SendGrid, etc.)</div>
                                <div><strong>Local Fix:</strong> Configure virtual domains in Postfix main.cf</div>
                                <div><strong>Test Fix:</strong> Try sending to external email (Gmail, Yahoo)</div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}