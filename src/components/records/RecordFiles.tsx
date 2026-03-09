import { useRef } from "react";
import { format } from "date-fns";
import { Upload, FileText, Trash2, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CrmFile } from "@/hooks/useFiles";

interface RecordFilesProps {
  files: CrmFile[];
  uploading?: boolean;
  onUpload: (file: File) => void;
  onDelete: (fileId: string) => void;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function RecordFiles({ files, uploading, onUpload, onDelete }: RecordFilesProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <input ref={inputRef} type="file" className="hidden" onChange={handleFileChange} />
      <Button size="sm" variant="outline" className="w-full" onClick={() => inputRef.current?.click()} disabled={uploading}>
        {uploading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Upload className="h-3.5 w-3.5 mr-1.5" />}
        {uploading ? 'Uploading...' : 'Upload File'}
      </Button>

      <div className="space-y-2">
        {files.map((file) => (
          <div key={file.id} className="flex items-center gap-3 rounded-lg border border-border p-2.5 group hover:bg-muted/30 transition-colors">
            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium truncate text-foreground hover:underline block">
                {file.fileName}
              </a>
              <p className="text-xs text-muted-foreground">{formatFileSize(file.fileSize)} · {format(new Date(file.createdAt), 'MMM d')}</p>
            </div>
            <div className="flex gap-0.5">
              <a href={file.fileUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Download className="h-3 w-3 text-muted-foreground" />
                </Button>
              </a>
              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => onDelete(file.id)}>
                <Trash2 className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
          </div>
        ))}
        {files.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">No files attached</p>
        )}
      </div>
    </div>
  );
}
