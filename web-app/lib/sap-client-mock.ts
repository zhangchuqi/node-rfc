// Mock SAP Client for development without SAP NW RFC SDK
// Replace this with the real sap-client.ts once node-rfc is properly installed

import { SAPConnection, ConnectionType } from '@prisma/client';

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

export function toSAPParams(connection: SAPConnection): SAPConnectionParams {
  const params: SAPConnectionParams = {
    user: connection.user,
    passwd: connection.password,
    ashost: connection.host,
    sysnr: connection.systemNumber,
    client: connection.client,
    lang: connection.language,
  };

  if (connection.saprouter) params.saprouter = connection.saprouter;
  if (connection.sncMode) params.snc_mode = connection.sncMode;
  if (connection.sncQop) params.snc_qop = connection.sncQop;
  if (connection.sncMyname) params.snc_myname = connection.sncMyname;
  if (connection.sncPartnername) params.snc_partnername = connection.sncPartnername;
  if (connection.trace) params.trace = connection.trace;

  return params;
}

// Mock implementations
export async function getSAPConnection(connection: SAPConnection): Promise<any> {
  console.warn('⚠️ Using MOCK SAP connection - node-rfc not installed');
  return { mock: true, connectionId: connection.id };
}

export async function closeSAPConnection(connectionId: string): Promise<void> {
  console.warn('⚠️ Using MOCK SAP close - node-rfc not installed');
}

export async function closeAllConnections(): Promise<void> {
  console.warn('⚠️ Using MOCK SAP close all - node-rfc not installed');
}

export async function callRFC(
  connection: SAPConnection,
  rfmName: string,
  parameters: Record<string, any> = {},
  callOptions?: { timeout?: number; notRequested?: string[] }
): Promise<any> {
  console.warn('⚠️ Using MOCK SAP call - node-rfc not installed');
  
  // Return mock data for testing
  return {
    ECHOTEXT: parameters.REQUTEXT || 'Mock response',
    RESPTEXT: `Mock SAP response for ${rfmName}`,
    MOCK_MODE: true,
    CONNECTION: connection.name,
  };
}

export async function testConnection(connection: SAPConnection): Promise<boolean> {
  console.warn('⚠️ Using MOCK SAP test - node-rfc not installed');
  
  // Simulate connection test delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Return true for mock success
  return true;
}
