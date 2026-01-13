import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDocuments, EntityType, DocumentType } from '@/hooks/useDocuments';
import { Upload, Loader2, Camera, FileImage, FileText, AlertTriangle } from 'lucide-react';

interface DocumentUploadButtonProps {
  entityId: string;
  entityType: EntityType;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function DocumentUploadButton({
  entityId,
  entityType,
  variant = 'outline',
  size = 'sm',
}: DocumentUploadButtonProps) {
  const [open, setOpen] = useState(false);
  const { uploadDocument, uploading } = useDocuments();

  const handleUpload = async (file: File, docType: DocumentType) => {
    await uploadDocument(entityId, entityType, file, docType);
    setOpen(false);
  };

  const handleFileSelect = (docType: DocumentType) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file, docType);
    }
    e.target.value = '';
  };

  const documentOptions: { type: DocumentType; label: string; icon: React.ReactNode }[] = [
    { type: 'id_photo', label: 'תעודת זהות', icon: <FileImage className="h-4 w-4" /> },
    { type: 'passport', label: 'דרכון', icon: <FileText className="h-4 w-4" /> },
    { type: 'damage_report', label: 'דו"ח נזק', icon: <AlertTriangle className="h-4 w-4" /> },
    { type: 'other', label: 'מסמך אחר', icon: <Camera className="h-4 w-4" /> },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant={variant} size={size} disabled={uploading} className="min-h-[44px]">
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" dir="rtl">
        <div className="space-y-1">
          {documentOptions.map((option) => (
            <label key={option.type} className="block">
              <input
                type="file"
                accept="image/*,application/pdf"
                capture="environment"
                onChange={handleFileSelect(option.type)}
                className="hidden"
                disabled={uploading}
              />
              <Button
                variant="ghost"
                className="w-full justify-start min-h-[44px]"
                asChild
              >
                <span>
                  {option.icon}
                  <span className="mr-2">{option.label}</span>
                </span>
              </Button>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
