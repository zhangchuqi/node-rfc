/// <reference types="node" />

// SPDX-FileCopyrightText: 2014 SAP SE Srdjan Boskovic <srdjan.boskovic@sap.com>
//
// SPDX-License-Identifier: Apache-2.0

import { EventEmitter } from "events";
import { Client } from "./sapnwrfc-client";

import fs from "fs";
import path from "path";

export * from "./noderfc-bindings";
export * from "./sapnwrfc-client";
export * from "./sapnwrfc-pool";
export * from "./sapnwrfc-throughput";
export * from "./sapnwrfc-server";
export * from "./sapnwrfc";

import { noderfc_binding } from "./noderfc-bindings";

//
// Addon functions
//

/**
 * Sets the directory containing the sapnwrfc.ini configuration file.
 *
 * The sapnwrfc.ini file can contain RFC destination definitions and other
 * SAP NetWeaver RFC SDK configuration settings.
 *
 * @param {string} iniFileDirectory - Absolute path to directory containing sapnwrfc.ini
 * @throws {Error} If sapnwrfc.ini is not found in the specified directory
 *
 * @example
 * import { setIniFileDirectory } from 'node-rfc';
 * setIniFileDirectory('/etc/sap');
 */
export function setIniFileDirectory(iniFileDirectory: string) {
    const fullPath = path.join(iniFileDirectory, "sapnwrfc.ini");
    if (!fs.existsSync(fullPath)) {
        throw new Error(`sapnwrfc.ini not found in: ${iniFileDirectory}`);
    }
    noderfc_binding.setIniFileDirectory(iniFileDirectory);
}

/**
 * Reloads the sapnwrfc.ini configuration file.
 *
 * Forces the RFC SDK to re-read the INI file, useful for picking up
 * configuration changes without restarting the application.
 *
 * @throws {Error} If reload fails or INI file has errors
 *
 * @example
 * import { reloadIniFile } from 'node-rfc';
 * reloadIniFile();
 */
export function reloadIniFile() {
    const err = noderfc_binding.reloadIniFile();
    if (err && err.message) {
        throw new Error(err.message);
    }
}

/**
 * Loads the SAP cryptographic library for SNC (Secure Network Communication).
 *
 * Required for establishing encrypted RFC connections using SNC. The crypto
 * library (e.g., libsapcrypto.so or sapcrypto.dll) must be obtained from SAP.
 *
 * @param {string} libAbsolutePath - Absolute path to the SAP crypto library file
 * @throws {Error} If crypto library file is not found
 *
 * @example
 * import { loadCryptoLibrary } from 'node-rfc';
 * loadCryptoLibrary('/usr/local/sap/libsapcrypto.so');
 */
export function loadCryptoLibrary(libAbsolutePath: string) {
    if (!fs.existsSync(libAbsolutePath)) {
        throw new Error(`Crypto library not found: ${libAbsolutePath}`);
    }
    noderfc_binding.loadCryptoLibrary(libAbsolutePath);
}

/**
 * Sets the path for RFC SDK log file output.
 *
 * Enables RFC SDK trace logging to the specified file for debugging
 * connection and protocol issues.
 *
 * @param {string} filePath - Absolute path where log file should be created
 *
 * @example
 * import { setLogFilePath } from 'node-rfc';
 * setLogFilePath('/var/log/rfc-trace.log');
 */
export function setLogFilePath(filePath: string) {
    noderfc_binding.setLogFilePath(filePath);
}

/**
 * Global event emitter for node-rfc library events.
 *
 * @type {EventEmitter}
 * @example
 * import { sapnwrfcEvents } from 'node-rfc';
 * sapnwrfcEvents.on('error', (err) => console.error('RFC Error:', err));
 */
export const sapnwrfcEvents = new EventEmitter();

/**
 * Cancels an ongoing RFC operation on the specified client.
 *
 * Convenience function for cancelling RFC calls. Equivalent to calling
 * client.cancel() directly.
 *
 * @param {Client} client - The RFC client instance with an active operation
 * @param {Function} [callback] - Optional callback(error). Omit for promise-based usage.
 * @returns {void | Promise<void>} Returns promise if no callback, otherwise void
 * @throws {TypeError} If callback is provided but not a function
 *
 * @example
 * // Promise style
 * import { cancelClient } from 'node-rfc';
 * await cancelClient(client);
 *
 * @example
 * // Callback style
 * cancelClient(client, (err) => {
 *   if (err) console.error('Cancel failed:', err);
 * });
 */
export function cancelClient(
    client: Client,
    callback?: Function
): void | Promise<void> {
    if (callback !== undefined && typeof callback !== "function") {
        throw new TypeError(
            `cancelClient 2nd argument, if provided, must be a Function. Received: ${typeof callback}`
        );
    }
    return client.cancel(callback);
}

/**
 * Converts an ISO 639-1 language code to SAP language code.
 *
 * @param {string} langIso - ISO language code (e.g., 'en', 'de', 'zh')
 * @returns {string} SAP language code (e.g., 'E', 'D', '1')
 * @throws {Error} If ISO language code is not recognized
 *
 * @example
 * import { languageIsoToSap } from 'node-rfc';
 * const sapLang = languageIsoToSap('en'); // Returns 'E'
 * const germanSap = languageIsoToSap('de'); // Returns 'D'
 */
export function languageIsoToSap(langIso: string): string {
    const langSap = noderfc_binding.languageIsoToSap(langIso);
    if (typeof langSap === "string") {
        return langSap;
    }
    throw new Error(`Language ISO code not found: ${langIso}`);
}

/**
 * Converts an SAP language code to ISO 639-1 language code.
 *
 * @param {string} langSap - SAP language code (e.g., 'E', 'D', '1')
 * @returns {string} ISO language code (e.g., 'en', 'de', 'zh')
 * @throws {Error} If SAP language code is not recognized
 *
 * @example
 * import { languageSapToIso } from 'node-rfc';
 * const isoLang = languageSapToIso('E'); // Returns 'en'
 * const chineseIso = languageSapToIso('1'); // Returns 'zh'
 */
export function languageSapToIso(langSap: string): string {
    const langIso = noderfc_binding.languageSapToIso(langSap);
    if (typeof langIso === "string") {
        return langIso;
    }
    throw new Error(`Language SAP code not found: ${langSap}`);
}
