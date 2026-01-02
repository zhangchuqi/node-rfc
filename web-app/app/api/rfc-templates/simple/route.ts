import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * 创建简化的 RFC API 接口
 * POST /api/rfc-templates/simple
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      name,
      description,
      connectionId,
      rfmName,
      apiPath,
      apiKey,
      inputMapping,
      outputMapping
    } = body;

    // 验证必填字段
    if (!name || !connectionId || !rfmName || !apiPath || !apiKey) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 验证 inputMapping
    if (!inputMapping || typeof inputMapping !== 'object' || Object.keys(inputMapping).length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one input mapping is required' },
        { status: 400 }
      );
    }

    // 验证连接是否存在
    const connection = await prisma.sAPConnection.findUnique({
      where: { id: connectionId }
    });

    if (!connection) {
      return NextResponse.json(
        { success: false, error: 'Connection not found' },
        { status: 404 }
      );
    }

    // 创建接口
    const template = await prisma.rFCTemplate.create({
      data: {
        name,
        description,
        connectionId,
        rfmName,
        apiPath,
        apiKey,
        inputMapping,
        outputMapping: outputMapping || null,
        isActive: true
      }
    });

    return NextResponse.json({
      success: true,
      data: template
    });

  } catch (error: any) {
    console.error('Create simple template error:', error);
    
    // 处理唯一约束错误
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0];
      return NextResponse.json(
        { 
          success: false, 
          error: field === 'name' ? 'Interface name already exists' : 'API path already exists'
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
