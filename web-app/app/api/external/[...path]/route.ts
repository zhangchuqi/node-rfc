import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Client } from 'node-rfc';
import { JSONPath } from 'jsonpath-plus';

/**
 * 动态路由处理外部 API 调用
 * POST /api/external/*
 * 
 * 根据 apiPath 查找对应的 RFC Template，执行映射和调用
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const startTime = Date.now();
  
  try {
    // 构建完整的 API 路径
    const apiPath = '/api/external/' + (params.path?.join('/') || '');
    
    // 验证 API Key
    const authHeader = req.headers.get('authorization');
    const apiKey = authHeader?.replace('Bearer ', '');
    
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API Key is required. Use: Authorization: Bearer YOUR_API_KEY' },
        { status: 401 }
      );
    }

    // 查找对应的模板
    const template = await prisma.rFCTemplate.findFirst({
      where: {
        apiPath,
        apiKey,
        isActive: true
      },
      include: {
        connection: true
      }
    });

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'API endpoint not found or invalid API key' },
        { status: 404 }
      );
    }

    // 获取请求体
    const requestBody = await req.json();

    // === 输入映射 ===
    const rfcParameters: Record<string, any> = {};
    const inputMapping = template.inputMapping as Record<string, string>;

    for (const [rfcParam, jsonPath] of Object.entries(inputMapping)) {
      try {
        // 使用 JSONPath 提取值
        const values = JSONPath({ path: jsonPath, json: requestBody });
        if (values && values.length > 0) {
          rfcParameters[rfcParam] = values[0];
        }
      } catch (error) {
        console.error(`Mapping error for ${rfcParam}: ${error}`);
      }
    }

    console.log('RFC Parameters after mapping:', rfcParameters);

    // === 调用 SAP RFC ===
    const connectionConfig = {
      user: template.connection!.user,
      passwd: template.connection!.password,
      ashost: template.connection!.ashost,
      sysnr: template.connection!.sysnr,
      client: template.connection!.client,
      lang: template.connection!.lang || 'EN',
    };

    const client = new Client(connectionConfig);
    let rfcResult: any;
    let errorMessage: string | null = null;
    let status: 'SUCCESS' | 'ERROR' = 'SUCCESS';

    try {
      await client.open();
      rfcResult = await client.call(template.rfmName, rfcParameters);
      await client.close();
    } catch (error: any) {
      status = 'ERROR';
      errorMessage = error.message;
      console.error('RFC call error:', error);
      
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

      // RFC 错误信息
      if (error.group) errorDetails.group = error.group;
      if (error.rfcMsgClass) errorDetails.rfcMsgClass = error.rfcMsgClass;
      if (error.rfcMsgNumber) errorDetails.rfcMsgNumber = error.rfcMsgNumber;
      
      // 堆栈信息（可能很长，只保存前 2000 字符）
      if (error.stack) {
        errorDetails.stack = error.stack.substring(0, 2000);
      }

      // 记录失败的调用
      await prisma.rFCCall.create({
        data: {
          templateId: template.id,
          rfmName: template.rfmName,
          parameters: rfcParameters,
          result: null,
          duration: Date.now() - startTime,
          status: 'ERROR',
          errorMessage: error.message,
          errorDetails: errorDetails,
          requestBody: requestBody,
          source: 'external_api',
          calledBy: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
        }
      });

      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          errorCode: error.code || error.key,
          errorDetails: process.env.NODE_ENV === 'development' ? errorDetails : undefined
        },
        { status: 500 }
      );
    }

    // === 输出映射 ===
    let responseData: any = rfcResult;

    if (template.outputMapping) {
      const outputMapping = template.outputMapping as Record<string, string>;
      const mappedOutput: Record<string, any> = {};

      for (const [outputField, jsonPath] of Object.entries(outputMapping)) {
        try {
          // 从 RFC 结果中提取字段
          const rfcField = outputField;
          const value = rfcResult[rfcField];
          
          // 将值设置到输出 JSON 路径
          // 简单实现：只支持 $.field 格式
          const fieldName = jsonPath.replace('$.', '');
          mappedOutput[fieldName] = value;
        } catch (error) {
          console.error(`Output mapping error for ${outputField}: ${error}`);
        }
      }

      responseData = mappedOutput;
    }

    // 记录成功的调用
    const duration = Date.now() - startTime;
    await prisma.rFCCall.create({
      data: {
        templateId: template.id,
        rfmName: template.rfmName,
        parameters: rfcParameters,
        result: rfcResult,
        duration,
        status: 'SUCCESS',
        requestBody: requestBody,
        source: 'external_api',
        calledBy: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
      }
    });

    return NextResponse.json({
      success: true,
      data: responseData,
      _meta: {
        duration,
        rfmName: template.rfmName
      }
    });

  } catch (error: any) {
    console.error('External API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET 方法返回接口信息
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const apiPath = '/api/external/' + (params.path?.join('/') || '');
  
  const template = await prisma.rFCTemplate.findFirst({
    where: {
      apiPath,
      isActive: true
    },
    select: {
      name: true,
      description: true,
      rfmName: true,
      inputMapping: true,
      outputMapping: true,
      createdAt: true
    }
  });

  if (!template) {
    return NextResponse.json(
      { success: false, error: 'API endpoint not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      name: template.name,
      description: template.description,
      rfmName: template.rfmName,
      inputMapping: template.inputMapping,
      outputMapping: template.outputMapping,
      usage: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_API_KEY'
        },
        example: 'See inputMapping for required fields'
      }
    }
  });
}
