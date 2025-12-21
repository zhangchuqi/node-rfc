const express = require('express');
const { Client } = require('node-rfc');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'RFC API Server' });
});

// Call RFC endpoint
app.post('/api/rfc/call', async (req, res) => {
  try {
    const { connection, rfmName, parameters } = req.body;

    if (!connection || !rfmName) {
      return res.status(400).json({
        success: false,
        error: 'connection and rfmName are required'
      });
    }

    // Create client
    const client = new Client(connection);
    
    // Connect and call
    await client.open();
    const result = await client.call(rfmName, parameters || {});
    await client.close();

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('RFC call error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test connection endpoint
app.post('/api/rfc/test', async (req, res) => {
  try {
    const { connection } = req.body;

    if (!connection) {
      return res.status(400).json({
        success: false,
        error: 'connection is required'
      });
    }

    const client = new Client(connection);
    
    const startTime = Date.now();
    await client.open();
    await client.ping();
    await client.close();
    const duration = Date.now() - startTime;

    res.json({
      success: true,
      data: { duration }
    });

  } catch (error) {
    console.error('Connection test error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get RFC metadata endpoint
app.post('/api/rfc/metadata', async (req, res) => {
  try {
    const { connection, rfmName } = req.body;

    if (!connection || !rfmName) {
      return res.status(400).json({
        success: false,
        error: 'connection and rfmName are required'
      });
    }

    const client = new Client(connection);
    
    await client.open();
    
    try {
      // Call RFC_GET_FUNCTION_INTERFACE to get function metadata
      const result = await client.call('RFC_GET_FUNCTION_INTERFACE', {
        FUNCNAME: rfmName
      });

      // Parse parameters - the result has a PARAMS array with PARAMCLASS field
      const parameters = {};
      
      // Process all parameters from PARAMS array
      if (result.PARAMS) {
        result.PARAMS.forEach(param => {
          let direction = '';
          switch(param.PARAMCLASS) {
            case 'I': direction = 'RFC_IMPORT'; break;
            case 'E': direction = 'RFC_EXPORT'; break;
            case 'T': direction = 'RFC_TABLES'; break;
            case 'C': direction = 'RFC_CHANGING'; break;
            default: direction = 'UNKNOWN';
          }
          
          parameters[param.PARAMETER] = {
            name: param.PARAMETER,
            type: param.EXID,
            direction: direction,
            description: param.PARAMTEXT,
            optional: param.OPTIONAL === 'X',
            tabname: param.TABNAME,
            default: param.DEFAULT
          };
        });
      }

      const metadata = {
        name: rfmName,
        description: result.FUNCTEXT || result.SHORT_TEXT || '',
        parameters
      };

      console.log(`Found ${Object.keys(parameters).length} parameters for ${rfmName}`);
      console.log('Parameter directions:', Object.values(parameters).map(p => `${p.name}:${p.direction}`).join(', '));

      // Generate input template (IMPORT, CHANGING, and TABLES parameters)
      const inputTemplate = {};
      
      // For each parameter, if it's a table/structure, get its field definitions
      for (const [paramName, param] of Object.entries(parameters)) {
        // Include IMPORT, CHANGING, and TABLES (but exclude EXPORT)
        if (param.direction === 'RFC_IMPORT' || 
            param.direction === 'RFC_CHANGING' || 
            param.direction === 'RFC_TABLES') {
          
          // Don't skip RETURN if it's an input parameter (some BAPIs have it as both)
          
          // For tables with tabname, try to get the structure definition
          if (param.tabname) {
            try {
              // Get the structure fields for this table type
              const typeInfo = await client.call('DDIF_FIELDINFO_GET', {
                TABNAME: param.tabname,
                LANGU: connection.lang || 'EN',
                ALL_TYPES: 'X'
              });
              
              // Build a sample row with field names
              const sampleRow = {};
              if (typeInfo.DFIES_TAB && typeInfo.DFIES_TAB.length > 0) {
                typeInfo.DFIES_TAB.forEach(field => {
                  sampleRow[field.FIELDNAME] = '';
                });
                inputTemplate[param.name] = [sampleRow];
              } else {
                // Fallback to empty array for tables
                inputTemplate[param.name] = [];
              }
            } catch (err) {
              console.error(`Failed to get structure for ${param.tabname}:`, err.message);
              // If DDIF_FIELDINFO_GET fails, use empty array
              inputTemplate[param.name] = [];
            }
          } else if (param.type === 'u') {
            // Structure type
            inputTemplate[param.name] = {};
          } else {
            inputTemplate[param.name] = '';
          }
        }
      }

      console.log(`Generated inputTemplate with ${Object.keys(inputTemplate).length} fields:`, Object.keys(inputTemplate).join(', '));

      await client.close();

      res.json({
        success: true,
        metadata,
        inputTemplate
      });

    } catch (metadataError) {
      await client.close();
      console.error('Metadata fetch error:', metadataError);
      res.status(400).json({
        success: false,
        error: `Failed to get metadata for ${rfmName}: ${metadataError.message}`,
        suggestion: 'Function may not exist or you may not have authorization'
      });
    }

  } catch (error) {
    console.error('RFC metadata error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`RFC API Server listening on port ${PORT}`);
});
