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

app.listen(PORT, () => {
  console.log(`RFC API Server listening on port ${PORT}`);
});
