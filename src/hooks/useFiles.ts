import { useState, useEffect, useCallback } from 'react';
import { api, getApiBase, getToken, getAssetUrl } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';

export interface CrmFile {
  id: string;
  recordId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedBy: string;
  createdAt: string;
}

function mapRow(row: any): CrmFile {
  return {
    id: row.id,
    recordId: row.record_id,
    fileName: row.file_name,
    fileUrl: row.file_url,
    fileSize: row.file_size ?? 0,
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at,
  };
}

export function useFiles(recordId: string) {
  const [files, setFiles] = useState<CrmFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id || 't1';
  const userName = profile?.name || 'User';

  const fetchFiles = useCallback(async () => {
    if (!recordId) return;
    setLoading(true);
    const { data } = await api.get('/api/files', { record_id: recordId });
    if (data) setFiles((data as any[]).map(mapRow));
    setLoading(false);
  }, [recordId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const uploadFile = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const form = new FormData();
        form.append('file', file);
        const token = getToken();
        const res = await fetch(`${getApiBase()}/api/upload/file`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: form,
        });
        const uploadData = await res.json();
        if (!res.ok || !uploadData?.url) throw new Error(uploadData?.error || 'Upload failed');
        const fileUrl = uploadData.url;
        const { data } = await api.post('/api/files', {
          record_id: recordId,
          file_name: file.name,
          file_url: fileUrl,
          file_size: file.size,
          uploaded_by: userName,
        });
        if (data) setFiles((prev) => [mapRow(data), ...prev]);
      } finally {
        setUploading(false);
      }
    },
    [recordId, userName]
  );

  const deleteFile = useCallback(async (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    await api.delete(`/api/files/${fileId}`);
  }, []);

  return { files, loading, uploading, uploadFile, deleteFile, getAssetUrl };
}
