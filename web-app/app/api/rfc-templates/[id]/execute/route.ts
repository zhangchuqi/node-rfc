import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { callRFC } from '@/lib/sap-client';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();

  try {
    const { id } = await params;
    const body = await request.json();

    // 获取 RFC 模板
    const template = await prisma.rFCTemplate.findUnique({
      where: { id },
      include: { connection: true },
    });

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    if (!template.isActive) {
      return NextResponse.json(
        { success: false, error: 'Template is inactive' },
        { status: 400 }
      );
    }

    // 合并参数：模板默认参数 + 请求参数
    const finalParams = {
      ...(template.parameters as object || {}),
      ...(body.parameters || {}),
    };

    // 调用 SAP RFC
    if (!template.connection) {
      throw new Error('Template connection not found');
    }
    if (!template.rfmName) {
      throw new Error('Template RFC function name not configured');
    }
    const result = await callRFC(template.connection, template.rfmName, finalParams);

    const duration = Date.now() - startTime;

    // 记录调用
    await prisma.rFCCall.create({
      data: {
        templateId: template.id,
        rfmName: template.rfmName,
        parameters: finalParams,
        result: result as any,
        duration,
        status: 'SUCCESS',
        source: 'web',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        result,
        duration,
        template: {
          id: template.id,
          name: template.name,
        },
      },
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;

    // 记录错误调用
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    
    await prisma.rFCCall.create({
      data: {
        templateId: id,
        rfmName: body.rfmName || 'UNKNOWN',
        parameters: body.parameters || null,
        duration,
        status: 'ERROR',
        errorMessage: error.message,
        source: 'web',
      },
    }).catch(() => {});

    console.error('Error executing RFC template:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
