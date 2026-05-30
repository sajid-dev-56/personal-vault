import { supabase } from './supabase';

export interface DocumentMetadata {
  id: string;
  name: string;
  category: string;
  date: string;
  tags: string[];
  notes: string;
  filePath: string;
  fileType: string;
  fileName: string;
  fileSize: number;
  createdAt: number;
}

export interface BackupData {
  documents: DocumentMetadata[];
  files: { id: string; base64: string; type: string; name: string }[];
}

export interface UploadProgress {
  phase: 'uploading' | 'finalize';
  current: number;
  total: number;
}

const STORAGE_BUCKET = 'vault-files';

async function getUid(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error('You must be signed in to access your vault.');
  }
  return data.user.id;
}

function mapRow(row: any): DocumentMetadata {
  return {
    id: row.id,
    name: row.name || '',
    category: row.category || 'other',
    date: row.date || '',
    tags: row.tags || [],
    notes: row.notes || '',
    filePath: row.file_path || '',
    fileType: row.file_type || '',
    fileName: row.file_name || '',
    fileSize: Number(row.file_size || 0),
    createdAt: row.created_at ? Date.parse(row.created_at) : Date.now()
  } as DocumentMetadata;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(base64: string, contentType: string): Blob {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: contentType });
}

function sanitizeFileName(fileName: string): string {
  const normalized = fileName.normalize('NFKD').replace(/[^\x00-\x7F]/g, '');
  const parts = normalized.split('.');
  const ext = parts.length > 1 ? parts.pop() || '' : '';
  const base = parts.join('.') || 'file';

  const safeBase = base.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  const safeExt = ext.replace(/[^a-zA-Z0-9]/g, '');
  const finalBase = safeBase || 'file';

  return safeExt ? `${finalBase}.${safeExt}` : finalBase;
}

export async function saveDocument(
  docData: Omit<DocumentMetadata, 'id' | 'createdAt' | 'filePath'>,
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<DocumentMetadata> {
  const uid = await getUid();
  const docId = crypto.randomUUID();
  const safeFileName = sanitizeFileName(file.name);
  const filePath = `${uid}/${docId}/${safeFileName}`;

  onProgress?.({ phase: 'uploading', current: 0, total: 1 });
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: false
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  onProgress?.({ phase: 'uploading', current: 1, total: 1 });

  const { data, error } = await supabase
    .from('documents')
    .insert({
      id: docId,
      user_id: uid,
      name: docData.name,
      category: docData.category,
      date: docData.date,
      tags: docData.tags,
      notes: docData.notes,
      file_path: filePath,
      file_type: docData.fileType,
      file_name: docData.fileName,
      file_size: docData.fileSize
    })
    .select('*')
    .single();

  if (error) {
    await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
    throw new Error(`Failed to save metadata: ${error.message}`);
  }

  onProgress?.({ phase: 'finalize', current: 1, total: 1 });

  return mapRow(data);
}

export async function getDocuments(): Promise<DocumentMetadata[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load documents: ${error.message}`);
  }

  return (data || []).map(mapRow);
}

export async function getDocumentFile(filePath: string): Promise<Blob> {
  if (!filePath) throw new Error('File path not found');

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .download(filePath);

  if (error || !data) {
    throw new Error('File data not found');
  }

  return data;
}

export async function deleteDocument(id: string, filePath: string): Promise<void> {
  if (!id) throw new Error('Document ID not found');

  const { error: storageError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([filePath]);

  if (storageError) {
    throw new Error(`Failed to delete file: ${storageError.message}`);
  }

  const { error: deleteError } = await supabase
    .from('documents')
    .delete()
    .eq('id', id);

  if (deleteError) {
    throw new Error(`Failed to delete document: ${deleteError.message}`);
  }
}

export async function updateDocumentMetadata(docData: DocumentMetadata): Promise<void> {
  const { error } = await supabase
    .from('documents')
    .update({
      name: docData.name,
      category: docData.category,
      date: docData.date,
      tags: docData.tags,
      notes: docData.notes
    })
    .eq('id', docData.id);

  if (error) {
    throw new Error(`Failed to update metadata: ${error.message}`);
  }
}

export async function exportBackup(): Promise<string> {
  const docs = await getDocuments();

  const files: { id: string; base64: string; type: string; name: string }[] = [];
  for (const docMeta of docs) {
    try {
      const blob = await getDocumentFile(docMeta.filePath);
      const base64 = await blobToBase64(blob);
      files.push({
        id: docMeta.id,
        base64,
        type: docMeta.fileType,
        name: docMeta.fileName
      });
    } catch (e) {
      console.error(`Failed to export file for "${docMeta.name}":`, e);
    }
  }

  const backupData: BackupData = { documents: docs, files };
  return JSON.stringify(backupData);
}

export async function importBackup(
  backupJson: string,
  mode: 'merge' | 'overwrite' = 'merge'
): Promise<void> {
  const data: BackupData = JSON.parse(backupJson);

  if (!data.documents || !data.files) {
    throw new Error('Invalid backup file structure');
  }

  if (mode === 'overwrite') {
    const existingDocs = await getDocuments();
    for (const existingDoc of existingDocs) {
      await deleteDocument(existingDoc.id, existingDoc.filePath);
    }
  }

  const fileMap = new Map(data.files.map((f) => [f.id, f]));

  for (const docMeta of data.documents) {
    const fileData = fileMap.get(docMeta.id);
    if (!fileData) {
      console.warn(`No file data for document "${docMeta.name}", skipping`);
      continue;
    }

    const blob = base64ToBlob(fileData.base64, fileData.type);
    const file = new File([blob], fileData.name || docMeta.fileName, { type: docMeta.fileType });

    await saveDocument(
      {
        name: docMeta.name,
        category: docMeta.category,
        date: docMeta.date,
        tags: docMeta.tags,
        notes: docMeta.notes,
        fileType: docMeta.fileType,
        fileName: fileData.name || docMeta.fileName,
        fileSize: file.size
      },
      file
    );
  }
}
