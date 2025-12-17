import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { testConnection } from '@/lib/sap-client';

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

    // Test the connection
    const startTime = Date.now();
    const isAlive = await testConnection(connection as any);
    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        alive: isAlive,
        duration,
        message: isAlive ? 'Connection successful' : 'Connection failed'
      }
    });
  } catch (error: any) {
    console.error('Error testing connection:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Connection test failed',
        details: {
          code: error.code,
          key: error.key,
          message: error.message
        }
      },
      { status: 500 }
    );
  }
}
