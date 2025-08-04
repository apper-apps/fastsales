import mockTemplates from '@/services/mockData/messageTemplates.json';

// In a real app, this would be stored in a database or localStorage
let templates = [...mockTemplates];
let nextId = Math.max(...templates.map(t => t.Id)) + 1;

const messageTemplatesService = {
  // Get all templates
  getAll: () => {
    return Promise.resolve([...templates]);
  },

  // Get template by ID
  getById: (id) => {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      return Promise.reject(new Error('Invalid template ID'));
    }
    
    const template = templates.find(t => t.Id === numericId);
    if (!template) {
      return Promise.reject(new Error('Template not found'));
    }
    
    return Promise.resolve({ ...template });
  },

  // Get templates by category
  getByCategory: (category) => {
    const filtered = templates.filter(t => t.category === category);
    return Promise.resolve([...filtered]);
  },

  // Search templates
  search: (query, category = null) => {
    let filtered = templates;
    
    if (category) {
      filtered = filtered.filter(t => t.category === category);
    }
    
    if (query) {
      const searchLower = query.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(searchLower) ||
        t.content.toLowerCase().includes(searchLower) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    return Promise.resolve([...filtered]);
  },

  // Create new template
  create: (templateData) => {
    const newTemplate = {
      Id: nextId++,
      name: templateData.name || 'Untitled Template',
      category: templateData.category || 'Initial Contact',
      content: templateData.content || '',
      tags: templateData.tags || [],
      isDefault: false,
      createdAt: new Date().toISOString()
    };
    
    templates.push(newTemplate);
    return Promise.resolve({ ...newTemplate });
  },

  // Update template
  update: (id, templateData) => {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      return Promise.reject(new Error('Invalid template ID'));
    }
    
    const index = templates.findIndex(t => t.Id === numericId);
    if (index === -1) {
      return Promise.reject(new Error('Template not found'));
    }
    
    const updatedTemplate = {
      ...templates[index],
      ...templateData,
      Id: numericId, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };
    
    templates[index] = updatedTemplate;
    return Promise.resolve({ ...updatedTemplate });
  },

  // Delete template
  delete: (id) => {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      return Promise.reject(new Error('Invalid template ID'));
    }
    
    const index = templates.findIndex(t => t.Id === numericId);
    if (index === -1) {
      return Promise.reject(new Error('Template not found'));
    }
    
    templates.splice(index, 1);
    return Promise.resolve();
  },

  // Get available categories
  getCategories: () => {
    const categories = [...new Set(templates.map(t => t.category))];
    return Promise.resolve(categories);
  }
};

export default messageTemplatesService;