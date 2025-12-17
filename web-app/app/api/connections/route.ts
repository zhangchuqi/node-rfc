import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const connections = await prisma.sAPConnection.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        connectionType: true,
        host: true,
        systemNumber: true,
        client: true,
        user: true,
        language: true,
        isActive: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { callLogs: true }
        }
      }
    });

    return NextResponse.json({ success: true, data: connections });
  } catch (error: any) {
    console.error('Error fetching connections:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const connection = await prisma.sAPConnection.create({
      data: {
        name: body.name,
        connectionType: body.connectionType,
        host: body.host,
        systemNumber: body.systemNumber,
        client: body.client,
        user: body.user,
        password: body.password, // TODO: Consider encryption
        language: body.language || 'EN',
        saprouter: body.saprouter,
        sncMode: body.sncMode,
        sncQop: body.sncQop,
        sncMyname: body.sncMyname,
        sncPartnername: body.sncPartnername,
        trace: body.trace,
        poolOptions: body.poolOptions,
        clientOptions: body.clientOptions,
        description: body.description,
        isActive: body.isActive ?? true,
      }
    });

    return NextResponse.json({ success: true, data: connection }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating connection:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
