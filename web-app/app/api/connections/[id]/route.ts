import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { closeSAPConnection } from '@/lib/sap-client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const connection = await prisma.sAPConnection.findUnique({
      where: { id },
      include: {
        callLogs: {
          orderBy: { calledAt: 'desc' },
          take: 10
        }
      }
    });

    if (!connection) {
      return NextResponse.json(
        { success: false, error: 'Connection not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: connection });
  } catch (error: any) {
    console.error('Error fetching connection:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Close existing connection from cache when updating
    await closeSAPConnection(id);
    
    const connection = await prisma.sAPConnection.update({
      where: { id },
      data: {
        name: body.name,
        connectionType: body.connectionType,
        host: body.host,
        systemNumber: body.systemNumber,
        client: body.client,
        user: body.user,
        password: body.password,
        language: body.language,
        saprouter: body.saprouter,
        sncMode: body.sncMode,
        sncQop: body.sncQop,
        sncMyname: body.sncMyname,
        sncPartnername: body.sncPartnername,
        trace: body.trace,
        poolOptions: body.poolOptions,
        clientOptions: body.clientOptions,
        description: body.description,
        isActive: body.isActive,
      }
    });

    return NextResponse.json({ success: true, data: connection });
  } catch (error: any) {
    console.error('Error updating connection:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Close and remove connection from cache
    await closeSAPConnection(id);
    
    await prisma.sAPConnection.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, data: { id } });
  } catch (error: any) {
    console.error('Error deleting connection:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
