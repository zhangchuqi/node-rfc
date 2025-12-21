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

    // Return template directly for workflow editor compatibility
    return NextResponse.json(template);
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

// PATCH for partial updates (used by workflow editor)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: any = {
      updatedAt: new Date(),
    };

    // Only update fields that are provided
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.connectionId !== undefined) updateData.connectionId = body.connectionId;
    if (body.rfmName !== undefined) updateData.rfmName = body.rfmName;
    if (body.parameters !== undefined) updateData.parameters = body.parameters;
    if (body.apiPath !== undefined) updateData.apiPath = body.apiPath;
    if (body.apiKey !== undefined) updateData.apiKey = body.apiKey;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.inputMapping !== undefined) updateData.inputMapping = body.inputMapping;
    if (body.outputMapping !== undefined) updateData.outputMapping = body.outputMapping;
    if (body.workflowDefinition !== undefined) updateData.workflowDefinition = body.workflowDefinition;

    const template = await prisma.rFCTemplate.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(template);
  } catch (error: any) {
    console.error('Error updating RFC template:', error);
    return NextResponse.json(
      { error: error.message },
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
