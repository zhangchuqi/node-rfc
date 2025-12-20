import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { callRFC } from '@/lib/sap-client';
import { applyMapping, applyReverseMapping, mergeWithDefaults } from '@/lib/json-mapper';

// 公共 API 端点 - 通过 API 路径调用 RFC
export async function POST(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const startTime = Date.now();
  const clientIp = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';

  try {
    const { path } = await params;
    const apiPath = '/' + path.join('/');
    const body = await request.json();

    // 获取 API Key（从 header 或 body）
    const apiKey = request.headers.get('x-api-key') || body.apiKey;

    // 查找 RFC 模板
    const template = await prisma.rFCTemplate.findUnique({
      where: { apiPath },
      include: { connection: true },
    });

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'API endpoint not found' },
        { status: 404 }
      );
    }

    // 检查是否激活
    if (!template.isActive) {
      return NextResponse.json(
        { success: false, error: 'API endpoint is inactive' },
        { status: 403 }
      );
    }

    // 验证 API Key（强制要求）
    if (!apiKey || apiKey !== template.apiKey) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing API key' },
        { status: 401 }
      );
    }

    // 检查连接是否激活
    if (!template.connection.isActive) {
      return NextResponse.json(
        { success: false, error: 'SAP connection is inactive' },
        { status: 503 }
      );
    }

    // 合并参数
    const finalParams = {
      ...(template.parameters as object || {}),
      ...(body.parameters || {}),
    };

    // 应用输入映射（如果配置了映射规则）
    const mappedParams = template.inputMapping 
      ? applyMapping(body.parameters || {}, template.inputMapping as any)
      : body.parameters || {};

    // 合并映射后的参数和默认参数
    const rfcParams = mergeWithDefaults(mappedParams, template.parameters as any);

    // 调用 SAP RFC
    const rfcResult = await callRFC(template.connection, template.rfmName, rfcParams);

    // 应用输出映射（如果配置了映射规则）
    const apiResult = template.outputMapping
      ? applyReverseMapping(rfcResult, template.outputMapping as any)
      : rfcResult;

    const duration = Date.now() - startTime;

    // 记录调用
    await prisma.rFCCall.create({
      data: {
        templateId: template.id,
        rfmName: template.rfmName,
        parameters: rfcParams,
        result: rfcResult as any,
        duration,
        status: 'SUCCESS',
        source: 'api',
        calledBy: clientIp,
      },
    });

    return NextResponse.json({
      success: true,
      data: apiResult,
      meta: {
        duration,
        rfmName: template.rfmName,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    const { path } = await params;
    const apiPath = '/' + path.join('/');

    // 记录错误
    await prisma.rFCCall.create({
      data: {
        rfmName: 'UNKNOWN',
        parameters: {},
        duration,
        status: 'ERROR',
        errorMessage: error.message,
        source: 'api',
        calledBy: clientIp,
      },
    }).catch(() => {});

    console.error(`API call failed for ${apiPath}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        meta: {
          duration,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
