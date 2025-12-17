import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSAPConnection } from '@/lib/sap-client';
import { Client, Pool } from 'node-rfc';

/**
 * Get RFC function metadata
 * POST /api/sap/metadata
 * Body: { connectionId: string, functionName: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { connectionId, functionName } = await request.json();

    if (!connectionId || !functionName) {
      return NextResponse.json(
        { error: 'Missing connectionId or functionName' },
        { status: 400 }
      );
    }

    // Get connection from database
    const connection = await prisma.sAPConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    // Get SAP connection
    const sapConnection = await getSAPConnection(connection);
    let client: Client | undefined;
    let shouldReleaseClient = false;

    try {
      // Get client instance
      if (sapConnection instanceof Client) {
        if (!sapConnection.alive) {
          await sapConnection.open();
        }
        client = sapConnection;
      } else {
        const acquiredClient = await sapConnection.acquire();
        if (acquiredClient) {
          client = Array.isArray(acquiredClient) ? acquiredClient[0] : acquiredClient;
          shouldReleaseClient = true;
        } else {
          throw new Error('Failed to acquire client from pool');
        }
      }

      // Get function interface using RFC_GET_FUNCTION_INTERFACE
      const metadata = await client.call('RFC_GET_FUNCTION_INTERFACE', {
        FUNCNAME: functionName
      }) as any;


      // Build parameter template grouped by type
      const groupedParameters: any = {
        import: {},
        export: {},
        changing: {},
        tables: {}
      };
      
      // Store field metadata for UI hints
      const fieldMetadata: any = {};
      
      // Process PARAMS (contains all parameter types)
      if (metadata.PARAMS && Array.isArray(metadata.PARAMS)) {
        // Debug: Check what fields are available in PARAMS
        if (metadata.PARAMS[0]) {
          console.log('\n=== Sample PARAMS entry ===');
          console.log(JSON.stringify(metadata.PARAMS[0], null, 2));
          console.log('Available PARAMS keys:', Object.keys(metadata.PARAMS[0]));
          console.log('===\n');
        }
        
        for (const param of metadata.PARAMS) {
          const paramName = (param as any).PARAMETER;
          const paramClass = (param as any).PARAMCLASS; // 'I'=Import, 'E'=Export, 'T'=Table, 'C'=Changing
          const isOptional = (param as any).OPTIONAL === 'X'; // 'X'=optional, ' '=required
          
          let targetGroup: string | null = null;
          if (paramClass === 'I') {
            targetGroup = 'import';
          } else if (paramClass === 'E') {
            targetGroup = 'export';
          } else if (paramClass === 'T') {
            targetGroup = 'tables';
          } else if (paramClass === 'C') {
            targetGroup = 'changing';
          }
          
          if (targetGroup) {
            if ((param as any).TABNAME) {
              // It's a structure or table - get structure details
              try {
                const structInfo = await client.call('DDIF_FIELDINFO_GET', {
                  TABNAME: (param as any).TABNAME,
                  LANGU: 'E'
                }) as any;
                
                if (structInfo.DFIES_TAB && Array.isArray(structInfo.DFIES_TAB) && structInfo.DFIES_TAB.length > 0) {
                  // Debug: Print complete field metadata to see what's available
                  if (structInfo.DFIES_TAB[0]) {
                    console.log(`\n=== Complete field metadata from ${(param as any).TABNAME} ===`);
                    console.log(JSON.stringify(structInfo.DFIES_TAB[0], null, 2));
                    console.log('Available keys:', Object.keys(structInfo.DFIES_TAB[0]));
                    console.log("===\n");
                  }
                  
                  // Store field metadata
                  fieldMetadata[paramName] = {
                    required: !isOptional,
                    type: paramClass === 'T' ? 'table' : 'structure',
                    fields: extractFieldMetadata(structInfo.DFIES_TAB)
                  };
                  
                  if (paramClass === 'T') {
                    // Table parameter
                    groupedParameters[targetGroup][paramName] = [buildStructureFromFields(structInfo.DFIES_TAB)];
                  } else {
                    // Structure parameter
                    groupedParameters[targetGroup][paramName] = buildStructureFromFields(structInfo.DFIES_TAB);
                  }
                } else {
                  fieldMetadata[paramName] = {
                    required: !isOptional,
                    type: paramClass === 'T' ? 'table' : 'structure',
                    fields: {}
                  };
                  groupedParameters[targetGroup][paramName] = paramClass === 'T' ? [{}] : {};
                }
              } catch (e) {
                fieldMetadata[paramName] = {
                  required: !isOptional,
                  type: paramClass === 'T' ? 'table' : 'structure',
                  fields: {}
                };
                groupedParameters[targetGroup][paramName] = paramClass === 'T' ? [{}] : {};
              }
            } else {
              // Simple parameter
              fieldMetadata[paramName] = {
                required: !isOptional,
                type: 'simple'
              };
              groupedParameters[targetGroup][paramName] = '';
            }
          }
        }
      }
      
      // Build flat parameter template for backward compatibility
      const parameterTemplate: any = {
        ...groupedParameters.import,
        ...groupedParameters.changing,
        ...groupedParameters.tables
      };
      
      // Legacy fallback: Process IMPORT parameters
      if (metadata.IMPORT && Array.isArray(metadata.IMPORT)) {
        for (const param of metadata.IMPORT) {
          const paramName = (param as any).PARAMETER || (param as any).PARAMTEXT;
          
          if ((param as any).TABNAME) {
            // It's a structure - get structure details
            try {
              const structInfo = await client.call('DDIF_FIELDINFO_GET', {
                TABNAME: (param as any).TABNAME,
                LANGU: 'E'
              }) as any;
              
              if (structInfo.DFIES_TAB && Array.isArray(structInfo.DFIES_TAB) && structInfo.DFIES_TAB.length > 0) {
                parameterTemplate[paramName] = buildStructureFromFields(structInfo.DFIES_TAB);
              } else {
                parameterTemplate[paramName] = {};
              }
            } catch (e) {
              // Fallback to empty object
              parameterTemplate[paramName] = {};
            }
          } else {
            // Simple parameter
            parameterTemplate[paramName] = '';
          }
        }
      }

      // Process TABLES parameters
      if (metadata.TABLES && Array.isArray(metadata.TABLES)) {
        for (const param of metadata.TABLES) {
          const paramName = (param as any).PARAMETER || (param as any).PARAMTEXT;
          
          if ((param as any).TABNAME) {
            try {
              const structInfo = await client.call('DDIF_FIELDINFO_GET', {
                TABNAME: (param as any).TABNAME,
                LANGU: 'E'
              }) as any;
              
              if (structInfo.DFIES_TAB && Array.isArray(structInfo.DFIES_TAB) && structInfo.DFIES_TAB.length > 0) {
                parameterTemplate[paramName] = [buildStructureFromFields(structInfo.DFIES_TAB)];
              } else {
                parameterTemplate[paramName] = [{}];
              }
            } catch (e) {
              parameterTemplate[paramName] = [{}];
            }
          } else {
            parameterTemplate[paramName] = [{}];
          }
        }
      }

      // Process CHANGING parameters
      if (metadata.CHANGING && Array.isArray(metadata.CHANGING)) {
        for (const param of metadata.CHANGING) {
          const paramName = (param as any).PARAMETER || (param as any).PARAMTEXT;
          
          if ((param as any).TABNAME) {
            try {
              const structInfo = await client.call('DDIF_FIELDINFO_GET', {
                TABNAME: (param as any).TABNAME,
                LANGU: 'E'
              }) as any;
              
              if (structInfo.DFIES_TAB && Array.isArray(structInfo.DFIES_TAB) && structInfo.DFIES_TAB.length > 0) {
                parameterTemplate[paramName] = buildStructureFromFields(structInfo.DFIES_TAB);
              } else {
                parameterTemplate[paramName] = {};
              }
            } catch (e) {
              parameterTemplate[paramName] = {};
            }
          } else {
            parameterTemplate[paramName] = '';
          }
        }
      }

      return NextResponse.json({
        metadata: {
          name: functionName,
          description: metadata.FUNCTEXT || '',
          import: metadata.IMPORT || [],
          export: metadata.EXPORT || [],
          changing: metadata.CHANGING || [],
          tables: metadata.TABLES || [],
          exceptions: metadata.EXCEPTION || []
        },
        groupedParameters,
        fieldMetadata,
        template: parameterTemplate,
        formattedTemplate: JSON.stringify(parameterTemplate, null, 2)
      });

    } finally {
      if (shouldReleaseClient && client && sapConnection instanceof Pool) {
        await sapConnection.release(client);
      }
    }

  } catch (error: any) {
    console.error('Error getting function metadata:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get function metadata',
        details: error.message,
        code: error.code,
        key: error.key
      },
      { status: 500 }
    );
  }
}

/**
 * Extract field metadata for UI hints
 */
function extractFieldMetadata(fields: any[]): any {
  const metadata: any = {};
  
  if (fields && Array.isArray(fields)) {
    for (const field of fields) {
      const fieldName = field.FIELDNAME;
      metadata[fieldName] = {
        key: field.KEYFLAG === 'X',              // Key field
        description: field.FIELDTEXT || field.SCRTEXT_L || field.SCRTEXT_M || '',
        shortText: field.SCRTEXT_S || '',
        dataType: field.DATATYPE || field.INTTYPE,
        length: parseInt(field.LENG || '0'),
        hasValueHelp: field.F4AVAILABL === 'X',  // F4 help available
        checkTable: field.CHECKTABLE || '',      // Reference check table
      };
    }
  }
  
  return metadata;
}

/**
 * Build structure template from field list
 */
function buildStructureFromFields(fields: any[]): any {
  const structure: any = {};
  
  if (fields && Array.isArray(fields)) {
    for (const field of fields) {
      const fieldName = field.FIELDNAME;
      const dataType = field.DATATYPE || field.INTTYPE;
      const externalType = field.EXID; // External type identifier
      
      // Set default value based on data type
      // INTTYPE values: b=INT1, s=INT2, I=INT4, P=PACKED, F=FLOAT
      switch (dataType) {
        case 'I': // INT4
        case 's': // INT2
        case 'b': // INT1
        case 'B': // INT1 (uppercase)
        case 'P': // Packed number
        case 'F': // Float
          structure[fieldName] = 0;
          break;
        case 'D': // Date
          structure[fieldName] = '';
          break;
        case 'T': // Time
          structure[fieldName] = '';
          break;
        case 'C': // Char
        case 'N': // Numeric char
        case 'g': // String
        default:
          structure[fieldName] = '';
          break;
      }
    }
  }
  
  return structure;
}

/**
 * Build structure template from type description
 */
function buildStructureTemplate(typeDesc: any): any {
  const structure: any = {};
  
  if (typeDesc && typeDesc.fields) {
    for (const field of typeDesc.fields) {
      if (field.type === 'RFCTYPE_STRUCTURE') {
        structure[field.name] = buildStructureTemplate(field.typeDescription);
      } else if (field.type === 'RFCTYPE_TABLE') {
        structure[field.name] = [buildStructureTemplate(field.typeDescription)];
      } else {
        structure[field.name] = getExampleValue(field.type, field.nucLength);
      }
    }
  }
  
  return structure;
}

/**
 * Get example value based on RFC type
 */
function getExampleValue(rfcType: string, length?: number): string {
  switch (rfcType) {
    case 'RFCTYPE_CHAR':
    case 'RFCTYPE_STRING':
      return '';
    case 'RFCTYPE_NUM':
      return '0'.repeat(length || 1);
    case 'RFCTYPE_INT':
    case 'RFCTYPE_INT1':
    case 'RFCTYPE_INT2':
      return '0';
    case 'RFCTYPE_DATE':
      return '20240101';
    case 'RFCTYPE_TIME':
      return '120000';
    case 'RFCTYPE_FLOAT':
    case 'RFCTYPE_BCD':
      return '0.0';
    default:
      return '';
  }
}
