import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
    try {
        const hosts = [
            'posteio',
            'posteio.coolify',
            'localhost',
            '127.0.0.1'
        ];

        const results = [];

        for (const host of hosts) {
            try {
                // Test DNS resolution
                const { stdout: nslookup } = await execAsync(`nslookup ${host}`).catch(() => ({ stdout: 'DNS resolution failed' }));
                
                // Test port connectivity
                const { stdout: telnet } = await execAsync(`timeout 3 bash -c "echo >/dev/tcp/${host}/25" 2>&1 || echo "Connection failed"`).catch(() => ({ stdout: 'Connection test failed' }));
                
                results.push({
                    host,
                    dns: nslookup.trim(),
                    port25: telnet.includes('Connection failed') ? 'CLOSED/UNREACHABLE' : 'OPEN',
                    status: telnet.includes('Connection failed') ? 'FAIL' : 'SUCCESS'
                });
            } catch (error) {
                results.push({
                    host,
                    dns: 'Error',
                    port25: 'ERROR',
                    status: 'FAIL',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            environment: {
                NODE_ENV: process.env.NODE_ENV,
                SMTP_HOST: process.env.SMTP_HOST || 'not set'
            },
            connectionTests: results
        });

    } catch (error) {
        return NextResponse.json(
            {
                error: 'Failed to run connection tests',
                details: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
}