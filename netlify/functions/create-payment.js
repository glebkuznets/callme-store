const https = require('https');
const crypto = require('crypto');

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
    const { items, totalUSD, name, email, phone, social, address, promoCode, paymentMethod } = JSON.parse(event.body);

    if (!items || !totalUSD || !email) {
      return {
        statusCode: 400,
        headers: jsonHeaders,
        body: JSON.stringify({ error: 'Missing required parameters (items, totalUSD, or email)' }),
      };
    }

    const tgBotToken = process.env.TELEGRAM_BOT_TOKEN;
    const tgChatId = process.env.TELEGRAM_CHAT_ID;
    const activeMethod = paymentMethod || 'cryptomus';

    console.log(`Processing checkout. Method: ${activeMethod}. Total: $${totalUSD}`);
    console.log("TG_BOT_TOKEN =", tgBotToken ? "SET" : "NOT_SET");
    console.log("TG_CHAT_ID =", tgChatId ? tgChatId : "NOT_SET");

    // --------------------------------------------------------------------------
    // FLOW 1: Pickup in Moscow
    // --------------------------------------------------------------------------
    if (activeMethod === 'pickup') {
      const orderId = `CM-PK-${Date.now()}`;
      const botUsername = 'callmecash9_bot'; // Replace with your actual bot username
      const paymentUrl = `https://t.me/${botUsername}?start=pickup_${orderId}`;

      if (tgBotToken && tgChatId) {
        try {
          let itemsText = items.map((item, idx) => `${idx + 1}. ${item.name} // SIZE: ${item.size} // QTY: ${item.qty} // $${item.price * item.qty}`).join('\n');
          const tgMessage = `🚨 NEW PICKUP ORDER INITIATED // САМОВЫВОЗ\n\n` +
                            `▫️ ORDER ID: ${orderId}\n` +
                            `▫️ TOTAL: $${totalUSD}\n` +
                            `▫️ ITEMS:\n${itemsText}\n\n` +
                            `▫️ BUYER: ${name}\n` +
                            `▫️ EMAIL: ${email}\n` +
                            `▫️ PHONE: ${phone}\n` +
                            `▫️ ADDRESS: ${address}\n` +
                            `▫️ PROMO CODE: ${promoCode || 'NONE'}`;

          await httpsRequest(`https://api.telegram.org/bot${tgBotToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          }, { chat_id: tgChatId, text: tgMessage });
        } catch (tgErr) {
          console.warn("Failed to send telegram pickup notification:", tgErr);
        }
      }

      return {
        statusCode: 200,
        headers: jsonHeaders,
        body: JSON.stringify({ paymentUrl, invoiceId: orderId, tgConfigured: !!(tgBotToken && tgChatId) }),
      };
    }

    // --------------------------------------------------------------------------
    // FLOW 2: Cryptomus Payment
    // --------------------------------------------------------------------------
    const cryptomusApiKey = process.env.CRYPTOMUS_API_KEY || 'DhqQfPXePVnHyHl5WX3EPDbu1pYxuWKDLmIzDCtH5cMZ0crVUwwkaFJnvWQjksvW'; // Replace or load from env
    const cryptomusMerchantUuid = process.env.CRYPTOMUS_MERCHANT_UUID || '1a07eb81-3aea-4f77-9498-2d56e8e3be2d'; // Replace or load from env
    
    const orderId = `CM-${Date.now()}`;

    // Payload parameters for Cryptomus API (v1/payment)
    const requestPayload = {
      amount: parseFloat(totalUSD).toFixed(2),
      currency: 'USD',
      order_id: orderId,
      url_success: `https://astonishing-bunny-4408f5.netlify.app/product.html?order=success&id=${orderId}`
    };

    // Calculate Cryptomus Signature: md5(base64(JSON.stringify(payload)) + cryptomusApiKey)
    const payloadJsonString = JSON.stringify(requestPayload);
    const base64Payload = Buffer.from(payloadJsonString).toString('base64');
    const signature = crypto.createHash('md5').update(base64Payload + cryptomusApiKey).digest('hex');

    console.log("Cryptomus signature generated successfully.");

    // Call Cryptomus REST API
    const response = await httpsRequest('https://api.cryptomus.com/v1/payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'merchant': cryptomusMerchantUuid,
        'sign': signature
      }
    }, requestPayload);

    const result = response.json();

    if (!response.ok || !result.result || !result.result.url) {
      console.error('Cryptomus API error response:', result);

      if (tgBotToken && tgChatId) {
        try {
          let itemsText = items.map((item, idx) => `${idx + 1}. ${item.name} // SIZE: ${item.size} // QTY: ${item.qty} // $${item.price * item.qty}`).join('\n');
          const tgMessage = `⚠️ CHECKOUT ATTEMPT FAILED // CRYPTOMUS ERROR\n\n` +
                            `▫️ REASON: ${result.message || JSON.stringify(result)}\n` +
                            `▫️ TOTAL: $${totalUSD}\n` +
                            `▫️ ITEMS:\n${itemsText}\n\n` +
                            `▫️ BUYER: ${name}\n` +
                            `▫️ EMAIL: ${email}\n` +
                            `▫️ PHONE: ${phone}\n` +
                            `▫️ ADDRESS: ${address}`;

          await httpsRequest(`https://api.telegram.org/bot${tgBotToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          }, { chat_id: tgChatId, text: tgMessage });
        } catch (tgErr) {
          console.warn("Failed to send telegram checkout failure notification:", tgErr);
        }
      }

      return {
        statusCode: 400,
        headers: jsonHeaders,
        body: JSON.stringify({ 
          error: 'Failed to create invoice with Cryptomus.', 
          details: result.message || JSON.stringify(result) 
        }),
      };
    }

    const paymentUrl = result.result.url;
    const invoiceId = result.result.uuid;

    // Send order transaction log details to Telegram for the merchant
    if (tgBotToken && tgChatId) {
      try {
        let itemsText = items.map((item, idx) => `${idx + 1}. ${item.name} // SIZE: ${item.size} // QTY: ${item.qty} // $${item.price * item.qty}`).join('\n');
        const tgMessage = `🚨 NEW CRYPTO INVOICE GENERATED // CRYPTOMUS\n\n` +
                          `▫️ INVOICE ID: ${invoiceId}\n` +
                          `▫️ TOTAL: $${totalUSD}\n` +
                          `▫️ ITEMS:\n${itemsText}\n\n` +
                          `▫️ BUYER: ${name}\n` +
                          `▫️ EMAIL: ${email}\n` +
                          `▫️ PHONE: ${phone}\n` +
                          `▫️ ADDRESS: ${address}\n` +
                          `▫️ PROMO CODE: ${promoCode || 'NONE'}\n\n` +
                          `▫️ PAYMENT LINK: ${paymentUrl}`;

        await httpsRequest(`https://api.telegram.org/bot${tgBotToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }, { chat_id: tgChatId, text: tgMessage });
      } catch (tgErr) {
        console.warn("Failed to send telegram invoice notification:", tgErr);
      }
    }

    return {
      statusCode: 200,
      headers: jsonHeaders,
      body: JSON.stringify({ paymentUrl, invoiceId, tgConfigured: !!(tgBotToken && tgChatId) }),
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
