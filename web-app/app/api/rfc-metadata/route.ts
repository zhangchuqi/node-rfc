import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/rfc-metadata
 * 获取 RFC 函数的元数据（参数结构）
 * 通过调用 rfc-server 来获取元数据
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { connectionId, rfmName } = body;

    if (!connectionId || !rfmName) {
      return NextResponse.json(
        { success: false, error: "Missing connectionId or rfmName" },
        { status: 400 }
      );
    }

    // 获取连接配置
    const connection = await prisma.sAPConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      return NextResponse.json(
        { success: false, error: "Connection not found" },
        { status: 404 }
      );
    }

    // 准备 RFC Server 连接参数
    const rfcConnection = {
      user: connection.user,
      passwd: connection.password,
      ashost: connection.host,
      sysnr: connection.systemNumber,
      client: connection.client,
      lang: connection.language || "EN",
    };

    // 调用 rfc-server 的 metadata 端点
    const rfcApiUrl = process.env.RFC_API_URL || "http://localhost:3001";
    const response = await fetch(`${rfcApiUrl}/api/rfc/metadata`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        connection: rfcConnection,
        rfmName: rfmName,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.error || "Failed to fetch metadata",
          suggestion: data.suggestion,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      metadata: data.metadata,
      inputTemplate: data.inputTemplate,
    });
  } catch (error: any) {
    console.error("RFC Metadata Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get RFC metadata",
      },
      { status: 500 }
    );
  }
}
