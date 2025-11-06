const express = require('express');
const router = express.Router();

/**
 * POST /at/dlr
 * Handles SMS delivery reports from Africa's Talking
 */
router.post('/dlr', (req, res) => {
  try {
    const { 
      id,
      phoneNumber,
      status,
      networkCode,
      cost,
      date
    } = req.body;

    // Log delivery report
    console.log(`📊 DLR Report:`, {
      messageId: id,
      phone: phoneNumber,
      status: status,
      network: networkCode,
      cost: cost,
      timestamp: date || new Date().toISOString()
    });

    // Acknowledge receipt
    res.json({ 
      status: 'received',
      messageId: id,
      deliveryStatus: status
    });

  } catch (error) {
    console.error('❌ DLR processing error:', error.message);
    
    res.status(500).json({ 
      error: 'DLR processing failed'
    });
  }
});

module.exports = router;
