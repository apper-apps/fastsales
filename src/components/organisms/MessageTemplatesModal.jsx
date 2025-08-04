import React, { useState, useEffect } from 'react';
import Button from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import Input from '@/components/atoms/Input';
import Label from '@/components/atoms/Label';
import Select from '@/components/atoms/Select';
import ApperIcon from '@/components/ApperIcon';
import { toast } from 'react-toastify';
import messageTemplatesService from '@/services/api/messageTemplatesService';

const MessageTemplatesModal = ({ isOpen, onClose, onSelectTemplate }) => {
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    category: 'Initial Contact',
    content: '',
    tags: []
  });

  // Load templates and categories on mount
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      loadCategories();
    }
  }, [isOpen]);

  // Filter templates when search or category changes
  useEffect(() => {
    filterTemplates();
  }, [templates, searchQuery, selectedCategory]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await messageTemplatesService.getAll();
      setTemplates(data);
    } catch (error) {
      toast.error('Failed to load templates');
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await messageTemplatesService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const filterTemplates = async () => {
    try {
      const filtered = await messageTemplatesService.search(searchQuery, selectedCategory || null);
      setFilteredTemplates(filtered);
    } catch (error) {
      console.error('Error filtering templates:', error);
    }
  };

  const handleSelectTemplate = (template) => {
    if (onSelectTemplate) {
      onSelectTemplate(template);
    }
    onClose();
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    
    if (!newTemplate.name.trim() || !newTemplate.content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const created = await messageTemplatesService.create({
        ...newTemplate,
        tags: newTemplate.tags.filter(tag => tag.trim())
      });
      
      setTemplates(prev => [...prev, created]);
      setNewTemplate({ name: '', category: 'Initial Contact', content: '', tags: [] });
      setIsCreating(false);
      toast.success('Template created successfully');
    } catch (error) {
      toast.error('Failed to create template');
      console.error('Error creating template:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      await messageTemplatesService.delete(templateId);
      setTemplates(prev => prev.filter(t => t.Id !== templateId));
      setSelectedTemplate(null);
      toast.success('Template deleted successfully');
    } catch (error) {
      toast.error('Failed to delete template');
      console.error('Error deleting template:', error);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Initial Contact': 'UserPlus',
      'Invitations': 'Mail',
      'Follow-ups': 'Clock',
      'Objection Handling': 'Shield'
    };
    return icons[category] || 'MessageSquare';
  };

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...categories.map(cat => ({ value: cat, label: cat }))
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex h-full">
          {/* Left Sidebar */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Message Templates</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreating(true)}
                  className="flex items-center gap-2"
                >
                  <ApperIcon name="Plus" size={16} />
                  New
                </Button>
              </div>

              {/* Search and Filter */}
              <div className="space-y-3">
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  options={categoryOptions}
                />
              </div>
            </div>

            {/* Templates List */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <ApperIcon name="Loader2" size={24} className="animate-spin text-gray-400" />
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ApperIcon name="Search" size={48} className="mx-auto mb-3 opacity-50" />
                  <p>No templates found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.Id}
                      onClick={() => setSelectedTemplate(template)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedTemplate?.Id === template.Id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <ApperIcon 
                          name={getCategoryIcon(template.category)} 
                          size={16} 
                          className="text-gray-400 mt-0.5 flex-shrink-0" 
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{template.name}</h4>
                          <p className="text-xs text-gray-500 mt-1">{template.category}</p>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {template.content.substring(0, 100)}...
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {isCreating ? 'Create New Template' : selectedTemplate ? 'Template Preview' : 'Select a Template'}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="flex items-center gap-2"
              >
                <ApperIcon name="X" size={16} />
                Close
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {isCreating ? (
                <form onSubmit={handleCreateTemplate} className="space-y-4">
                  <div>
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input
                      id="template-name"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter template name"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="template-category">Category</Label>
                    <Select
                      id="template-category"
                      value={newTemplate.category}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                      options={categories.map(cat => ({ value: cat, label: cat }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="template-content">Content</Label>
                    <textarea
                      id="template-content"
                      value={newTemplate.content}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Enter your template content. Use [Name] for personalization."
                      className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
                      required
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Creating...' : 'Create Template'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreating(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : selectedTemplate ? (
                <div className="space-y-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900">{selectedTemplate.name}</h4>
                      <div className="flex items-center gap-2 mt-2">
                        <ApperIcon 
                          name={getCategoryIcon(selectedTemplate.category)} 
                          size={16} 
                          className="text-gray-400" 
                        />
                        <span className="text-sm text-gray-600">{selectedTemplate.category}</span>
                      </div>
                    </div>
                    {!selectedTemplate.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTemplate(selectedTemplate.Id)}
                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                      >
                        <ApperIcon name="Trash2" size={16} />
                      </Button>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Template Content:</Label>
                    <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                      {selectedTemplate.content}
                    </p>
                  </div>

                  {selectedTemplate.tags && selectedTemplate.tags.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Tags:</Label>
                      <div className="flex flex-wrap gap-2">
                        {selectedTemplate.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button onClick={() => handleSelectTemplate(selectedTemplate)}>
                      Use This Template
                    </Button>
                    <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                      Back to List
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <ApperIcon name="MessageSquare" size={64} className="mb-4 opacity-50" />
                  <h4 className="text-lg font-medium mb-2">Select a Template</h4>
                  <p className="text-center max-w-md">
                    Choose a template from the list to preview its content and use it in your contact activities.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MessageTemplatesModal;