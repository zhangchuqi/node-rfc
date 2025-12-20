// SPDX-FileCopyrightText: 2014 SAP SE Srdjan Boskovic <srdjan.boskovic@sap.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
    //Promise,
    noderfc_binding,
    environment,
    NodeRfcEnvironment,
} from "./noderfc-bindings";

import {
    RfcConnectionParameters,
    RfcLoggingLevel,
    RfcParameterDirection,
    RfcObject,
} from "./sapnwrfc";

//
// RfcClient
//

/**
 * Options for configuring RFC client behavior.
 *
 * @typedef {Object} RfcClientOptions
 * @property {string | Function} [bcd] - Binary-coded decimal (BCD) conversion function or format string
 * @property {Object} [date] - Date conversion handlers
 * @property {Function} date.toABAP - Convert JavaScript date to ABAP format
 * @property {Function} date.fromABAP - Convert ABAP date to JavaScript format
 * @property {Object} [time] - Time conversion handlers
 * @property {Function} time.toABAP - Convert JavaScript time to ABAP format
 * @property {Function} time.fromABAP - Convert ABAP time to JavaScript format
 * @property {RfcParameterDirection} [filter] - Filter parameters by direction (import/export/changing/tables)
 * @property {boolean} [stateless] - Use stateless connection mode (default: false)
 * @property {number} [timeout] - Connection timeout in seconds
 * @property {RfcLoggingLevel} [logLevel] - Logging verbosity level
 *
 * @example
 * const clientOptions = {
 *   stateless: true,
 *   timeout: 10,
 *   date: {
 *     toABAP: (date) => date.toISOString().slice(0, 10).replace(/-/g, ''),
 *     fromABAP: (abapDate) => new Date(abapDate)
 *   }
 * };
 */
export type RfcClientOptions = {
    bcd?: string | Function;
    date?: { toABAP: Function; fromABAP: Function };
    time?: { toABAP: Function; fromABAP: Function };
    filter?: RfcParameterDirection;
    stateless?: boolean;
    timeout?: number;
    logLevel?: RfcLoggingLevel;
};

/**
 * Options for individual RFC function call operations.
 *
 * @typedef {Object} RfcCallOptions
 * @property {Array<string>} [notRequested] - List of parameter names to exclude from result
 * @property {number} [timeout] - Call-specific timeout in seconds (overrides client timeout)
 *
 * @example
 * const callOptions = {
 *   notRequested: ['LARGE_TABLE', 'UNUSED_PARAM'],
 *   timeout: 30
 * };
 */
export type RfcCallOptions = {
    notRequested?: Array<string>;
    timeout?: number;
};

/**
 * SAP system connection information returned after successful connection.
 *
 * @interface RfcConnectionInfo
 * @property {string} dest - Destination name
 * @property {string} host - Application server hostname
 * @property {string} partnerHost - Partner system hostname
 * @property {string} sysNumber - System number (00-99)
 * @property {string} sysId - System ID (e.g., 'PRD', 'DEV')
 * @property {string} client - Client number (e.g., '001')
 * @property {string} user - Logged-in username
 * @property {string} language - Login language (SAP format, e.g., 'EN')
 * @property {string} isoLanguage - ISO language code (e.g., 'en')
 * @property {string} codepage - Client codepage
 * @property {string} partnerCodepage - Partner system codepage
 * @property {string} rfcRole - RFC role ('C' for client, 'S' for server)
 * @property {string} type - Connection type
 * @property {string} partnerType - Partner system type
 * @property {string} rel - SAP release version
 * @property {string} partnerRel - Partner system release
 * @property {string} kernelRel - Kernel release version
 * @property {string} cpicConvId - CPIC conversation ID
 * @property {string} progName - Program name
 * @property {string} partnerBytesPerChar - Partner bytes per character
 * @property {string} partnerSystemCodepage - Partner system codepage
 * @property {string} partnerIP - Partner IPv4 address
 * @property {string} partnerIPv6 - Partner IPv6 address
 */
interface RfcConnectionInfo {
    dest: string;
    host: string;
    partnerHost: string;
    sysNumber: string;
    sysId: string;
    client: string;
    user: string;
    language: string;
    trace: string;
    isoLanguage: string;
    codepage: string;
    partnerCodepage: string;
    rfcRole: string;
    type: string;
    partnerType: string;
    rel: string;
    partnerRel: string;
    kernelRel: string;
    cpicConvId: string;
    progName: string;
    partnerBytesPerChar: string;
    partnerSystemCodepage: string;
    partnerIP: string;
    partnerIPv6: string;
    //reserved: string;
}

/**
 * Configuration object combining connection parameters and client options.
 *
 * @typedef {Object} RfcClientConfig
 * @property {RfcConnectionParameters} connectionParameters - SAP connection parameters
 * @property {RfcClientOptions} [clientOptions] - Optional client behavior configuration
 */
export type RfcClientConfig = {
    connectionParameters: RfcConnectionParameters;
    clientOptions?: RfcClientOptions;
};

/* eslint-disable @typescript-eslint/no-misused-new */
export interface RfcClientBinding {
    new (
        connectionParameters: RfcConnectionParameters,
        clientOptions?: RfcClientOptions
    ): RfcClientBinding;
    (
        connectionParameters: RfcConnectionParameters,
        options?: RfcClientOptions
    ): RfcClientBinding;
    _id: number;
    _alive: boolean;
    _connectionHandle: number;
    _pool_id: number;
    _config: RfcClientConfig;
    connectionInfo(): RfcConnectionInfo;
    open(callback: Function): void;
    close(callback: Function): void;
    resetServerContext(callback: Function): void;
    ping(callback: Function): void;
    cancel(callback: Function): void;
    invoke(
        rfmName: string,
        rfmParams: RfcObject,
        callback: Function,
        callOptions?: RfcCallOptions
    ): void;
    release(oneClientBinding: [RfcClientBinding], callback: Function): void;
}

/**
 * RFC Client for direct or managed connections to SAP systems.
 *
 * The Client class provides both callback and Promise-based APIs for interacting
 * with SAP systems via RFC (Remote Function Call). It supports direct connections
 * and managed connections from connection pools.
 *
 * @class Client
 *
 * @example
 * // Direct connection with promises
 * const client = new Client({
 *   ashost: '10.68.110.51',
 *   sysnr: '00',
 *   user: 'demo',
 *   passwd: 'welcome',
 *   client: '620',
 *   lang: 'EN'
 * });
 *
 * await client.open();
 * const result = await client.call('STFC_CONNECTION', { REQUTEXT: 'Hello SAP' });
 * console.log(result.ECHOTEXT);
 * await client.close();
 *
 * @example
 * // Using callbacks
 * const client = new Client(connectionParams);
 * client.open((err) => {
 *   if (err) return console.error(err);
 *   client.call('RFC_FUNCTION', params, (err, result) => {
 *     if (err) return console.error(err);
 *     console.log(result);
 *     client.close();
 *   });
 * });
 *
 * @example
 * // With client options
 * const client = new Client(connectionParams, {
 *   stateless: true,
 *   timeout: 10,
 *   filter: RfcParameterDirection.RFC_EXPORT
 * });
 */
export class Client {
    private __client: RfcClientBinding;

    /**
     * Creates a new RFC Client instance.
     *
     * @constructor
     * @param {RfcClientBinding | RfcConnectionParameters} arg1 - Either connection parameters for a new client
     *   or an existing RfcClientBinding (typically from a pool)
     * @param {RfcClientOptions} [clientOptions] - Optional client configuration
     * @throws {TypeError} If no argument is provided or if a pooled client binding is passed with options
     *
     * @example
     * // Direct connection
     * const client = new Client({
     *   ashost: 'server.example.com',
     *   sysnr: '00',
     *   user: 'USERNAME',
     *   passwd: 'PASSWORD',
     *   client: '100',
     *   lang: 'EN'
     * });
     *
     * @example
     * // With options
     * const client = new Client(connectionParams, {
     *   stateless: true,
     *   timeout: 30
     * });
     */
    constructor(
        arg1: RfcClientBinding | RfcConnectionParameters,
        clientOptions?: RfcClientOptions
    ) {
        if (arg1 === undefined) {
            throw new TypeError(`Client constructor requires an argument`);
        }
        if (arg1["_pool_id"] !== undefined && arg1["_pool_id"] > 0) {
            this.__client = arg1 as RfcClientBinding;
        } else {
            this.__client = clientOptions
                ? new noderfc_binding.Client(
                      arg1 as RfcConnectionParameters,
                      clientOptions
                  )
                : new noderfc_binding.Client(arg1 as RfcConnectionParameters);
        }
    }

    /**
     * Gets the global node-rfc environment information (static accessor).
     *
     * @static
     * @returns {NodeRfcEnvironment} Global environment configuration including platform and RFC SDK version
     */
    static get environment(): NodeRfcEnvironment {
        return environment;
    }

    /**
     * Gets the node-rfc environment information.
     *
     * @returns {NodeRfcEnvironment} Environment configuration
     */
    get environment(): NodeRfcEnvironment {
        return environment;
    }

    /**
     * Gets the underlying C++ binding instance.
     *
     * @returns {RfcClientBinding} Native RFC client binding
     */
    get binding(): RfcClientBinding {
        return this.__client;
    }

    /**
     * Gets the unique client instance ID.
     *
     * @returns {number} Client ID
     */
    get id(): number {
        return this.__client._id;
    }

    /**
     * Checks if the client connection is currently active.
     *
     * @returns {boolean} True if connection is alive, false otherwise
     */
    get alive(): boolean {
        return this.__client._alive;
    }

    /**
     * Gets the RFC connection handle.
     *
     * @returns {number} Connection handle (0 if not connected)
     */
    get connectionHandle(): number {
        return this.__client._connectionHandle;
    }

    /**
     * Gets the pool ID if this client is managed by a connection pool.
     *
     * @returns {number} Pool ID (0 if direct connection)
     */
    get pool_id(): number {
        return this.__client._pool_id;
    }

    /**
     * Gets the client configuration.
     *
     * @returns {RfcClientConfig} Configuration object with connection parameters and options
     */
    get config(): RfcClientConfig {
        return this.__client._config;
    }

    /**
     * Gets a formatted string representation of the client ID.
     *
     * @returns {string} Formatted ID string including handle and pool info
     * @example
     * // Returns: "42 handle: 12345 [d]" for direct connection
     * // Returns: "42 handle: 12345 [m] pool: 1" for pooled connection
     */
    get _id(): string {
        return `${this.__client._id} handle: ${
            this.__client._connectionHandle
        } ${
            this.__client._pool_id
                ? `[m] pool: ${this.__client._pool_id} `
                : "[d]"
        }`;
    }

    /**
     * Gets detailed connection information from the SAP system.
     *
     * @returns {RfcConnectionInfo} Detailed connection properties
     * @throws {Error} If connection is not open
     */
    get connectionInfo(): RfcConnectionInfo {
        return this.__client.connectionInfo();
    }

    /**
     * @private
     * Validates callback argument type.
     *
     * @param {string} method - Method name for error message
     * @param {Function} [callback] - Callback to validate
     * @throws {TypeError} If callback is provided but not a function
     */
    static checkCallbackArg(method: string, callback?: Function) {
        if (callback !== undefined && typeof callback !== "function") {
            throw new TypeError(
                `Client ${method}() argument, if provided, must be a Function. Received: ${typeof callback}`
            );
        }
    }

    /**
     * Opens a connection to the SAP system (backwards compatibility alias for open()).
     *
     * @deprecated Use open() instead
     * @param {Function} [callback] - Optional callback(error). Omit for promise-based usage.
     * @returns {void | Promise<Client>} Returns promise if no callback provided, otherwise void
     * @throws {TypeError} If callback is provided but not a function
     *
     * @example
     * // Callback style
     * client.connect((err) => {
     *   if (err) console.error(err);
     *   else console.log('Connected');
     * });
     */
    // for backwards compatibility only, to be deprecated
    connect(callback?: Function): void | Promise<Client> {
        Client.checkCallbackArg("connect", callback);
        return this.open(callback);
    }

    /**
     * Opens a connection to the SAP system.
     *
     * Establishes the RFC connection using the parameters provided during construction.
     * Supports both callback and promise-based usage patterns.
     *
     * @param {Function} [callback] - Optional callback(error). Omit for promise-based usage.
     * @returns {void | Promise<Client>} Returns promise resolving to Client if no callback,
     *   otherwise void. Promise rejects on error.
     * @throws {TypeError} If callback is provided but not a function
     *
     * @example
     * // Promise style
     * try {
     *   await client.open();
     *   console.log('Connected to SAP');
     * } catch (err) {
     *   console.error('Connection failed:', err);
     * }
     *
     * @example
     * // Callback style
     * client.open((err) => {
     *   if (err) return console.error('Connection failed:', err);
     *   console.log('Connected to SAP');
     * });
     */
    open(callback?: Function): void | Promise<Client> {
        Client.checkCallbackArg("open", callback);
        if (typeof callback === "function") {
            try {
                this.__client.open(callback);
            } catch (ex) {
                callback(ex);
            }
        } else {
            return new Promise((resolve, reject) => {
                try {
                    this.__client.open((err: unknown) => {
                        if (err !== undefined) {
                            reject(err);
                        } else {
                            resolve(this);
                        }
                    });
                } catch (ex) {
                    reject(ex);
                }
            });
        }
    }

    /**
     * Pings the SAP system to test connection health.
     *
     * Sends a lightweight RFC ping to verify the connection is alive and responsive.
     * This is useful for connection health checks and keep-alive mechanisms.
     *
     * @param {Function} [callback] - Optional callback(error, result). Omit for promise-based usage.
     * @returns {void | Promise<boolean>} Returns promise resolving to true if no callback,
     *   otherwise void. Promise rejects on error.
     * @throws {TypeError} If callback is provided but not a function
     *
     * @example
     * // Promise style
     * const isAlive = await client.ping();
     * console.log('Connection alive:', isAlive);
     *
     * @example
     * // Callback style
     * client.ping((err, result) => {
     *   if (err) console.error('Ping failed:', err);
     *   else console.log('Ping successful:', result);
     * });
     */
    ping(callback?: Function): void | Promise<boolean> {
        Client.checkCallbackArg("ping", callback);

        if (typeof callback === "function") {
            try {
                this.__client.ping(callback);
            } catch (ex) {
                callback(ex);
            }
        } else {
            return new Promise((resolve, reject) => {
                try {
                    this.__client.ping((err: unknown, res: boolean) => {
                        if (err === undefined) {
                            resolve(res);
                        } else {
                            reject(err);
                        }
                    });
                } catch (ex) {
                    reject(ex);
                }
            });
        }
    }

    /**
     * Closes the RFC connection to the SAP system.
     *
     * Gracefully terminates the connection and releases associated resources.
     * For pooled clients, use Pool.release() instead of calling close() directly.
     *
     * @param {Function} [callback] - Optional callback(error). Omit for promise-based usage.
     * @returns {void | Promise<void>} Returns promise resolving when closed if no callback,
     *   otherwise void. Promise rejects on error.
     * @throws {TypeError} If callback is provided but not a function
     *
     * @example
     * // Promise style
     * await client.close();
     * console.log('Connection closed');
     *
     * @example
     * // Callback style
     * client.close((err) => {
     *   if (err) console.error('Error closing:', err);
     *   else console.log('Connection closed');
     * });
     */
    close(callback?: Function): void | Promise<void> {
        Client.checkCallbackArg("close", callback);

        if (typeof callback === "function") {
            try {
                this.__client.close(callback);
            } catch (ex) {
                callback(ex);
            }
        } else {
            return new Promise((resolve, reject) => {
                try {
                    this.__client.close((err: unknown) => {
                        if (err === undefined) {
                            resolve();
                        } else {
                            reject(err);
                        }
                    });
                } catch (ex) {
                    reject(ex);
                }
            });
        }
    }

    /**
     * Cancels the currently running RFC call.
     *
     * Attempts to cancel an ongoing RFC operation. This is useful for terminating
     * long-running operations or handling user-initiated cancellations.
     *
     * @param {Function} [callback] - Optional callback(error). Omit for promise-based usage.
     * @returns {void | Promise<void>} Returns promise resolving when cancelled if no callback,
     *   otherwise void. Promise rejects on error.
     * @throws {TypeError} If callback is provided but not a function
     *
     * @example
     * // Promise style
     * await client.cancel();
     * console.log('Call cancelled');
     *
     * @example
     * // Using the global cancelClient function
     * import { cancelClient } from 'node-rfc';
     * await cancelClient(client);
     */
    cancel(callback?: Function): void | Promise<void> {
        Client.checkCallbackArg("cancel", callback);

        if (typeof callback === "function") {
            try {
                this.__client.cancel(callback);
            } catch (ex) {
                callback(ex);
            }
        } else {
            return new Promise((resolve, reject) => {
                try {
                    this.__client.cancel((err: unknown) => {
                        if (err === undefined) {
                            resolve();
                        } else {
                            reject(err);
                        }
                    });
                } catch (ex) {
                    reject(ex);
                }
            });
        }
    }

    /**
     * Resets the server context for stateful connections.
     *
     * Clears the server-side user context, effectively resetting the session state
     * while keeping the connection alive. This is useful for multi-user scenarios
     * where you want to reuse a connection without closing it.
     *
     * @param {Function} [callback] - Optional callback(error). Omit for promise-based usage.
     * @returns {void | Promise<void>} Returns promise resolving when reset if no callback,
     *   otherwise void. Promise rejects on error.
     * @throws {TypeError} If callback is provided but not a function
     *
     * @example
     * // Promise style
     * await client.resetServerContext();
     * console.log('Server context reset');
     */
    resetServerContext(callback?: Function): void | Promise<void> {
        Client.checkCallbackArg("resetServerContext", callback);

        if (typeof callback === "function") {
            try {
                this.__client.resetServerContext(callback);
            } catch (ex) {
                callback(ex);
            }
        } else {
            return new Promise((resolve, reject) => {
                try {
                    this.__client.resetServerContext((err: unknown) => {
                        if (err === undefined) {
                            resolve();
                        } else {
                            reject(err);
                        }
                    });
                } catch (ex) {
                    reject(ex);
                }
            });
        }
    }

    /**
     * Releases a pooled client back to its connection pool.
     *
     * Returns this client instance to the pool for reuse. Only applicable for
     * clients obtained from a Pool via acquire(). For direct connections, use close() instead.
     *
     * @param {Function} [callback] - Optional callback(error). Omit for promise-based usage.
     * @returns {void | Promise<void>} Returns promise resolving when released if no callback,
     *   otherwise void. Promise rejects on error.
     * @throws {TypeError} If callback is provided but not a function
     *
     * @example
     * // Promise style with pool
     * const pool = new Pool(poolConfig);
     * const client = await pool.acquire();
     * await client.call('RFC_FUNCTION', params);
     * await client.release(); // Return to pool
     *
     * @see Pool.release() for the preferred method of releasing pooled clients
     */
    release(callback?: Function): void | Promise<void> {
        Client.checkCallbackArg("release");

        if (typeof callback === "function") {
            try {
                this.__client.release([this.__client], callback);
            } catch (ex) {
                callback(ex);
            }
        } else {
            return new Promise((resolve, reject) => {
                try {
                    this.__client.release([this.__client], (err: unknown) => {
                        if (err === undefined) {
                            resolve();
                        } else {
                            reject(err);
                        }
                    });
                } catch (ex) {
                    reject(ex);
                }
            });
        }
    }

    /**
     * Invokes an RFC function module on the SAP system.
     *
     * Executes a remote function call with the specified parameters and returns the result.
     * This is the primary method for interacting with SAP business logic. The connection
     * must be open before calling this method.
     *
     * @param {string} rfmName - Name of the RFC function module to call (e.g., 'STFC_CONNECTION')
     * @param {RfcObject} rfmParams - Input parameters as key-value pairs matching the function signature
     * @param {RfcCallOptions} [callOptions={}] - Optional call configuration (timeout, notRequested params)
     * @returns {Promise<RfcObject>} Promise resolving to the function result containing export,
     *   changing, and table parameters
     * @throws {TypeError} If required arguments are missing or invalid
     * @throws {Error} If RFC call fails (connection issues, ABAP exceptions, etc.)
     *
     * @example
     * // Simple RFC call
     * const result = await client.call('STFC_CONNECTION', {
     *   REQUTEXT: 'Hello SAP from Node.js'
     * });
     * console.log('Echo:', result.ECHOTEXT);
     * console.log('Response:', result.RESPTEXT);
     *
     * @example
     * // With call options
     * const result = await client.call('BAPI_USER_GET_DETAIL', {
     *   USERNAME: 'DEMO_USER'
     * }, {
     *   timeout: 30,
     *   notRequested: ['LARGE_TABLE', 'UNUSED_PARAM']
     * });
     *
     * @example
     * // Complex parameters with structures and tables
     * const result = await client.call('RFC_READ_TABLE', {
     *   QUERY_TABLE: 'MARA',
     *   DELIMITER: '|',
     *   FIELDS: [
     *     { FIELDNAME: 'MATNR' },
     *     { FIELDNAME: 'MAKTX' }
     *   ],
     *   OPTIONS: [
     *     { TEXT: "MATNR LIKE '000000000000%'" }
     *   ],
     *   ROWCOUNT: 10
     * });
     * console.log('Data:', result.DATA);
     */
    call(
        rfmName: string,
        rfmParams: RfcObject,
        callOptions: RfcCallOptions = {}
    ): Promise<RfcObject> {
        return new Promise(
            (
                resolve: (arg0: RfcObject) => void,
                reject: (arg0: TypeError) => void
            ) => {
                if (arguments.length < 2) {
                    reject(
                        new TypeError(
                            "Please provide remote function module name and parameters as arguments"
                        )
                    );
                }

                if (typeof rfmName !== "string") {
                    reject(
                        new TypeError(
                            "First argument (remote function module name) must be an string"
                        )
                    );
                }

                if (typeof rfmParams !== "object") {
                    reject(
                        new TypeError(
                            "Second argument (remote function module parameters) must be an object"
                        )
                    );
                }

                if (
                    callOptions !== undefined &&
                    typeof callOptions !== "object"
                ) {
                    reject(
                        new TypeError("Call options argument must be an object")
                    );
                }
                try {
                    this.invoke(
                        rfmName,
                        rfmParams,
                        (err: unknown, res: RfcObject) => {
                            if (err !== undefined && err !== null) {
                                reject(err as TypeError);
                            } else {
                                resolve(res);
                            }
                        },
                        callOptions
                    );
                } catch (ex) {
                    reject(ex as TypeError);
                }
            }
        );
    }

    invoke(
        rfmName: string,
        rfmParams: RfcObject,
        callback: Function,
        callOptions?: RfcCallOptions
    ) {
        try {
            if (typeof callback !== "function") {
                throw new TypeError("Callback function must be supplied");
            }

            if (arguments.length < 3) {
                throw new TypeError(
                    "Client invoke() argument missing: RFM name, parameters or callback"
                );
            }

            if (typeof rfmName !== "string") {
                throw new TypeError(
                    "Client invoke() 1st argument (remote function module name) must be an string"
                );
            }

            if (typeof rfmParams !== "object") {
                throw new TypeError(
                    "Client invoke() 2nd argument (remote function module parameters) must be an object"
                );
            }

            if (arguments.length === 4 && typeof callOptions !== "object") {
                throw new TypeError("Call options argument must be an object");
            }

            const clientOptions = this.config.clientOptions;
            let timeout = 0,
                callbackFunction = callback;
            if (callOptions && callOptions.timeout) {
                timeout = callOptions.timeout;
            }
            if (timeout === 0 && clientOptions && clientOptions.timeout) {
                timeout = clientOptions.timeout;
            }
            if (timeout > 0) {
                const cancelTimeout = setTimeout(() => {
                    /* eslint-disable @typescript-eslint/no-unused-vars */
                    (this.cancel as Function)(
                        (_err: unknown, _res: unknown) => {
                            // _res like
                            // { connectionHandle: 140414048978432, result: 'cancelled' }
                        }
                    );
                }, timeout * 1000);
                callbackFunction = (err: unknown, res: unknown) => {
                    clearTimeout(cancelTimeout);
                    callback(err, res);
                };
            }

            // check rfm parmeters' names
            for (const rfmParamName of Object.keys(rfmParams)) {
                if (rfmParamName.length === 0)
                    throw new TypeError(
                        `Empty RFM parameter name when calling "${rfmName}"`
                    );
                if (!rfmParamName.match(/^[a-zA-Z0-9_]*$/))
                    throw new TypeError(
                        `RFM parameter name invalid: "${rfmParamName}" when calling "${rfmName}"`
                    );
            }

            this.__client.invoke(
                rfmName,
                rfmParams,
                callbackFunction,
                callOptions
            );
        } catch (ex) {
            if (typeof callback !== "function") {
                throw ex;
            } else {
                callback(ex);
            }
        }
    }
}
