const express = require('express');
const router = express.Router();
const smsReplyService = require('../services/smsReplyService');
const weatherService = require('../services/weatherService');
const parser = require('../utils/parser');
const formatter = require('../utils/formatter');

/**
 * POST /at/sms
 * Handles incoming SMS messages from Africa's Talking
 * Supports both Production and Sandbox payload formats
 * Supports: WEATHER, FORECAST, RAINHISTORY, HELP
 */
router.post('/sms', async (req, res) => {
  try {
    // Debug: Log raw incoming payload
    console.log("📥 Raw incoming SMS payload:", JSON.stringify(req.body, null, 2));

    // Handle both Production and Sandbox payload formats
    const fromNumber = req.body.from || req.body.phoneNumber || null;
    const messageText = req.body.text || null;
    const shortcode = req.body.to || req.body.shortCode || null;
    const messageDate = req.body.date || new Date().toISOString();
    const messageId = req.body.id || req.body.messageId || 'sandbox-msg';

    console.log(`📱 SMS from ${fromNumber} to ${shortcode}: "${messageText}"`);
    
    // Validate required fields
    if (!fromNumber || !messageText) {
      console.error('❌ Missing required SMS fields (from/phoneNumber or text)');
      console.error('❌ Received fields:', { 
        from: req.body.from, 
        phoneNumber: req.body.phoneNumber, 
        text: req.body.text 
      });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Clean phone number
    const phoneNumber = fromNumber.replace(/[\s+]/g, '');
    
    // Parse the SMS command
    const parsedCommand = parser.parseWeatherCommand(messageText);
    
    if (!parsedCommand.isValid) {
      console.log(`⚠️  Invalid command from ${phoneNumber}: ${parsedCommand.error}`);
      
      const helpMessage = formatter.formatHelpMessage();
      await smsReplyService.sendSMS(phoneNumber, helpMessage);
      
      return res.json({ status: 'help_sent', payload_format: fromNumber.includes('+') ? 'production' : 'sandbox' });
    }

    console.log(`✅ Valid command:`, parsedCommand);

    // Route to weather handlers
    let response;
    
    switch (parsedCommand.command) {
      case 'WEATHER':
        response = await handleCurrentWeather(parsedCommand);
        break;
        
      case 'FORECAST':
        response = await handleForecast(parsedCommand);
        break;
        
      case 'RAINHISTORY':
        response = await handleRainHistory(parsedCommand);
        break;
        
      case 'HELP':
        response = formatter.formatHelpMessage();
        break;
        
      default:
        response = formatter.formatErrorMessage();
    }

    console.log(`📤 Sending to ${phoneNumber}: "${response}"`);
    
    // Send SMS response
    await smsReplyService.sendSMS(phoneNumber, response);
    
    res.json({ 
      status: 'success', 
      command: parsedCommand.command,
      response_length: response.length,
      payload_format: fromNumber.includes('+') ? 'production' : 'sandbox'
    });

  } catch (error) {
    console.error('❌ SMS processing error:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    // Send error message to user using safe field extraction
    try {
      const fromNumber = req.body.from || req.body.phoneNumber || null;
      if (fromNumber) {
        const phoneNumber = fromNumber.replace(/[\s+]/g, '');
        const errorMessage = formatter.formatErrorMessage();
        await smsReplyService.sendSMS(phoneNumber, errorMessage);
        console.log(`📤 Error SMS sent to ${phoneNumber}`);
      }
    } catch (smsError) {
      console.error('❌ Failed to send error SMS:', smsError.message);
    }
    
    res.status(500).json({ 
      error: 'SMS processing failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Handle current weather request
 */
async function handleCurrentWeather(parsedCommand) {
  const { lat, lng } = parsedCommand.coordinates;
  
  try {
    const weatherData = await weatherService.getCurrentWeather(lat, lng);
    return formatter.formatCurrentWeather(weatherData);
  } catch (error) {
    console.error('❌ Current weather error:', error.message);
    return formatter.formatErrorMessage();
  }
}

/**
 * Handle 7-day forecast request
 */
async function handleForecast(parsedCommand) {
  const { lat, lng } = parsedCommand.coordinates;
  
  try {
    const forecastData = await weatherService.getForecast(lat, lng);
    return formatter.formatForecast(forecastData);
  } catch (error) {
    console.error('❌ Forecast error:', error.message);
    return formatter.formatErrorMessage();
  }
}

/**
 * Handle rainfall history request
 */
async function handleRainHistory(parsedCommand) {
  const { lat, lng } = parsedCommand.coordinates;
  
  try {
    const historyData = await weatherService.getRainHistory(lat, lng);
    return formatter.formatRainHistory(historyData);
  } catch (error) {
    console.error('❌ Rain history error:', error.message);
    return formatter.formatErrorMessage();
  }
}

module.exports = router;
