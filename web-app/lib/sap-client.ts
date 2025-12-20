/**
 * SAP Client - Conditional Import
 * 
 * In production (Railway), this module should NOT be used directly.
 * Instead, use rfc-api-client.ts to call the RFC API Server via HTTP.
 * 
 * This file is only for local development with direct SAP SDK access.
 */

// Type-only imports to avoid runtime dependency
import type { SAPConnection } from '@prisma/client';

export interface SAPConnectionParams {
  user: string;
  passwd: string;
  ashost: string;
  sysnr: string;
  client: string;
  lang: string;
  saprouter?: string;
  snc_mode?: string;
  snc_qop?: string;
  snc_myname?: string;
  snc_partnername?: string;
  trace?: string;
}

/**
 * Convert database connection record to SAP connection parameters
 */
export function toSAPParams(connection: SAPConnection): SAPConnectionParams {
  const params: SAPConnectionParams = {
    user: connection.user,
    passwd: connection.password,
    ashost: connection.host,
    sysnr: connection.systemNumber,
    client: connection.client,
    lang: connection.language,
  };

  // Add optional parameters if they exist
  if (connection.saprouter) params.saprouter = connection.saprouter;
  if (connection.sncMode) params.snc_mode = connection.sncMode;
  if (connection.sncQop) params.snc_qop = connection.sncQop;
  if (connection.sncMyname) params.snc_myname = connection.sncMyname;
  if (connection.sncPartnername) params.snc_partnername = connection.sncPartnername;
  if (connection.trace) params.trace = connection.trace;

  return params;
}

/**
 * DEPRECATED in production: Use RFC API Client instead
 * 
 * This function is only available in local development environments
 * where node-rfc is installed.
 */
export async function getSAPConnection(connection: SAPConnection): Promise<any> {
  throw new Error(
    'getSAPConnection is not available in production. ' +
    'Use RFC API Client (rfc-api-client.ts) to call RFC API Server via HTTP.'
  );
}

/**
 * DEPRECATED in production: Use RFC API Client instead
 */
export async function callRFC(
  connection: SAPConnection,
  functionName: string,
  parameters: Record<string, any> = {}
): Promise<any> {
  throw new Error(
    'callRFC is not available in production. ' +
    'Use RFC API Client (rfc-api-client.ts) to call RFC API Server via HTTP.'
  );
}

/**
 * DEPRECATED in production: Use RFC API Client instead
 */
export async function closeAllConnections(): Promise<void> {
  // No-op in production
  console.log('closeAllConnections: No active connections in production mode');
}
