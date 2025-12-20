import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { callRFC } from '@/lib/sap-client';

// 测试执行 RFC 函数
export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { connectionId, rfmName, parameters } = body;

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

    // 调用 RFC
    const result = await callRFC(connection, rfmName.toUpperCase(), parameters || {});
    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        result,
        duration,
        rfmName: rfmName.toUpperCase(),
        parameters,
      },
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('Error testing RFC:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        duration,
      },
      { status: 500 }
    );
  }
}
