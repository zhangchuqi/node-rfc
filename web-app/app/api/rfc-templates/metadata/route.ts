import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { callRFC } from '@/lib/sap-client';

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
      const metadata = await callRFC(
        connection,
        'RFC_GET_FUNCTION_INTERFACE',
        { FUNCNAME: rfmName.toUpperCase() }
      );

      // 解析参数结构
      const inputSchema = {
        IMPORTING: metadata.IMPORT_PARAMETER || [],
        TABLES: metadata.TABLES || [],
        CHANGING: metadata.CHANGING_PARAMETER || [],
      };

      const outputSchema = {
        EXPORTING: metadata.EXPORT_PARAMETER || [],
        TABLES: metadata.TABLES || [],
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
