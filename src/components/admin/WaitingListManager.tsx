import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePreLaunchMode, WaitingListLead } from '@/hooks/usePreLaunchMode';
import { Loader2, Trash2, Users, Bell, Download, Phone, User, Calendar, Save, Mail, FileEdit, Clock, Eye, FileSignature, FileText, FolderOpen } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { jsPDF } from 'jspdf';
import { DocumentUploadButton } from './DocumentUploadButton';
import { DocumentGallery } from './DocumentGallery';
export function WaitingListManager() {
  const { toast } = useToast();
  const { 
    isPreLaunchMode,
    manualMode,
    isWithinSchedule,
    scheduleStart,
    scheduleEnd,
    settingLoading, 
    togglePreLaunchMode,
    updateSchedule,
    leads, 
    leadsLoading,
    deleteLead,
    bannerTitle,
    bannerSubtitle,
    updateBannerText,
  } = usePreLaunchMode();

  // Local state for editing
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editScheduleStart, setEditScheduleStart] = useState('');
  const [editScheduleEnd, setEditScheduleEnd] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [hasScheduleChanges, setHasScheduleChanges] = useState(false);
  const [selectedSignature, setSelectedSignature] = useState<string | null>(null);
  const [selectedLeadForDocs, setSelectedLeadForDocs] = useState<WaitingListLead | null>(null);

  // Sync with loaded values
  useEffect(() => {
    if (bannerTitle !== undefined) {
      setEditTitle(bannerTitle || '🎉 פתיחה חגיגית בקרוב!');
    }
    if (bannerSubtitle !== undefined) {
      setEditSubtitle(bannerSubtitle || 'האתר בהרצה - הירשמו לרשימת המתנה ונעדכן אתכם ראשונים');
    }
  }, [bannerTitle, bannerSubtitle]);

  useEffect(() => {
    if (scheduleStart) {
      setEditScheduleStart(scheduleStart.slice(0, 16)); // Format for datetime-local
    }
    if (scheduleEnd) {
      setEditScheduleEnd(scheduleEnd.slice(0, 16));
    }
  }, [scheduleStart, scheduleEnd]);

  // Detect changes
  useEffect(() => {
    const titleChanged = editTitle !== (bannerTitle || '🎉 פתיחה חגיגית בקרוב!');
    const subtitleChanged = editSubtitle !== (bannerSubtitle || 'האתר בהרצה - הירשמו לרשימת המתנה ונעדכן אתכם ראשונים');
    setHasChanges(titleChanged || subtitleChanged);
  }, [editTitle, editSubtitle, bannerTitle, bannerSubtitle]);

  useEffect(() => {
    const startChanged = editScheduleStart !== (scheduleStart?.slice(0, 16) || '');
    const endChanged = editScheduleEnd !== (scheduleEnd?.slice(0, 16) || '');
    setHasScheduleChanges(startChanged || endChanged);
  }, [editScheduleStart, editScheduleEnd, scheduleStart, scheduleEnd]);

  const handleSaveBannerText = async () => {
    try {
      await updateBannerText.mutateAsync({
        title: editTitle,
        subtitle: editSubtitle,
      });
      toast({ title: 'טקסט הבאנר נשמר בהצלחה!' });
    } catch (error) {
      toast({ title: 'שגיאה בשמירת הטקסט', variant: 'destructive' });
    }
  };

  const handleSaveSchedule = async () => {
    try {
      await updateSchedule.mutateAsync({
        start: editScheduleStart ? new Date(editScheduleStart).toISOString() : null,
        end: editScheduleEnd ? new Date(editScheduleEnd).toISOString() : null,
      });
    } catch (error) {
      toast({ title: 'שגיאה בשמירת התזמון', variant: 'destructive' });
    }
  };

  const handleClearSchedule = async () => {
    setEditScheduleStart('');
    setEditScheduleEnd('');
    await updateSchedule.mutateAsync({ start: null, end: null });
  };

  const handleExportCSV = () => {
    if (!leads || leads.length === 0) return;
    
    const csv = [
      ['שם', 'טלפון', 'אימייל', 'חתימה', 'תאריך הרשמה'],
      ...leads.map(lead => [
        lead.name,
        lead.phone || '',
        lead.email || '',
        lead.signature_url ? 'יש' : 'אין',
        format(new Date(lead.created_at), 'dd/MM/yyyy HH:mm', { locale: he })
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `waiting-list-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generatePDF = async (lead: WaitingListLead) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    
    // Add Unicode font support for Hebrew
    doc.setFont('helvetica');
    
    // Title
    doc.setFontSize(20);
    doc.text('Digital Signature Confirmation', 105, 25, { align: 'center' });
    
    // Horizontal line
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 35, 190, 35);
    
    // Lead details
    doc.setFontSize(12);
    let y = 50;
    
    doc.text(`Name: ${lead.name}`, 20, y);
    y += 10;
    
    if (lead.phone) {
      doc.text(`Phone: ${lead.phone}`, 20, y);
      y += 10;
    }
    
    if (lead.email) {
      doc.text(`Email: ${lead.email}`, 20, y);
      y += 10;
    }
    
    doc.text(`Registration Date: ${format(new Date(lead.created_at), 'dd/MM/yyyy HH:mm')}`, 20, y);
    y += 10;
    
    if (lead.waiver_version) {
      doc.text(`Waiver Version: ${lead.waiver_version}`, 20, y);
      y += 10;
    }
    
    y += 10;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, y, 190, y);
    y += 15;
    
    // Signature section
    doc.setFontSize(14);
    doc.text('Signature:', 20, y);
    y += 10;
    
    if (lead.signature_url) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = lead.signature_url!;
        });
        
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        const imgData = canvas.toDataURL('image/png');
        
        // Add signature image with border
        doc.setDrawColor(150, 150, 150);
        doc.rect(20, y, 100, 40);
        doc.addImage(imgData, 'PNG', 22, y + 2, 96, 36);
        y += 50;
      } catch (error) {
        doc.setFontSize(10);
        doc.text('(Signature image could not be loaded)', 20, y);
        y += 10;
      }
    } else {
      doc.setFontSize(10);
      doc.text('(No signature provided)', 20, y);
      y += 10;
    }
    
    // Footer
    y += 20;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('I confirm that I have read and understood the terms of service.', 20, y);
    
    // Save
    doc.save(`signature-${lead.name.replace(/\s+/g, '-')}-${format(new Date(lead.created_at), 'yyyy-MM-dd')}.pdf`);
    toast({ title: 'PDF נוצר בהצלחה!' });
  };

  const handleExportAllPDF = async () => {
    if (!leads || leads.length === 0) return;
    
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    
    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      if (i > 0) doc.addPage();
      
      // Title
      doc.setFont('helvetica');
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 0);
      doc.text('Digital Signature Confirmation', 105, 25, { align: 'center' });
      
      // Horizontal line
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 35, 190, 35);
      
      // Lead details
      doc.setFontSize(12);
      let y = 50;
      
      doc.text(`Name: ${lead.name}`, 20, y);
      y += 10;
      
      if (lead.phone) {
        doc.text(`Phone: ${lead.phone}`, 20, y);
        y += 10;
      }
      
      if (lead.email) {
        doc.text(`Email: ${lead.email}`, 20, y);
        y += 10;
      }
      
      doc.text(`Registration Date: ${format(new Date(lead.created_at), 'dd/MM/yyyy HH:mm')}`, 20, y);
      y += 10;
      
      if (lead.waiver_version) {
        doc.text(`Waiver Version: ${lead.waiver_version}`, 20, y);
        y += 10;
      }
      
      y += 10;
      doc.line(20, y, 190, y);
      y += 15;
      
      // Signature section
      doc.setFontSize(14);
      doc.text('Signature:', 20, y);
      y += 10;
      
      if (lead.signature_url) {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = lead.signature_url!;
          });
          
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0);
          const imgData = canvas.toDataURL('image/png');
          
          doc.setDrawColor(150, 150, 150);
          doc.rect(20, y, 100, 40);
          doc.addImage(imgData, 'PNG', 22, y + 2, 96, 36);
          y += 50;
        } catch {
          doc.setFontSize(10);
          doc.text('(Signature image could not be loaded)', 20, y);
          y += 10;
        }
      } else {
        doc.setFontSize(10);
        doc.text('(No signature provided)', 20, y);
        y += 10;
      }
      
      // Footer
      y += 20;
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('I confirm that I have read and understood the terms of service.', 20, y);
    }
    
    doc.save(`all-signatures-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast({ title: `${leads.length} חתימות יוצאו בהצלחה!` });
  };

  return (
    <div className="space-y-6">
      {/* Pre-Launch Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            מצב השקה
          </CardTitle>
          <CardDescription>
            כאשר מצב ההשקה פעיל, יופיע באנר בראש האתר וכפתורי ההזמנה ישתנו ל"הצטרפות לרשימת המתנה"
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{manualMode ? 'באנר פעיל ידנית' : 'באנר כבוי'}</p>
              <p className="text-sm text-muted-foreground">
                {isPreLaunchMode 
                  ? 'המבקרים רואים את הבאנר וכפתורי רשימת המתנה'
                  : 'האתר במצב רגיל - הזמנות פעילות'}
              </p>
              {isWithinSchedule && !manualMode && (
                <p className="text-sm text-primary font-medium mt-1">
                  ⏰ הבאנר פעיל לפי תזמון אוטומטי
                </p>
              )}
            </div>
            <Switch
              checked={manualMode}
              onCheckedChange={(checked) => togglePreLaunchMode.mutate(checked)}
              disabled={settingLoading || togglePreLaunchMode.isPending}
            />
          </div>
        </CardContent>
      </Card>

      {/* Schedule Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            תזמון אוטומטי
          </CardTitle>
          <CardDescription>
            הגדירו טווח תאריכים שבו מצב ההשקה יופעל אוטומטית (אופציונלי)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="schedule-start">תחילת תקופה</Label>
              <Input
                id="schedule-start"
                type="datetime-local"
                value={editScheduleStart}
                onChange={(e) => setEditScheduleStart(e.target.value)}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule-end">סיום תקופה</Label>
              <Input
                id="schedule-end"
                type="datetime-local"
                value={editScheduleEnd}
                onChange={(e) => setEditScheduleEnd(e.target.value)}
                dir="ltr"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleSaveSchedule}
              disabled={!hasScheduleChanges || updateSchedule.isPending}
              className="gap-2 min-h-[44px]"
            >
              {updateSchedule.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              שמור תזמון
            </Button>
            {(editScheduleStart || editScheduleEnd) && (
              <Button
                variant="outline"
                onClick={handleClearSchedule}
                disabled={updateSchedule.isPending}
                className="min-h-[44px]"
              >
                נקה תזמון
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Banner Text Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileEdit className="h-5 w-5" />
            עריכת טקסט הבאנר
          </CardTitle>
          <CardDescription>
            עדכנו את הטקסט שמופיע בבאנר ההשקה בראש האתר
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="banner-title">כותרת ראשית</Label>
            <Input
              id="banner-title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="🎉 פתיחה חגיגית בקרוב!"
              dir="rtl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="banner-subtitle">טקסט משני</Label>
            <Input
              id="banner-subtitle"
              value={editSubtitle}
              onChange={(e) => setEditSubtitle(e.target.value)}
              placeholder="האתר בהרצה - הירשמו לרשימת המתנה"
              dir="rtl"
            />
          </div>
          <Button 
            onClick={handleSaveBannerText}
            disabled={!hasChanges || updateBannerText.isPending}
            className="gap-2 min-h-[44px]"
          >
            {updateBannerText.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            שמור שינויים
          </Button>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              רשימת המתנה
            </CardTitle>
            <CardDescription>
              {leads?.length || 0} אנשים נרשמו לרשימת המתנה
            </CardDescription>
          </div>
          {leads && leads.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleExportCSV} className="min-h-[44px] px-4">
                <Download className="h-4 w-4 ml-2" />
                ייצוא CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportAllPDF} className="min-h-[44px] px-4">
                <FileText className="h-4 w-4 ml-2" />
                ייצוא PDF
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {leadsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !leads || leads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>אין נרשמים עדיין</p>
            </div>
          ) : (
            <div className="relative mt-4">
              {/* Mobile scroll indicator */}
              <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-card to-transparent z-10 pointer-events-none md:hidden" />
              <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-card to-transparent z-10 pointer-events-none md:hidden" />
              <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                <Table className="min-w-[700px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          שם
                        </div>
                      </TableHead>
                      <TableHead className="text-right">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          טלפון
                        </div>
                      </TableHead>
                      <TableHead className="text-right">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          אימייל
                        </div>
                      </TableHead>
                      <TableHead className="text-right">
                        <div className="flex items-center gap-2">
                          <FileSignature className="h-4 w-4" />
                          חתימה
                        </div>
                      </TableHead>
                      <TableHead className="text-right">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          תאריך הרשמה
                        </div>
                      </TableHead>
                      <TableHead className="text-right">
                        <div className="flex items-center gap-2">
                          <FolderOpen className="h-4 w-4" />
                          מסמכים
                        </div>
                      </TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium">{lead.name}</TableCell>
                        <TableCell dir="ltr" className="text-left">{lead.phone || '-'}</TableCell>
                        <TableCell dir="ltr" className="text-left">{lead.email || '-'}</TableCell>
                        <TableCell>
                          {lead.signature_url ? (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedSignature(lead.signature_url)}
                                className="gap-1 text-primary min-h-[44px] px-3"
                              >
                                <Eye className="h-4 w-4" />
                                צפייה
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => generatePDF(lead)}
                                className="gap-1 min-h-[44px] px-3"
                              >
                                <FileText className="h-4 w-4" />
                                PDF
                              </Button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {format(new Date(lead.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedLeadForDocs(lead)}
                              className="gap-1 min-h-[44px] px-2"
                            >
                              <FolderOpen className="h-4 w-4" />
                              <span className="text-xs">
                                {((lead as any).documents_urls?.length || 0) + (lead.signature_url ? 1 : 0)}
                              </span>
                            </Button>
                            <DocumentUploadButton
                              entityId={lead.id}
                              entityType="lead"
                              size="sm"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="min-h-[44px] min-w-[44px] text-destructive hover:text-destructive"
                            onClick={() => deleteLead.mutate(lead.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Signature Viewer Dialog */}
      <Dialog open={!!selectedSignature} onOpenChange={() => setSelectedSignature(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSignature className="h-5 w-5" />
              חתימה דיגיטלית
            </DialogTitle>
          </DialogHeader>
          {selectedSignature && (
            <div className="border rounded-lg overflow-hidden bg-white">
              <img 
                src={selectedSignature} 
                alt="חתימה" 
                className="w-full h-auto"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Document Gallery Dialog */}
      {selectedLeadForDocs && (
        <DocumentGallery
          open={!!selectedLeadForDocs}
          onOpenChange={(open) => !open && setSelectedLeadForDocs(null)}
          entityId={selectedLeadForDocs.id}
          entityType="lead"
          entityName={selectedLeadForDocs.name}
          documents={(selectedLeadForDocs as any).documents_urls || []}
          signatureUrl={selectedLeadForDocs.signature_url}
        />
      )}
    </div>
  );
}
