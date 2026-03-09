import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';
import { UserAvatar } from '@/components/UserAvatar';
import { toast } from 'sonner';

interface AvatarUploaderProps {
  name: string;
  avatarUrl: string | null;
  onUpload: (file: File) => Promise<string | null>;
}

export function AvatarUploader({ name, avatarUrl, onUpload }: AvatarUploaderProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB');
      return;
    }

    setUploading(true);
    const url = await onUpload(file);
    setUploading(false);

    if (url) {
      toast.success('Avatar updated');
    } else {
      toast.error('Failed to upload avatar');
    }
  };

  return (
    <div className="flex items-center gap-4">
      <UserAvatar name={name} avatarUrl={avatarUrl} size="lg" />
      <div className="space-y-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 mr-1.5" />
          )}
          {uploading ? 'Uploading...' : 'Change Avatar'}
        </Button>
        <p className="text-xs text-muted-foreground">JPG, PNG under 2MB</p>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
