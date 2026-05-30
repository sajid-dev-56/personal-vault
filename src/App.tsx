import { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import VaultList from './components/VaultList';
import UploadPanel from './components/UploadPanel';
import BackupSettings from './components/BackupSettings';
import DocumentViewer from './components/DocumentViewer';
import AuthScreen from './components/AuthScreen';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { getDocuments, type DocumentMetadata } from './db';
import { Menu, LogOut } from 'lucide-react';

function AppContent() {
  const { user, loading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocumentMetadata | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadDocuments = async () => {
    try {
      const docs = await getDocuments();
      setDocuments(docs);
    } catch (e) {
      console.error('Failed to load documents', e);
    }
  };

  // Load documents when user logs in or updates
  useEffect(() => {
    if (user) {
      loadDocuments();
    } else {
      setDocuments([]);
    }
  }, [user]);

  // Click outside to close user dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard controls for modal close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedDoc(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard Overview';
      case 'vault': return 'Document Vault';
      case 'upload': return 'Upload Documents';
      case 'backup': return 'Backup & Settings';
      default: return 'Personal Vault';
    }
  };

  // Show loading spinner during auth state resolution
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <span className="loading-text">Securing your vault connection...</span>
      </div>
    );
  }

  // Gate app behind authentication screen
  if (!user) {
    return <AuthScreen />;
  }

  return (
    <>
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsMobileMenuOpen(false);
        }}
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* Mobile Sidebar Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main App Window */}
      <div className="main-container">
        
        {/* Header */}
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Collapse toggle for desktop sidebar / mobile menu toggle */}
            <button
              onClick={() => {
                setIsCollapsed(!isCollapsed);
                setIsMobileMenuOpen(!isMobileMenuOpen);
              }}
              className="btn btn-ghost sidebar-toggle-btn"
              style={{ 
                padding: '8px', 
                display: 'flex', 
                borderRadius: 'var(--radius-sm)'
              }}
              aria-label="Toggle Navigation Menu"
            >
              <Menu size={20} />
            </button>
            <h1 className="header-title">{getPageTitle()}</h1>
          </div>

          {/* User profile dropdown and sync badge */}
          <div className="user-menu" ref={dropdownRef}>
            <div className="sync-badge">
              <span className="sync-dot" />
              <span>Cloud Sync</span>
            </div>

            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="user-avatar"
              aria-label="User Profile Options"
            >
              {user.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt={user.user_metadata?.display_name || 'User'} />
              ) : (
                <span>{(user.user_metadata?.display_name || user.email || 'U')[0].toUpperCase()}</span>
              )}
            </button>

            {showDropdown && (
              <div className="user-dropdown glass-panel animate-fade-in">
                <div style={{ padding: '8px 12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Signed in as
                  <div style={{ 
                    fontWeight: 600, 
                    color: 'var(--text-primary)', 
                    marginTop: '2px', 
                    wordBreak: 'break-all' 
                  }}>
                    {user.user_metadata?.display_name || user.email}
                  </div>
                </div>
                <div className="user-dropdown-divider" />
                <button 
                  onClick={() => {
                    signOut();
                    setShowDropdown(false);
                  }}
                  className="user-dropdown-item danger"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Content Area */}
        <main className="content-area">
          {activeTab === 'dashboard' && (
            <Dashboard 
              documents={documents} 
              setActiveTab={setActiveTab} 
              onViewDoc={setSelectedDoc} 
            />
          )}

          {activeTab === 'vault' && (
            <VaultList 
              documents={documents} 
              onRefresh={loadDocuments} 
              onViewDoc={setSelectedDoc} 
            />
          )}

          {activeTab === 'upload' && (
            <UploadPanel 
              onUploadSuccess={loadDocuments} 
              setActiveTab={setActiveTab} 
            />
          )}

          {activeTab === 'backup' && (
            <BackupSettings 
              onRefresh={loadDocuments} 
            />
          )}
        </main>
      </div>

      {/* Full screen document viewer modal overlay */}
      {selectedDoc && (
        <DocumentViewer 
          document={selectedDoc} 
          onClose={() => setSelectedDoc(null)} 
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
