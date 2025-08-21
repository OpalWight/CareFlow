// Admin Panel for Knowledge Management System
// Provides administrative interface for managing dynamic CNA knowledge documents

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../api/AuthContext';
import KnowledgeDocumentEditor from './KnowledgeDocumentEditor';
import KnowledgeDocumentList from './KnowledgeDocumentList';
import DynamicKnowledgeService from '../../services/dynamicKnowledgeService';
import '../../styles/admin/AdminPanel.css';

const AdminPanel = () => {
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState('documents');
  const [knowledgeDocuments, setKnowledgeDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [knowledgeService, setKnowledgeService] = useState(null);
  const [stats, setStats] = useState({
    totalDocuments: 0,
    lastUpdated: null,
    embeddingStatus: 'idle'
  });

  // Check if user has admin privileges
  const isAdmin = user?.role === 'admin' || user?.isAdmin === true;

  useEffect(() => {
    const initializeService = async () => {
      try {
        const service = new DynamicKnowledgeService();
        await service.initialize();
        setKnowledgeService(service);
        
        // Load existing documents
        const documents = await service.getAllDocuments();
        setKnowledgeDocuments(documents);
        
        // Get stats
        const systemStats = await service.getStats();
        setStats(systemStats);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing knowledge service:', error);
        setError('Failed to initialize knowledge management system');
        setIsLoading(false);
      }
    };

    if (isAuthenticated && isAdmin) {
      initializeService();
    }
  }, [isAuthenticated, isAdmin]);

  // Redirect if not authenticated or not admin
  if (!isAuthenticated) {
    return (
      <div className="admin-access-denied">
        <h2>🔒 Access Denied</h2>
        <p>Please log in to access the admin panel.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-access-denied">
        <h2>🔒 Admin Access Required</h2>
        <p>You need administrator privileges to access this panel.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading Knowledge Management System...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error">
        <h2>⚠️ System Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  const handleCreateDocument = () => {
    setSelectedDocument(null);
    setIsEditing(true);
    setActiveTab('editor');
  };

  const handleEditDocument = (document) => {
    setSelectedDocument(document);
    setIsEditing(true);
    setActiveTab('editor');
  };

  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    try {
      await knowledgeService.deleteDocument(documentId);
      
      // Refresh document list
      const updatedDocuments = await knowledgeService.getAllDocuments();
      setKnowledgeDocuments(updatedDocuments);
      
      // Update stats
      const updatedStats = await knowledgeService.getStats();
      setStats(updatedStats);
      
      alert('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
    }
  };

  const handleSaveDocument = async (documentData) => {
    try {
      let savedDocument;
      
      if (selectedDocument) {
        // Update existing document
        savedDocument = await knowledgeService.updateDocument(selectedDocument.id, documentData);
      } else {
        // Create new document
        savedDocument = await knowledgeService.createDocument(documentData);
      }
      
      // Refresh document list
      const updatedDocuments = await knowledgeService.getAllDocuments();
      setKnowledgeDocuments(updatedDocuments);
      
      // Update stats
      const updatedStats = await knowledgeService.getStats();
      setStats(updatedStats);
      
      // Go back to document list
      setIsEditing(false);
      setActiveTab('documents');
      setSelectedDocument(null);
      
      alert(selectedDocument ? 'Document updated successfully' : 'Document created successfully');
    } catch (error) {
      console.error('Error saving document:', error);
      alert('Failed to save document');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSelectedDocument(null);
    setActiveTab('documents');
  };

  const handleRefreshEmbeddings = async () => {
    try {
      setStats(prev => ({ ...prev, embeddingStatus: 'processing' }));
      
      await knowledgeService.refreshAllEmbeddings();
      
      // Update stats
      const updatedStats = await knowledgeService.getStats();
      setStats(updatedStats);
      
      alert('Embeddings refreshed successfully');
    } catch (error) {
      console.error('Error refreshing embeddings:', error);
      alert('Failed to refresh embeddings');
      setStats(prev => ({ ...prev, embeddingStatus: 'error' }));
    }
  };

  const handleImportDocuments = async (files) => {
    try {
      const results = await knowledgeService.importDocuments(files);
      
      // Refresh document list
      const updatedDocuments = await knowledgeService.getAllDocuments();
      setKnowledgeDocuments(updatedDocuments);
      
      // Update stats
      const updatedStats = await knowledgeService.getStats();
      setStats(updatedStats);
      
      alert(`Successfully imported ${results.successful} documents. ${results.failed} failed.`);
    } catch (error) {
      console.error('Error importing documents:', error);
      alert('Failed to import documents');
    }
  };

  const handleExportDocuments = async () => {
    try {
      const exportData = await knowledgeService.exportAllDocuments();
      
      // Create download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], 
        { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cna-knowledge-export-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting documents:', error);
      alert('Failed to export documents');
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>🛠️ Knowledge Management System</h1>
        <div className="admin-stats">
          <div className="stat-item">
            <span className="stat-label">Documents:</span>
            <span className="stat-value">{stats.totalDocuments}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Last Updated:</span>
            <span className="stat-value">
              {stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleDateString() : 'Never'}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Embedding Status:</span>
            <span className={`stat-value status-${stats.embeddingStatus}`}>
              {stats.embeddingStatus}
            </span>
          </div>
        </div>
      </div>

      <div className="admin-nav">
        <button 
          className={`nav-btn ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          📚 Documents
        </button>
        <button 
          className={`nav-btn ${activeTab === 'editor' ? 'active' : ''}`}
          onClick={handleCreateDocument}
        >
          ✏️ Create New
        </button>
        <button 
          className={`nav-btn ${activeTab === 'tools' ? 'active' : ''}`}
          onClick={() => setActiveTab('tools')}
        >
          🔧 Tools
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'documents' && !isEditing && (
          <KnowledgeDocumentList
            documents={knowledgeDocuments}
            onEdit={handleEditDocument}
            onDelete={handleDeleteDocument}
            onCreate={handleCreateDocument}
          />
        )}

        {activeTab === 'editor' || isEditing ? (
          <KnowledgeDocumentEditor
            document={selectedDocument}
            onSave={handleSaveDocument}
            onCancel={handleCancelEdit}
          />
        ) : null}

        {activeTab === 'tools' && (
          <div className="admin-tools">
            <div className="tool-section">
              <h3>🔄 Embedding Management</h3>
              <p>Refresh embeddings when documents are updated</p>
              <button 
                className="tool-btn"
                onClick={handleRefreshEmbeddings}
                disabled={stats.embeddingStatus === 'processing'}
              >
                {stats.embeddingStatus === 'processing' ? 'Processing...' : 'Refresh All Embeddings'}
              </button>
            </div>

            <div className="tool-section">
              <h3>📤 Import/Export</h3>
              <p>Manage knowledge documents in bulk</p>
              <div className="tool-buttons">
                <input 
                  type="file"
                  multiple
                  accept=".json"
                  id="import-input"
                  style={{ display: 'none' }}
                  onChange={(e) => handleImportDocuments(e.target.files)}
                />
                <button 
                  className="tool-btn"
                  onClick={() => document.getElementById('import-input').click()}
                >
                  Import Documents
                </button>
                <button 
                  className="tool-btn"
                  onClick={handleExportDocuments}
                >
                  Export All Documents
                </button>
              </div>
            </div>

            <div className="tool-section">
              <h3>📊 System Status</h3>
              <div className="status-grid">
                <div className="status-item">
                  <span>Knowledge Service:</span>
                  <span className="status-active">Active</span>
                </div>
                <div className="status-item">
                  <span>Vector Database:</span>
                  <span className="status-active">Connected</span>
                </div>
                <div className="status-item">
                  <span>AI Assessment:</span>
                  <span className="status-active">Online</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;