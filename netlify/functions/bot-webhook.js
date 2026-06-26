const https = require('https');

// Helper function for version-agnostic HTTPS requests in Node.js
function httpsRequest(urlStr, options, postData) {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(urlStr);
      
      const reqOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: parsedUrl.pathname + parsedUrl.search,
        method: options.method || 'GET',
        headers: { ...(options.headers || {}) }
      };

      let payload = null;
      if (postData) {
        payload = typeof postData === 'string' ? postData : JSON.stringify(postData);
        reqOptions.headers['Content-Length'] = Buffer.byteLength(payload);
      }

      const req = https.request(reqOptions, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            statusCode: res.statusCode,
            json: () => {
              try {
                return JSON.parse(body);
              } catch (e) {
                return { error: 'Invalid JSON', body };
              }
            },
            text: () => body
          });
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      if (payload) {
        req.write(payload);
      }
      req.end();
    } catch (e) {
      reject(e);
    }
  });
}

exports.handler = async (event, context) => {
  const jsonHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight OPTIONS requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: jsonHeaders,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: jsonHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const update = JSON.parse(event.body);
    console.log("Received Telegram update:", JSON.stringify(update));

    const message = update.message;
    if (message && message.text) {
      const chatId = message.chat.id;
      const text = message.text.trim();
      const tgBotToken = process.env.TELEGRAM_BOT_TOKEN;

      if (!tgBotToken) {
        console.error("TELEGRAM_BOT_TOKEN is not set in environment variables!");
        return {
          statusCode: 500,
          headers: jsonHeaders,
          body: JSON.stringify({ error: 'Bot token not configured' }),
        };
      }

      if (text.startsWith('/start')) {
        const replyText = `Привет! Вы выбрали самовывоз для вашего заказа. 📦\n\n` +
                          `📍 **Адрес магазина**: г. Москва, ул. Примерная, д. 1\n` +
                          `🕒 **Время работы**: ежедневно с 10:00 до 22:00\n` +
                          `📞 **Телефон магазина**: +7 (999) 123-45-67\n\n` +
                          `Наш менеджер свяжется с вами по указанному в заказе телефону в ближайшее время, чтобы подтвердить готовность!`;

        // Send reply to user
        await httpsRequest(`https://api.telegram.org/bot${tgBotToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }, { chat_id: chatId, text: replyText });
        
        console.log(`Successfully replied to chat ID ${chatId}`);
      }
    }

    return {
      statusCode: 200,
      headers: jsonHeaders,
      body: JSON.stringify({ ok: true }),
    };
  } catch (error) {
    console.error('Error handling telegram update:', error);
    return {
      statusCode: 500,
      headers: jsonHeaders,
      body: JSON.stringify({ error: 'Internal Server Error', details: error.message }),
    };
  }
};
