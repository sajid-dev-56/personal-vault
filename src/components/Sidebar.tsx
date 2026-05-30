import { 
  LayoutDashboard, 
  FolderLock, 
  UploadCloud, 
  DatabaseBackup,
  ChevronLeft,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  isCollapsed, 
  setIsCollapsed 
}: SidebarProps) {
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'vault', label: 'Document Vault', icon: FolderLock },
    { id: 'upload', label: 'Upload Documents', icon: UploadCloud },
    { id: 'backup', label: 'Backup & Settings', icon: DatabaseBackup },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside 
        className="glass-panel sidebar-desktop"
        style={{
          width: isCollapsed ? '80px' : '260px',
          height: 'calc(100vh - 24px)',
          margin: '12px',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 'var(--radius-lg)',
          transition: 'width var(--transition-normal)',
          overflow: 'hidden',
          zIndex: 20,
          flexShrink: 0
        }}
      >
        {/* Brand Header */}
        <div 
          style={{
            height: '70px',
            padding: isCollapsed ? '0' : '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            borderBottom: '1px solid var(--border-color)',
            overflow: 'hidden'
          }}
        >
          {!isCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={24} color="var(--accent)" style={{ filter: 'drop-shadow(0 0 8px var(--accent-glow))' }} />
              <span style={{ 
                fontWeight: 800, 
                fontSize: '1.1rem', 
                letterSpacing: '0.05em', 
                color: 'var(--text-primary)',
                background: 'linear-gradient(135deg, #fff 0%, var(--text-secondary) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                VAULT.IO
              </span>
            </div>
          )}
          {isCollapsed && (
            <ShieldCheck size={26} color="var(--accent)" style={{ filter: 'drop-shadow(0 0 8px var(--accent-glow))' }} />
          )}
          
          {!isCollapsed && (
            <button 
              onClick={() => setIsCollapsed(true)}
              className="btn btn-ghost"
              style={{ padding: '6px', borderRadius: '50%' }}
              aria-label="Collapse sidebar"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {/* Nav List */}
        <nav style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  gap: '12px',
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: isActive ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                  border: '1px solid',
                  borderColor: isActive ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all var(--transition-fast)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.9rem',
                  position: 'relative'
                }}
                className="tooltip"
                data-tooltip={isCollapsed ? item.label : undefined}
              >
                <Icon 
                  size={20} 
                  style={{ 
                    flexShrink: 0,
                    color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                    filter: isActive ? 'drop-shadow(0 0 4px var(--accent-glow))' : 'none'
                  }} 
                />
                {!isCollapsed && <span>{item.label}</span>}
                
                {isActive && !isCollapsed && (
                  <div 
                    style={{
                      position: 'absolute',
                      left: '0',
                      top: '25%',
                      height: '50%',
                      width: '3px',
                      borderRadius: '0 4px 4px 0',
                      background: 'var(--accent)',
                      boxShadow: '0 0 10px var(--accent)'
                    }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Expand Button for Collapsed State */}
        {isCollapsed && (
          <div style={{ padding: '16px', display: 'flex', justifyContent: 'center', borderTop: '1px solid var(--border-color)' }}>
            <button 
              onClick={() => setIsCollapsed(false)}
              className="btn btn-ghost"
              style={{ padding: '8px', borderRadius: '50%' }}
              aria-label="Expand sidebar"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* Footer Info */}
        {!isCollapsed && (
          <div 
            style={{ 
              padding: '16px 20px', 
              borderTop: '1px solid var(--border-color)',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              textAlign: 'center'
            }}
          >
            <span>Cloud Synced</span>
          </div>
        )}
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          // Shorten labels on mobile
          const shortLabel = item.id === 'dashboard' ? 'Dash' :
                             item.id === 'vault' ? 'Vault' :
                             item.id === 'upload' ? 'Upload' : 'Settings';
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
