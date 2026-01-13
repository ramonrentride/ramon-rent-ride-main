import { useMemo, useState } from 'react';
import { useAuditLogs, AuditLogEntry } from '@/hooks/useAuditLog';
import { format, isToday, isYesterday, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { he } from 'date-fns/locale';
import type { Json } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bike,
  Ticket,
  ClipboardList,
  User,
  Camera,
  Wrench,
  DollarSign,
  Ruler,
  Loader2,
  History,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Download,
  Filter,
  X,
} from 'lucide-react';

const getEntityIcon = (entityType: string) => {
  switch (entityType) {
    case 'bike':
      return <Bike className="w-4 h-4" />;
    case 'coupon':
      return <Ticket className="w-4 h-4" />;
    case 'booking':
      return <ClipboardList className="w-4 h-4" />;
    case 'user':
      return <User className="w-4 h-4" />;
    case 'return_photo':
      return <Camera className="w-4 h-4" />;
    case 'maintenance_log':
      return <Wrench className="w-4 h-4" />;
    case 'pricing':
      return <DollarSign className="w-4 h-4" />;
    case 'height_ranges':
      return <Ruler className="w-4 h-4" />;
    default:
      return <History className="w-4 h-4" />;
  }
};

const getActionIcon = (action: string) => {
  switch (action) {
    case 'create':
      return <Plus className="w-3 h-3 text-success" />;
    case 'edit':
    case 'update':
      return <Edit className="w-3 h-3 text-warning" />;
    case 'delete':
      return <Trash2 className="w-3 h-3 text-destructive" />;
    case 'status_change':
    case 'role_change':
      return <RefreshCw className="w-3 h-3 text-accent" />;
    case 'upload':
      return <Camera className="w-3 h-3 text-primary" />;
    default:
      return null;
  }
};

const getActionLabel = (action: string): string => {
  switch (action) {
    case 'create':
      return 'יצירה';
    case 'edit':
      return 'עריכה';
    case 'update':
      return 'עדכון';
    case 'delete':
      return 'מחיקה';
    case 'status_change':
      return 'שינוי סטטוס';
    case 'role_change':
      return 'שינוי תפקיד';
    case 'upload':
      return 'העלאה';
    case 'use':
      return 'שימוש';
    default:
      return action;
  }
};

const getEntityLabel = (entityType: string): string => {
  switch (entityType) {
    case 'bike':
      return 'אופניים';
    case 'coupon':
      return 'קופון';
    case 'booking':
      return 'הזמנה';
    case 'user':
      return 'משתמש';
    case 'return_photo':
      return 'תמונת החזרה';
    case 'maintenance_log':
      return 'יומן תחזוקה';
    case 'pricing':
      return 'מחירון';
    case 'height_ranges':
      return 'טווחי גובה';
    default:
      return entityType;
  }
};

const formatDateHeader = (dateStr: string): string => {
  const date = parseISO(dateStr);
  if (isToday(date)) {
    return 'היום';
  }
  if (isYesterday(date)) {
    return 'אתמול';
  }
  return format(date, 'EEEE, d בMMMM yyyy', { locale: he });
};

const LogEntryCard = ({ entry }: { entry: AuditLogEntry }) => {
  const time = format(parseISO(entry.created_at), 'HH:mm');
  
  const getDetailsText = () => {
    if (!entry.details || typeof entry.details !== 'object' || Array.isArray(entry.details)) return null;
    
    const details = entry.details as Record<string, Json>;
    
    if (entry.action === 'status_change') {
      return `${details.oldStatus} → ${details.newStatus}`;
    }
    if (entry.action === 'role_change') {
      return `${details.oldRole} → ${details.newRole}`;
    }
    if (entry.entity_type === 'bike' && details.status) {
      return `סטטוס: ${details.status}`;
    }
    if (entry.entity_type === 'coupon') {
      if (entry.action === 'use') {
        return 'קופון נוצל';
      }
      return `${details.discount}${details.discount_type === 'percent' ? '%' : '₪'}`;
    }
    if (entry.entity_type === 'pricing' && details.old_value !== undefined) {
      return `${details.key}: ${details.old_value}₪ → ${details.new_value}₪`;
    }
    if (entry.entity_type === 'height_ranges') {
      if (details.old_min !== undefined) {
        return `${details.size}: ${details.old_min}-${details.old_max} → ${details.new_min}-${details.new_max} ס״מ`;
      }
      return `${details.size}: ${details.min_height}-${details.max_height} ס״מ`;
    }
    
    return null;
  };

  const detailsText = getDetailsText();

  return (
    <div className="flex items-start gap-3 p-3 hover:bg-muted/30 rounded-lg transition-colors">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
        {getEntityIcon(entry.entity_type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {getActionIcon(entry.action)}
          <span className="font-medium text-sm">
            {getActionLabel(entry.action)} {getEntityLabel(entry.entity_type)}
          </span>
          {entry.entity_id && (
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              #{entry.entity_id.slice(-6)}
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {entry.user_display_name || entry.user_email || 'מערכת'}
          {detailsText && (
            <span className="mx-1">•</span>
          )}
          {detailsText && (
            <span className="text-foreground/70">{detailsText}</span>
          )}
        </div>
      </div>
      <div className="text-xs text-muted-foreground shrink-0">
        {time}
      </div>
    </div>
  );
};

// Export to CSV function
const exportToCSV = (logs: AuditLogEntry[], filename: string) => {
  const headers = ['תאריך', 'שעה', 'סוג ישות', 'פעולה', 'מזהה ישות', 'משתמש', 'פרטים'];
  
  const rows = logs.map(log => {
    const date = parseISO(log.created_at);
    const details = log.details ? JSON.stringify(log.details) : '';
    return [
      format(date, 'yyyy-MM-dd'),
      format(date, 'HH:mm:ss'),
      getEntityLabel(log.entity_type),
      getActionLabel(log.action),
      log.entity_id || '',
      log.user_display_name || log.user_email || 'מערכת',
      details
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

export default function AuditLogHistory() {
  const { data: logs = [], isLoading } = useAuditLogs();
  
  // Filter states
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [searchText, setSearchText] = useState('');

  // Get unique entity types and actions from logs
  const { entityTypes, actionTypes } = useMemo(() => {
    const entities = new Set<string>();
    const actions = new Set<string>();
    logs.forEach(log => {
      entities.add(log.entity_type);
      actions.add(log.action);
    });
    return {
      entityTypes: Array.from(entities).sort(),
      actionTypes: Array.from(actions).sort()
    };
  }, [logs]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Date filter
      if (dateFrom || dateTo) {
        const logDate = parseISO(log.created_at);
        if (dateFrom && dateTo) {
          if (!isWithinInterval(logDate, {
            start: startOfDay(parseISO(dateFrom)),
            end: endOfDay(parseISO(dateTo))
          })) return false;
        } else if (dateFrom) {
          if (logDate < startOfDay(parseISO(dateFrom))) return false;
        } else if (dateTo) {
          if (logDate > endOfDay(parseISO(dateTo))) return false;
        }
      }

      // Entity type filter
      if (entityFilter !== 'all' && log.entity_type !== entityFilter) return false;

      // Action filter
      if (actionFilter !== 'all' && log.action !== actionFilter) return false;

      // Text search
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        const matchesId = log.entity_id?.toLowerCase().includes(searchLower);
        const matchesUser = (log.user_display_name || log.user_email || '').toLowerCase().includes(searchLower);
        const matchesDetails = JSON.stringify(log.details || {}).toLowerCase().includes(searchLower);
        if (!matchesId && !matchesUser && !matchesDetails) return false;
      }

      return true;
    });
  }, [logs, dateFrom, dateTo, entityFilter, actionFilter, searchText]);

  // Group filtered logs by date
  const groupedLogs = useMemo(() => {
    const groups: Record<string, AuditLogEntry[]> = {};
    
    filteredLogs.forEach((log) => {
      const dateKey = format(parseISO(log.created_at), 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(log);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, entries]) => ({
        date,
        entries,
      }));
  }, [filteredLogs]);

  const hasFilters = dateFrom || dateTo || entityFilter !== 'all' || actionFilter !== 'all' || searchText;

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setEntityFilter('all');
    setActionFilter('all');
    setSearchText('');
  };

  const handleExportCSV = () => {
    const filename = `audit-log-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`;
    exportToCSV(filteredLogs, filename);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="glass-card rounded-xl p-12 text-center">
        <History className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">אין היסטוריה עדיין</h3>
        <p className="text-muted-foreground">
          פעולות שיבוצעו באתר יופיעו כאן
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <History className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">היסטוריית פעולות</h2>
          <span className="text-sm text-muted-foreground">
            ({filteredLogs.length} מתוך {logs.length} פעולות)
          </span>
        </div>
        <Button onClick={handleExportCSV} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          ייצוא CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Filter className="w-4 h-4" />
          סינון וחיפוש
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
              <X className="w-3 h-3" />
              נקה הכל
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Date From */}
          <div>
            <Label className="text-xs">מתאריך</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="mt-1"
            />
          </div>
          
          {/* Date To */}
          <div>
            <Label className="text-xs">עד תאריך</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="mt-1"
            />
          </div>
          
          {/* Entity Type */}
          <div>
            <Label className="text-xs">סוג ישות</Label>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">הכל</SelectItem>
                {entityTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {getEntityLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Action */}
          <div>
            <Label className="text-xs">פעולה</Label>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">הכל</SelectItem>
                {actionTypes.map(action => (
                  <SelectItem key={action} value={action}>
                    {getActionLabel(action)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Search */}
          <div>
            <Label className="text-xs">חיפוש חופשי</Label>
            <Input
              type="text"
              placeholder="מזהה, משתמש, פרטים..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Log entries */}
      {filteredLogs.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center">
          <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">לא נמצאו פעולות התואמות לסינון</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedLogs.map(({ date, entries }) => (
            <div key={date} className="glass-card rounded-xl overflow-hidden">
              <div className="bg-primary/10 px-4 py-2 border-b border-border/50">
                <h3 className="font-medium text-sm">
                  {formatDateHeader(date)}
                </h3>
              </div>
              <div className="divide-y divide-border/30">
                {entries.map((entry) => (
                  <LogEntryCard key={entry.id} entry={entry} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}