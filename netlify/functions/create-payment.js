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
    const { items, totalUSD, name, email, phone, social, address, promoCode } = JSON.parse(event.body);

    if (!items || !totalUSD || !email) {
      return {
        statusCode: 400,
        headers: jsonHeaders,
        body: JSON.stringify({ error: 'Missing required parameters (items, totalUSD, or email)' }),
      };
    }

    // Lava.top Configuration
    const lavaApiKey = process.env.LAVA_API_KEY || 'DhqQfPXePVnHyHl5WX3EPDbu1pYxuWKDLmIzDCtH5cMZ0crVUwwkaFJnvWQjksvW';
    const offerId = process.env.LAVA_OFFER_ID || '1a07eb81-3aea-4f77-9498-2d56e8e3be2d';

    // Prepare JSON payload for gate.lava.top api v3
    const requestPayload = {
      email: email,
      offerId: offerId,
      currency: 'USD',
      amount: parseFloat(totalUSD)
    };

    if (promoCode) {
      requestPayload.promoCode = promoCode;
    }

    // Call Lava.top Public API (v3/invoice) to generate invoice contract using our HTTPS helper
    const lavaResponse = await httpsRequest('https://gate.lava.top/api/v3/invoice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': lavaApiKey
      }
    }, requestPayload);

    const lavaResult = lavaResponse.json();

    if (!lavaResponse.ok || !lavaResult.paymentUrl) {
      console.error('Lava.top API error response:', lavaResult);
      return {
        statusCode: 400,
        headers: jsonHeaders,
        body: JSON.stringify({ 
          error: 'Failed to create invoice with Lava.top.', 
          details: lavaResult.message || JSON.stringify(lavaResult) 
        }),
      };
    }

    const paymentUrl = lavaResult.paymentUrl;
    const invoiceId = lavaResult.id;

    // Send transaction log details to Telegram for the merchant
    const tgBotToken = process.env.TELEGRAM_BOT_TOKEN;
    const tgChatId = process.env.TELEGRAM_CHAT_ID;
    
    if (tgBotToken && tgChatId) {
      try {
        let itemsText = items.map((item, idx) => `${idx + 1}. ${item.name} // SIZE: ${item.size} // QTY: ${item.qty} // $${item.price * item.qty}`).join('\n');
        const tgMessage = `🚨 NEW INVOICE GENERATED // LAVA.TOP\n\n` +
                          `▫️ INVOICE ID: ${invoiceId}\n` +
                          `▫️ TOTAL: $${totalUSD}\n` +
                          `▫️ ITEMS:\n${itemsText}\n\n` +
                          `▫️ BUYER: ${name}\n` +
                          `▫️ EMAIL: ${email}\n` +
                          `▫️ PHONE: ${phone}\n` +
                          `▫️ SOCIAL/TG: ${social}\n` +
                          `▫️ ADDRESS: ${address}\n` +
                          `▫️ PROMO CODE: ${promoCode || 'NONE'}\n\n` +
                          `▫️ PAYMENT LINK: ${paymentUrl}`;

        // Fire-and-forget telegram notify using our HTTPS helper
        httpsRequest(`https://api.telegram.org/bot${tgBotToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }, { chat_id: tgChatId, text: tgMessage }).catch(() => {});
      } catch (tgErr) {
        console.warn("Failed to send telegram invoice notification:", tgErr);
      }
    }

    return {
      statusCode: 200,
      headers: jsonHeaders,
      body: JSON.stringify({ paymentUrl, invoiceId }),
    };
  } catch (error) {
    console.error('Error creating payment:', error);
    return {
      statusCode: 500,
      headers: jsonHeaders,
      body: JSON.stringify({ error: 'Internal Server Error', details: error.message }),
    };
  }
};
