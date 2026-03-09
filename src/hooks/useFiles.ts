import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
    fileSize: row.file_size,
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
    const { data } = await supabase
      .from('files')
      .select('*')
      .eq('record_id', recordId)
      .order('created_at', { ascending: false });
    if (data) setFiles(data.map(mapRow));
    setLoading(false);
  }, [recordId]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true);
    const filePath = `${tenantId}/${recordId}/${Date.now()}_${file.name}`;
    
    const { error: uploadError } = await supabase.storage
      .from('crm-files')
      .upload(filePath, file);
    
    if (uploadError) {
      setUploading(false);
      throw uploadError;
    }

    const { data: urlData } = supabase.storage.from('crm-files').getPublicUrl(filePath);
    const fileUrl = urlData.publicUrl;

    const { data } = await supabase.from('files').insert({
      record_id: recordId,
      file_name: file.name,
      file_url: fileUrl,
      file_size: file.size,
      uploaded_by: userName,
      tenant_id: tenantId,
    } as any).select().single();

    if (data) setFiles(prev => [mapRow(data), ...prev]);
    setUploading(false);
  }, [recordId, userName, tenantId]);

  const deleteFile = useCallback(async (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    setFiles(prev => prev.filter(f => f.id !== fileId));
    await supabase.from('files').delete().eq('id', fileId);
    // Try to remove from storage too
    if (file?.fileUrl) {
      const path = file.fileUrl.split('/crm-files/')[1];
      if (path) await supabase.storage.from('crm-files').remove([path]);
    }
  }, [files]);

  return { files, loading, uploading, uploadFile, deleteFile };
}
