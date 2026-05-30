import { useState, useEffect } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  Loader, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { getDocumentFile } from '../db';
import type { DocumentMetadata } from '../db';

interface DocumentViewerProps {
  document: DocumentMetadata | null;
  onClose: () => void;
}

export default function DocumentViewer({ document: doc, onClose }: DocumentViewerProps) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [objectUrl, setObjectUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Image transformation state
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [textContent, setTextContent] = useState('');

  useEffect(() => {
    if (!doc) {
      setBlob(null);
      setObjectUrl('');
      setError('');
      return;
    }

    let active = true;
    const loadFile = async () => {
      setIsLoading(true);
      setError('');
      setTextContent('');
      setZoom(1);
      setRotation(0);

      try {
        const fileBlob = await getDocumentFile(doc.filePath);
        if (!active) return;

        setBlob(fileBlob);
        
        // Handle text previews by reading content
        if (doc.fileType.includes('text/plain')) {
          const text = await fileBlob.text();
          if (active) setTextContent(text);
        } else {
          // Create object URL for pdf / images
          const url = URL.createObjectURL(fileBlob);
          if (active) setObjectUrl(url);
        }
      } catch (err: any) {
        console.error(err);
        if (active) setError('Failed to load file from your vault storage.');
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadFile();

    return () => {
      active = false;
      // Clean up object URL when component changes or unmounts
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [doc]);

  // Keep objectUrl cleanup safe
  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  if (!doc) return null;

  const handleDownload = () => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.fileName || doc.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.25, 0.5));
  const handleRotate = () => setRotation(r => (r + 90) % 360);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px' }}>
          <Loader size={36} className="spin" color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>Loading document...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px', padding: '24px', textAlign: 'center' }}>
          <AlertCircle size={40} color="var(--danger)" />
          <p style={{ color: '#f87171', fontWeight: 600, fontSize: '0.95rem' }}>{error}</p>
          <button onClick={onClose} className="btn btn-secondary">Close Viewer</button>
        </div>
      );
    }

    if (doc.fileType.includes('pdf') && objectUrl) {
      return (
        <div style={{ width: '100%', height: '100%', background: '#1e1e24', padding: '10px', borderRadius: 'var(--radius-md)' }}>
          <iframe 
            src={`${objectUrl}#toolbar=0`} 
            width="100%" 
            height="100%" 
            style={{ border: 'none', background: '#ffffff', borderRadius: 'var(--radius-sm)' }}
            title={doc.name}
          />
        </div>
      );
    }

    if (doc.fileType.includes('image') && objectUrl) {
      return (
        <div 
          style={{ 
            width: '100%', 
            height: '100%', 
            overflow: 'auto', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            background: '#0d0e12',
            padding: '24px',
            position: 'relative'
          }}
        >
          <img 
            src={objectUrl} 
            alt={doc.name} 
            style={{ 
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              maxHeight: '100%',
              maxWidth: '100%',
              objectFit: 'contain',
              boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
              borderRadius: 'var(--radius-sm)'
            }}
          />
        </div>
      );
    }

    if (doc.fileType.includes('text/plain')) {
      return (
        <div 
          style={{ 
            width: '100%', 
            height: '100%', 
            overflowY: 'auto', 
            background: '#0d0e12',
            padding: '32px',
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            color: '#a7f3d0',
            lineHeight: '1.6',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            whiteSpace: 'pre-wrap'
          }}
        >
          {textContent}
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '20px', padding: '24px', textAlign: 'center' }}>
        <div style={{ padding: '24px', borderRadius: '50%', background: 'var(--bg-tertiary)' }}>
          <FileText size={48} color="var(--text-muted)" />
        </div>
        <div>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>Preview Not Available</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '320px' }}>
            This file type ({doc.fileType}) cannot be rendered directly in the browser vault.
          </p>
        </div>
        <button onClick={handleDownload} className="btn btn-primary">
          <Download size={16} />
          <span>Download to Device</span>
        </button>
      </div>
    );
  };

  return (
    <div className="viewer-container animate-fade-in">
      {/* Viewer Header */}
      <div className="viewer-header">
        <div style={{ overflow: 'hidden', paddingRight: '16px' }}>
          <h3 
            style={{ 
              fontSize: '1.1rem', 
              fontWeight: 800, 
              whiteSpace: 'nowrap', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis',
              color: 'var(--text-primary)'
            }}
          >
            {doc.name}
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
            {doc.category} Document • {doc.date}
          </span>
        </div>

        {/* Toolbar Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {doc.fileType.includes('image') && !isLoading && !error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-tertiary)', padding: '4px', borderRadius: 'var(--radius-md)', marginRight: '8px' }}>
              <button onClick={handleZoomOut} className="btn btn-ghost" style={{ padding: '6px', borderRadius: 'var(--radius-sm)' }} title="Zoom Out">
                <ZoomOut size={16} />
              </button>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', minWidth: '40px', textAlign: 'center' }}>
                {Math.round(zoom * 100)}%
              </span>
              <button onClick={handleZoomIn} className="btn btn-ghost" style={{ padding: '6px', borderRadius: 'var(--radius-sm)' }} title="Zoom In">
                <ZoomIn size={16} />
              </button>
              <button onClick={handleRotate} className="btn btn-ghost" style={{ padding: '6px', borderRadius: 'var(--radius-sm)', marginLeft: '4px' }} title="Rotate Right">
                <RotateCw size={16} />
              </button>
            </div>
          )}

          {blob && (
            <button 
              onClick={handleDownload} 
              className="btn btn-secondary" 
              style={{ height: '36px', padding: '0 12px', fontSize: '0.8rem' }}
            >
              <Download size={14} />
              <span>Download</span>
            </button>
          )}

          <button 
            onClick={onClose} 
            className="btn btn-ghost"
            style={{ 
              padding: '8px', 
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--danger)'
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {renderContent()}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
