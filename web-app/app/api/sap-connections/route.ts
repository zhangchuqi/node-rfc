import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const connections = await prisma.sAPConnection.findMany({
      select: {
        id: true,
        name: true,
        host: true,
        systemNumber: true,
        client: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: connections,
    });
  } catch (error: any) {
    console.error("Error fetching SAP connections:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch SAP connections",
      },
      { status: 500 }
    );
  }
}
