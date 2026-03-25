const crypto = require('crypto');

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

class EncryptionService {
  constructor() {
    // Get encryption key from environment variable
    this.masterKey = process.env.ENCRYPTION_KEY;
    
    if (!this.masterKey) {
      throw new Error('ENCRYPTION_KEY environment variable is not set');
    }
    
    if (this.masterKey.length < 32) {
      throw new Error('ENCRYPTION_KEY must be at least 32 characters long');
    }
  }
  
  /**
   * Derive encryption key from master key using PBKDF2
   */
  deriveKey(salt) {
    return crypto.pbkdf2Sync(
      this.masterKey,
      salt,
      ITERATIONS,
      KEY_LENGTH,
      'sha512'
    );
  }
  
  /**
   * Encrypt data using AES-256-GCM
   * @param {string|object} data - Data to encrypt
   * @returns {string} - Encrypted data in format: salt:iv:tag:encryptedData
   */
  encrypt(data) {
    try {
      // Convert object to JSON string if needed
      const plaintext = typeof data === 'object' ? JSON.stringify(data) : String(data);
      
      // Generate random salt and IV
      const salt = crypto.randomBytes(SALT_LENGTH);
      const iv = crypto.randomBytes(IV_LENGTH);
      
      // Derive key from master key and salt
      const key = this.deriveKey(salt);
      
      // Create cipher
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
      
      // Encrypt data
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get authentication tag
      const tag = cipher.getAuthTag();
      
      // Combine salt, iv, tag, and encrypted data
      return `${salt.toString('hex')}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }
  
  /**
   * Decrypt data using AES-256-GCM
   * @param {string} encryptedData - Encrypted data in format: salt:iv:tag:encryptedData
   * @returns {string|object} - Decrypted data
   */
  decrypt(encryptedData) {
    try {
      // Split encrypted data into components
      const parts = encryptedData.split(':');
      
      if (parts.length !== 4) {
        throw new Error('Invalid encrypted data format');
      }
      
      const salt = Buffer.from(parts[0], 'hex');
      const iv = Buffer.from(parts[1], 'hex');
      const tag = Buffer.from(parts[2], 'hex');
      const encrypted = parts[3];
      
      // Derive key from master key and salt
      const key = this.deriveKey(salt);
      
      // Create decipher
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(tag);
      
      // Decrypt data
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      // Try to parse as JSON, return as string if parsing fails
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }
  
  /**
   * Mask sensitive data for display (show only last 4 characters)
   * @param {string} data - Data to mask
   * @returns {string} - Masked data
   */
  mask(data) {
    if (!data || data.length <= 4) {
      return '****';
    }
    return '*'.repeat(data.length - 4) + data.slice(-4);
  }
  
  /**
   * Encrypt credential object fields
   * @param {object} credentials - Credential object with sensitive fields
   * @param {array} sensitiveFields - Array of field names to encrypt
   * @returns {object} - Credential object with encrypted fields
   */
  encryptCredentials(credentials, sensitiveFields = []) {
    const encrypted = { ...credentials };
    
    // Default sensitive fields if not provided
    const fieldsToEncrypt = sensitiveFields.length > 0 ? sensitiveFields : [
      'apiKey', 'authToken', 'accountSid', 'secretAccessKey', 
      'password', 'accessKeyId', 'businessAccountId', 'phoneNumberId'
    ];
    
    fieldsToEncrypt.forEach(field => {
      if (encrypted[field]) {
        encrypted[field] = this.encrypt(encrypted[field]);
      }
    });
    
    return encrypted;
  }
  
  /**
   * Decrypt credential object fields
   * @param {object} credentials - Credential object with encrypted fields
   * @param {array} sensitiveFields - Array of field names to decrypt
   * @returns {object} - Credential object with decrypted fields
   */
  decryptCredentials(credentials, sensitiveFields = []) {
    const decrypted = { ...credentials };
    
    // Default sensitive fields if not provided
    const fieldsToDecrypt = sensitiveFields.length > 0 ? sensitiveFields : [
      'apiKey', 'authToken', 'accountSid', 'secretAccessKey', 
      'password', 'accessKeyId', 'businessAccountId', 'phoneNumberId'
    ];
    
    fieldsToDecrypt.forEach(field => {
      if (decrypted[field] && typeof decrypted[field] === 'string' && decrypted[field].includes(':')) {
        try {
          decrypted[field] = this.decrypt(decrypted[field]);
        } catch (error) {
          // Field might not be encrypted, leave as is
        }
      }
    });
    
    return decrypted;
  }
  
  /**
   * Mask credential object fields for frontend display
   * @param {object} credentials - Credential object
   * @param {array} sensitiveFields - Array of field names to mask
   * @returns {object} - Credential object with masked fields
   */
  maskCredentials(credentials, sensitiveFields = []) {
    const masked = { ...credentials };
    
    // Default sensitive fields if not provided
    const fieldsToMask = sensitiveFields.length > 0 ? sensitiveFields : [
      'apiKey', 'authToken', 'accountSid', 'secretAccessKey', 
      'password', 'accessKeyId', 'businessAccountId', 'phoneNumberId'
    ];
    
    fieldsToMask.forEach(field => {
      if (masked[field]) {
        masked[field] = this.mask(masked[field]);
      }
    });
    
    return masked;
  }
}

// Export singleton instance
module.exports = new EncryptionService();
