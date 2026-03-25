const axios = require('axios');
const logger = require('../../config/logger');

class ConnectionTestService {
  /**
   * Test WhatsApp connection
   */
  async testWhatsAppConnection(provider, credentials, timeout = 10000) {
    try {
      switch (provider) {
        case 'twilio':
          return await this.testTwilioWhatsApp(credentials, timeout);
        case 'gupshup':
          return await this.testGupshupWhatsApp(credentials, timeout);
        case 'whatsapp-business':
          return await this.testWhatsAppBusiness(credentials, timeout);
        default:
          throw new Error(`Unsupported WhatsApp provider: ${provider}`);
      }
    } catch (error) {
      logger.error(`WhatsApp connection test failed: ${error.message}`);
      return {
        success: false,
        message: error.message,
        details: error.response?.data || null
      };
    }
  }
  
  /**
   * Test SMS connection
   */
  async testSMSConnection(provider, credentials, timeout = 10000) {
    try {
      switch (provider) {
        case 'twilio':
          return await this.testTwilioSMS(credentials, timeout);
        case 'msg91':
          return await this.testMSG91(credentials, timeout);
        case 'textlocal':
          return await this.testTextLocal(credentials, timeout);
        case 'fast2sms':
          return await this.testFast2SMS(credentials, timeout);
        default:
          throw new Error(`Unsupported SMS provider: ${provider}`);
      }
    } catch (error) {
      logger.error(`SMS connection test failed: ${error.message}`);
      return {
        success: false,
        message: error.message,
        details: error.response?.data || null
      };
    }
  }
  
  /**
   * Test Email connection
   */
  async testEmailConnection(provider, credentials, timeout = 10000) {
    try {
      switch (provider) {
        case 'aws-ses':
          return await this.testAWSSES(credentials, timeout);
        case 'sendgrid':
          return await this.testSendGrid(credentials, timeout);
        case 'mailgun':
          return await this.testMailgun(credentials, timeout);
        case 'smtp':
          return await this.testSMTP(credentials, timeout);
        default:
          throw new Error(`Unsupported Email provider: ${provider}`);
      }
    } catch (error) {
      logger.error(`Email connection test failed: ${error.message}`);
      return {
        success: false,
        message: error.message,
        details: error.response?.data || null
      };
    }
  }
  
  /**
   * Test Twilio WhatsApp
   */
  async testTwilioWhatsApp(credentials, timeout) {
    const { accountSid, authToken, phoneNumber } = credentials;
    
    // Test by fetching account details
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`;
    
    const response = await axios.get(url, {
      auth: {
        username: accountSid,
        password: authToken
      },
      timeout
    });
    
    if (response.status === 200) {
      return {
        success: true,
        message: 'Twilio WhatsApp connection successful',
        details: {
          accountName: response.data.friendly_name,
          status: response.data.status,
          phoneNumber
        }
      };
    }
    
    throw new Error('Failed to verify Twilio credentials');
  }
  
  /**
   * Test Gupshup WhatsApp
   */
  async testGupshupWhatsApp(credentials, timeout) {
    const { apiKey, appName } = credentials;
    
    // Test by checking app status
    const url = 'https://api.gupshup.io/sm/api/v1/app/opt/in';
    
    const response = await axios.get(url, {
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout
    });
    
    if (response.status === 200) {
      return {
        success: true,
        message: 'Gupshup WhatsApp connection successful',
        details: {
          appName,
          status: 'active'
        }
      };
    }
    
    throw new Error('Failed to verify Gupshup credentials');
  }
  
  /**
   * Test WhatsApp Business API
   */
  async testWhatsAppBusiness(credentials, timeout) {
    const { phoneNumberId, accessToken } = credentials;
    
    // Test by fetching phone number details
    const url = `https://graph.facebook.com/v17.0/${phoneNumberId}`;
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      timeout
    });
    
    if (response.status === 200) {
      return {
        success: true,
        message: 'WhatsApp Business API connection successful',
        details: {
          phoneNumber: response.data.display_phone_number,
          verifiedName: response.data.verified_name,
          quality: response.data.quality_rating
        }
      };
    }
    
    throw new Error('Failed to verify WhatsApp Business API credentials');
  }
  
  /**
   * Test Twilio SMS
   */
  async testTwilioSMS(credentials, timeout) {
    const { accountSid, authToken, phoneNumber } = credentials;
    
    // Test by fetching account details
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`;
    
    const response = await axios.get(url, {
      auth: {
        username: accountSid,
        password: authToken
      },
      timeout
    });
    
    if (response.status === 200) {
      return {
        success: true,
        message: 'Twilio SMS connection successful',
        details: {
          accountName: response.data.friendly_name,
          status: response.data.status,
          phoneNumber
        }
      };
    }
    
    throw new Error('Failed to verify Twilio credentials');
  }
  
  /**
   * Test MSG91
   */
  async testMSG91(credentials, timeout) {
    const { authKey, senderId } = credentials;
    
    // Test by checking balance
    const url = `https://api.msg91.com/api/balance.php?authkey=${authKey}`;
    
    const response = await axios.get(url, { timeout });
    
    if (response.status === 200 && response.data) {
      return {
        success: true,
        message: 'MSG91 connection successful',
        details: {
          senderId,
          balance: response.data
        }
      };
    }
    
    throw new Error('Failed to verify MSG91 credentials');
  }
  
  /**
   * Test TextLocal
   */
  async testTextLocal(credentials, timeout) {
    const { apiKey, sender } = credentials;
    
    // Test by checking balance
    const url = 'https://api.textlocal.in/balance/';
    
    const response = await axios.post(url, 
      `apikey=${apiKey}`,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout
      }
    );
    
    if (response.status === 200 && response.data.status === 'success') {
      return {
        success: true,
        message: 'TextLocal connection successful',
        details: {
          sender,
          balance: response.data.balance
        }
      };
    }
    
    throw new Error('Failed to verify TextLocal credentials');
  }
  
  /**
   * Test Fast2SMS
   */
  async testFast2SMS(credentials, timeout) {
    const { apiKey, senderId } = credentials;
    
    // Test by checking wallet balance
    const url = 'https://www.fast2sms.com/dev/wallet';
    
    const response = await axios.get(url, {
      headers: {
        'authorization': apiKey
      },
      timeout
    });
    
    if (response.status === 200 && response.data.return) {
      return {
        success: true,
        message: 'Fast2SMS connection successful',
        details: {
          senderId,
          balance: response.data.wallet
        }
      };
    }
    
    throw new Error('Failed to verify Fast2SMS credentials');
  }
  
  /**
   * Test AWS SES
   */
  async testAWSSES(credentials, timeout) {
    // AWS SES requires AWS SDK, simplified test
    const { accessKeyId, secretAccessKey, region, fromEmail } = credentials;
    
    // For now, just validate credentials format
    if (accessKeyId && secretAccessKey && region && fromEmail) {
      return {
        success: true,
        message: 'AWS SES credentials validated (format check)',
        details: {
          region,
          fromEmail,
          note: 'Full connection test requires AWS SDK integration'
        }
      };
    }
    
    throw new Error('Invalid AWS SES credentials');
  }
  
  /**
   * Test SendGrid
   */
  async testSendGrid(credentials, timeout) {
    const { apiKey, fromEmail } = credentials;
    
    // Test by verifying API key
    const url = 'https://api.sendgrid.com/v3/scopes';
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      timeout
    });
    
    if (response.status === 200) {
      return {
        success: true,
        message: 'SendGrid connection successful',
        details: {
          fromEmail,
          scopes: response.data.scopes?.length || 0
        }
      };
    }
    
    throw new Error('Failed to verify SendGrid credentials');
  }
  
  /**
   * Test Mailgun
   */
  async testMailgun(credentials, timeout) {
    const { apiKey, domain, fromEmail } = credentials;
    
    // Test by fetching domain info
    const url = `https://api.mailgun.net/v3/domains/${domain}`;
    
    const response = await axios.get(url, {
      auth: {
        username: 'api',
        password: apiKey
      },
      timeout
    });
    
    if (response.status === 200) {
      return {
        success: true,
        message: 'Mailgun connection successful',
        details: {
          domain,
          fromEmail,
          state: response.data.domain?.state
        }
      };
    }
    
    throw new Error('Failed to verify Mailgun credentials');
  }
  
  /**
   * Test SMTP
   */
  async testSMTP(credentials, timeout) {
    const nodemailer = require('nodemailer');
    
    const { host, port, username, password, secure } = credentials;
    
    // Create transporter
    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(port),
      secure: secure || false,
      auth: {
        user: username,
        pass: password
      }
    });
    
    // Verify connection
    await transporter.verify();
    
    return {
      success: true,
      message: 'SMTP connection successful',
      details: {
        host,
        port,
        username
      }
    };
  }
}

module.exports = new ConnectionTestService();
