const MessageTemplate = require('./MessageTemplate.model');
const MessagingCampaign = require('../messagingCampaign/model');
const logger = require('../../config/logger');

class TemplateService {
  /**
   * Valid voter fields for variable placeholders
   */
  validVariables = [
    'voterName', 'name', 'firstName', 'lastName', 'fatherName', 'husbandName',
    'area', 'district', 'state', 'block', 'gramPanchayat', 'ward',
    'voterId', 'epicNumber', 'phoneNumber', 'age', 'gender',
    'caste', 'religion', 'education', 'occupation',
    'address', 'pincode', 'pollingStation', 'boothNumber'
  ];
  
  /**
   * Create a new template
   */
  async createTemplate(templateData, userId) {
    try {
      const { name, type, subject, content } = templateData;
      
      // Check for duplicate name within type
      const existing = await MessageTemplate.findOne({ name, type });
      if (existing) {
        throw new Error(`Template with name "${name}" already exists for ${type}`);
      }
      
      // Extract and validate variables
      const variables = this.extractVariables(content);
      const invalidVars = this.validateVariables(variables);
      
      if (invalidVars.length > 0) {
        throw new Error(`Invalid variable placeholders: ${invalidVars.join(', ')}`);
      }
      
      // Create template
      const template = new MessageTemplate({
        name,
        type,
        subject,
        content,
        variables,
        createdBy: userId,
        updatedBy: userId
      });
      
      await template.save();
      
      logger.info(`Template created: ${name} (${type}) by user ${userId}`);
      
      return template;
    } catch (error) {
      logger.error(`Error creating template: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Update an existing template
   */
  async updateTemplate(templateId, templateData, userId) {
    try {
      const template = await MessageTemplate.findById(templateId);
      
      if (!template) {
        throw new Error('Template not found');
      }
      
      const { name, subject, content } = templateData;
      
      // Check for duplicate name if name is being changed
      if (name && name !== template.name) {
        const existing = await MessageTemplate.findOne({ 
          name, 
          type: template.type,
          _id: { $ne: templateId }
        });
        
        if (existing) {
          throw new Error(`Template with name "${name}" already exists for ${template.type}`);
        }
        
        template.name = name;
      }
      
      // Update content and extract variables
      if (content) {
        const variables = this.extractVariables(content);
        const invalidVars = this.validateVariables(variables);
        
        if (invalidVars.length > 0) {
          throw new Error(`Invalid variable placeholders: ${invalidVars.join(', ')}`);
        }
        
        template.content = content;
        template.variables = variables;
      }
      
      if (subject !== undefined) {
        template.subject = subject;
      }
      
      template.updatedBy = userId;
      
      await template.save();
      
      logger.info(`Template updated: ${template.name} (${template.type}) by user ${userId}`);
      
      return template;
    } catch (error) {
      logger.error(`Error updating template: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Delete a template (with usage check)
   */
  async deleteTemplate(templateId) {
    try {
      const template = await MessageTemplate.findById(templateId);
      
      if (!template) {
        throw new Error('Template not found');
      }
      
      // Check if template is used in active campaigns
      const activeCampaigns = await MessagingCampaign.countDocuments({
        templateId: templateId,
        status: { $in: ['DRAFT', 'SCHEDULED', 'IN_PROGRESS'] }
      });
      
      if (activeCampaigns > 0) {
        throw new Error(`Cannot delete template. It is used in ${activeCampaigns} active campaign(s)`);
      }
      
      await MessageTemplate.findByIdAndDelete(templateId);
      
      logger.info(`Template deleted: ${template.name} (${template.type})`);
      
      return { success: true, message: 'Template deleted successfully' };
    } catch (error) {
      logger.error(`Error deleting template: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get templates by type
   */
  async getTemplates(type = null, userId = null) {
    try {
      const query = {};
      
      if (type) {
        query.type = type;
      }
      
      if (userId) {
        query.createdBy = userId;
      }
      
      const templates = await MessageTemplate.find(query)
        .sort({ type: 1, name: 1 })
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .lean();
      
      return templates;
    } catch (error) {
      logger.error(`Error getting templates: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get template by ID
   */
  async getTemplateById(templateId) {
    try {
      const template = await MessageTemplate.findById(templateId)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .lean();
      
      if (!template) {
        throw new Error('Template not found');
      }
      
      return template;
    } catch (error) {
      logger.error(`Error getting template: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Extract variable placeholders from content
   */
  extractVariables(content) {
    const regex = /\{\{(\w+)\}\}/g;
    const variables = [];
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      const variable = match[1];
      if (!variables.includes(variable)) {
        variables.push(variable);
      }
    }
    
    return variables;
  }
  
  /**
   * Validate variable placeholders
   */
  validateVariables(variables) {
    const invalidVars = [];
    
    variables.forEach(variable => {
      if (!this.validVariables.includes(variable)) {
        invalidVars.push(`{{${variable}}}`);
      }
    });
    
    return invalidVars;
  }
  
  /**
   * Render template with voter data
   */
  renderTemplate(template, voterData) {
    let rendered = template.content;
    
    // Replace all variable placeholders
    template.variables.forEach(variable => {
      const value = voterData[variable] || '';
      const regex = new RegExp(`\\{\\{${variable}\\}\\}`, 'g');
      rendered = rendered.replace(regex, value);
    });
    
    return rendered;
  }
  
  /**
   * Render template with sample data
   */
  renderTemplateWithSampleData(template) {
    const sampleData = {
      voterName: 'राम कुमार',
      name: 'राम कुमार',
      firstName: 'राम',
      lastName: 'कुमार',
      fatherName: 'श्याम लाल',
      husbandName: '',
      area: 'वार्ड 5',
      district: 'लखनऊ',
      state: 'उत्तर प्रदेश',
      block: 'मोहनलालगंज',
      gramPanchayat: 'रामनगर',
      ward: 'वार्ड 5',
      voterId: 'ABC1234567',
      epicNumber: 'ABC1234567',
      phoneNumber: '+919876543210',
      age: '35',
      gender: 'MALE',
      caste: 'GENERAL',
      religion: 'HINDU',
      education: 'Graduate',
      occupation: 'Business',
      address: 'मकान नं 123, राम नगर',
      pincode: '226001',
      pollingStation: 'प्राथमिक विद्यालय',
      boothNumber: '45'
    };
    
    return this.renderTemplate(template, sampleData);
  }
  
  /**
   * Update template usage statistics
   */
  async updateUsageStats(templateId) {
    try {
      await MessageTemplate.findByIdAndUpdate(
        templateId,
        {
          $inc: { usageCount: 1 },
          lastUsedAt: new Date()
        }
      );
    } catch (error) {
      logger.error(`Error updating template usage stats: ${error.message}`);
    }
  }
  
  /**
   * Get template usage count
   */
  async getTemplateUsage(templateId) {
    try {
      const template = await MessageTemplate.findById(templateId);
      
      if (!template) {
        throw new Error('Template not found');
      }
      
      // Count campaigns using this template
      const campaignCount = await MessagingCampaign.countDocuments({
        templateId: templateId
      });
      
      const activeCampaignCount = await MessagingCampaign.countDocuments({
        templateId: templateId,
        status: { $in: ['DRAFT', 'SCHEDULED', 'IN_PROGRESS'] }
      });
      
      return {
        usageCount: template.usageCount,
        lastUsedAt: template.lastUsedAt,
        totalCampaigns: campaignCount,
        activeCampaigns: activeCampaignCount
      };
    } catch (error) {
      logger.error(`Error getting template usage: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new TemplateService();
