import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { callRFC as callRFCDirect, toSAPParams } from '@/lib/sap-client';
import { callRFC as callRFCViaAPI } from '@/lib/rfc-api-client';
import { CallStatus } from '@prisma/client';
import type { SAPConnection } from '@prisma/client';

// Helper: 统一 RFC 调用接口
async function executeRFC(
  connection: SAPConnection,
  rfmName: string,
  parameters: Record<string, any>,
  callOptions?: any
): Promise<any> {
  const useAPIClient = process.env.RFC_API_URL;
  
  if (useAPIClient) {
    // 使用 HTTP API 调用 rfc-server
    const sapParams = toSAPParams(connection);
    const response = await callRFCViaAPI({
      connection: sapParams,
      rfmName,
      parameters
    });
    
    if (!response.success) {
      throw new Error(response.error || 'RFC call failed');
    }
    
    return response.data;
  } else {
    // 本地直接调用（开发环境）
    return await callRFCDirect(connection, rfmName, parameters, callOptions);
  }
}

// Helper function to remove empty string values from parameters
function cleanParameters(params: any): any {
  if (Array.isArray(params)) {
    // For arrays, clean each item and filter out empty objects
    const cleaned = params.map(item => cleanParameters(item)).filter(item => {
      if (typeof item === 'object' && item !== null) {
        return Object.keys(item).length > 0;
      }
      return item !== '';
    });
    return cleaned;
  } else if (typeof params === 'object' && params !== null) {
    // For objects, recursively clean and remove empty string values
    const cleaned: any = {};
    for (const [key, value] of Object.entries(params)) {
      if (value === '') {
        // Skip empty strings
        continue;
      } else if (Array.isArray(value)) {
        const cleanedArray = cleanParameters(value);
        if (cleanedArray.length > 0) {
          cleaned[key] = cleanedArray;
        }
      } else if (typeof value === 'object' && value !== null) {
        const cleanedObj = cleanParameters(value);
        if (Object.keys(cleanedObj).length > 0) {
          cleaned[key] = cleanedObj;
        }
      } else {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }
  return params;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { connectionId, rfmName, parameters, callOptions } = body;

    if (!connectionId || !rfmName) {
      return NextResponse.json(
        { success: false, error: 'connectionId and rfmName are required' },
        { status: 400 }
      );
    }

    // Fetch connection from database
    const connection = await prisma.sAPConnection.findUnique({
      where: { id: connectionId }
    });

    if (!connection) {
      return NextResponse.json(
        { success: false, error: 'Connection not found' },
        { status: 404 }
      );
    }

    if (!connection.isActive) {
      return NextResponse.json(
        { success: false, error: 'Connection is not active' },
        { status: 400 }
      );
    }

    // Execute RFC call
    const startTime = Date.now();
    let result;
    let status: CallStatus = CallStatus.SUCCESS;
    let errorMessage: string | null = null;
    let errorCode: string | null = null;
    let errorKey: string | null = null;

    try {
      // Clean parameters: remove empty strings so SAP uses default values
      const cleanedParameters = cleanParameters(parameters || {});
      result = await executeRFC(connection, rfmName, cleanedParameters, callOptions);
    } catch (error: any) {
      status = CallStatus.ERROR;
      errorMessage = error.message || 'Unknown error';
      errorCode = error.code?.toString() || null;
      errorKey = error.key || null;
      result = null;
    }

    const duration = Date.now() - startTime;

    // Log the call
    const callLog = await prisma.callLog.create({
      data: {
        connectionId,
        rfmName,
        parameters: parameters || {},
        result: result || {},
        duration,
        status,
        errorMessage,
        errorCode,
        errorKey,
      }
    });

    if (status === CallStatus.ERROR) {
      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          details: {
            code: errorCode,
            key: errorKey,
            duration,
            logId: callLog.id
          }
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        result,
        duration,
        logId: callLog.id
      }
    });
  } catch (error: any) {
    console.error('Error calling RFC:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
