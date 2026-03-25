const templateService = require('./template.service');
const templateTestService = require('./templateTest.service');
const templateImportExportService = require('./templateImportExport.service');
const logger = require('../../config/logger');

class TemplateController {
  /**
   * Create template
   */
  async createTemplate(req, res) {
    try {
      const { name, type, subject, content } = req.body;
      const userId = req.user._id;
      
      if (!name || !type || !content) {
        return res.status(400).json({
          success: false,
          message: 'Name, type, and content are required'
        });
      }
      
      const template = await templateService.createTemplate(
        { name, type, subject, content },
        userId
      );
      
      res.status(201).json({
        success: true,
        message: 'Template created successfully',
        data: template
      });
    } catch (error) {
      logger.error(`Error creating template: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  /**
   * Get templates
   */
  async getTemplates(req, res) {
    try {
      const { type } = req.query;
      
      const templates = await templateService.getTemplates(type);
      
      res.status(200).json({
        success: true,
        data: templates
      });
    } catch (error) {
      logger.error(`Error getting templates: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  /**
   * Get template by ID
   */
  async getTemplateById(req, res) {
    try {
      const { id } = req.params;
      
      const template = await templateService.getTemplateById(id);
      
      res.status(200).json({
        success: true,
        data: template
      });
    } catch (error) {
      logger.error(`Error getting template: ${error.message}`);
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }
  
  /**
   * Update template
   */
  async updateTemplate(req, res) {
    try {
      const { id } = req.params;
      const { name, subject, content } = req.body;
      const userId = req.user._id;
      
      const template = await templateService.updateTemplate(
        id,
        { name, subject, content },
        userId
      );
      
      res.status(200).json({
        success: true,
        message: 'Template updated successfully',
        data: template
      });
    } catch (error) {
      logger.error(`Error updating template: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  /**
   * Delete template
   */
  async deleteTemplate(req, res) {
    try {
      const { id } = req.params;
      
      const result = await templateService.deleteTemplate(id);
      
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      logger.error(`Error deleting template: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  /**
   * Preview template
   */
  async previewTemplate(req, res) {
    try {
      const { id } = req.params;
      
      const template = await templateService.getTemplateById(id);
      const rendered = templateService.renderTemplateWithSampleData(template);
      
      res.status(200).json({
        success: true,
        data: {
          original: {
            subject: template.subject,
            content: template.content
          },
          rendered: {
            subject: template.subject,
            content: rendered
          },
          variables: template.variables
        }
      });
    } catch (error) {
      logger.error(`Error previewing template: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  /**
   * Send test message
   */
  async sendTestMessage(req, res) {
    try {
      const { id } = req.params;
      const { testContact } = req.body;
      const userId = req.user._id;
      
      if (!testContact) {
        return res.status(400).json({
          success: false,
          message: 'Test contact (phone/email) is required'
        });
      }
      
      const result = await templateTestService.sendTestMessage(id, testContact, userId);
      
      res.status(200).json(result);
    } catch (error) {
      logger.error(`Error sending test message: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  /**
   * Export templates
   */
  async exportTemplates(req, res) {
    try {
      const { type } = req.query;
      
      const exportData = await templateImportExportService.exportTemplates(type);
      const file = templateImportExportService.generateExportFile(exportData);
      
      res.setHeader('Content-Type', file.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
      res.status(200).send(file.content);
    } catch (error) {
      logger.error(`Error exporting templates: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  /**
   * Import templates
   */
  async importTemplates(req, res) {
    try {
      const { fileContent } = req.body;
      const userId = req.user._id;
      
      if (!fileContent) {
        return res.status(400).json({
          success: false,
          message: 'File content is required'
        });
      }
      
      const importData = templateImportExportService.parseImportFile(fileContent);
      const results = await templateImportExportService.importTemplates(importData, userId);
      
      res.status(200).json({
        success: true,
        message: 'Import completed',
        data: results
      });
    } catch (error) {
      logger.error(`Error importing templates: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  /**
   * Get template usage
   */
  async getTemplateUsage(req, res) {
    try {
      const { id } = req.params;
      
      const usage = await templateService.getTemplateUsage(id);
      
      res.status(200).json({
        success: true,
        data: usage
      });
    } catch (error) {
      logger.error(`Error getting template usage: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new TemplateController();
