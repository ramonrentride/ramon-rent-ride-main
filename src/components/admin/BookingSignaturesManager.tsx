import { useState, useMemo } from 'react';
import { useBookings } from '@/hooks/useSupabaseData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInYears, parse, isValid } from 'date-fns';
import { he } from 'date-fns/locale';
import jsPDF from 'jspdf';
import {
  FileSignature,
  Search,
  Eye,
  Download,
  Calendar,
  FileText,
  Users,
  Filter,
  AlertTriangle,
} from 'lucide-react';

function calculateAge(birthDate: string): number {
  let parsedDate = parse(birthDate, 'yyyy-MM-dd', new Date());
  if (!isValid(parsedDate)) {
    parsedDate = parse(birthDate, 'dd/MM/yyyy', new Date());
  }
  if (!isValid(parsedDate)) return 999;
  return differenceInYears(new Date(), parsedDate);
}

interface RiderWithSignature {
  id: string;
  name: string;
  height: number;
  birthDate?: string;
  isMinor?: boolean;
  signatureUrl?: string;
  guardianName?: string;
  guardianSignatureUrl?: string;
}

interface BookingWithSignature {
  id: string;
  date: string;
  session: string;
  phone: string;
  email: string;
  riders: RiderWithSignature[];
  waiverVersion?: string;
  waiverAcceptedAt?: string;
  createdAt: string;
}

export function BookingSignaturesManager() {
  const { data: bookings = [] } = useBookings(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedSignature, setSelectedSignature] = useState<BookingWithSignature | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Filter bookings with signatures (either global or per-rider)
  const bookingsWithSignatures = useMemo(() => {
    return (bookings as any[])
      .filter((b: any) => {
        // Check for global signature or any rider with signature
        const hasGlobalSig = b.signatureUrl || b.signature_url;
        const riders = b.riders || [];
        const hasRiderSig = riders.some((r: any) => r.signatureUrl || r.guardianSignatureUrl);
        return hasGlobalSig || hasRiderSig;
      })
      .map((b: any) => ({
        id: b.id,
        date: b.date,
        session: b.session,
        phone: b.phone,
        email: b.email,
        riders: (b.riders || []).map((r: any) => ({
          id: r.id,
          name: r.name,
          height: r.height,
          birthDate: r.birthDate,
          isMinor: r.isMinor,
          signatureUrl: r.signatureUrl,
          guardianName: r.guardianName,
          guardianSignatureUrl: r.guardianSignatureUrl,
        })),
        waiverVersion: b.waiverVersion || b.waiver_version,
        waiverAcceptedAt: b.waiverAcceptedAt || b.waiver_accepted_at,
        createdAt: b.createdAt || b.created_at,
      })) as BookingWithSignature[];
  }, [bookings]);

  // Apply filters
  const filteredSignatures = useMemo(() => {
    return bookingsWithSignatures.filter(booking => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesPhone = booking.phone?.toLowerCase().includes(query);
        const matchesEmail = booking.email?.toLowerCase().includes(query);
        const matchesName = booking.riders?.some(r => r.name?.toLowerCase().includes(query));
        const matchesId = booking.id.toLowerCase().includes(query);
        if (!matchesPhone && !matchesEmail && !matchesName && !matchesId) return false;
      }

      // Date range filter
      if (dateFrom && booking.date < dateFrom) return false;
      if (dateTo && booking.date > dateTo) return false;

      return true;
    });
  }, [bookingsWithSignatures, searchQuery, dateFrom, dateTo]);

  const handleViewSignature = (booking: BookingWithSignature) => {
    setSelectedSignature(booking);
    setViewDialogOpen(true);
  };

  const handleExportPDF = async (booking: BookingWithSignature) => {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(20);
    doc.text('אישור ויתור על אחריות', 105, 20, { align: 'center' });

    // Add booking details
    doc.setFontSize(12);
    doc.text(`מספר הזמנה: ${booking.id.slice(0, 8)}`, 190, 40, { align: 'right' });
    doc.text(`תאריך הזמנה: ${format(new Date(booking.date), 'dd/MM/yyyy')}`, 190, 50, { align: 'right' });
    doc.text(`סשן: ${booking.session === 'morning' ? 'בוקר' : 'יומי'}`, 190, 60, { align: 'right' });

    // Add riders with signatures
    doc.text('רוכבים:', 190, 75, { align: 'right' });
    let yPos = 85;

    for (const rider of booking.riders) {
      const isMinor = rider.isMinor || (rider.birthDate && calculateAge(rider.birthDate) < 18);
      doc.text(`• ${rider.name} (${rider.height}cm)${isMinor ? ' [קטין]' : ''}`, 180, yPos, { align: 'right' });

      // Add rider signature if available
      if (rider.signatureUrl?.startsWith('data:')) {
        try {
          doc.addImage(rider.signatureUrl, 'PNG', 100, yPos + 5, 60, 30);
          yPos += 35;
        } catch (e) {
          yPos += 10;
        }
      } else {
        yPos += 10;
      }

      // Add guardian signature for minors
      if (isMinor && rider.guardianName) {
        doc.text(`  הורה/אפוטרופוס: ${rider.guardianName}`, 170, yPos, { align: 'right' });
        yPos += 10;

        if (rider.guardianSignatureUrl?.startsWith('data:')) {
          try {
            doc.addImage(rider.guardianSignatureUrl, 'PNG', 100, yPos, 60, 30);
            yPos += 35;
          } catch (e) {
            yPos += 5;
          }
        }
      }
      yPos += 5;
    }

    // Add waiver info
    yPos += 10;
    doc.text(`גרסת ויתור: ${booking.waiverVersion || 'לא זמין'}`, 190, yPos, { align: 'right' });

    if (booking.waiverAcceptedAt) {
      doc.text(`תאריך אישור: ${format(new Date(booking.waiverAcceptedAt), 'dd/MM/yyyy HH:mm')}`, 190, yPos + 10, { align: 'right' });
    }

    // Add footer
    doc.setFontSize(10);
    doc.text('ramonrentride - מצפה רמון', 105, 280, { align: 'center' });

    // Save
    doc.save(`waiver_${booking.id.slice(0, 8)}_${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  const handleExportAllCSV = () => {
    const headers = ['מספר הזמנה', 'תאריך', 'סשן', 'שם', 'טלפון', 'אימייל', 'גרסת ויתור', 'תאריך אישור'];
    const rows = filteredSignatures.map(b => [
      b.id.slice(0, 8),
      format(new Date(b.date), 'dd/MM/yyyy'),
      b.session === 'morning' ? 'בוקר' : 'יומי',
      b.riders[0]?.name || '',
      b.phone,
      b.email,
      b.waiverVersion || '',
      b.waiverAcceptedAt ? format(new Date(b.waiverAcceptedAt), 'dd/MM/yyyy HH:mm') : '',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `signatures_${format(new Date(), 'yyyyMMdd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <FileSignature className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">✍️ ניהול חתימות הזמנות</h2>
        </div>
        <Button variant="outline" onClick={handleExportAllCSV} className="gap-2 min-h-[44px]">
          <Download className="w-4 h-4" />
          ייצוא הכל ל-CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">סינון</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <Label>חיפוש</Label>
            <div className="relative mt-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="שם, טלפון, מייל או מספר הזמנה..."
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <Label>מתאריך</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>עד תאריך</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-primary">{bookingsWithSignatures.length}</div>
          <div className="text-sm text-muted-foreground">סה"כ חתימות</div>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-primary">{filteredSignatures.length}</div>
          <div className="text-sm text-muted-foreground">תוצאות מסוננות</div>
        </div>
      </div>

      {/* Signatures Table */}
      {filteredSignatures.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center">
          <FileSignature className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {bookingsWithSignatures.length === 0
              ? 'אין עדיין חתימות בהזמנות'
              : 'לא נמצאו תוצאות לחיפוש'
            }
          </p>
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="relative">
            {/* Mobile scroll indicator */}
            <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-card to-transparent z-10 pointer-events-none md:hidden" />
            <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-card to-transparent z-10 pointer-events-none md:hidden" />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-right p-4 font-medium">מספר הזמנה</th>
                    <th className="text-right p-4 font-medium">תאריך</th>
                    <th className="text-right p-4 font-medium">שם</th>
                    <th className="text-right p-4 font-medium">טלפון</th>
                    <th className="text-right p-4 font-medium">גרסת ויתור</th>
                    <th className="text-right p-4 font-medium">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSignatures.map(booking => (
                    <tr key={booking.id} className="border-t border-border hover:bg-muted/30">
                      <td className="p-4">
                        <span className="font-mono text-primary">#{booking.id.slice(0, 8)}</span>
                      </td>
                      <td className="p-4">
                        {format(new Date(booking.date), 'dd/MM/yyyy', { locale: he })}
                      </td>
                      <td className="p-4">
                        {booking.riders[0]?.name || '-'}
                        {booking.riders.length > 1 && (
                          <span className="text-muted-foreground text-sm"> (+{booking.riders.length - 1})</span>
                        )}
                      </td>
                      <td className="p-4 font-mono text-sm">{booking.phone}</td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {booking.waiverVersion || '-'}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewSignature(booking)}
                            className="gap-1 min-h-[44px] px-3"
                          >
                            <Eye className="w-4 h-4" />
                            צפייה
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleExportPDF(booking)}
                            className="gap-1 min-h-[44px] px-3"
                          >
                            <Download className="w-4 h-4" />
                            PDF
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* View Signature Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSignature className="w-5 h-5 text-primary" />
              חתימת הזמנה #{selectedSignature?.id.slice(0, 8)}
            </DialogTitle>
          </DialogHeader>

          {selectedSignature && (
            <div className="space-y-4">
              {/* Booking Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">תאריך:</span>
                  <span className="font-medium mr-2">
                    {format(new Date(selectedSignature.date), 'dd/MM/yyyy', { locale: he })}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">סשן:</span>
                  <span className="font-medium mr-2">
                    {selectedSignature.session === 'morning' ? 'בוקר' : 'יומי'}
                  </span>
                </div>
              </div>

              {/* Riders */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">רוכבים:</span>
                </div>
                <div className="space-y-1">
                  {selectedSignature.riders.map((rider, idx) => (
                    <div key={rider.id} className="text-sm bg-muted/50 px-3 py-1 rounded">
                      {idx + 1}. {rider.name} ({rider.height}cm)
                    </div>
                  ))}
                </div>
              </div>

              {/* Waiver Info */}
              <div className="p-3 bg-primary/5 rounded-lg space-y-1 text-sm">
                <div>
                  <span className="text-muted-foreground">גרסת ויתור:</span>
                  <span className="font-medium mr-2">{selectedSignature.waiverVersion || 'לא זמין'}</span>
                </div>
                {selectedSignature.waiverAcceptedAt && (
                  <div>
                    <span className="text-muted-foreground">תאריך אישור:</span>
                    <span className="font-medium mr-2">
                      {format(new Date(selectedSignature.waiverAcceptedAt), 'dd/MM/yyyy HH:mm', { locale: he })}
                    </span>
                  </div>
                )}
              </div>

              {/* Per-Rider Signatures */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileSignature className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">חתימות רוכבים:</span>
                </div>
                {selectedSignature.riders.map((rider, idx) => {
                  const isMinor = rider.isMinor || (rider.birthDate && calculateAge(rider.birthDate) < 18);
                  return (
                    <div key={rider.id} className={`border rounded-lg p-4 ${isMinor ? 'border-warning/50 bg-warning/5' : 'bg-white'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{idx + 1}. {rider.name}</span>
                        {isMinor && (
                          <span className="text-xs text-warning bg-warning/10 px-2 py-0.5 rounded flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            קטין
                          </span>
                        )}
                      </div>

                      {/* Rider's signature */}
                      {rider.signatureUrl ? (
                        <img src={rider.signatureUrl} alt={`חתימת ${rider.name}`} className="max-w-full h-auto mb-2" />
                      ) : (
                        <div className="text-center text-muted-foreground py-4 text-sm">אין חתימה</div>
                      )}

                      {/* Guardian signature for minors */}
                      {isMinor && rider.guardianName && (
                        <div className="mt-3 pt-3 border-t border-warning/30">
                          <div className="text-sm text-muted-foreground mb-1">הורה/אפוטרופוס: {rider.guardianName}</div>
                          {rider.guardianSignatureUrl ? (
                            <img src={rider.guardianSignatureUrl} alt={`חתימת הורה`} className="max-w-full h-auto" />
                          ) : (
                            <div className="text-center text-muted-foreground py-2 text-sm">אין חתימת הורה</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => handleExportPDF(selectedSignature)}
                  className="flex-1 gap-2 min-h-[44px]"
                >
                  <Download className="w-4 h-4" />
                  ייצוא PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setViewDialogOpen(false)}
                  className="flex-1 min-h-[44px]"
                >
                  סגור
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
