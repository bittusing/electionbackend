class ValidationService {
  /**
   * Validate WhatsApp credentials based on provider
   */
  validateWhatsAppCredentials(provider, credentials) {
    const errors = [];
    
    switch (provider) {
      case 'twilio':
        if (!credentials.accountSid || credentials.accountSid.trim() === '') {
          errors.push('Account SID is required for Twilio');
        }
        if (!credentials.authToken || credentials.authToken.trim() === '') {
          errors.push('Auth Token is required for Twilio');
        }
        if (!credentials.phoneNumber || credentials.phoneNumber.trim() === '') {
          errors.push('Phone Number is required for Twilio');
        } else if (!this.isValidPhoneNumber(credentials.phoneNumber)) {
          errors.push('Invalid phone number format (use E.164 format: +1234567890)');
        }
        break;
        
      case 'gupshup':
        if (!credentials.apiKey || credentials.apiKey.trim() === '') {
          errors.push('API Key is required for Gupshup');
        }
        if (!credentials.appName || credentials.appName.trim() === '') {
          errors.push('App Name is required for Gupshup');
        }
        if (!credentials.phoneNumber || credentials.phoneNumber.trim() === '') {
          errors.push('Phone Number is required for Gupshup');
        }
        break;
        
      case 'whatsapp-business':
        if (!credentials.phoneNumberId || credentials.phoneNumberId.trim() === '') {
          errors.push('Phone Number ID is required for WhatsApp Business API');
        }
        if (!credentials.businessAccountId || credentials.businessAccountId.trim() === '') {
          errors.push('Business Account ID is required for WhatsApp Business API');
        }
        if (!credentials.accessToken || credentials.accessToken.trim() === '') {
          errors.push('Access Token is required for WhatsApp Business API');
        }
        break;
        
      default:
        errors.push(`Unknown WhatsApp provider: ${provider}`);
    }
    
    return errors;
  }
  
  /**
   * Validate SMS credentials based on provider
   */
  validateSMSCredentials(provider, credentials) {
    const errors = [];
    
    switch (provider) {
      case 'twilio':
        if (!credentials.accountSid || credentials.accountSid.trim() === '') {
          errors.push('Account SID is required for Twilio');
        }
        if (!credentials.authToken || credentials.authToken.trim() === '') {
          errors.push('Auth Token is required for Twilio');
        }
        if (!credentials.phoneNumber || credentials.phoneNumber.trim() === '') {
          errors.push('Phone Number is required for Twilio');
        }
        break;
        
      case 'msg91':
        if (!credentials.authKey || credentials.authKey.trim() === '') {
          errors.push('Auth Key is required for MSG91');
        }
        if (!credentials.senderId || credentials.senderId.trim() === '') {
          errors.push('Sender ID is required for MSG91');
        }
        if (credentials.senderId && credentials.senderId.length > 6) {
          errors.push('Sender ID must be 6 characters or less');
        }
        break;
        
      case 'textlocal':
        if (!credentials.apiKey || credentials.apiKey.trim() === '') {
          errors.push('API Key is required for TextLocal');
        }
        if (!credentials.sender || credentials.sender.trim() === '') {
          errors.push('Sender is required for TextLocal');
        }
        break;
        
      case 'fast2sms':
        if (!credentials.apiKey || credentials.apiKey.trim() === '') {
          errors.push('API Key is required for Fast2SMS');
        }
        if (!credentials.senderId || credentials.senderId.trim() === '') {
          errors.push('Sender ID is required for Fast2SMS');
        }
        break;
        
      default:
        errors.push(`Unknown SMS provider: ${provider}`);
    }
    
    return errors;
  }
  
  /**
   * Validate Email credentials based on provider
   */
  validateEmailCredentials(provider, credentials) {
    const errors = [];
    
    switch (provider) {
      case 'aws-ses':
        if (!credentials.accessKeyId || credentials.accessKeyId.trim() === '') {
          errors.push('Access Key ID is required for AWS SES');
        }
        if (!credentials.secretAccessKey || credentials.secretAccessKey.trim() === '') {
          errors.push('Secret Access Key is required for AWS SES');
        }
        if (!credentials.region || credentials.region.trim() === '') {
          errors.push('Region is required for AWS SES');
        }
        if (!credentials.fromEmail || credentials.fromEmail.trim() === '') {
          errors.push('From Email is required for AWS SES');
        } else if (!this.isValidEmail(credentials.fromEmail)) {
          errors.push('Invalid From Email format');
        }
        break;
        
      case 'sendgrid':
        if (!credentials.apiKey || credentials.apiKey.trim() === '') {
          errors.push('API Key is required for SendGrid');
        }
        if (!credentials.fromEmail || credentials.fromEmail.trim() === '') {
          errors.push('From Email is required for SendGrid');
        } else if (!this.isValidEmail(credentials.fromEmail)) {
          errors.push('Invalid From Email format');
        }
        if (credentials.fromName && credentials.fromName.trim() === '') {
          errors.push('From Name cannot be empty if provided');
        }
        break;
        
      case 'mailgun':
        if (!credentials.apiKey || credentials.apiKey.trim() === '') {
          errors.push('API Key is required for Mailgun');
        }
        if (!credentials.domain || credentials.domain.trim() === '') {
          errors.push('Domain is required for Mailgun');
        }
        if (!credentials.fromEmail || credentials.fromEmail.trim() === '') {
          errors.push('From Email is required for Mailgun');
        } else if (!this.isValidEmail(credentials.fromEmail)) {
          errors.push('Invalid From Email format');
        }
        break;
        
      case 'smtp':
        if (!credentials.host || credentials.host.trim() === '') {
          errors.push('Host is required for SMTP');
        }
        if (!credentials.port) {
          errors.push('Port is required for SMTP');
        } else if (!this.isValidPort(credentials.port)) {
          errors.push('Invalid port number (must be between 1 and 65535)');
        }
        if (!credentials.username || credentials.username.trim() === '') {
          errors.push('Username is required for SMTP');
        }
        if (!credentials.password || credentials.password.trim() === '') {
          errors.push('Password is required for SMTP');
        }
        if (!credentials.fromEmail || credentials.fromEmail.trim() === '') {
          errors.push('From Email is required for SMTP');
        } else if (!this.isValidEmail(credentials.fromEmail)) {
          errors.push('Invalid From Email format');
        }
        break;
        
      default:
        errors.push(`Unknown Email provider: ${provider}`);
    }
    
    return errors;
  }
  
  /**
   * Validate credentials based on type and provider
   */
  validateCredentials(type, provider, credentials) {
    switch (type) {
      case 'whatsapp':
        return this.validateWhatsAppCredentials(provider, credentials);
      case 'sms':
        return this.validateSMSCredentials(provider, credentials);
      case 'email':
        return this.validateEmailCredentials(provider, credentials);
      default:
        return [`Unknown credential type: ${type}`];
    }
  }
  
  /**
   * Validate email format
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  /**
   * Validate phone number format (E.164)
   */
  isValidPhoneNumber(phone) {
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  }
  
  /**
   * Validate port number
   */
  isValidPort(port) {
    const portNum = parseInt(port, 10);
    return !isNaN(portNum) && portNum >= 1 && portNum <= 65535;
  }
}

module.exports = new ValidationService();
