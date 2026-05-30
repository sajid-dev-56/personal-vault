import { 
  FileText, 
  Database, 
  Activity, 
  Home, 
  DollarSign, 
  CreditCard, 
  Receipt,
  File,
  Eye,
  Plus,
  Clock
} from 'lucide-react';
import type { DocumentMetadata } from '../db';

interface DashboardProps {
  documents: DocumentMetadata[];
  setActiveTab: (tab: string) => void;
  onViewDoc: (doc: DocumentMetadata) => void;
}

export default function Dashboard({ documents, setActiveTab, onViewDoc }: DashboardProps) {
  // Compute analytics
  const totalCount = documents.length;
  const totalSize = documents.reduce((acc, doc) => acc + (doc.fileSize || 0), 0);
  
  const categoryCounts = documents.reduce((acc, doc) => {
    acc[doc.category] = (acc[doc.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categories = [
    { name: 'Home', count: categoryCounts['Home'] || 0, icon: Home, color: '#60a5fa', badgeClass: 'badge-home' },
    { name: 'Medical', count: categoryCounts['Medical'] || 0, icon: Activity, color: '#f87171', badgeClass: 'badge-medical' },
    { name: 'Finance', count: categoryCounts['Finance'] || 0, icon: DollarSign, color: '#34d399', badgeClass: 'badge-finance' },
    { name: 'Identity', count: categoryCounts['Identity'] || 0, icon: CreditCard, color: '#c084fc', badgeClass: 'badge-identity' },
    { name: 'Receipts', count: categoryCounts['Receipts'] || 0, icon: Receipt, color: '#fbbf24', badgeClass: 'badge-receipts' },
    { name: 'Other', count: categoryCounts['Other'] || 0, icon: FileText, color: '#9ca3af', badgeClass: 'badge-other' },
  ];

  // Sort categories by count (descending)
  const topCategories = [...categories].sort((a, b) => b.count - a.count);

  // Formatting helpers
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileText size={18} color="var(--accent)" />;
    if (fileType.includes('image')) return <File size={18} color="#60a5fa" />;
    return <File size={18} color="#9ca3af" />;
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Welcome Banner */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: '28px 32px', 
          borderRadius: 'var(--radius-lg)', 
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(17, 19, 24, 0.7) 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '6px', letterSpacing: '-0.02em' }}>
            Welcome to your Vault
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Keep your sensitive documents secure, organized, and private in your space.
          </p>
        </div>
        <button 
          onClick={() => setActiveTab('upload')} 
          className="btn btn-primary"
          style={{ height: '48px', padding: '0 24px' }}
        >
          <Plus size={20} />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Stats Widgets */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
          gap: '24px' 
        }}
      >
        {/* Stat 1: Total Docs */}
        <div className="glass-panel glow-card" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Documents
            </span>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent)' }}>
              <FileText size={20} />
            </div>
          </div>
          <span style={{ fontSize: '2.25rem', fontWeight: 800 }}>{totalCount}</span>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            stored in browser database
          </div>
        </div>

        {/* Stat 2: Storage Size */}
        <div className="glass-panel glow-card" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Vault Disk Usage
            </span>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-md)', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <Database size={20} />
            </div>
          </div>
          <span style={{ fontSize: '2.25rem', fontWeight: 800 }}>{formatSize(totalSize)}</span>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            allocated local sandbox storage
          </div>
        </div>

        {/* Stat 3: Last Upload */}
        <div className="glass-panel glow-card" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Last Activity
            </span>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-md)', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <Clock size={20} />
            </div>
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, display: 'block', height: '42px', alignContent: 'center' }}>
            {totalCount > 0 ? formatDate(documents[0].createdAt) : 'No uploads yet'}
          </span>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            {totalCount > 0 ? `Latest: ${documents[0].name.substring(0, 18)}${documents[0].name.length > 18 ? '...' : ''}` : 'waiting for first document'}
          </div>
        </div>
      </div>

      {/* Main split */}
      <div className="dashboard-split-grid">
        {/* Left Column: Category breakdown */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px' }}>Category Metrics</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {topCategories.map((cat) => {
              const Icon = cat.icon;
              const percentage = totalCount > 0 ? (cat.count / totalCount) * 100 : 0;
              return (
                <div key={cat.name} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ padding: '6px', borderRadius: 'var(--radius-sm)', background: `${cat.color}15`, color: cat.color, display: 'flex' }}>
                        <Icon size={16} />
                      </div>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{cat.name}</span>
                    </div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {cat.count} {cat.count === 1 ? 'doc' : 'docs'} ({Math.round(percentage)}%)
                    </span>
                  </div>
                  {/* Progress bar container */}
                  <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        background: cat.color, 
                        width: `${percentage}%`,
                        borderRadius: '9999px',
                        transition: 'width var(--transition-slow)'
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Recent Uploads */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Recent Documents</h3>
            {totalCount > 4 && (
              <button 
                onClick={() => setActiveTab('vault')} 
                className="btn btn-ghost" 
                style={{ fontSize: '0.8rem', padding: '4px 8px' }}
              >
                View All
              </button>
            )}
          </div>

          {documents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
              <File size={32} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
              <p style={{ fontSize: '0.9rem', marginBottom: '16px' }}>No documents uploaded yet.</p>
              <button onClick={() => setActiveTab('upload')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.8rem' }}>
                Start uploading
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {documents.slice(0, 4).map((doc) => (
                <div 
                  key={doc.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    transition: 'border-color var(--transition-fast)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(16,185,129,0.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', padding: '10px', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)' }}>
                      {getFileIcon(doc.fileType)}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          fontSize: '0.9rem', 
                          fontWeight: 600, 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          color: 'var(--text-primary)'
                        }}
                      >
                        {doc.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <span className={`badge badge-other ${
                          doc.category === 'Medical' ? 'badge-medical' :
                          doc.category === 'Home' ? 'badge-home' :
                          doc.category === 'Finance' ? 'badge-finance' :
                          doc.category === 'Identity' ? 'badge-identity' :
                          doc.category === 'Receipts' ? 'badge-receipts' : ''
                        }`} style={{ padding: '2px 8px', fontSize: '0.65rem' }}>
                          {doc.category}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {formatSize(doc.fileSize)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => onViewDoc(doc)}
                    className="btn btn-secondary" 
                    style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
                  >
                    <Eye size={14} />
                    <span>View</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
