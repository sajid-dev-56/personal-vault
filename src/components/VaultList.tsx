import { useState, useMemo } from 'react';
import { 
  Search, 
  LayoutGrid, 
  List, 
  Trash2, 
  Edit3, 
  Download, 
  Eye, 
  Calendar, 
  X, 
  SlidersHorizontal,
  FileText,
  FileImage,
  File,
  AlertTriangle
} from 'lucide-react';
import { getDocumentFile, deleteDocument, updateDocumentMetadata } from '../db';
import type { DocumentMetadata } from '../db';

interface VaultListProps {
  documents: DocumentMetadata[];
  onRefresh: () => void;
  onViewDoc: (doc: DocumentMetadata) => void;
}

type SortOption = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc' | 'size-desc';

export default function VaultList({ documents, onRefresh, onViewDoc }: VaultListProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Modals state
  const [editingDoc, setEditingDoc] = useState<DocumentMetadata | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<DocumentMetadata | null>(null);
  
  // Form state for editing
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTagInput, setEditTagInput] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editNotes, setEditNotes] = useState('');

  // Categories list
  const categories = ['All', 'Home', 'Medical', 'Finance', 'Identity', 'Receipts', 'Other'];

  // Extract all unique tags in vault for tag filter dropdown
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    documents.forEach(doc => {
      if (doc.tags) {
        doc.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet);
  }, [documents]);

  const handleDownload = async (doc: DocumentMetadata) => {
    try {
      const blob = await getDocumentFile(doc.filePath);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName || `${doc.name}.${doc.fileType.split('/')[1] || 'bin'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download document: ' + err);
    }
  };

  const handleDelete = async () => {
    if (!deletingDoc) return;
    try {
      await deleteDocument(deletingDoc.id, deletingDoc.filePath);
      setDeletingDoc(null);
      onRefresh();
    } catch (err) {
      alert('Failed to delete document: ' + err);
    }
  };

  const handleOpenEdit = (doc: DocumentMetadata) => {
    setEditingDoc(doc);
    setEditName(doc.name);
    setEditCategory(doc.category);
    setEditDate(doc.date);
    setEditTags(doc.tags || []);
    setEditNotes(doc.notes || '');
    setEditTagInput('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc || !editName.trim()) return;

    try {
      const updated: DocumentMetadata = {
        ...editingDoc,
        name: editName.trim(),
        category: editCategory,
        date: editDate,
        tags: editTags,
        notes: editNotes.trim()
      };
      
      await updateDocumentMetadata(updated);
      setEditingDoc(null);
      onRefresh();
    } catch (err) {
      alert('Failed to update document metadata: ' + err);
    }
  };

  const addEditTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const cleaned = editTagInput.trim().toLowerCase().replace(/,/g, '');
      if (cleaned && !editTags.includes(cleaned)) {
        setEditTags([...editTags, cleaned]);
        setEditTagInput('');
      }
    }
  };

  const removeEditTag = (index: number) => {
    setEditTags(editTags.filter((_, i) => i !== index));
  };

  const toggleTagFilter = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Filtered and Sorted Documents
  const filteredDocs = useMemo(() => {
    let result = documents;

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(doc => 
        doc.name.toLowerCase().includes(q) || 
        doc.notes?.toLowerCase().includes(q) || 
        doc.tags?.some(tag => tag.toLowerCase().includes(q)) ||
        doc.fileName?.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategory !== 'All') {
      result = result.filter(doc => doc.category === selectedCategory);
    }

    // Tags multi-select filter
    if (selectedTags.length > 0) {
      result = result.filter(doc => 
        selectedTags.every(selectedTag => doc.tags?.includes(selectedTag))
      );
    }

    // Sort operations
    return [...result].sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'size-desc':
          return (b.fileSize || 0) - (a.fileSize || 0);
        default:
          return 0;
      }
    });

  }, [documents, search, selectedCategory, selectedTags, sortBy]);

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileText size={20} color="var(--accent)" />;
    if (fileType.includes('image')) return <FileImage size={20} color="#3b82f6" />;
    return <File size={20} color="var(--text-muted)" />;
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Category Tabs & Views */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '12px',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', maxWidth: '100%' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '8px 16px',
                borderRadius: '9999px',
                background: selectedCategory === cat ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                border: '1px solid',
                borderColor: selectedCategory === cat ? 'var(--accent)' : 'transparent',
                color: selectedCategory === cat ? 'var(--accent)' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                whiteSpace: 'nowrap'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Layout and Sort Toggle */}
        <div className="view-mode-selector" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="glass-panel" style={{ display: 'flex', padding: '4px', borderRadius: 'var(--radius-md)' }}>
            <button 
              onClick={() => setViewMode('grid')}
              style={{
                padding: '6px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: viewMode === 'grid' ? 'var(--bg-tertiary)' : 'transparent',
                color: viewMode === 'grid' ? 'var(--accent)' : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex'
              }}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              style={{
                padding: '6px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: viewMode === 'list' ? 'var(--bg-tertiary)' : 'transparent',
                color: viewMode === 'list' ? 'var(--accent)' : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex'
              }}
              title="List View"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents by title, tags, notes..."
            className="form-input"
            style={{ width: '100%', paddingLeft: '44px' }}
          />
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          {search && (
            <button 
              onClick={() => setSearch('')}
              style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Sort Select */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="form-input"
            style={{ minWidth: '160px', padding: '10px 32px 10px 14px' }}
          >
            <option value="date-desc">Newest Date</option>
            <option value="date-asc">Oldest Date</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="size-desc">File Size (Max)</option>
          </select>

          {/* Advanced Filter Toggle */}
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`btn btn-secondary ${showFilters ? 'active' : ''}`}
            style={{ 
              borderColor: showFilters ? 'var(--accent)' : 'var(--border-color)',
              color: showFilters ? 'var(--accent)' : 'var(--text-primary)',
            }}
          >
            <SlidersHorizontal size={16} />
            <span>Filters {selectedTags.length > 0 && `(${selectedTags.length})`}</span>
          </button>
        </div>
      </div>

      {/* Advanced Tag Filter Drawer */}
      {showFilters && allTags.length > 0 && (
        <div 
          className="glass-panel animate-fade-in" 
          style={{ 
            padding: '18px 24px', 
            borderRadius: 'var(--radius-md)', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '12px' 
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Filter by Tags</span>
            {selectedTags.length > 0 && (
              <button 
                onClick={() => setSelectedTags([])}
                style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Clear All
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {allTags.map(tag => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleTagFilter(tag)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid',
                    borderColor: isSelected ? 'var(--accent)' : 'var(--border-color)',
                    background: isSelected ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.01)',
                    color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredDocs.length === 0 && (
        <div className="glass-panel" style={{ padding: '80px 24px', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
          <File size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>No documents match your criteria</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto 20px auto' }}>
            Try resetting your filters, clearing your search, or uploading new files to your vault.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            {(search || selectedCategory !== 'All' || selectedTags.length > 0) && (
              <button 
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('All');
                  setSelectedTags([]);
                }} 
                className="btn btn-secondary"
              >
                Reset Search Filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Document Layout - GRID */}
      {viewMode === 'grid' && filteredDocs.length > 0 && (
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: '24px' 
          }}
        >
          {filteredDocs.map((doc) => (
            <div 
              key={doc.id} 
              className="glass-panel glow-card" 
              style={{ 
                borderRadius: 'var(--radius-lg)', 
                display: 'flex', 
                flexDirection: 'column',
                height: '260px',
                overflow: 'hidden'
              }}
            >
              {/* Header Info */}
              <div style={{ padding: '20px 20px 12px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ display: 'flex', padding: '10px', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)' }}>
                    {getFileIcon(doc.fileType)}
                  </div>
                  <span className={`badge ${
                    doc.category === 'Medical' ? 'badge-medical' :
                    doc.category === 'Home' ? 'badge-home' :
                    doc.category === 'Finance' ? 'badge-finance' :
                    doc.category === 'Identity' ? 'badge-identity' :
                    doc.category === 'Receipts' ? 'badge-receipts' : 'badge-other'
                  }`}>
                    {doc.category}
                  </span>
                </div>
                
                <div style={{ overflow: 'hidden' }}>
                  <h4 
                    style={{ 
                      fontSize: '1rem', 
                      fontWeight: 700, 
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                      color: 'var(--text-primary)',
                      marginBottom: '4px'
                    }}
                    title={doc.name}
                  >
                    {doc.name}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    <Calendar size={12} />
                    <span>{formatDate(doc.date)}</span>
                    <span>•</span>
                    <span>{formatSize(doc.fileSize)}</span>
                  </div>
                </div>

                {/* Notes (truncated) */}
                {doc.notes && (
                  <p 
                    style={{ 
                      fontSize: '0.8rem', 
                      color: 'var(--text-secondary)',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: '1.4'
                    }}
                  >
                    {doc.notes}
                  </p>
                )}

                {/* Tags (scrolling if many) */}
                {doc.tags && doc.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', marginTop: 'auto' }}>
                    {doc.tags.map((tag) => (
                      <span 
                        key={tag}
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-secondary)',
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Footer */}
              <div 
                style={{ 
                  height: '52px', 
                  borderTop: '1px solid var(--border-color)', 
                  background: 'rgba(255,255,255,0.01)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 16px'
                }}
              >
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button 
                    onClick={() => onViewDoc(doc)}
                    className="btn btn-ghost" 
                    style={{ padding: '8px', borderRadius: 'var(--radius-sm)' }}
                    title="View Document"
                  >
                    <Eye size={16} color="var(--accent)" />
                  </button>
                  <button 
                    onClick={() => handleDownload(doc)}
                    className="btn btn-ghost" 
                    style={{ padding: '8px', borderRadius: 'var(--radius-sm)' }}
                    title="Download File"
                  >
                    <Download size={16} />
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button 
                    onClick={() => handleOpenEdit(doc)}
                    className="btn btn-ghost" 
                    style={{ padding: '8px', borderRadius: 'var(--radius-sm)' }}
                    title="Edit Metadata"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button 
                    onClick={() => setDeletingDoc(doc)}
                    className="btn btn-ghost" 
                    style={{ padding: '8px', borderRadius: 'var(--radius-sm)' }}
                    title="Delete Document"
                  >
                    <Trash2 size={16} color="var(--danger)" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Layout - LIST */}
      {viewMode === 'list' && filteredDocs.length > 0 && (
        <div 
          className="glass-panel" 
          style={{ 
            borderRadius: 'var(--radius-lg)', 
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {filteredDocs.map((doc, idx) => (
            <div 
              key={doc.id}
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 2fr 1fr 1fr 1.2fr auto',
                alignItems: 'center',
                padding: '16px 24px',
                borderBottom: idx === filteredDocs.length - 1 ? 'none' : '1px solid var(--border-color)',
                background: 'rgba(255,255,255,0.005)',
                transition: 'background var(--transition-fast)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.015)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.005)'}
            >
              {/* Icon */}
              <div style={{ display: 'flex', padding: '10px', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', marginRight: '16px' }}>
                {getFileIcon(doc.fileType)}
              </div>

              {/* Title & Notes */}
              <div style={{ overflow: 'hidden', paddingRight: '16px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>
                  {doc.name}
                </h4>
                {doc.notes && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                    {doc.notes}
                  </p>
                )}
              </div>

              {/* Category */}
              <div>
                <span className={`badge ${
                  doc.category === 'Medical' ? 'badge-medical' :
                  doc.category === 'Home' ? 'badge-home' :
                  doc.category === 'Finance' ? 'badge-finance' :
                  doc.category === 'Identity' ? 'badge-identity' :
                  doc.category === 'Receipts' ? 'badge-receipts' : 'badge-other'
                }`}>
                  {doc.category}
                </span>
              </div>

              {/* Date */}
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {formatDate(doc.date)}
              </div>

              {/* Size */}
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {formatSize(doc.fileSize)}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => onViewDoc(doc)}
                  className="btn btn-secondary btn-sm" 
                  style={{ padding: '8px 12px', fontSize: '0.75rem' }}
                >
                  <Eye size={12} />
                  <span style={{ marginLeft: '4px' }}>View</span>
                </button>
                <button 
                  onClick={() => handleDownload(doc)}
                  className="btn btn-ghost" 
                  style={{ padding: '8px' }}
                  title="Download File"
                >
                  <Download size={14} />
                </button>
                <button 
                  onClick={() => handleOpenEdit(doc)}
                  className="btn btn-ghost" 
                  style={{ padding: '8px' }}
                  title="Edit Metadata"
                >
                  <Edit3 size={14} />
                </button>
                <button 
                  onClick={() => setDeletingDoc(doc)}
                  className="btn btn-ghost" 
                  style={{ padding: '8px' }}
                  title="Delete Document"
                >
                  <Trash2 size={14} color="var(--danger)" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Metadata Modal */}
      {editingDoc && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div 
            className="glass-panel animate-fade-in" 
            style={{ 
              width: '100%', 
              maxWidth: '560px', 
              borderRadius: 'var(--radius-lg)', 
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid rgba(255,255,255,0.12)'
            }}
          >
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Edit Document Settings</h3>
              <button 
                onClick={() => setEditingDoc(null)} 
                className="btn btn-ghost"
                style={{ padding: '6px', borderRadius: '50%' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div className="form-group">
                <label className="form-label">Document Name</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select 
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="form-input form-select"
                  >
                    {categories.filter(c => c !== 'All').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Document Date</label>
                  <input 
                    type="date" 
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Tags (press Enter to add)</label>
                <div 
                  className="form-input"
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    alignItems: 'center',
                    padding: '8px 12px',
                    minHeight: '44px'
                  }}
                  onClick={(e) => e.currentTarget.querySelector('input')?.focus()}
                >
                  {editTags.map((tag, idx) => (
                    <span 
                      key={idx}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '2px 8px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {tag}
                      <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); removeEditTag(idx); }}
                        style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                  <input 
                    type="text" 
                    value={editTagInput}
                    onChange={(e) => setEditTagInput(e.target.value)}
                    onKeyDown={addEditTag}
                    style={{
                      background: 'none',
                      border: 'none',
                      outline: 'none',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      flex: 1,
                      minWidth: '80px'
                    }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes / Description</label>
                <textarea 
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="form-input form-textarea"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setEditingDoc(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingDoc && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div 
            className="glass-panel animate-fade-in" 
            style={{ 
              width: '100%', 
              maxWidth: '440px', 
              borderRadius: 'var(--radius-lg)', 
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid rgba(239, 68, 68, 0.15)'
            }}
          >
            <div style={{ padding: '24px 24px 16px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
              <div style={{ padding: '16px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', display: 'flex' }}>
                <AlertTriangle size={32} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '6px' }}>Permanently Delete?</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.4' }}>
                  Are you sure you want to delete <strong>{deletingDoc.name}</strong>? 
                  This will erase the file from your vault storage permanently.
                </p>
              </div>
            </div>

            <div 
              style={{ 
                padding: '16px 24px', 
                borderTop: '1px solid var(--border-color)', 
                background: 'rgba(255,255,255,0.01)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                borderRadius: '0 0 var(--radius-lg) var(--radius-lg)'
              }}
            >
              <button onClick={() => setDeletingDoc(null)} className="btn btn-secondary">
                Keep File
              </button>
              <button onClick={handleDelete} className="btn btn-danger">
                Delete Securely
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
