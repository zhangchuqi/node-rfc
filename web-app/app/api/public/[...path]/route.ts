import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { callRFC, toSAPParams } from '@/lib/sap-client';
import { applyMapping, applyReverseMapping, mergeWithDefaults } from '@/lib/json-mapper';
import { executeWorkflow, validateWorkflow } from '@/lib/workflow-executor';
import { callRFCViaAPI } from '@/lib/rfc-api-client';

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

    // 检查连接是否存在并激活
    if (!template.connection) {
      return NextResponse.json(
        { success: false, error: 'Template connection not found' },
        { status: 400 }
      );
    }
    if (!template.connection.isActive) {
      return NextResponse.json(
        { success: false, error: 'SAP connection is inactive' },
        { status: 503 }
      );
    }

    // 检查是否使用工作流模式
    let rfcResult: any;
    let apiResult: any;
    let rfcParams: any;

    if (template.workflowDefinition) {
      // 新模式：执行可视化工作流
      const workflow = template.workflowDefinition as any;
      
      // 验证工作流
      const validation = validateWorkflow(workflow);
      if (!validation.valid) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid workflow definition',
            details: validation.errors 
          },
          { status: 400 }
        );
      }

      // 创建 RFC 执行器
      const rfcExecutor = async (connectionId: string, rfmName: string, params: any) => {
        if (!template.connection) {
          throw new Error('Template connection not found');
        }
        // 检查是否使用 RFC API Server
        if (process.env.RFC_API_URL) {
          const sapParams = toSAPParams(template.connection);
          const response = await callRFCViaAPI({
            connection: sapParams,
            rfmName,
            parameters: params
          });
          
          if (!response.success) {
            throw new Error(response.error || 'RFC call failed');
          }
          
          return response.data;
        } else {
          // 本地直接调用
          if (!template.connection) {
            throw new Error('Template connection not found');
          }
          return await callRFC(template.connection, rfmName, params);
        }
      };

      // 执行工作流
      const workflowResult = await executeWorkflow(
        workflow,
        body.parameters || {},
        rfcExecutor
      );

      if (!workflowResult.success) {
        throw new Error(workflowResult.error || 'Workflow execution failed');
      }

      apiResult = workflowResult.result;
      rfcParams = body.parameters || {};
      rfcResult = workflowResult.result;
    } else {
      // 旧模式：使用 inputMapping/outputMapping
      const finalParams = {
        ...(template.parameters as object || {}),
        ...(body.parameters || {}),
      };

      // 应用输入映射（如果配置了映射规则）
      const mappedParams = template.inputMapping 
        ? applyMapping(body.parameters || {}, template.inputMapping as any)
        : body.parameters || {};

      // 合并映射后的参数和默认参数
      rfcParams = mergeWithDefaults(mappedParams, template.parameters as any);

      // 调用 SAP RFC
      if (!template.connection) {
        throw new Error('Template connection not found');
      }
      if (!template.rfmName) {
        throw new Error('Template RFC function name not configured');
      }
      rfcResult = await callRFC(template.connection, template.rfmName, rfcParams);

      // 应用输出映射（如果配置了映射规则）
      apiResult = template.outputMapping
        ? applyReverseMapping(rfcResult, template.outputMapping as any)
        : rfcResult;
    }

    const duration = Date.now() - startTime;

    // 记录调用
    await prisma.rFCCall.create({
      data: {
        templateId: template.id,
        rfmName: template.rfmName || '',
        parameters: rfcParams,
        result: rfcResult as any,
        duration,
        status: 'SUCCESS',
        requestBody: body,
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

    // 记录错误
    await prisma.rFCCall.create({
      data: {
        rfmName: 'UNKNOWN',
        parameters: {},
        duration,
        status: 'ERROR',
        errorMessage: error.message,
        errorDetails: errorDetails,
        requestBody: body,
        source: 'api',
        calledBy: clientIp,
      },
    }).catch(() => {});

    console.error(`API call failed for ${apiPath}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        errorDetails: process.env.NODE_ENV === 'development' ? errorDetails : undefined,
        meta: {
          duration,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
