import { useState, useRef } from 'react';
import { 
  UploadCloud, 
  X, 
  FileText, 
  Calendar, 
  AlertCircle,
  CheckCircle,
  Loader
} from 'lucide-react';
import { saveDocument } from '../db';
import type { DocumentMetadata } from '../db';

interface UploadPanelProps {
  onUploadSuccess: (doc: DocumentMetadata) => void;
  setActiveTab: (tab: string) => void;
}

export default function UploadPanel({ onUploadSuccess, setActiveTab }: UploadPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Home');
  const [date, setDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  
  // Drag & drop status
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, phase: 'uploading' as 'uploading' | 'finalize' });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Categories list
  const categories = ['Home', 'Medical', 'Finance', 'Identity', 'Receipts', 'Other'];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (selectedFile: File) => {
    setFile(selectedFile);
    setName(selectedFile.name.replace(/\.[^/.]+$/, "")); // remove extension for user convenience
    setUploadStatus('idle');
  };

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const cleaned = tagInput.trim().toLowerCase().replace(/,/g, '');
      if (cleaned && !tags.includes(cleaned)) {
        setTags([...tags, cleaned]);
        setTagInput('');
      }
    }
  };

  const removeTag = (indexToRemove: number) => {
    setTags(tags.filter((_, i) => i !== indexToRemove));
  };

  const resetForm = () => {
    setFile(null);
    setName('');
    setCategory('Home');
    setDate(new Date().toISOString().substring(0, 10));
    setTagInput('');
    setTags([]);
    setNotes('');
    setUploadStatus('idle');
    setUploadProgress({ current: 0, total: 0, phase: 'uploading' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name.trim()) return;

    setIsUploading(true);
    setUploadStatus('idle');
    setErrorMessage('');
    setUploadProgress({ current: 0, total: 0, phase: 'uploading' });

    try {
      const metadata = {
        name: name.trim(),
        category,
        date,
        tags,
        notes: notes.trim(),
        fileType: file.type || 'application/octet-stream',
        fileName: file.name,
        fileSize: file.size,
      };

      const newDoc = await saveDocument(metadata, file, (progress) => {
        setUploadProgress(progress);
      });
      setIsUploading(false);
      setUploadStatus('success');
      onUploadSuccess(newDoc);
      
      // Auto-navigate to vault after short success presentation
      setTimeout(() => {
        resetForm();
        setActiveTab('vault');
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setIsUploading(false);
      setUploadStatus('error');
      setErrorMessage(err.message || 'Failed to save document. Cloud storage might be unavailable.');
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      
      <div className="glass-panel" style={{ padding: '32px', borderRadius: 'var(--radius-lg)' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '24px', letterSpacing: '-0.01em' }}>
          Upload New Document
        </h2>

        {uploadStatus === 'success' && (
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              background: 'rgba(16, 185, 129, 0.1)', 
              border: '1px solid rgba(16, 185, 129, 0.2)',
              color: 'var(--accent)',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '24px'
            }}
          >
            <CheckCircle size={20} />
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Document saved securely in your vault! Redirecting...</span>
          </div>
        )}

        {uploadStatus === 'error' && (
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              background: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#f87171',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '24px'
            }}
          >
            <AlertCircle size={20} />
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* File Picker Zone */}
          {!file ? (
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '48px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                background: isDragActive ? 'rgba(16, 185, 129, 0.02)' : 'rgba(255, 255, 255, 0.01)',
                borderColor: isDragActive ? 'var(--accent)' : 'var(--border-color)',
                transition: 'all var(--transition-fast)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseLeave={(e) => {
                if(!isDragActive) e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                onChange={handleFileInput}
                style={{ display: 'none' }}
                accept="application/pdf,image/*,text/plain"
              />
              <div 
                style={{ 
                  padding: '16px', 
                  borderRadius: '50%', 
                  background: 'var(--bg-tertiary)',
                  color: isDragActive ? 'var(--accent)' : 'var(--text-secondary)',
                  display: 'flex',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <UploadCloud size={32} />
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '6px' }}>
                  Drag & drop your file here, or <span style={{ color: 'var(--accent)' }}>browse</span>
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  Supports PDF, Images, and Text files up to 500MB (plan limits apply)
                </p>
              </div>
            </div>
          ) : (
            /* Selected File Panel */
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '16px 20px',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', overflow: 'hidden' }}>
                <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent)', display: 'flex' }}>
                  <FileText size={22} />
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <p style={{ fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {file.name}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {parseFloat((file.size / 1024 / 1024).toFixed(2))} MB
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setFile(null)} 
                className="btn btn-ghost" 
                style={{ padding: '8px', borderRadius: '50%' }}
                disabled={isUploading}
              >
                <X size={16} />
              </button>
            </div>
          )}

          {file && (
            /* Metadata Fields */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }} className="animate-fade-in">
              <div className="form-group">
                <label className="form-label">Document Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                  required
                  disabled={isUploading}
                  placeholder="e.g. Health Insurance Plan 2026"
                />
              </div>

              <div className="upload-split-grid">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="form-input form-select"
                    disabled={isUploading}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Document Date</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input 
                      type="date" 
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="form-input"
                      style={{ width: '100%', paddingRight: '40px' }}
                      required
                      disabled={isUploading}
                    />
                    <Calendar size={18} color="var(--text-muted)" style={{ position: 'absolute', right: '12px', pointerEvents: 'none' }} />
                  </div>
                </div>
              </div>

              {/* Tag Input */}
              <div className="form-group">
                <label className="form-label">Tags (press Enter or Comma to add)</label>
                <div 
                  className="form-input"
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    alignItems: 'center',
                    padding: '8px 12px',
                    minHeight: '46px'
                  }}
                  onClick={(e) => {
                    const input = e.currentTarget.querySelector('input');
                    if (input) input.focus();
                  }}
                >
                  {tags.map((tag, index) => (
                    <span 
                      key={index} 
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '3px 8px',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTag(index);
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
                        disabled={isUploading}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  <input 
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={addTag}
                    placeholder={tags.length === 0 ? "e.g. tax, medical, receipt" : ""}
                    style={{
                      background: 'none',
                      border: 'none',
                      outline: 'none',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-family)',
                      fontSize: '0.9rem',
                      flex: 1,
                      minWidth: '100px'
                    }}
                    disabled={isUploading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes / Description</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="form-input form-textarea"
                  placeholder="Describe the document, add key details or search keywords..."
                  disabled={isUploading}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '12px' }}>
                <button 
                  type="button" 
                  onClick={resetForm} 
                  className="btn btn-secondary"
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ minWidth: '120px' }}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader size={18} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                      <span>
                        {uploadProgress.phase === 'finalize'
                          ? 'Finalizing...'
                          : uploadProgress.total > 0
                            ? `Uploading ${uploadProgress.current}/${uploadProgress.total}`
                            : 'Uploading...'}
                      </span>
                    </>
                  ) : (
                    <span>Save to Vault</span>
                  )}
                </button>
              </div>
            </div>
          )}

        </form>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
