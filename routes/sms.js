const express = require('express');
const router = express.Router();
const smsService = require('../services/smsService');
const parser = require('../utils/parser');
const formatter = require('../utils/formatter');

/**
 * POST /at/sms
 * Handles incoming SMS messages from Africa's Talking
 */
router.post('/sms', async (req, res) => {
  try {
    const { from, to, text, date, id, cost, networkCode } = req.body;

    console.log(`📱 Incoming SMS from ${from}: "${text}"`);
    
    // Validate required fields
    if (!from || !text) {
      console.error('❌ Missing required SMS fields (from, text)');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Normalize phone number (remove + and spaces)
    const phoneNumber = from.replace(/[\s+]/g, '');
    
    // Parse the SMS command
    const parsedCommand = parser.parseSMSCommand(text);
    
    if (!parsedCommand.isValid) {
      console.log(`⚠️ Invalid command from ${phoneNumber}: ${parsedCommand.error}`);
      
      const helpMessage = formatter.formatHelpMessage();
      await smsService.sendSMS(phoneNumber, helpMessage);
      
      return res.json({ status: 'help_sent' });
    }

    console.log(`✅ Valid command parsed:`, parsedCommand);

    // Route to appropriate handler based on command type
    let response;
    
    switch (parsedCommand.command) {
      case 'WEATHER':
        response = await handleWeatherRequest(parsedCommand, phoneNumber);
        break;
        
      case 'QUOTE':
        response = await handleQuoteRequest(parsedCommand, phoneNumber);
        break;
        
      case 'PLANTING':
        response = await handlePlantingRequest(parsedCommand, phoneNumber);
        break;
        
      default:
        throw new Error(`Unhandled command type: ${parsedCommand.command}`);
    }

    console.log(`📤 Sending response to ${phoneNumber}: "${response}"`);
    
    // Send SMS response
    await smsService.sendSMS(phoneNumber, response);
    
    res.json({ 
      status: 'success', 
      command: parsedCommand.command,
      response_length: response.length 
    });

  } catch (error) {
    console.error('❌ SMS processing error:', error.message);
    console.error('Stack:', error.stack);
    
    // Send error message to user if we have their phone number
    try {
      if (req.body.from) {
        const phoneNumber = req.body.from.replace(/[\s+]/g, '');
        const errorMessage = formatter.formatErrorMessage();
        await smsService.sendSMS(phoneNumber, errorMessage);
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
 * Handle weather request
 */
async function handleWeatherRequest(parsedCommand, phoneNumber) {
  const { lat, lng } = parsedCommand.coordinates;
  const flaskService = require('../services/flaskService');
  
  const weatherData = await flaskService.getWeather(lat, lng);
  return formatter.formatWeatherResponse(weatherData);
}

/**
 * Handle insurance quote request
 */
async function handleQuoteRequest(parsedCommand, phoneNumber) {
  const { lat, lng } = parsedCommand.coordinates;
  const { crop } = parsedCommand;
  const flaskService = require('../services/flaskService');
  
  const quoteData = await flaskService.getInsuranceQuote(lat, lng, crop);
  return formatter.formatQuoteResponse(quoteData, crop);
}

/**
 * Handle planting window request
 */
async function handlePlantingRequest(parsedCommand, phoneNumber) {
  const { lat, lng } = parsedCommand.coordinates;
  const flaskService = require('../services/flaskService');
  
  const plantingData = await flaskService.getPlantingWindow(lat, lng);
  return formatter.formatPlantingResponse(plantingData);
}

module.exports = router;
