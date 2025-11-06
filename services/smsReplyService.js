const AfricasTalking = require('africastalking');

// Initialize Africa's Talking
const credentials = {
  apiKey: process.env.AT_API_KEY,
  username: process.env.AT_USERNAME // MUST be "sandbox" for testing
};

const AT = AfricasTalking(credentials);
const sms = AT.SMS;

class SMSReplyService {
  async sendSMS(phoneNumber, message) {
    try {
      if (!phoneNumber || !message) {
        throw new Error('Phone number and message are required');
      }

      // Truncate long messages
      if (message.length > 150) {
        console.warn(`⚠️ Message truncated from ${message.length} to 150 chars`);
        message = message.substring(0, 147) + "...";
      }

      // Ensure correct +263 format
      const formattedPhone = phoneNumber.startsWith("+")
        ? phoneNumber
        : `+${phoneNumber}`;

      const options = {
        to: [formattedPhone],  // ✅ MUST be array
        message: message
        // ❌ DO NOT set `from` in Sandbox
      };

      console.log(`📤 Sending SMS to ${formattedPhone}: "${message}"`);
      
      const response = await sms.send(options);
      console.log("✅ Africa's Talking SMS Response:", JSON.stringify(response, null, 2));

      const recipient = response.SMSMessageData?.Recipients?.[0];
      if (recipient?.status === "Success") {
        return {
          success: true,
          messageId: recipient.messageId,
          cost: recipient.cost,
          status: recipient.status
        };
      } else {
        throw new Error(`SMS failed: ${recipient?.status}`);
      }

    } catch (error) {
      console.error("❌ SMS sending error:", error.message);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  isConfigured() {
    return !!(process.env.AT_USERNAME && process.env.AT_API_KEY);
  }
}

module.exports = new SMSReplyService();
