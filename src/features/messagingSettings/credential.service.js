const MessagingCredential = require('./MessagingCredential.model');
const encryptionService = require('./encryption.service');
const logger = require('../../config/logger');

class CredentialService {
  /**
   * Save or update credentials with encryption and versioning
   */
  async saveCredentials(type, provider, credentials, userId, isPrimary = false) {
    try {
      // Encrypt sensitive fields
      const encryptedCredentials = encryptionService.encryptCredentials(credentials);
      
      // Find existing credential for this type and provider
      let credential = await MessagingCredential.findOne({ type, provider });
      
      if (credential) {
        // Save current version to history (keep last 5)
        const versionEntry = {
          credentials: credential.credentials,
          updatedBy: credential.updatedBy || userId,
          updatedAt: credential.updatedAt || new Date()
        };
        
        credential.versionHistory.unshift(versionEntry);
        
        // Keep only last 5 versions
        if (credential.versionHistory.length > 5) {
          credential.versionHistory = credential.versionHistory.slice(0, 5);
        }
        
        // Update credentials
        credential.credentials = encryptedCredentials;
        credential.updatedBy = userId;
        credential.isPrimary = isPrimary;
        credential.lastTestStatus = 'pending';
        credential.lastTestError = null;
      } else {
        // Create new credential
        credential = new MessagingCredential({
          type,
          provider,
          credentials: encryptedCredentials,
          createdBy: userId,
          updatedBy: userId,
          isPrimary,
          priority: await this.getNextPriority(type)
        });
      }
      
      await credential.save();
      
      // Log credential access
      logger.info(`Credentials saved for ${type}/${provider} by user ${userId}`);
      
      return credential;
    } catch (error) {
      logger.error(`Error saving credentials: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get credentials by type and provider (decrypted for backend use)
   */
  async getCredentials(type, provider = null) {
    try {
      const query = { type, isActive: true };
      
      if (provider) {
        query.provider = provider;
      }
      
      const credentials = provider 
        ? await MessagingCredential.findOne(query)
        : await MessagingCredential.find(query).sort({ priority: 1 });
      
      if (!credentials) {
        return null;
      }
      
      // Decrypt credentials for backend use
      if (Array.isArray(credentials)) {
        return credentials.map(cred => ({
          ...cred.toObject(),
          credentials: encryptionService.decryptCredentials(cred.credentials)
        }));
      } else {
        return {
          ...credentials.toObject(),
          credentials: encryptionService.decryptCredentials(credentials.credentials)
        };
      }
    } catch (error) {
      logger.error(`Error getting credentials: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get credentials list with masked values for frontend
   */
  async getCredentialsList(type = null) {
    try {
      const query = type ? { type } : {};
      const credentials = await MessagingCredential.find(query)
        .sort({ type: 1, priority: 1 })
        .select('-versionHistory')
        .lean();
      
      // Mask sensitive fields
      return credentials.map(cred => ({
        ...cred,
        credentials: encryptionService.maskCredentials(cred.credentials)
      }));
    } catch (error) {
      logger.error(`Error getting credentials list: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get primary credentials for a message type
   */
  async getPrimaryCredentials(type) {
    try {
      const credential = await MessagingCredential.findOne({
        type,
        isActive: true,
        isPrimary: true
      });
      
      if (!credential) {
        // If no primary, get first active credential
        const fallback = await MessagingCredential.findOne({
          type,
          isActive: true
        }).sort({ priority: 1 });
        
        return fallback ? {
          ...fallback.toObject(),
          credentials: encryptionService.decryptCredentials(fallback.credentials)
        } : null;
      }
      
      return {
        ...credential.toObject(),
        credentials: encryptionService.decryptCredentials(credential.credentials)
      };
    } catch (error) {
      logger.error(`Error getting primary credentials: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get credentials with fallback support
   */
  async getCredentialsWithFallback(type) {
    try {
      const credentials = await MessagingCredential.find({
        type,
        isActive: true
      }).sort({ priority: 1 });
      
      return credentials.map(cred => ({
        ...cred.toObject(),
        credentials: encryptionService.decryptCredentials(cred.credentials)
      }));
    } catch (error) {
      logger.error(`Error getting credentials with fallback: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Update credential priority
   */
  async updatePriority(credentialId, priority) {
    try {
      const credential = await MessagingCredential.findByIdAndUpdate(
        credentialId,
        { priority },
        { new: true }
      );
      
      return credential;
    } catch (error) {
      logger.error(`Error updating priority: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Set primary credential
   */
  async setPrimary(credentialId) {
    try {
      const credential = await MessagingCredential.findById(credentialId);
      
      if (!credential) {
        throw new Error('Credential not found');
      }
      
      credential.isPrimary = true;
      await credential.save();
      
      return credential;
    } catch (error) {
      logger.error(`Error setting primary credential: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Delete credential
   */
  async deleteCredential(credentialId) {
    try {
      const credential = await MessagingCredential.findByIdAndDelete(credentialId);
      
      if (!credential) {
        throw new Error('Credential not found');
      }
      
      logger.info(`Credential deleted: ${credential.type}/${credential.provider}`);
      
      return credential;
    } catch (error) {
      logger.error(`Error deleting credential: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get version history
   */
  async getVersionHistory(type, provider) {
    try {
      const credential = await MessagingCredential.findOne({ type, provider })
        .populate('versionHistory.updatedBy', 'name email')
        .lean();
      
      if (!credential) {
        return [];
      }
      
      // Mask credentials in history
      return credential.versionHistory.map(version => ({
        ...version,
        credentials: encryptionService.maskCredentials(version.credentials)
      }));
    } catch (error) {
      logger.error(`Error getting version history: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Restore credential from version history
   */
  async restoreVersion(type, provider, versionIndex, userId) {
    try {
      const credential = await MessagingCredential.findOne({ type, provider });
      
      if (!credential) {
        throw new Error('Credential not found');
      }
      
      if (versionIndex >= credential.versionHistory.length) {
        throw new Error('Version not found');
      }
      
      const versionToRestore = credential.versionHistory[versionIndex];
      
      // Save current version to history
      credential.versionHistory.unshift({
        credentials: credential.credentials,
        updatedBy: credential.updatedBy,
        updatedAt: credential.updatedAt
      });
      
      // Keep only last 5 versions
      if (credential.versionHistory.length > 5) {
        credential.versionHistory = credential.versionHistory.slice(0, 5);
      }
      
      // Restore version
      credential.credentials = versionToRestore.credentials;
      credential.updatedBy = userId;
      credential.lastTestStatus = 'pending';
      
      await credential.save();
      
      logger.info(`Credential version restored for ${type}/${provider} by user ${userId}`);
      
      return credential;
    } catch (error) {
      logger.error(`Error restoring version: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Update usage statistics
   */
  async updateStats(credentialId) {
    try {
      const credential = await MessagingCredential.findById(credentialId);
      
      if (!credential) {
        return;
      }
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Reset stats if needed
      if (!credential.stats.lastResetDate || credential.stats.lastResetDate < today) {
        credential.stats.messagesSentToday = 0;
        credential.stats.lastResetDate = today;
      }
      
      // Increment counters
      credential.stats.messagesSentToday += 1;
      credential.stats.messagesSentThisWeek += 1;
      credential.stats.messagesSentThisMonth += 1;
      credential.lastUsedAt = now;
      
      await credential.save();
    } catch (error) {
      logger.error(`Error updating stats: ${error.message}`);
    }
  }
  
  /**
   * Get usage statistics
   */
  async getStats(type, provider) {
    try {
      const credential = await MessagingCredential.findOne({ type, provider });
      
      if (!credential) {
        return null;
      }
      
      return {
        messagesSentToday: credential.stats.messagesSentToday || 0,
        messagesSentThisWeek: credential.stats.messagesSentThisWeek || 0,
        messagesSentThisMonth: credential.stats.messagesSentThisMonth || 0,
        lastUsedAt: credential.lastUsedAt,
        lastTestedAt: credential.lastTestedAt,
        lastTestStatus: credential.lastTestStatus,
        lastTestError: credential.lastTestError
      };
    } catch (error) {
      logger.error(`Error getting stats: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get next priority number for a type
   */
  async getNextPriority(type) {
    const maxPriority = await MessagingCredential.findOne({ type })
      .sort({ priority: -1 })
      .select('priority')
      .lean();
    
    return maxPriority ? maxPriority.priority + 1 : 0;
  }
  
  /**
   * Log credential access
   */
  logAccess(type, provider, userId) {
    logger.info(`Credential accessed: ${type}/${provider} by user ${userId}`, {
      type,
      provider,
      userId,
      timestamp: new Date()
    });
  }
}

module.exports = new CredentialService();
