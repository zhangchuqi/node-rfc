import { Client, Pool } from 'node-rfc';
import { SAPConnection, ConnectionType } from '@prisma/client';

// Cache for active connections
const connectionCache = new Map<string, Client | Pool>();

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
 * Get or create a SAP client/pool connection
 */
export async function getSAPConnection(connection: SAPConnection): Promise<Client | Pool> {
  const cacheKey = connection.id;

  // Return cached connection if exists
  if (connectionCache.has(cacheKey)) {
    const cached = connectionCache.get(cacheKey)!;
    
    // Check if connection is still alive
    if (cached instanceof Client && cached.alive) {
      return cached;
    }
    if (cached instanceof Pool) {
      return cached;
    }
    
    // Remove stale connection from cache
    connectionCache.delete(cacheKey);
  }

  // Create new connection based on type
  const params = toSAPParams(connection);
  const clientOptions = (connection.clientOptions as any) || {};

  if (connection.connectionType === ConnectionType.POOL) {
    const poolOptions = (connection.poolOptions as any) || { low: 2, high: 10 };
    
    const pool = new Pool({
      connectionParameters: params,
      clientOptions,
      poolOptions,
    });

    connectionCache.set(cacheKey, pool);
    return pool;
  } else {
    // CLIENT type
    const client = new Client(params, clientOptions);
    connectionCache.set(cacheKey, client);
    return client;
  }
}

/**
 * Close and remove a connection from cache
 */
export async function closeSAPConnection(connectionId: string): Promise<void> {
  const cached = connectionCache.get(connectionId);
  if (!cached) return;

  try {
    if (cached instanceof Client) {
      if (cached.alive) {
        await cached.close();
      }
    } else if (cached instanceof Pool) {
      await cached.closeAll();
    }
  } catch (error) {
    console.error('Error closing connection:', error);
  } finally {
    connectionCache.delete(connectionId);
  }
}

/**
 * Close all cached connections
 */
export async function closeAllConnections(): Promise<void> {
  const promises = Array.from(connectionCache.keys()).map(closeSAPConnection);
  await Promise.all(promises);
}

/**
 * Get RFC function metadata (parameters structure)
 */
export async function getFunctionMetadata(
  connection: SAPConnection,
  rfmName: string
): Promise<any> {
  const sapConnection = await getSAPConnection(connection);

  if (sapConnection instanceof Client) {
    // Direct client - need to open/close
    if (!sapConnection.alive) {
      await sapConnection.open();
    }
    // Use the client's metadata method
    const metadata = (sapConnection as any).connectionInfo;
    
    // Call RFC_METADATA to get function description
    const result = await sapConnection.call('RFC_METADATA_GET', {
      FUNCTION_NAME: rfmName
    });
    return result;
  } else {
    // Pool - acquire, call, release
    return new Promise((resolve, reject) => {
      sapConnection.acquire((err: Error | null, client: Client) => {
        if (err || !client) {
          reject(err || new Error('Failed to acquire client'));
          return;
        }
        client.call('RFC_METADATA_GET', { FUNCTION_NAME: rfmName })
          .then((result: any) => {
            sapConnection.release(client, (releaseErr: Error | null) => {
              if (releaseErr) console.error('Error releasing client:', releaseErr);
              resolve(result);
            });
          })
          .catch((callErr: any) => {
            sapConnection.release(client, (releaseErr: Error | null) => {
              if (releaseErr) console.error('Error releasing client:', releaseErr);
              reject(callErr);
            });
          });
      });
    });
  }
}

/**
 * Call a SAP function module
 */
export async function callRFC(
  connection: SAPConnection,
  rfmName: string,
  parameters: Record<string, any> = {},
  callOptions?: { timeout?: number; notRequested?: string[] }
): Promise<any> {
  const sapConnection = await getSAPConnection(connection);

  if (sapConnection instanceof Client) {
    // Direct client - need to open/close
    if (!sapConnection.alive) {
      await sapConnection.open();
    }
    const result = await sapConnection.call(rfmName, parameters, callOptions);
    return result;
  } else {
    // Pool - acquire, call, release
    return new Promise((resolve, reject) => {
      sapConnection.acquire((err: Error | null, client: Client) => {
        if (err || !client) {
          reject(err || new Error('Failed to acquire client'));
          return;
        }
        client.call(rfmName, parameters, callOptions)
          .then((result: any) => {
            sapConnection.release(client, (releaseErr: Error | null) => {
              if (releaseErr) console.error('Error releasing client:', releaseErr);
              resolve(result);
            });
          })
          .catch((callErr: any) => {
            sapConnection.release(client, (releaseErr: Error | null) => {
              if (releaseErr) console.error('Error releasing client:', releaseErr);
              reject(callErr);
            });
          });
      });
    });
  }
}

/**
 * Test a connection (without caching)
 */
export async function testConnection(connection: SAPConnection): Promise<boolean> {
  const params = toSAPParams(connection);
  const clientOptions = (connection.clientOptions as any) || {};
  
  const client = new Client(params, clientOptions);
  
  try {
    await client.open();
    await client.ping();
    await client.close();
    return true;
  } catch (error) {
    throw error;
  }
}
