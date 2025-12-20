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
    RFC_RC,
    RFC_UNIT_STATE,
} from "./sapnwrfc";

//
// RfcServer
//

/**
 * Security attributes provided by the calling SAP system during authentication.
 *
 * @typedef {Object} RfcSecurityAttributes
 * @property {string} abapFunctionName - Name of the ABAP function being called (max 30 chars)
 * @property {string} sysId - Calling system ID
 * @property {string} client - Client number (max 3 chars)
 * @property {string} user - Username
 * @property {string} progName - Program name
 * @property {string} sncName - Secure Network Communication name
 * @property {string} ssoTicket - Single Sign-On ticket
 * @property {string} sncAclKey - SNC Access Control List key
 * @property {number} sncAclKeyLength - Length of SNC ACL key
 */
export type RfcSecurityAttributes = {
    abapFunctionName: string[30];
    sysId: string;
    client: string[3];
    user: string;
    progName: string;
    sncName: string;
    ssoTicket: string;
    sncAclKey: string;
    sncAclKeyLength: number;
};

/**
 * Return type for RFC authentication handlers.
 *
 * @typedef {undefined | RFC_RC.RFC_OK | boolean | string} RfcAuthHandlerResponse
 * - undefined or RFC_RC.RFC_OK or true: Authentication succeeds
 * - false: Authentication fails
 * - string: Authentication fails with custom error message
 */
export type RfcAuthHandlerResponse =
    | undefined
    | RFC_RC.RFC_OK
    | boolean
    | string;

/**
 * Authentication handler callback for validating incoming RFC requests.
 *
 * @callback RfcAuthHandler
 * @param {RfcSecurityAttributes} securityAttributes - Security information from the calling system
 * @param {...unknown} args - Additional optional arguments
 * @returns {RfcAuthHandlerResponse | Promise<RfcAuthHandlerResponse>} Authentication result
 *
 * @example
 * const authHandler = async (securityAttributes) => {
 *   console.log(`Auth request from user: ${securityAttributes.user}`);
 *   if (securityAttributes.user === 'ALLOWED_USER') {
 *     return true; // Allow
 *   }
 *   return 'User not authorized'; // Deny with message
 * };
 */
export type RfcAuthHandler = (
    securityAttributes: RfcSecurityAttributes,
    ...[unknown]
) => RfcAuthHandlerResponse | Promise<RfcAuthHandlerResponse>;

export type RfcUnitIdentifier = {
    queued: boolean;
    id: string;
};

export type RfcBgRfcHandler = (
    connHandle: number,
    unitIdentifier: RfcUnitIdentifier
) => RFC_RC | Promise<RFC_RC>;

export type RfcBgRfcHandlerGetState = (
    connHandle: number,
    unitIdentifier: RfcUnitIdentifier
) => RFC_UNIT_STATE | Promise<RFC_UNIT_STATE>;

export type RfcBgRfcHandlers = {
    check?: RfcBgRfcHandler;
    commit?: RfcBgRfcHandler;
    rollback?: RfcBgRfcHandler;
    confirm?: RfcBgRfcHandler;
    getState?: RfcBgRfcHandlerGetState;
};

export type RfcServerOptions = {
    logLevel?: RfcLoggingLevel;
    port?: number;
    authHandler?: RfcAuthHandler;
    bgRfcHandlers?: RfcBgRfcHandlers;
};

export type RfcServerConfiguration = {
    serverConnection: RfcConnectionParameters;
    clientConnection: RfcConnectionParameters;
    serverOptions?: RfcServerOptions;
};

/* eslint-disable @typescript-eslint/no-misused-new */
export interface RfcServerBinding {
    new (serverConfiguration: RfcServerConfiguration): RfcServerBinding;
    (serverConfiguration: RfcServerConfiguration): RfcServerBinding;
    _id: number;
    _alive: boolean;
    _server_conn_handle: number;
    _client_conn_handle: number;
    start(callback?: Function): void;
    stop(callback?: Function): void;
    addFunction(
        abapFunctionName: string,
        jsFunction: Function,
        callback?: Function
    ): void;
    removeFunction(abapFunctionName: string, callback?: Function): void;
    getFunctionDescription(rfmName: string, callback?: Function): void;
}

/**
 * RFC Server for accepting incoming RFC calls from SAP systems.
 *
 * The Server class allows Node.js applications to act as RFC servers, receiving
 * and processing function calls from ABAP systems. It supports authentication handlers,
 * background RFC (bgRFC) processing, and dynamic function registration.
 *
 * @class Server
 *
 * @example
 * // Basic RFC server setup
 * const server = new Server({
 *   serverConnection: {
 *     gwhost: 'gateway.example.com',
 *     gwserv: '3300',
 *     tpname: 'NODE_RFC_SERVER',
 *     program_id: 'NODE_SERVER'
 *   },
 *   clientConnection: {
 *     ashost: '10.68.110.51',
 *     sysnr: '00',
 *     user: 'demo',
 *     passwd: 'welcome',
 *     client: '620',
 *     lang: 'EN'
 *   }
 * });
 *
 * @example
 * // Register function handlers
 * await server.addFunction('STFC_CONNECTION', async (request) => {
 *   console.log('Request:', request.REQUTEXT);
 *   return {
 *     ECHOTEXT: request.REQUTEXT,
 *     RESPTEXT: 'Hello from Node.js RFC Server'
 *   };
 * });
 *
 * await server.start();
 * console.log('RFC server running...');
 *
 * @example
 * // With authentication handler
 * const server = new Server({
 *   serverConnection: serverParams,
 *   clientConnection: clientParams,
 *   serverOptions: {
 *     authHandler: async (secAttrs) => {
 *       return secAttrs.user === 'ALLOWED_USER';
 *     }
 *   }
 * });
 */
export class Server {
    private __server: RfcServerBinding;

    constructor(serverConfiguration: RfcServerConfiguration) {
        this.__server = new noderfc_binding.Server({
            serverConnection: serverConfiguration.serverConnection,
            clientConnection: serverConfiguration.clientConnection,
            serverOptions: serverConfiguration.serverOptions || {},
        });
    }

    start(callback?: Function): void | Promise<void> {
        if (typeof callback === "function") {
            return this.__server.start(callback);
        }

        return new Promise((resolve, reject) => {
            this.__server.start((err: unknown) => {
                if (err === undefined) {
                    resolve();
                } else {
                    reject(err);
                }
            });
        });
    }

    stop(callback?: Function): void | Promise<void> {
        if (typeof callback === "function") {
            return this.__server.stop(callback);
        }

        return new Promise((resolve, reject) => {
            this.__server.stop((err: unknown) => {
                if (err === undefined) {
                    resolve();
                } else {
                    reject(err);
                }
            });
        });
    }

    addFunction(
        abapFunctionName: string,
        jsFunction: Function,
        callback?: Function
    ): void | Promise<void> {
        if (typeof callback === "function") {
            return this.__server.addFunction(
                abapFunctionName,
                jsFunction,
                callback
            );
        }

        return new Promise((resolve, reject) => {
            this.__server.addFunction(
                abapFunctionName,
                jsFunction,
                (err: unknown) => {
                    if (err === undefined) {
                        resolve();
                    } else {
                        reject(err);
                    }
                }
            );
        });
    }

    removeFunction(
        abapFunctionName: string,
        callback?: Function
    ): void | Promise<void> {
        if (typeof callback === "function") {
            return this.__server.removeFunction(abapFunctionName, callback);
        }

        return new Promise((resolve, reject) => {
            this.__server.removeFunction(abapFunctionName, (err: unknown) => {
                if (err === undefined) {
                    resolve();
                } else {
                    reject(err);
                }
            });
        });
    }

    getFunctionDescription(rfmName: string, callback?: Function) {
        if (typeof callback === "function") {
            return this.__server.getFunctionDescription(rfmName, callback);
        }

        return new Promise((resolve, reject) => {
            this.__server.getFunctionDescription(
                rfmName,
                (err: unknown, rfmFunctionDescription: object) => {
                    if (err === undefined) {
                        resolve(rfmFunctionDescription);
                    } else {
                        reject(err);
                    }
                }
            );
        });
    }

    static get environment(): NodeRfcEnvironment {
        return environment;
    }

    get environment(): NodeRfcEnvironment {
        return environment;
    }

    get binding(): RfcServerBinding {
        return this.__server;
    }

    get id(): number {
        return this.__server._id;
    }

    get alive(): boolean {
        return this.__server._alive;
    }

    get server_connection(): number {
        return this.__server._server_conn_handle;
    }

    get client_connection(): number {
        return this.__server._client_conn_handle;
    }
}
