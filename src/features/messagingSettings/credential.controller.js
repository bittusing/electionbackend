const credentialService = require('./credential.service');
const validationService = require('./validation.service');
const connectionTestService = require('./connectionTest.service');
const encryptionService = require('./encryption.service');
const logger = require('../../config/logger');

class CredentialController {
  /**
   * Save credentials
   */
  async saveCredentials(req, res) {
    try {
      const { type, provider, credentials, isPrimary } = req.body;
      const userId = req.user._id;
      
      // Validate input
      if (!type || !provider || !credentials) {
        return res.status(400).json({
          success: false,
          message: 'Type, provider, and credentials are required'
        });
      }
      
      // Validate credentials format
      const validationErrors = validationService.validateCredentials(type, provider, credentials);
      
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors
        });
      }
      
      // Save credentials
      const savedCredential = await credentialService.saveCredentials(
        type,
        provider,
        credentials,
        userId,
        isPrimary
      );
      
      // Return masked credentials
      const response = {
        ...savedCredential.toObject(),
        credentials: encryptionService.maskCredentials(savedCredential.credentials)
      };
      
      res.status(200).json({
        success: true,
        message: 'Credentials saved successfully',
        data: response
      });
    } catch (error) {
      logger.error(`Error saving credentials: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  /**
   * Get credentials by type
   */
  async getCredentialsByType(req, res) {
    try {
      const { type } = req.params;
      
      if (!['whatsapp', 'sms', 'email'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid credential type'
        });
      }
      
      const credentials = await credentialService.getCredentialsList(type);
      
      res.status(200).json({
        success: true,
        data: credentials
      });
    } catch (error) {
      logger.error(`Error getting credentials: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  /**
   * Get all credentials
   */
  async getAllCredentials(req, res) {
    try {
      const credentials = await credentialService.getCredentialsList();
      
      res.status(200).json({
        success: true,
        data: credentials
      });
    } catch (error) {
      logger.error(`Error getting all credentials: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  /**
   * Test connection
   */
  async testConnection(req, res) {
    try {
      const { type } = req.params;
      const { provider, credentials } = req.body;
      
      if (!type || !provider || !credentials) {
        return res.status(400).json({
          success: false,
          message: 'Type, provider, and credentials are required'
        });
      }
      
      // Validate credentials
      const validationErrors = validationService.validateCredentials(type, provider, credentials);
      
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors
        });
      }
      
      // Test connection
      let result;
      switch (type) {
        case 'whatsapp':
          result = await connectionTestService.testWhatsAppConnection(provider, credentials);
          break;
        case 'sms':
          result = await connectionTestService.testSMSConnection(provider, credentials);
          break;
        case 'email':
          result = await connectionTestService.testEmailConnection(provider, credentials);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid credential type'
          });
      }
      
      // Update test status in database if credential exists
      const existingCredential = await credentialService.getCredentials(type, provider);
      if (existingCredential) {
        const credential = Array.isArray(existingCredential) 
          ? existingCredential[0] 
          : existingCredential;
        
        await credentialService.saveCredentials(
          type,
          provider,
          credentials,
          req.user._id,
          credential.isPrimary
        );
      }
      
      res.status(200).json(result);
    } catch (error) {
      logger.error(`Error testing connection: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  /**
   * Get version history
   */
  async getVersionHistory(req, res) {
    try {
      const { type, provider } = req.params;
      
      const history = await credentialService.getVersionHistory(type, provider);
      
      res.status(200).json({
        success: true,
        data: history
      });
    } catch (error) {
      logger.error(`Error getting version history: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  /**
   * Restore version
   */
  async restoreVersion(req, res) {
    try {
      const { type, provider } = req.params;
      const { versionIndex } = req.body;
      const userId = req.user._id;
      
      if (versionIndex === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Version index is required'
        });
      }
      
      const credential = await credentialService.restoreVersion(
        type,
        provider,
        versionIndex,
        userId
      );
      
      // Return masked credentials
      const response = {
        ...credential.toObject(),
        credentials: encryptionService.maskCredentials(credential.credentials)
      };
      
      res.status(200).json({
        success: true,
        message: 'Version restored successfully',
        data: response
      });
    } catch (error) {
      logger.error(`Error restoring version: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  /**
   * Update priority
   */
  async updatePriority(req, res) {
    try {
      const { credentialId } = req.params;
      const { priority } = req.body;
      
      if (priority === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Priority is required'
        });
      }
      
      const credential = await credentialService.updatePriority(credentialId, priority);
      
      res.status(200).json({
        success: true,
        message: 'Priority updated successfully',
        data: credential
      });
    } catch (error) {
      logger.error(`Error updating priority: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  /**
   * Set primary credential
   */
  async setPrimary(req, res) {
    try {
      const { credentialId } = req.params;
      
      const credential = await credentialService.setPrimary(credentialId);
      
      res.status(200).json({
        success: true,
        message: 'Primary credential set successfully',
        data: credential
      });
    } catch (error) {
      logger.error(`Error setting primary credential: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  /**
   * Delete credential
   */
  async deleteCredential(req, res) {
    try {
      const { credentialId } = req.params;
      
      await credentialService.deleteCredential(credentialId);
      
      res.status(200).json({
        success: true,
        message: 'Credential deleted successfully'
      });
    } catch (error) {
      logger.error(`Error deleting credential: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  /**
   * Get usage statistics
   */
  async getStats(req, res) {
    try {
      const { type, provider } = req.params;
      
      const stats = await credentialService.getStats(type, provider);
      
      if (!stats) {
        return res.status(404).json({
          success: false,
          message: 'Credential not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error(`Error getting stats: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new CredentialController();
