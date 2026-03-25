const templateService = require('./template.service');
const credentialService = require('./credential.service');
const logger = require('../../config/logger');
const axios = require('axios');

class TemplateTestService {
  /**
   * Send test message using template
   */
  async sendTestMessage(templateId, testContact, userId) {
    try {
      // Get template
      const template = await templateService.getTemplateById(templateId);
      
      if (!template) {
        throw new Error('Template not found');
      }
      
      // Render template with sample data
      const renderedContent = templateService.renderTemplateWithSampleData(template);
      
      // Get credentials for template type
      const credentials = await credentialService.getPrimaryCredentials(template.type);
      
      if (!credentials) {
        throw new Error(`No credentials configured for ${template.type}`);
      }
      
      // Send test message based on type
      let result;
      switch (template.type) {
        case 'whatsapp':
          result = await this.sendTestWhatsApp(
            credentials.provider,
            credentials.credentials,
            testContact,
            renderedContent
          );
          break;
          
        case 'sms':
          result = await this.sendTestSMS(
            credentials.provider,
            credentials.credentials,
            testContact,
            renderedContent
          );
          break;
          
        case 'email':
          result = await this.sendTestEmail(
            credentials.provider,
            credentials.credentials,
            testContact,
            template.subject,
            renderedContent
          );
          break;
          
        default:
          throw new Error(`Unsupported message type: ${template.type}`);
      }
      
      logger.info(`Test message sent for template ${template.name} by user ${userId}`);
      
      return {
        success: true,
        message: 'Test message sent successfully',
        details: result
      };
    } catch (error) {
      logger.error(`Error sending test message: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Send test WhatsApp message
   */
  async sendTestWhatsApp(provider, credentials, phoneNumber, message) {
    switch (provider) {
      case 'twilio':
        return await this.sendTwilioWhatsApp(credentials, phoneNumber, message);
      case 'gupshup':
        return await this.sendGupshupWhatsApp(credentials, phoneNumber, message);
      case 'whatsapp-business':
        return await this.sendWhatsAppBusiness(credentials, phoneNumber, message);
      default:
        throw new Error(`Unsupported WhatsApp provider: ${provider}`);
    }
  }
  
  /**
   * Send test SMS message
   */
  async sendTestSMS(provider, credentials, phoneNumber, message) {
    switch (provider) {
      case 'twilio':
        return await this.sendTwilioSMS(credentials, phoneNumber, message);
      case 'msg91':
        return await this.sendMSG91SMS(credentials, phoneNumber, message);
      case 'textlocal':
        return await this.sendTextLocalSMS(credentials, phoneNumber, message);
      case 'fast2sms':
        return await this.sendFast2SMS(credentials, phoneNumber, message);
      default:
        throw new Error(`Unsupported SMS provider: ${provider}`);
    }
  }
  
  /**
   * Send test Email
   */
  async sendTestEmail(provider, credentials, email, subject, message) {
    switch (provider) {
      case 'aws-ses':
        return await this.sendAWSSESEmail(credentials, email, subject, message);
      case 'sendgrid':
        return await this.sendSendGridEmail(credentials, email, subject, message);
      case 'mailgun':
        return await this.sendMailgunEmail(credentials, email, subject, message);
      case 'smtp':
        return await this.sendSMTPEmail(credentials, email, subject, message);
      default:
        throw new Error(`Unsupported Email provider: ${provider}`);
    }
  }
  
  /**
   * Twilio WhatsApp implementation
   */
  async sendTwilioWhatsApp(credentials, phoneNumber, message) {
    const { accountSid, authToken, phoneNumber: fromNumber } = credentials;
    
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    const response = await axios.post(url, 
      new URLSearchParams({
        From: `whatsapp:${fromNumber}`,
        To: `whatsapp:${phoneNumber}`,
        Body: message
      }),
      {
        auth: {
          username: accountSid,
          password: authToken
        }
      }
    );
    
    return {
      messageId: response.data.sid,
      status: response.data.status
    };
  }
  
  /**
   * Gupshup WhatsApp implementation
   */
  async sendGupshupWhatsApp(credentials, phoneNumber, message) {
    const { apiKey, appName, phoneNumber: fromNumber } = credentials;
    
    const url = 'https://api.gupshup.io/sm/api/v1/msg';
    
    const response = await axios.post(url,
      new URLSearchParams({
        channel: 'whatsapp',
        source: fromNumber,
        destination: phoneNumber,
        'src.name': appName,
        message: JSON.stringify({ type: 'text', text: message })
      }),
      {
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    return {
      messageId: response.data.messageId,
      status: response.data.status
    };
  }
  
  /**
   * WhatsApp Business API implementation
   */
  async sendWhatsAppBusiness(credentials, phoneNumber, message) {
    const { phoneNumberId, accessToken } = credentials;
    
    const url = `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`;
    
    const response = await axios.post(url,
      {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: { body: message }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      messageId: response.data.messages[0].id,
      status: 'sent'
    };
  }
  
  /**
   * Twilio SMS implementation
   */
  async sendTwilioSMS(credentials, phoneNumber, message) {
    const { accountSid, authToken, phoneNumber: fromNumber } = credentials;
    
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    const response = await axios.post(url,
      new URLSearchParams({
        From: fromNumber,
        To: phoneNumber,
        Body: message
      }),
      {
        auth: {
          username: accountSid,
          password: authToken
        }
      }
    );
    
    return {
      messageId: response.data.sid,
      status: response.data.status
    };
  }
  
  /**
   * MSG91 SMS implementation
   */
  async sendMSG91SMS(credentials, phoneNumber, message) {
    const { authKey, senderId } = credentials;
    
    const url = `https://api.msg91.com/api/v5/flow/`;
    
    const response = await axios.post(url,
      {
        sender: senderId,
        mobiles: phoneNumber,
        message: message
      },
      {
        headers: {
          'authkey': authKey,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      messageId: response.data.request_id,
      status: response.data.type
    };
  }
  
  /**
   * TextLocal SMS implementation
   */
  async sendTextLocalSMS(credentials, phoneNumber, message) {
    const { apiKey, sender } = credentials;
    
    const url = 'https://api.textlocal.in/send/';
    
    const response = await axios.post(url,
      new URLSearchParams({
        apikey: apiKey,
        sender: sender,
        numbers: phoneNumber,
        message: message
      })
    );
    
    return {
      messageId: response.data.messages[0]?.id,
      status: response.data.status
    };
  }
  
  /**
   * Fast2SMS implementation
   */
  async sendFast2SMS(credentials, phoneNumber, message) {
    const { apiKey, senderId } = credentials;
    
    const url = 'https://www.fast2sms.com/dev/bulkV2';
    
    const response = await axios.post(url,
      {
        sender_id: senderId,
        message: message,
        route: 'v3',
        numbers: phoneNumber
      },
      {
        headers: {
          'authorization': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      messageId: response.data.message_id,
      status: response.data.return ? 'success' : 'failed'
    };
  }
  
  /**
   * AWS SES Email implementation (simplified)
   */
  async sendAWSSESEmail(credentials, email, subject, message) {
    // AWS SES requires AWS SDK - simplified implementation
    return {
      messageId: 'test-' + Date.now(),
      status: 'simulated',
      note: 'AWS SES requires full SDK integration'
    };
  }
  
  /**
   * SendGrid Email implementation
   */
  async sendSendGridEmail(credentials, email, subject, message) {
    const { apiKey, fromEmail, fromName } = credentials;
    
    const url = 'https://api.sendgrid.com/v3/mail/send';
    
    const response = await axios.post(url,
      {
        personalizations: [{
          to: [{ email }],
          subject
        }],
        from: {
          email: fromEmail,
          name: fromName || 'Campaign System'
        },
        content: [{
          type: 'text/plain',
          value: message
        }]
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      messageId: response.headers['x-message-id'],
      status: 'sent'
    };
  }
  
  /**
   * Mailgun Email implementation
   */
  async sendMailgunEmail(credentials, email, subject, message) {
    const { apiKey, domain, fromEmail } = credentials;
    
    const url = `https://api.mailgun.net/v3/${domain}/messages`;
    
    const response = await axios.post(url,
      new URLSearchParams({
        from: fromEmail,
        to: email,
        subject: subject,
        text: message
      }),
      {
        auth: {
          username: 'api',
          password: apiKey
        }
      }
    );
    
    return {
      messageId: response.data.id,
      status: 'sent'
    };
  }
  
  /**
   * SMTP Email implementation
   */
  async sendSMTPEmail(credentials, email, subject, message) {
    const nodemailer = require('nodemailer');
    
    const { host, port, username, password, fromEmail, secure } = credentials;
    
    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(port),
      secure: secure || false,
      auth: {
        user: username,
        pass: password
      }
    });
    
    const info = await transporter.sendMail({
      from: fromEmail,
      to: email,
      subject: subject,
      text: message
    });
    
    return {
      messageId: info.messageId,
      status: 'sent'
    };
  }
}

module.exports = new TemplateTestService();
