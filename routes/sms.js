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
 * WEATHER command only: WEATHER lat,lng
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
    
    // Parse the WEATHER command only
    const parsedCommand = parser.parseWeatherCommand(messageText);
    
    if (!parsedCommand.isValid) {
      console.log(`⚠️  Invalid command from ${phoneNumber}: ${parsedCommand.error}`);
      
      // Send error message for invalid commands
      await smsReplyService.sendSMS(phoneNumber, "Send WEATHER lat,lng");
      
      return res.json({ status: 'invalid_command_help_sent' });
    }

    console.log(`✅ Valid WEATHER command:`, parsedCommand);

    // Handle WEATHER request
    let response;
    try {
      const weatherData = await weatherService.getCurrentWeather(parsedCommand.lat, parsedCommand.lng);
      response = formatter.formatWeatherResponse(weatherData, parsedCommand.lat, parsedCommand.lng);
    } catch (error) {
      console.error('❌ Weather API error:', error.message);
      response = "Weather temporarily unavailable. Try again.";
    }

    console.log(`📤 Sending to ${phoneNumber}: "${response}"`);
    
    // Send SMS response
    await smsReplyService.sendSMS(phoneNumber, response);
    
    res.json({ 
      status: 'success',
      response_length: response.length
    });

  } catch (error) {
    console.error('❌ SMS processing error:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    // Send error message to user using safe field extraction
    try {
      const fromNumber = req.body.from || req.body.phoneNumber || null;
      if (fromNumber) {
        const phoneNumber = fromNumber.replace(/[\s+]/g, '');
        await smsReplyService.sendSMS(phoneNumber, "Weather temporarily unavailable. Try again.");
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

module.exports = router;
