const axios = require('axios');

let cache = {
  data: null,
  timestamp: null
};

const CACHE_DURATION = 5 * 60 * 1000;

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Check cache
    const now = Date.now();
    if (cache.data && cache.timestamp && (now - cache.timestamp) < CACHE_DURATION) {
      return res.json({
        success: true,
        source: 'cache',
        data: cache.data
      });
    }

    // User-Agent yang realistic
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
    ];

    const response = await axios.get('https://pvb-bot.page.gd/pvb_api_config.php?db_id=3', {
      timeout: 15000,
      headers: {
        'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Referer': 'https://pvb-bot.page.gd/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin'
      },
      // Tambahkan delay random
      delay: Math.floor(Math.random() * 1000) + 500
    });

    cache.data = response.data;
    cache.timestamp = now;

    res.json({
      success: true,
      source: 'fresh',
      data: response.data
    });

  } catch (error) {
    console.error('Error:', error.message);
    
    if (cache.data) {
      return res.json({
        success: true,
        source: 'cache_fallback',
        data: cache.data
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
      response: error.response?.data
    });
  }
};
