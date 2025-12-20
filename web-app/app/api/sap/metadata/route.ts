import { NextRequest, NextResponse } from 'next/server';

/**
 * Get RFC function metadata
 * POST /api/sap/metadata
 * 
 * DEPRECATED: This endpoint is deprecated in production deployments.
 * Use /api/rfc-templates/metadata instead, which works with the RFC API Server architecture.
 */
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'This API endpoint is deprecated.',
      message: 'Please use /api/rfc-templates/metadata instead.',
      hint: 'This endpoint requires direct node-rfc access which is only available via RFC API Server in production.'
    },
    { status: 410 }
  );
}
