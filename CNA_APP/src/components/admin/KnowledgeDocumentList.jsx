// Knowledge Document List Component
// Displays and manages list of dynamic CNA knowledge documents

import React, { useState } from 'react';
import '../../styles/admin/KnowledgeDocumentList.css';

const KnowledgeDocumentList = ({ documents, onEdit, onDelete, onCreate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSkill, setFilterSkill] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterCriticality, setFilterCriticality] = useState('all');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Filter and sort documents
  const filteredAndSortedDocuments = documents
    .filter(doc => {
      // Search filter
      if (searchTerm && !doc.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !doc.content.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) {
        return false;
      }
      
      // Skill filter
      if (filterSkill !== 'all' && doc.skillId !== filterSkill) {
        return false;
      }
      
      // Category filter
      if (filterCategory !== 'all' && doc.category !== filterCategory) {
        return false;
      }
      
      // Criticality filter
      if (filterCriticality !== 'all' && doc.criticality !== filterCriticality) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      // Handle date sorting
      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      // Handle string sorting
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const skillOptions = [
    { value: 'all', label: 'All Skills' },
    { value: 'hand-hygiene', label: 'Hand Hygiene' },
    { value: 'elastic-stocking', label: 'Elastic Stocking' },
    { value: 'ambulate-transfer-belt', label: 'Transfer Belt Ambulation' },
    { value: 'bedpan-use', label: 'Bedpan Use' },
    { value: 'denture-cleaning', label: 'Denture Cleaning' },
    { value: 'radial-pulse', label: 'Radial Pulse' },
    { value: 'respirations', label: 'Respirations' },
    { value: 'ppe-gown-gloves', label: 'PPE (Gown and Gloves)' },
    { value: 'general', label: 'General (Cross-skill)' }
  ];

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'infection-control', label: 'Infection Control' },
    { value: 'adl-assistance', label: 'ADL Assistance' },
    { value: 'mobility-safety', label: 'Mobility & Safety' },
    { value: 'assessment', label: 'Assessment' },
    { value: 'professionalism', label: 'Professionalism' },
    { value: 'safety', label: 'Safety' },
    { value: 'technique', label: 'Technique' },
    { value: 'regulations', label: 'Regulations' }
  ];

  const criticalityOptions = [
    { value: 'all', label: 'All Levels' },
    { value: 'high', label: 'High Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'low', label: 'Low Priority' }
  ];

  const getCriticalityColor = (criticality) => {
    switch (criticality) {
      case 'high': return '#dc3545';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getCriticalityIcon = (criticality) => {
    switch (criticality) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'published': return '✅';
      case 'draft': return '📝';
      case 'archived': return '📦';
      default: return '❓';
    }
  };

  const getEmbeddingStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '✅';
      case 'processing': return '⏳';
      case 'pending': return '⏸️';
      case 'failed': return '❌';
      default: return '❓';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="knowledge-document-list">
      {/* Header */}
      <div className="list-header">
        <h2>Knowledge Documents ({filteredAndSortedDocuments.length})</h2>
        <button className="create-new-btn" onClick={onCreate}>
          ➕ Create New Document
        </button>
      </div>

      {/* Filters */}
      <div className="list-filters">
        <div className="filter-row">
          <div className="search-group">
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          
          <select
            value={filterSkill}
            onChange={(e) => setFilterSkill(e.target.value)}
            className="filter-select"
          >
            {skillOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="filter-select"
          >
            {categoryOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <select
            value={filterCriticality}
            onChange={(e) => setFilterCriticality(e.target.value)}
            className="filter-select"
          >
            {criticalityOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Document List */}
      {filteredAndSortedDocuments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📄</div>
          <h3>No Documents Found</h3>
          <p>
            {documents.length === 0 
              ? "No knowledge documents have been created yet."
              : "No documents match your current filters."
            }
          </p>
          <button className="create-first-btn" onClick={onCreate}>
            Create First Document
          </button>
        </div>
      ) : (
        <div className="document-table-container">
          <table className="document-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('title')} className="sortable">
                  Title {getSortIcon('title')}
                </th>
                <th onClick={() => handleSort('skillId')} className="sortable">
                  Skill {getSortIcon('skillId')}
                </th>
                <th onClick={() => handleSort('category')} className="sortable">
                  Category {getSortIcon('category')}
                </th>
                <th onClick={() => handleSort('criticality')} className="sortable">
                  Priority {getSortIcon('criticality')}
                </th>
                <th>Status</th>
                <th>Embedding</th>
                <th onClick={() => handleSort('updatedAt')} className="sortable">
                  Last Updated {getSortIcon('updatedAt')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedDocuments.map(doc => (
                <tr key={doc._id || doc.id}>
                  <td className="title-cell">
                    <div className="title-content">
                      <strong>{doc.title}</strong>
                      {doc.tags && doc.tags.length > 0 && (
                        <div className="tag-chips">
                          {doc.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="tag-chip">{tag}</span>
                          ))}
                          {doc.tags.length > 3 && (
                            <span className="tag-chip more">+{doc.tags.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="skill-badge">
                      {skillOptions.find(opt => opt.value === doc.skillId)?.label || doc.skillId}
                    </span>
                  </td>
                  <td>
                    <span className="category-badge">
                      {categoryOptions.find(opt => opt.value === doc.category)?.label || doc.category}
                    </span>
                  </td>
                  <td>
                    <span 
                      className="criticality-badge"
                      style={{ color: getCriticalityColor(doc.criticality) }}
                    >
                      {getCriticalityIcon(doc.criticality)} {doc.criticality}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${doc.status}`}>
                      {getStatusIcon(doc.status)} {doc.status}
                    </span>
                  </td>
                  <td>
                    <span 
                      className={`embedding-status embedding-${doc.embeddingStatus}`}
                      title={`Embedding Status: ${doc.embeddingStatus}`}
                    >
                      {getEmbeddingStatusIcon(doc.embeddingStatus)}
                    </span>
                  </td>
                  <td className="date-cell">
                    <div className="date-info">
                      <div>{formatDate(doc.updatedAt || doc.createdAt)}</div>
                      {doc.updatedBy && (
                        <small>by {doc.updatedBy.name || 'Unknown'}</small>
                      )}
                    </div>
                  </td>
                  <td className="actions-cell">
                    <button 
                      className="action-btn edit-btn"
                      onClick={() => onEdit(doc)}
                      title="Edit Document"
                    >
                      ✏️
                    </button>
                    <button 
                      className="action-btn delete-btn"
                      onClick={() => onDelete(doc._id || doc.id)}
                      title="Delete Document"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Stats */}
      {documents.length > 0 && (
        <div className="list-summary">
          <div className="summary-stats">
            <div className="stat-item">
              <span className="stat-label">Total Documents:</span>
              <span className="stat-value">{documents.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Published:</span>
              <span className="stat-value">
                {documents.filter(d => d.status === 'published').length}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">High Priority:</span>
              <span className="stat-value">
                {documents.filter(d => d.criticality === 'high').length}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Embeddings Complete:</span>
              <span className="stat-value">
                {documents.filter(d => d.embeddingStatus === 'completed').length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeDocumentList;