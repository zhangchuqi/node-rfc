import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { callRFC as callRFCHttp } from '@/lib/rfc-api-client';
import { toSAPParams } from '@/lib/sap-client';

// 动态导入本地 sap-client（仅在开发环境）
let callRFCLocal: any = null;
try {
  const localClient = require('@/lib/sap-client-local');
  callRFCLocal = localClient.callRFC;
} catch (e) {
  // 生产环境，没有 sap-client-local
}

// 获取 RFC 函数的元数据（参数结构）
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { connectionId, rfmName } = body;

    if (!connectionId || !rfmName) {
      return NextResponse.json(
        { success: false, error: 'connectionId and rfmName are required' },
        { status: 400 }
      );
    }

    // 获取连接
    const connection = await prisma.sAPConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      return NextResponse.json(
        { success: false, error: 'Connection not found' },
        { status: 404 }
      );
    }

    // 调用 RFC_GET_FUNCTION_INTERFACE 获取函数元数据
    try {
      let metadata;
      
      // 优先：如果设置了 RFC_API_URL，通过 HTTP 调用 RFC API Server
      if (process.env.RFC_API_URL) {
        const sapParams = toSAPParams(connection);
        const response = await callRFCHttp({
          connection: sapParams,
          rfmName: 'RFC_GET_FUNCTION_INTERFACE',
          parameters: { FUNCNAME: rfmName.toUpperCase() }
        });
        
        if (!response.success) {
          throw new Error(response.error || 'RFC call failed');
        }
        metadata = response.data;
      }
      // 回退：本地开发直接调用 RFC（需要安装 node-rfc）
      else if (callRFCLocal && process.env.NODE_ENV === 'development') {
        metadata = await callRFCLocal(
          connection,
          'RFC_GET_FUNCTION_INTERFACE',
          { FUNCNAME: rfmName.toUpperCase() }
        );
      } 
      // 既没有 RFC_API_URL 也没有本地 RFC
      else {
        return NextResponse.json(
          { 
            success: false, 
            error: 'RFC not available. Set RFC_API_URL environment variable to use RFC API Server, or run in development mode with node-rfc installed.',
          },
          { status: 503 }
        );
      }

      // 解析参数结构
      // RFC_GET_FUNCTION_INTERFACE 返回的字段名可能是：
      // IMPORT_PARAMETER, EXPORT_PARAMETER, CHANGING_PARAMETER, TABLES_PARAMETER
      // 或者 IMPORTING, EXPORTING, CHANGING, TABLES
      const inputSchema = {
        IMPORTING: metadata.IMPORT_PARAMETER || metadata.IMPORTING || [],
        TABLES: metadata.TABLES_PARAMETER || metadata.TABLES || [],
        CHANGING: metadata.CHANGING_PARAMETER || metadata.CHANGING || [],
      };

      const outputSchema = {
        EXPORTING: metadata.EXPORT_PARAMETER || metadata.EXPORTING || [],
        TABLES: metadata.TABLES_PARAMETER || metadata.TABLES || [],
      };

      return NextResponse.json({
        success: true,
        data: {
          rfmName,
          inputSchema,
          outputSchema,
          description: metadata.DESCRIPTION || '',
        },
      });
    } catch (rfcError: any) {
      // 如果 RFC_GET_FUNCTION_INTERFACE 失败，返回友好错误
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to get RFC metadata: ${rfcError.message}`,
          hint: 'Make sure the RFC function name is correct and you have authorization to call RFC_GET_FUNCTION_INTERFACE'
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error fetching RFC metadata:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
