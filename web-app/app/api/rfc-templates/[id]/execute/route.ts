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
        requestBody: body,
        source: 'web',
        calledBy: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'web-user',
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
    
    // 提取详细的错误信息
    const errorDetails: any = {
      message: error.message,
      name: error.name,
      code: error.code,
      key: error.key,
    };

    // SAP ABAP 错误信息
    if (error.abapMsgClass) errorDetails.abapMsgClass = error.abapMsgClass;
    if (error.abapMsgType) errorDetails.abapMsgType = error.abapMsgType;
    if (error.abapMsgNumber) errorDetails.abapMsgNumber = error.abapMsgNumber;
    if (error.abapMsgV1) errorDetails.abapMsgV1 = error.abapMsgV1;
    if (error.abapMsgV2) errorDetails.abapMsgV2 = error.abapMsgV2;
    if (error.abapMsgV3) errorDetails.abapMsgV3 = error.abapMsgV3;
    if (error.abapMsgV4) errorDetails.abapMsgV4 = error.abapMsgV4;
    if (error.group) errorDetails.group = error.group;
    if (error.stack) errorDetails.stack = error.stack.substring(0, 2000);
    
    await prisma.rFCCall.create({
      data: {
        templateId: id,
        rfmName: body.rfmName || 'UNKNOWN',
        parameters: body.parameters || null,
        duration,
        status: 'ERROR',
        errorMessage: error.message,
        errorDetails: errorDetails,
        requestBody: body,
        source: 'web',
        calledBy: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'web-user',
      },
    }).catch(() => {});

    console.error('Error executing RFC template:', error);
    return NextResponse.json(
      { success: false, error: error.message, errorDetails: process.env.NODE_ENV === 'development' ? errorDetails : undefined },
      { status: 500 }
    );
  }
}
