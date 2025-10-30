import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
    try {
        const { to, subject, message } = await request.json();

        // Validate required fields
        if (!to || !subject || !message) {
            return NextResponse.json(
                { error: 'Missing required fields: to, subject, message' },
                { status: 400 }
            );
        }

        // Create transporter with Postfix configuration
        // Try different possible hostnames for Coolify deployment
        const possibleHosts = [
            process.env.SMTP_HOST || 'postfix',
            'postfix',
            'postfix.coolify',
            '10.0.1.11', // Keep your working IP
            'localhost',
            '127.0.0.1'
        ];

        let transporter;
        let lastError;

        // Try each host until one works or all fail
        for (const host of possibleHosts) {
            try {
                const transportConfig = {
                    host: host,
                    port: 25,
                    secure: false, // No encryption
                    requireTLS: false,
                    connectionTimeout: 5000, // 5 second timeout
                    greetingTimeout: 5000,
                    socketTimeout: 5000,
                    tls: {
                        rejectUnauthorized: false // Accept self-signed certificates
                    }
                };

                transporter = nodemailer.createTransport(transportConfig);

                // Test the connection
                await transporter.verify();
                console.log(`Successfully connected to SMTP server at ${host}:25`);
                break;
            } catch (error) {
                console.log(`Failed to connect to ${host}:25 -`, error instanceof Error ? error.message : error);
                lastError = error;
                transporter = null;
            }
        }

        if (!transporter) {
            throw new Error(`Could not connect to any SMTP server. Last error: ${lastError instanceof Error ? lastError.message : 'Unknown error'}`);
        }

        // Email options
        const mailOptions = {
            from: {
                name: 'VERIDA',
                address: 'no-reply@verida.dgmgumruk.com'
            },
            to: to,
            subject: subject,
            text: message,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Poste.io Test Email</h2>
          <p style="color: #666; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            This email was sent from the Verida application using Poste.io server on Coolify.<br>
            Server: posteio:25 (no encryption)<br>
            Sent at: ${new Date().toISOString()}
          </p>
        </div>
      `
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);

        return NextResponse.json({
            success: true,
            messageId: info.messageId,
            response: info.response,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Email sending error:', error);

        return NextResponse.json(
            {
                error: 'Failed to send email',
                details: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
}