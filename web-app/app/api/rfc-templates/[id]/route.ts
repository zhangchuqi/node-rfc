import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const template = await prisma.rFCTemplate.findUnique({
      where: { id },
      include: {
        connection: true,
        calls: {
          orderBy: { calledAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: template });
  } catch (error: any) {
    console.error('Error fetching RFC template:', error);
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

    const template = await prisma.rFCTemplate.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        connectionId: body.connectionId,
        rfmName: body.rfmName,
        parameters: body.parameters,
        apiPath: body.apiPath,
        apiKey: body.apiKey,
        isActive: body.isActive,
      },
    });

    return NextResponse.json({ success: true, data: template });
  } catch (error: any) {
    console.error('Error updating RFC template:', error);
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

    await prisma.rFCTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, data: { id } });
  } catch (error: any) {
    console.error('Error deleting RFC template:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
