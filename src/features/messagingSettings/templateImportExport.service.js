const MessageTemplate = require('./MessageTemplate.model');
const templateService = require('./template.service');
const logger = require('../../config/logger');

class TemplateImportExportService {
  /**
   * Export templates to JSON
   */
  async exportTemplates(type = null) {
    try {
      const templates = await templateService.getTemplates(type);
      
      // Format templates for export
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        templates: templates.map(template => ({
          name: template.name,
          type: template.type,
          subject: template.subject,
          content: template.content,
          variables: template.variables
        }))
      };
      
      logger.info(`Exported ${templates.length} templates (type: ${type || 'all'})`);
      
      return exportData;
    } catch (error) {
      logger.error(`Error exporting templates: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Import templates from JSON
   */
  async importTemplates(importData, userId) {
    try {
      if (!importData || !importData.templates || !Array.isArray(importData.templates)) {
        throw new Error('Invalid import data format');
      }
      
      const results = {
        success: [],
        failed: [],
        skipped: []
      };
      
      for (const templateData of importData.templates) {
        try {
          // Validate template structure
          const validation = this.validateImportTemplate(templateData);
          
          if (!validation.valid) {
            results.failed.push({
              name: templateData.name,
              reason: validation.errors.join(', ')
            });
            continue;
          }
          
          // Check for duplicate name
          let templateName = templateData.name;
          const existing = await MessageTemplate.findOne({
            name: templateName,
            type: templateData.type
          });
          
          if (existing) {
            // Append numeric suffix to avoid conflict
            templateName = await this.getUniqueTemplateName(
              templateData.name,
              templateData.type
            );
            
            results.skipped.push({
              originalName: templateData.name,
              newName: templateName,
              reason: 'Name conflict - renamed'
            });
          }
          
          // Validate variables
          const invalidVars = templateService.validateVariables(templateData.variables || []);
          
          if (invalidVars.length > 0) {
            results.failed.push({
              name: templateData.name,
              reason: `Invalid variables: ${invalidVars.join(', ')}`
            });
            continue;
          }
          
          // Create template
          const template = new MessageTemplate({
            name: templateName,
            type: templateData.type,
            subject: templateData.subject,
            content: templateData.content,
            variables: templateData.variables || [],
            createdBy: userId,
            updatedBy: userId
          });
          
          await template.save();
          
          results.success.push({
            name: templateName,
            type: templateData.type
          });
          
        } catch (error) {
          results.failed.push({
            name: templateData.name,
            reason: error.message
          });
        }
      }
      
      logger.info(`Import completed: ${results.success.length} success, ${results.failed.length} failed, ${results.skipped.length} renamed`);
      
      return results;
    } catch (error) {
      logger.error(`Error importing templates: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Validate imported template structure
   */
  validateImportTemplate(template) {
    const errors = [];
    
    if (!template.name || template.name.trim() === '') {
      errors.push('Template name is required');
    }
    
    if (!template.type || !['whatsapp', 'sms', 'email'].includes(template.type)) {
      errors.push('Invalid or missing template type');
    }
    
    if (!template.content || template.content.trim() === '') {
      errors.push('Template content is required');
    }
    
    if (template.type === 'email' && (!template.subject || template.subject.trim() === '')) {
      errors.push('Subject is required for email templates');
    }
    
    // Validate variables format
    if (template.variables && !Array.isArray(template.variables)) {
      errors.push('Variables must be an array');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Get unique template name by appending numeric suffix
   */
  async getUniqueTemplateName(baseName, type) {
    let counter = 1;
    let uniqueName = `${baseName} (${counter})`;
    
    while (await MessageTemplate.findOne({ name: uniqueName, type })) {
      counter++;
      uniqueName = `${baseName} (${counter})`;
    }
    
    return uniqueName;
  }
  
  /**
   * Export templates as downloadable file
   */
  generateExportFile(exportData) {
    return {
      filename: `templates_${exportData.exportDate.split('T')[0]}.json`,
      content: JSON.stringify(exportData, null, 2),
      contentType: 'application/json'
    };
  }
  
  /**
   * Parse imported file
   */
  parseImportFile(fileContent) {
    try {
      const data = JSON.parse(fileContent);
      
      if (!data.templates || !Array.isArray(data.templates)) {
        throw new Error('Invalid file format: missing templates array');
      }
      
      return data;
    } catch (error) {
      throw new Error(`Failed to parse import file: ${error.message}`);
    }
  }
}

module.exports = new TemplateImportExportService();
