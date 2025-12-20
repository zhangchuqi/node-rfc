import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const templates = await prisma.rFCTemplate.findMany({
      include: {
        connection: {
          select: {
            id: true,
            name: true,
            host: true,
            isActive: true,
          },
        },
        _count: {
          select: { calls: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: templates });
  } catch (error: any) {
    console.error('Error fetching RFC templates:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const template = await prisma.rFCTemplate.create({
      data: {
        name: body.name,
        description: body.description,
        connectionId: body.connectionId,
        rfmName: body.rfmName,
        parameters: body.parameters || null,
        apiPath: body.apiPath || null,
        apiKey: body.apiKey,
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
      include: {
        connection: true,
      },
    });

    return NextResponse.json({ success: true, data: template });
  } catch (error: any) {
    console.error('Error creating RFC template:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
