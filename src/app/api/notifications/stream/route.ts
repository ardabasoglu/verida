import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { registerConnection, unregisterConnection } from '@/lib/notification-stream';


// GET /api/notifications/stream - Server-Sent Events for real-time notifications
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Create a readable stream for SSE
    const stream = new ReadableStream({
      start(controller) {
        // Store the connection
        registerConnection(userId, controller);

        // Send initial connection message
        controller.enqueue(`data: ${JSON.stringify({ type: 'connected', message: 'Connected to notifications' })}\n\n`);

        // Set up heartbeat to keep connection alive
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`);
          } catch {
            clearInterval(heartbeat);
            unregisterConnection(userId);
          }
        }, 30000); // Send heartbeat every 30 seconds

        // Clean up on close
        request.signal.addEventListener('abort', () => {
          clearInterval(heartbeat);
          unregisterConnection(userId);
          try {
            controller.close();
          } catch {
            // Connection already closed
          }
        });
      },
      cancel() {
        unregisterConnection(userId);
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    });
  } catch (error) {
    console.error('Error setting up SSE connection:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Note: helper functions for sending notifications are exported from
// '@/lib/notification-stream' to comply with Next.js route export rules.