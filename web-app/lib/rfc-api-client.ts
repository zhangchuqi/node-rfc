/**
 * RFC API Client - 通过 HTTP 调用 RFC API Server
 * 在 Railway 部署时使用，避免 web-app 直接依赖 SAP SDK
 */

export interface RFCConnection {
  ashost: string;
  sysnr: string;
  client: string;
  user: string;
  passwd: string;
  lang?: string;
}

export interface RFCCallParams {
  connection: RFCConnection;
  rfmName: string;
  parameters?: Record<string, any>;
}

export interface RFCResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * 调用 RFC 函数
 */
export async function callRFC(params: RFCCallParams): Promise<RFCResponse> {
  const rfcApiUrl = process.env.RFC_API_URL;
  
  if (!rfcApiUrl) {
    throw new Error('RFC_API_URL environment variable is not set');
  }

  try {
    const response = await fetch(`${rfcApiUrl}/api/rfc/call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('RFC API call error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 测试 RFC 连接
 */
export async function testRFCConnection(connection: RFCConnection): Promise<RFCResponse> {
  const rfcApiUrl = process.env.RFC_API_URL;
  
  if (!rfcApiUrl) {
    throw new Error('RFC_API_URL environment variable is not set');
  }

  try {
    const response = await fetch(`${rfcApiUrl}/api/rfc/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ connection }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('RFC connection test error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 检查 RFC API Server 健康状态
 */
export async function checkRFCApiHealth(): Promise<boolean> {
  const rfcApiUrl = process.env.RFC_API_URL;
  
  if (!rfcApiUrl) {
    return false;
  }

  try {
    const response = await fetch(`${rfcApiUrl}/health`, {
      method: 'GET',
    });
    
    const result = await response.json();
    return result.status === 'ok';
  } catch (error) {
    console.error('RFC API health check error:', error);
    return false;
  }
}
