import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDocuments, EntityType, DocumentType } from '@/hooks/useDocuments';
import { FileImage, Trash2, Download, Plus, Loader2, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DocumentGalleryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: string;
  entityType: EntityType;
  entityName: string;
  documents: string[];
  signatureUrl?: string | null;
  riders?: Array<{
    id: string;
    name: string;
    signatureUrl?: string; // Adult
    guardianSignatureUrl?: string; // Minor
    guardianName?: string;
  }>;
}

export function DocumentGallery({
  open,
  onOpenChange,
  entityId,
  entityType,
  entityName,
  documents,
  signatureUrl,
  riders = [],
}: DocumentGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadDocType, setUploadDocType] = useState<DocumentType>('other');
  const { uploadDocument, deleteDocument, getDocumentType, getDocumentName, uploading } = useDocuments();

  // Combine signatures from all riders + main legacy signature + documents
  const riderSignatures = riders.flatMap(r => {
    const docs = [];
    if (r.signatureUrl) docs.push({ url: r.signatureUrl, name: `חתימה: ${r.name}`, protected: true });
    if (r.guardianSignatureUrl) docs.push({ url: r.guardianSignatureUrl, name: `אפוטרופוס: ${r.guardianName || r.name}`, protected: true });
    return docs;
  });

  // Legacy single signature support
  const legacySig = signatureUrl ? [{ url: signatureUrl, name: 'חתימה ראשית', protected: true }] : [];

  // Normalize regular docs
  const regularDocs = documents.map(d => ({ url: d, name: getDocumentName(getDocumentType(d)), protected: false }));

  const allDisplayDocs = [...legacySig, ...riderSignatures, ...regularDocs];

  const selectedDoc = allDisplayDocs.find(d => d.url === selectedImage);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await uploadDocument(entityId, entityType, file, uploadDocType);
    e.target.value = '';
  };

  const handleDelete = async (url: string) => {
    const doc = allDisplayDocs.find(d => d.url === url);
    if (doc?.protected) {
      return;
    }
    await deleteDocument(entityId, entityType, url);
    if (selectedImage === url) {
      setSelectedImage(null);
    }
  };

  const handleDownload = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileImage className="h-5 w-5" />
            מסמכים של: {entityName}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Thumbnails */}
          <div className="space-y-4">
            <ScrollArea className="h-[300px] md:h-[400px] border rounded-lg p-2">
              {allDisplayDocs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  אין מסמכים
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {allDisplayDocs.map((item, index) => {
                    return (
                      <div
                        key={index}
                        className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${selectedImage === item.url ? 'border-primary' : 'border-transparent hover:border-muted-foreground/50'
                          }`}
                        onClick={() => setSelectedImage(item.url)}
                      >
                        <img
                          src={item.url}
                          alt={item.name}
                          className="w-full h-20 object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.svg';
                          }}
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 text-center truncate">
                          {item.name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Upload section */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={uploadDocType} onValueChange={(v) => setUploadDocType(v as DocumentType)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="סוג מסמך" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id_photo">תעודת זהות</SelectItem>
                  <SelectItem value="passport">דרכון</SelectItem>
                  <SelectItem value="damage_report">דו"ח נזק</SelectItem>
                  <SelectItem value="other">אחר</SelectItem>
                </SelectContent>
              </Select>

              <label className="flex-1">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={uploading}
                />
                <Button
                  variant="outline"
                  className="w-full min-h-[44px]"
                  disabled={uploading}
                  asChild
                >
                  <span>
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    ) : (
                      <Plus className="h-4 w-4 ml-2" />
                    )}
                    העלה מסמך
                  </span>
                </Button>
              </label>
            </div>
          </div>

          {/* Preview */}
          <div className="border rounded-lg p-2 min-h-[300px] md:min-h-[400px] flex flex-col">
            {selectedImage ? (
              <>
                <div className="flex-1 flex items-center justify-center overflow-hidden">
                  <img
                    src={selectedImage}
                    alt="תצוגה מקדימה"
                    className="max-w-full max-h-[300px] object-contain"
                  />
                </div>
                <div className="flex gap-2 mt-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 min-h-[44px]"
                    onClick={() => handleDownload(selectedImage)}
                  >
                    <Download className="h-4 w-4 ml-2" />
                    הורד
                  </Button>
                  {selectedDoc && !selectedDoc.protected && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1 min-h-[44px]"
                      onClick={() => handleDelete(selectedImage)}
                    >
                      <Trash2 className="h-4 w-4 ml-2" />
                      מחק
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="min-h-[44px]"
                    onClick={() => setSelectedImage(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                לחץ על תמונה להצגה
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
