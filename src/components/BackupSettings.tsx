import React, { useState, useRef } from 'react';
import { 
  Download, 
  Upload, 
  ShieldAlert, 
  CheckCircle, 
  AlertTriangle,
  Loader,
  Info
} from 'lucide-react';
import { exportBackup, importBackup } from '../db';

interface BackupSettingsProps {
  onRefresh: () => void;
}

export default function BackupSettings({ onRefresh }: BackupSettingsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importMode, setImportMode] = useState<'merge' | 'overwrite'>('merge');
  
  const [exportSuccess, setExportSuccess] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setErrorMsg('');
    setExportSuccess(false);

    try {
      const backupString = await exportBackup();
      const blob = new Blob([backupString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const dateStr = new Date().toISOString().substring(0, 10);
      const a = document.createElement('a');
      a.href = url;
      a.download = `personal-vault-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setExportSuccess(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to export vault data: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setErrorMsg('');
    setImportSuccess(false);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonContent = event.target?.result as string;
        
        // Confirm overwrite with user if selected
        if (importMode === 'overwrite') {
          const confirmWipe = window.confirm(
            'WARNING: Overwrite mode will permanently DELETE all current documents and files in this browser before importing. Do you want to proceed?'
          );
          if (!confirmWipe) {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
          }
        }

        await importBackup(jsonContent, importMode);
        setImportSuccess(true);
        onRefresh();
      } catch (err: any) {
        console.error(err);
        setErrorMsg('Import failed. Invalid backup file format or corrupted data: ' + err.message);
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.onerror = () => {
      setErrorMsg('Failed to read the backup file.');
      setIsImporting(false);
    };

    reader.readAsText(file);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Privacy Warning Header */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: '24px', 
          borderRadius: 'var(--radius-lg)', 
          borderLeft: '4px solid var(--warning)',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.03) 0%, rgba(17, 19, 24, 0.7) 100%)',
          display: 'flex',
          gap: '16px',
          alignItems: 'flex-start'
        }}
      >
        <ShieldAlert size={24} color="var(--warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
            Understanding Cloud Storage
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5' }}>
            All documents are safely stored in your private cloud database. Even if you clear your browser's cache or switch devices, <strong>your files are preserved</strong>. 
            We still recommend exporting backups if you want a local copy of your data on a physical drive for cold storage.
          </p>
        </div>
      </div>

      <div className="backup-split-grid">
        {/* Export Panel */}
        <div className="glass-panel" style={{ padding: '28px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Download size={20} color="var(--accent)" />
              <span>Export Vault Backup</span>
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '24px' }}>
              Compile all document metadata and binary files into a single `.json` file. You can download and store this file anywhere.
            </p>
          </div>

          <div style={{ marginTop: 'auto' }}>
            {exportSuccess && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '16px' }}>
                <CheckCircle size={16} />
                <span>Backup file generated and downloaded!</span>
              </div>
            )}

            <button 
              onClick={handleExport}
              className="btn btn-primary"
              style={{ width: '100%', height: '46px' }}
              disabled={isExporting || isImporting}
            >
              {isExporting ? (
                <>
                  <Loader size={18} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Packaging Vault...</span>
                </>
              ) : (
                <span>Download Backup File</span>
              )}
            </button>
          </div>
        </div>

        {/* Import Panel */}
        <div className="glass-panel" style={{ padding: '28px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Upload size={20} color="#3b82f6" />
            <span>Restore / Import Backup</span>
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '18px' }}>
            Restore your vault documents from a previously exported `.json` file. Select a file and select the recovery behavior:
          </p>

          {/* Import Modes */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input 
                type="radio" 
                name="importMode" 
                checked={importMode === 'merge'} 
                onChange={() => setImportMode('merge')}
                disabled={isImporting}
                style={{ accentColor: 'var(--accent)' }}
              />
              <div>
                <strong style={{ display: 'block', color: 'var(--text-primary)' }}>Merge</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Keep current and add new files</span>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input 
                type="radio" 
                name="importMode" 
                checked={importMode === 'overwrite'} 
                onChange={() => setImportMode('overwrite')}
                disabled={isImporting}
                style={{ accentColor: 'var(--accent)' }}
              />
              <div>
                <strong style={{ display: 'block', color: '#f87171' }}>Overwrite</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Wipe vault first, then import</span>
              </div>
            </label>
          </div>

          <div style={{ marginTop: 'auto' }}>
            {importSuccess && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '16px' }}>
                <CheckCircle size={16} />
                <span>Vault restored successfully!</span>
              </div>
            )}

            {errorMsg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontSize: '0.85rem', fontWeight: 600, marginBottom: '16px' }}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            <input 
              ref={fileInputRef}
              type="file" 
              accept=".json"
              onChange={handleImportFile}
              style={{ display: 'none' }}
              disabled={isImporting}
            />

            <button 
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-secondary"
              style={{ width: '100%', height: '46px', borderColor: 'rgba(59, 130, 246, 0.4)', color: '#60a5fa' }}
              disabled={isExporting || isImporting}
            >
              {isImporting ? (
                <>
                  <Loader size={18} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Restoring Vault...</span>
                </>
              ) : (
                <span>Upload & Import Backup</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Security Tip */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: '20px 24px', 
          borderRadius: 'var(--radius-lg)', 
          background: 'rgba(255,255,255,0.01)',
          display: 'flex',
          gap: '12px',
          alignItems: 'center'
        }}
      >
        <Info size={18} color="var(--accent)" />
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
          <strong>Tip:</strong> Backups are saved as raw JSON text. Do not modify the contents of the exported JSON file directly, or they may fail to validate when importing.
        </span>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
