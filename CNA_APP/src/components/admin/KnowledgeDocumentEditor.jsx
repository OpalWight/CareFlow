// Knowledge Document Editor Component
// Rich editor for creating and editing dynamic CNA knowledge documents

import React, { useState, useEffect } from 'react';
import '../../styles/admin/KnowledgeDocumentEditor.css';

const KnowledgeDocumentEditor = ({ document, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    content: '',
    skillId: 'general',
    category: 'technique',
    source: 'custom',
    criticality: 'medium',
    tags: [],
    status: 'published'
  });

  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Skill options
  const skillOptions = [
    { value: 'hand-hygiene', label: 'Hand Hygiene (Hand Washing)' },
    { value: 'elastic-stocking', label: 'Applies One Knee-High Elastic Stocking' },
    { value: 'ambulate-transfer-belt', label: 'Assists to Ambulate Using Transfer Belt' },
    { value: 'bedpan-use', label: 'Assists with Use of Bedpan' },
    { value: 'denture-cleaning', label: 'Cleans Upper or Lower Denture' },
    { value: 'radial-pulse', label: 'Counts and Records Radial Pulse' },
    { value: 'respirations', label: 'Counts and Records Respirations' },
    { value: 'ppe-gown-gloves', label: 'Donning and Removing PPE (Gown and Gloves)' },
    { value: 'dressing-affected-arm', label: 'Dresses Client with Affected (Weak) Right Arm' },
    { value: 'feeding-client', label: 'Feeds Client Who Cannot Feed Self' },
    { value: 'modified-bed-bath', label: 'Gives Modified Bed Bath' },
    { value: 'electronic-blood-pressure', label: 'Measures and Records Electronic Blood Pressure' },
    { value: 'urinary-output', label: 'Measures and Records Urinary Output' },
    { value: 'weight-measurement', label: 'Measures and Records Weight of Ambulatory Client' },
    { value: 'prom-knee-ankle', label: 'Performs Modified Passive Range of Motion (Knee and Ankle)' },
    { value: 'prom-shoulder', label: 'Performs Modified Passive Range of Motion (Shoulder)' },
    { value: 'position-on-side', label: 'Positions Resident on One Side' },
    { value: 'catheter-care-female', label: 'Provides Catheter Care for Female' },
    { value: 'foot-care', label: 'Provides Foot Care on One Foot' },
    { value: 'mouth-care', label: 'Provides Mouth Care' },
    { value: 'perineal-care-female', label: 'Provides Perineal Care for Female' },
    { value: 'transfer-bed-wheelchair', label: 'Transfers from Bed to Wheelchair Using Transfer Belt' },
    { value: 'manual-blood-pressure', label: 'Measures and Records Manual Blood Pressure' },
    { value: 'general', label: 'General (Cross-skill knowledge)' }
  ];

  // Category options
  const categoryOptions = [
    { value: 'infection-control', label: 'Infection Control' },
    { value: 'adl-assistance', label: 'Activities of Daily Living' },
    { value: 'mobility-safety', label: 'Mobility and Safety' },
    { value: 'assessment', label: 'Assessment' },
    { value: 'professionalism', label: 'Professionalism' },
    { value: 'safety', label: 'Safety' },
    { value: 'technique', label: 'Technique' },
    { value: 'regulations', label: 'Regulations' }
  ];

  // Source options
  const sourceOptions = [
    { value: 'credentia-2024', label: 'Credentia 2024 Standards' },
    { value: 'obra-regulations', label: 'OBRA Regulations' },
    { value: 'safety-guidelines', label: 'Safety Guidelines' },
    { value: 'professional-guidelines', label: 'Professional Guidelines' },
    { value: 'assessment-data', label: 'Assessment Data' },
    { value: 'custom', label: 'Custom/Institution-specific' },
    { value: 'user-generated', label: 'User Generated' }
  ];

  // Criticality options
  const criticalityOptions = [
    { value: 'high', label: 'High (Safety Critical)' },
    { value: 'medium', label: 'Medium (Important)' },
    { value: 'low', label: 'Low (Supplementary)' }
  ];

  // Load document data when editing
  useEffect(() => {
    if (document) {
      setFormData({
        id: document.id || '',
        title: document.title || '',
        content: document.content || '',
        skillId: document.skillId || 'general',
        category: document.category || 'technique',
        source: document.source || 'custom',
        criticality: document.criticality || 'medium',
        tags: document.tags || [],
        status: document.status || 'published'
      });
    } else {
      // Generate ID for new document
      const newId = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setFormData(prev => ({ ...prev, id: newId }));
    }
  }, [document]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleTagAdd = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim().toLowerCase())) {
      const newTag = tagInput.trim().toLowerCase();
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag]
      }));
      setTagInput('');
    }
  };

  const handleTagRemove = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTagAdd();
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be 200 characters or less';
    }
    
    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    } else if (formData.content.length > 10000) {
      newErrors.content = 'Content must be 10,000 characters or less';
    }
    
    if (!formData.skillId) {
      newErrors.skillId = 'Skill selection is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category selection is required';
    }
    
    if (!formData.source) {
      newErrors.source = 'Source selection is required';
    }
    
    if (!formData.criticality) {
      newErrors.criticality = 'Criticality level is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving document:', error);
      alert('Failed to save document. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const insertTemplate = (templateType) => {
    let template = '';
    
    switch (templateType) {
      case 'procedure':
        template = `PROCEDURE: ${formData.title}

PURPOSE: [Describe the purpose and importance]

CRITICAL REQUIREMENTS:
- [List critical safety and technique requirements]
- [Each point should be specific and actionable]
- [Include timing requirements if applicable]

SUPPLIES REQUIRED:
- [List all necessary supplies]
- [Include quantities where specific amounts are needed]

STEP-BY-STEP PROCEDURE:
1. [First step with specific instructions]
2. [Second step with safety considerations]
3. [Continue with all procedural steps]

SAFETY CONSIDERATIONS:
- [Critical safety points]
- [Infection control requirements]
- [Patient dignity and privacy]

COMMON ERRORS:
- [List typical mistakes]
- [Include corrections for each error]

ASSESSMENT CRITERIA:
- [How performance is evaluated]
- [Key points that determine success]`;
        break;
        
      case 'assessment':
        template = `ASSESSMENT CRITERIA: ${formData.title}

SCORING CATEGORIES:

SAFETY COMPLIANCE (30% of score):
- [Specific safety requirements]
- [Critical error definitions]

TECHNICAL ACCURACY (25% of score):
- [Technique requirements]
- [Acceptable variations]

COMMUNICATION (15% of score):
- [Patient interaction requirements]
- [Professional behavior standards]

TIMING AND EFFICIENCY (15% of score):
- [Expected time ranges]
- [Efficiency indicators]

CRITICAL ERRORS (Automatic failure):
- [List actions that result in automatic failure]
- [Safety violations]

SCORING RUBRIC:
- 90-100: Excellent performance
- 80-89: Good performance with minor issues
- 70-79: Satisfactory performance
- 60-69: Needs improvement
- Below 60: Unsatisfactory`;
        break;
        
      case 'safety':
        template = `SAFETY PROTOCOL: ${formData.title}

SAFETY REQUIREMENTS:
- [Primary safety concerns]
- [Protective equipment needed]

CONTRAINDICATIONS:
- [When procedure should not be performed]
- [Risk factors to consider]

WARNING SIGNS:
- [Signs of complications]
- [When to stop procedure]

EMERGENCY PROCEDURES:
- [What to do if complications arise]
- [Who to notify]

INFECTION CONTROL:
- [Hand hygiene requirements]
- [PPE specifications]
- [Contamination prevention]

DOCUMENTATION REQUIREMENTS:
- [What must be recorded]
- [When to report concerns]`;
        break;
    }
    
    setFormData(prev => ({ ...prev, content: template }));
  };

  const renderPreview = () => {
    return (
      <div className="document-preview">
        <div className="preview-header">
          <h2>{formData.title || 'Untitled Document'}</h2>
          <div className="preview-metadata">
            <span className="metadata-item">
              Skill: {skillOptions.find(opt => opt.value === formData.skillId)?.label}
            </span>
            <span className="metadata-item">
              Category: {categoryOptions.find(opt => opt.value === formData.category)?.label}
            </span>
            <span className="metadata-item">
              Criticality: {criticalityOptions.find(opt => opt.value === formData.criticality)?.label}
            </span>
          </div>
        </div>
        
        <div className="preview-content">
          {formData.content.split('\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
        
        {formData.tags.length > 0 && (
          <div className="preview-tags">
            <strong>Tags:</strong>
            {formData.tags.map(tag => (
              <span key={tag} className="tag-preview">{tag}</span>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="knowledge-document-editor">
      <div className="editor-header">
        <h2>{document ? 'Edit Knowledge Document' : 'Create New Knowledge Document'}</h2>
        <div className="editor-actions">
          <button 
            className={`preview-toggle ${previewMode ? 'active' : ''}`}
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? '✏️ Edit' : '👁️ Preview'}
          </button>
        </div>
      </div>

      {previewMode ? renderPreview() : (
        <div className="editor-form">
          {/* Basic Information */}
          <div className="form-section">
            <h3>Basic Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Document ID</label>
                <input
                  type="text"
                  value={formData.id}
                  onChange={(e) => handleInputChange('id', e.target.value)}
                  disabled={!!document}
                  className={errors.id ? 'error' : ''}
                />
                {errors.id && <span className="error-text">{errors.id}</span>}
                {document && <small>ID cannot be changed for existing documents</small>}
              </div>
              
              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter document title..."
                className={errors.title ? 'error' : ''}
                maxLength={200}
              />
              {errors.title && <span className="error-text">{errors.title}</span>}
              <small>{formData.title.length}/200 characters</small>
            </div>
          </div>

          {/* Classification */}
          <div className="form-section">
            <h3>Classification</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Skill *</label>
                <select
                  value={formData.skillId}
                  onChange={(e) => handleInputChange('skillId', e.target.value)}
                  className={errors.skillId ? 'error' : ''}
                >
                  {skillOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.skillId && <span className="error-text">{errors.skillId}</span>}
              </div>
              
              <div className="form-group">
                <label>Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className={errors.category ? 'error' : ''}
                >
                  {categoryOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.category && <span className="error-text">{errors.category}</span>}
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Source *</label>
                <select
                  value={formData.source}
                  onChange={(e) => handleInputChange('source', e.target.value)}
                  className={errors.source ? 'error' : ''}
                >
                  {sourceOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.source && <span className="error-text">{errors.source}</span>}
              </div>
              
              <div className="form-group">
                <label>Criticality *</label>
                <select
                  value={formData.criticality}
                  onChange={(e) => handleInputChange('criticality', e.target.value)}
                  className={errors.criticality ? 'error' : ''}
                >
                  {criticalityOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.criticality && <span className="error-text">{errors.criticality}</span>}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="form-section">
            <h3>Content</h3>
            
            {/* Template Buttons */}
            <div className="template-buttons">
              <button 
                type="button" 
                onClick={() => insertTemplate('procedure')}
                className="template-btn"
              >
                📋 Procedure Template
              </button>
              <button 
                type="button" 
                onClick={() => insertTemplate('assessment')}
                className="template-btn"
              >
                📊 Assessment Template
              </button>
              <button 
                type="button" 
                onClick={() => insertTemplate('safety')}
                className="template-btn"
              >
                🔒 Safety Template
              </button>
            </div>
            
            <div className="form-group">
              <label>Document Content *</label>
              <textarea
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                placeholder="Enter the knowledge document content..."
                className={`content-textarea ${errors.content ? 'error' : ''}`}
                rows={20}
                maxLength={10000}
              />
              {errors.content && <span className="error-text">{errors.content}</span>}
              <small>{formData.content.length}/10,000 characters</small>
            </div>
          </div>

          {/* Tags */}
          <div className="form-section">
            <h3>Tags</h3>
            <div className="form-group">
              <label>Add Tags</label>
              <div className="tag-input-container">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagInputKeyPress}
                  placeholder="Enter tag and press Enter..."
                />
                <button type="button" onClick={handleTagAdd} className="add-tag-btn">
                  Add
                </button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="tag-list">
                  {formData.tags.map(tag => (
                    <span key={tag} className="tag-item">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleTagRemove(tag)}
                        className="remove-tag-btn"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="editor-footer">
        <button 
          type="button" 
          onClick={onCancel}
          className="cancel-btn"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button 
          type="button" 
          onClick={handleSave}
          className="save-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : (document ? 'Update Document' : 'Create Document')}
        </button>
      </div>
    </div>
  );
};

export default KnowledgeDocumentEditor;