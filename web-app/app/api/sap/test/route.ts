import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { testRFCConnection } from '@/lib/rfc-api-client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { connectionId, connectionData } = body;

    let connection;

    // Test existing connection by ID
    if (connectionId) {
      connection = await prisma.sAPConnection.findUnique({
        where: { id: connectionId }
      });

      if (!connection) {
        return NextResponse.json(
          { success: false, error: 'Connection not found' },
          { status: 404 }
        );
      }
    } 
    // Test new connection data (not saved yet)
    else if (connectionData) {
      connection = {
        ...connectionData,
        id: 'temp',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } else {
      return NextResponse.json(
        { success: false, error: 'Either connectionId or connectionData is required' },
        { status: 400 }
      );
    }

    // Test the connection via RFC API Server
    const startTime = Date.now();
    const result = await testRFCConnection({
      ashost: connection.host,
      sysnr: connection.systemNumber,
      client: connection.client,
      user: connection.user,
      passwd: connection.password,
      lang: connection.language,
    });
    const duration = Date.now() - startTime;

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Connection test failed',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        alive: result.success,
        duration,
        message: result.success ? 'Connection successful' : 'Connection failed'
      }
    });
  } catch (error: any) {
    console.error('Error testing connection:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Connection test failed',
      },
      { status: 500 }
    );
  }
}
