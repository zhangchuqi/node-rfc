import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('connectionId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (connectionId) where.connectionId = connectionId;
    if (status) where.status = status;

    const [logs, total] = await Promise.all([
      prisma.callLog.findMany({
        where,
        include: {
          connection: {
            select: {
              id: true,
              name: true,
              connectionType: true
            }
          }
        },
        orderBy: { calledAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.callLog.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching logs:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
