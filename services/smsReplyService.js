const AfricasTalking = require('africastalking');

// Initialize Africa's Talking
const credentials = {
  apiKey: process.env.AT_API_KEY,
  username: process.env.AT_USERNAME
};

const AT = AfricasTalking(credentials);
const sms = AT.SMS;

class SMSReplyService {
  /**
   * Send SMS via Africa's Talking
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} message - SMS message content (max 150 chars)
   * @returns {Promise} - SMS sending result
   */
  async sendSMS(phoneNumber, message) {
    try {
      // Validate inputs
      if (!phoneNumber || !message) {
        throw new Error('Phone number and message are required');
      }

      // Ensure message is SMS-friendly
      if (message.length > 150) {
        console.warn(`⚠️  Message truncated from ${message.length} to 150 chars`);
        message = message.substring(0, 147) + '...';
      }

      // Format phone number
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

      const options = {
        to: formattedPhone,
        message: message,
        from: 'YIELDERA' // Optional sender ID
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
        throw new Error('Unexpected response format from SMS service');
      }

    } catch (error) {
      console.error('❌ SMS sending error:', error.message);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  /**
   * Check if Africa's Talking is properly configured
   * @returns {boolean} - True if configured
   */
  isConfigured() {
    return !!(process.env.AT_USERNAME && process.env.AT_API_KEY);
  }

  /**
   * Get account balance (optional)
   * @returns {Promise<Object>} - Balance info
   */
  async getBalance() {
    try {
      const application = AT.APPLICATION;
      const response = await application.fetchApplicationData();
      
      return {
        balance: response.UserData.balance,
        currency: 'USD'
      };
    } catch (error) {
      console.error('❌ Failed to fetch balance:', error.message);
      throw new Error(`Failed to fetch balance: ${error.message}`);
    }
  }
}

// Export singleton instance
module.exports = new SMSReplyService();
