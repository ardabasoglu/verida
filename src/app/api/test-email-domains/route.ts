import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
    try {
        const { testDomain = 'verida.dgmgumruk.com' } = await request.json();

        // Test different email addresses to see which ones work
        const testAddresses = [
            `test@${testDomain}`,
            `no-reply@${testDomain}`,
            `admin@${testDomain}`,
            `postmaster@${testDomain}`,
            'test@localhost',
            'test@example.com'
        ];

        const results = [];

        // Try to connect to the SMTP server first
        const possibleHosts = [
            'postfix'
        ];

        let workingTransporter = null;
        let workingHost = null;

        for (const host of possibleHosts) {
            try {
                const transportConfig = {
                    host: host,
                    port: 25,
                    secure: false,
                    requireTLS: false,
                    connectionTimeout: 5000,
                    greetingTimeout: 5000,
                    socketTimeout: 5000,
                    tls: {
                        rejectUnauthorized: false
                    }
                };

                const transporter = nodemailer.createTransport(transportConfig);
                await transporter.verify();
                workingTransporter = transporter;
                workingHost = host;
                break;
            } catch {
                console.log(`Failed to connect to ${host}:25`);
            }
        }

        if (!workingTransporter) {
            return NextResponse.json({
                error: 'No SMTP server connection available',
                timestamp: new Date().toISOString()
            }, { status: 500 });
        }

        // Test each email address
        for (const testEmail of testAddresses) {
            try {
                const mailOptions = {
                    from: {
                        name: 'VERIDA',
                        address: 'no-reply@verida.dgmgumruk.com'
                    },
                    to: testEmail,
                    subject: 'Domain Test - Please Ignore',
                    text: 'This is a test email to verify domain configuration. You can safely ignore this message.'
                };

                // Try to send (this will fail but give us useful error info)
                try {
                    const info = await workingTransporter.sendMail(mailOptions);
                    results.push({
                        email: testEmail,
                        status: 'SUCCESS',
                        messageId: info.messageId,
                        response: info.response
                    });
                } catch (sendError) {
                    const errorMessage = sendError instanceof Error ? sendError.message : 'Unknown error';
                    results.push({
                        email: testEmail,
                        status: 'FAILED',
                        error: errorMessage,
                        errorType: errorMessage.includes('550') ? 'RECIPIENT_REJECTED' :
                            errorMessage.includes('relay') ? 'RELAY_DENIED' : 'OTHER'
                    });
                }
            } catch (error) {
                results.push({
                    email: testEmail,
                    status: 'ERROR',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }

        return NextResponse.json({
            success: true,
            workingHost,
            testDomain,
            results,
            recommendations: generateRecommendations(results),
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        return NextResponse.json({
            error: 'Failed to test domains',
            details: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}

function generateRecommendations(results: Array<{
    email: string;
    status: string;
    errorType?: string;
    messageId?: string;
    response?: string;
    error?: string;
}>) {
    const recommendations = [];

    const successCount = results.filter(r => r.status === 'SUCCESS').length;
    const recipientRejected = results.filter(r => r.errorType === 'RECIPIENT_REJECTED').length;
    const relayDenied = results.filter(r => r.errorType === 'RELAY_DENIED').length;

    if (successCount === 0 && recipientRejected > 0) {
        recommendations.push('All recipients rejected - check if domains are configured in Poste.io');
        recommendations.push('Create mailboxes for the domain in Poste.io admin panel');
    }

    if (relayDenied > 0) {
        recommendations.push('Relay denied - configure Poste.io to allow internal relay');
    }

    if (successCount > 0) {
        recommendations.push(`${successCount} addresses work - use working addresses for testing`);
    }

    return recommendations;
}