const crypto = require('crypto');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const { items, totalUSD, name, email, phone, social, address } = JSON.parse(event.body);

    if (!items || !totalUSD) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required parameters' }),
      };
    }

    // Read environment variables (configured in Netlify dashboard)
    const merchantId = process.env.AAIO_MERCHANT_ID;
    const secretKey = process.env.AAIO_SECRET_KEY;
    const exchangeRate = parseFloat(process.env.AAIO_USD_TO_RUB || '92.5'); // default rate

    if (!merchantId || !secretKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Payment gateway not configured on host server. Please set AAIO_MERCHANT_ID and AAIO_SECRET_KEY.' }),
      };
    }

    // Convert total USD to RUB (AAIO primary currency for cards/SBP)
    const amountRUB = (totalUSD * exchangeRate).toFixed(2);
    const currency = 'RUB';
    const orderId = `CALLME-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Build the signature string
    // Format: SHA256(merchant_id:amount:currency:secret:order_id)
    const signString = `${merchantId}:${amountRUB}:${currency}:${secretKey}:${orderId}`;
    const sign = crypto
      .createHash('sha256')
      .update(signString)
      .digest('hex');

    // Create description of the order
    const desc = items.map(item => `${item.name} (x${item.qty})`).join(', ');

    // Build the redirect URL
    const paymentUrl = `https://aaio.so/merchant/pay?` +
      `merchant_id=${encodeURIComponent(merchantId)}&` +
      `amount=${encodeURIComponent(amountRUB)}&` +
      `currency=${encodeURIComponent(currency)}&` +
      `order_id=${encodeURIComponent(orderId)}&` +
      `sign=${encodeURIComponent(sign)}&` +
      `desc=${encodeURIComponent(desc)}&` +
      `lang=ru`;

    // Also send an asynchronous telegram log notification to the seller if token is provided
    const tgBotToken = process.env.TELEGRAM_BOT_TOKEN;
    const tgChatId = process.env.TELEGRAM_CHAT_ID;
    
    if (tgBotToken && tgChatId) {
      try {
        let itemsText = items.map((item, idx) => `${idx + 1}. ${item.name} // SIZE: ${item.size} // QTY: ${item.qty} // $${item.price * item.qty}`).join('\n');
        const tgMessage = `🚨 NEW INVOICE GENERATED // AAIO\n\n` +
                          `▫️ ORDER ID: ${orderId}\n` +
                          `▫️ TOTAL: $${totalUSD} (~${amountRUB} RUB)\n` +
                          `▫️ ITEMS:\n${itemsText}\n\n` +
                          `▫️ BUYER: ${name}\n` +
                          `▫️ PHONE: ${phone}\n` +
                          `▫️ SOCIAL/TG: ${social}\n` +
                          `▫️ ADDRESS: ${address}`;

        // Fire and forget telegram message
        globalThis.fetch(`https://api.telegram.org/bot${tgBotToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: tgChatId, text: tgMessage })
        }).catch(() => {});
      } catch (tgErr) {
        console.warn("Failed to send telegram invoice notification", tgErr);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ paymentUrl, orderId }),
    };
  } catch (error) {
    console.error('Error creating payment:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error', details: error.message }),
    };
  }
};
