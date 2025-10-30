const axios = require('axios');

// Cache in memory
let cache = {
  data: null,
  timestamp: null
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const now = Date.now();
    
    // Check cache first
    if (cache.data && cache.timestamp && (now - cache.timestamp) < CACHE_DURATION) {
      console.log('Serving from cache');
      return res.json({
        success: true,
        source: 'cache',
        cached: true,
        timestamp: new Date().toISOString(),
        data: cache.data
      });
    }

    console.log('Fetching fresh data from source');
    
    // Fetch from source
    const response = await axios.get('https://pvb-bot.page.gd/pvb_api_config.php?db_id=3', {
      timeout: 10000,
      headers: {
        'User-Agent': 'PVB-Mirror-API/1.0'
      }
    });

    // Update cache
    cache.data = response.data;
    cache.timestamp = now;

    // Return response
    res.json({
      success: true,
      source: 'fresh',
      cached: false,
      timestamp: new Date().toISOString(),
      data: response.data
    });

  } catch (error) {
    console.error('Error fetching data:', error.message);

    // Fallback to cache if available
    if (cache.data) {
      console.log('Using cache as fallback');
      return res.json({
        success: true,
        source: 'cache_fallback',
        cached: true,
        timestamp: new Date().toISOString(),
        data: cache.data,
        warning: 'Using cached data due to fetch error'
      });
    }

    // No cache available, return error
    res.status(500).json({
      success: false,
      error: 'Failed to fetch data',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
