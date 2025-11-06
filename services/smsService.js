const AfricasTalking = require('africastalking');

// Initialize Africa's Talking
const credentials = {
  apiKey: process.env.AT_API_KEY,
  username: process.env.AT_USERNAME
};

const AT = AfricasTalking(credentials);
const sms = AT.SMS;

class SMSService {
  /**
   * Send SMS via Africa's Talking
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} message - SMS message content
   * @param {string} from - Sender ID (optional)
   * @returns {Promise} - SMS sending result
   */
  async sendSMS(phoneNumber, message, from = null) {
    try {
      // Validate inputs
      if (!phoneNumber || !message) {
        throw new Error('Phone number and message are required');
      }

      // Ensure message is within SMS limits (160 chars for single SMS)
      if (message.length > 150) {
        console.warn(`⚠️ Message length (${message.length}) exceeds recommended limit (150)`);
        message = message.substring(0, 147) + '...';
      }

      // Format phone number (ensure it starts with +)
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

      const options = {
        to: formattedPhone,
        message: message,
        from: from || process.env.DEFAULT_SENDER_ID || null
      };

      console.log(`📤 Sending SMS to ${formattedPhone}: "${message}"`);
      
      const response = await sms.send(options);
      
      if (response.SMSMessageData && response.SMSMessageData.Recipients) {
        const recipient = response.SMSMessageData.Recipients[0];
        
        if (recipient.status === 'Success') {
          console.log(`✅ SMS sent successfully to ${formattedPhone}`);
          console.log(`💰 Cost: ${recipient.cost}, MessageId: ${recipient.messageId}`);
          
          return {
            success: true,
            messageId: recipient.messageId,
            cost: recipient.cost,
            status: recipient.status
          };
        } else {
          console.error(`❌ SMS failed to ${formattedPhone}: ${recipient.status}`);
          throw new Error(`SMS failed: ${recipient.status}`);
        }
      } else {
        console.error('❌ Unexpected response format from Africa\'s Talking');
        throw new Error('Unexpected response format from SMS service');
      }

    } catch (error) {
      console.error('❌ SMS sending error:', error.message);
      
      // Re-throw with more context
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  /**
   * Validate Africa's Talking configuration
   * @returns {boolean} - True if properly configured
   */
  isConfigured() {
    return !!(process.env.AT_USERNAME && process.env.AT_API_KEY);
  }

  /**
   * Get account balance (if needed for monitoring)
   * @returns {Promise} - Account balance data
   */
  async getBalance() {
    try {
      const application = AT.APPLICATION;
      const response = await application.fetchApplicationData();
      
      return {
        balance: response.UserData.balance,
        currency: 'USD' // Africa's Talking typically uses USD
      };
    } catch (error) {
      console.error('❌ Failed to fetch balance:', error.message);
      throw new Error(`Failed to fetch account balance: ${error.message}`);
    }
  }
}

// Export singleton instance
module.exports = new SMSService();
