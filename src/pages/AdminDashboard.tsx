import { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  useBikes,
  useBookings,
  useCoupons,
  useHeightRanges,
  usePricing,
  usePartsInventory,
  useMaintenanceLogs,
  useMechanicIssues,
  useUpdateBike,
  useAddBike,
  useRemoveBike,
  useUpdateBooking,
  useCreateCoupon,
  useUpdateCoupon,
  useUpdateHeightRanges,
  useUpdatePricing,
  useUpdatePartsInventory,
  useAddMaintenanceLog,
  useUpdateMaintenanceLog,
  useDeleteMaintenanceLog,
  useAddMechanicIssue,
  useUpdateMechanicIssue,
  useRealtimeSubscription,
} from '@/hooks/useSupabaseData';
import BookingCalendar from '@/components/BookingCalendar';
import StaffManagement from '@/components/StaffManagement';
import MorningBriefing from '@/components/MorningBriefing';
import AuditLogHistory from '@/components/AuditLogHistory';
import AuditLogDashboard from '@/components/AuditLogDashboard';
import { RateLimitTelemetry } from '@/components/admin/RateLimitTelemetry';
import PicnicMenuManagement from '@/components/PicnicMenuManagement';
import { SiteContentManager } from '@/components/admin/SiteContentManager';
import { WaitingListManager } from '@/components/admin/WaitingListManager';
import { BookingSignaturesManager } from '@/components/admin/BookingSignaturesManager';
import { SessionSettingsManager } from '@/components/admin/SessionSettingsManager';
import { PaymentMethodsManager } from '@/components/admin/PaymentMethodsManager';
import { useAuditActions } from '@/hooks/useAuditLog';
import type { BikeStatus, BikeSize, IssueType, BikeMaintenanceLog, PartInventory, MechanicIssue } from '@/lib/types';
import { DocumentUploadButton } from '@/components/admin/DocumentUploadButton';
import { DocumentGallery } from '@/components/admin/DocumentGallery';
import {
  Sun,
  ClipboardList,
  Wrench,
  Bike,
  Settings,
  LogOut,
  Users,
  Calendar,
  Clock,
  Camera,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Edit,
  Save,
  Home,
  Gift,
  Ticket,
  Plus,
  Trash2,
  Mail,
  Package,
  User,
  Key,
  CalendarDays,
  MessageCircle,
  Phone,
  Download,
  FileSpreadsheet,
  History,
  ShoppingBag,
  FileEdit,
  Bell,
  FileSignature,
  FolderOpen,
  Eye,
  ShieldAlert,
  Loader2
} from 'lucide-react';

// Generate unique coupon code
const generateCouponCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'RAMON5-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Use Supabase Auth
  const {
    isAuthenticated,
    isLoading,
    isAdmin,
    isMechanic,
    isStaff,
    displayName,
    role,
    signOut
  } = useAuth();

  // Only fetch staff data when authenticated AND confirmed as staff
  const staffDataEnabled = !isLoading && isAuthenticated && isStaff;

  // Supabase data hooks - only enabled when staff auth is confirmed
  const { data: bikes = [], error: bikesError } = useBikes(staffDataEnabled);
  const { data: bookings = [], error: bookingsError } = useBookings(staffDataEnabled);
  const { data: coupons = [], error: couponsError } = useCoupons(staffDataEnabled);
  const { data: heightRanges = [] } = useHeightRanges();
  const { data: pricing } = usePricing();
  const { data: partsInventory = [] } = usePartsInventory(staffDataEnabled);
  const { data: maintenanceLogs = [] } = useMaintenanceLogs(staffDataEnabled);
  const { data: mechanicIssues = [] } = useMechanicIssues(staffDataEnabled);

  // Show error toast if staff queries fail
  useEffect(() => {
    if (bookingsError) {
      console.error('Bookings fetch error:', bookingsError);
      toast({ title: 'שגיאה בטעינת הזמנות', description: String(bookingsError), variant: 'destructive' });
    }
  }, [bookingsError, toast]);

  // Enable real-time updates for Admin Dashboard
  useRealtimeSubscription('bookings');
  useRealtimeSubscription('bikes');
  useRealtimeSubscription('pricing');



  // Mutations
  const updateBikeMutation = useUpdateBike();
  const addBikeMutation = useAddBike();
  const removeBikeMutation = useRemoveBike();
  const updateBookingMutation = useUpdateBooking();
  const createCouponMutation = useCreateCoupon();
  const updateCouponMutation = useUpdateCoupon();
  const updateHeightRangesMutation = useUpdateHeightRanges();
  const updatePricingMutation = useUpdatePricing();
  const updatePartsInventoryMutation = useUpdatePartsInventory();
  const addMaintenanceLogMutation = useAddMaintenanceLog();
  const updateMaintenanceLogMutation = useUpdateMaintenanceLog();
  const deleteMaintenanceLogMutation = useDeleteMaintenanceLog();
  const addMechanicIssueMutation = useAddMechanicIssue();
  const updateMechanicIssueMutation = useUpdateMechanicIssue();

  // Audit log actions
  const auditActions = useAuditActions();

  const [editingBike, setEditingBike] = useState<number | null>(null);
  const [deletingBikeId, setDeletingBikeId] = useState<number | null>(null);
  const [editingRanges, setEditingRanges] = useState(false);
  const [editingPricing, setEditingPricing] = useState(false);
  const [tempRanges, setTempRanges] = useState(heightRanges);
  const [tempPricing, setTempPricing] = useState(pricing);

  // Sync temp state with loaded data from Supabase
  useEffect(() => {
    if (heightRanges.length > 0) {
      setTempRanges(heightRanges);
    }
  }, [heightRanges]);

  useEffect(() => {
    if (pricing) {
      setTempPricing(pricing);
    }
  }, [pricing]);

  // Coupon creation state
  const [couponAmount, setCouponAmount] = useState('');
  const [couponType, setCouponType] = useState<'percent' | 'fixed'>('fixed');
  const [couponEmail, setCouponEmail] = useState('');

  // Maintenance state
  const [newLogBikeId, setNewLogBikeId] = useState('');
  const [newLogDescription, setNewLogDescription] = useState('');
  const [editingParts, setEditingParts] = useState(false);
  const [tempParts, setTempParts] = useState<PartInventory[]>(partsInventory);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editLogDescription, setEditLogDescription] = useState('');

  // Issue editing state
  const [editingIssueId, setEditingIssueId] = useState<string | null>(null);
  const [editIssueDescription, setEditIssueDescription] = useState('');
  const [editIssueBikeId, setEditIssueBikeId] = useState('');
  const [editIssueType, setEditIssueType] = useState<IssueType>('other');

  // New issue state
  const [newIssueBikeId, setNewIssueBikeId] = useState('');
  const [newIssueType, setNewIssueType] = useState<IssueType>('other');
  const [newIssueDescription, setNewIssueDescription] = useState('');

  // Document gallery state
  const [selectedBookingForDocs, setSelectedBookingForDocs] = useState<any | null>(null);

  // Date filter from URL
  const dateFilter = searchParams.get('date');

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
    } else if (!isLoading && isAuthenticated && !isStaff) {
      toast({
        title: 'אין לך הרשאות',
        description: 'פנה למנהל כדי לקבל גישה',
        variant: 'destructive'
      });
      navigate('/');
    }
  }, [isLoading, isAuthenticated, isStaff, navigate, toast]);

  const handleLogout = async () => {
    await signOut();
    toast({ title: 'התנתקת בהצלחה' });
    navigate('/auth');
  };

  const getStatusIcon = (status: BikeStatus) => {
    switch (status) {
      case 'available': return <CheckCircle className="w-5 h-5 text-success" />;
      case 'maintenance': return <Wrench className="w-5 h-5 text-warning" />;
      case 'rented': return <Clock className="w-5 h-5 text-accent" />;
      case 'unavailable': return <XCircle className="w-5 h-5 text-destructive" />;
    }
  };

  const getStatusLabel = (status: BikeStatus) => {
    switch (status) {
      case 'available': return 'זמין ✅';
      case 'maintenance': return 'תחזוקה 🛠️';
      case 'rented': return 'מושכר 🚴';
      case 'unavailable': return 'לא זמין ❌';
    }
  };

  const getIssueIcon = (type: IssueType) => {
    switch (type) {
      case 'tire': return '🔧';
      case 'chain': return '⛓️';
      case 'brake': return '🛑';
      default: return '❓';
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayBookings = bookings.filter(b => b.date === todayStr);

  // Get next 3 days bookings for morning brief
  const getNextDays = (daysAhead: number) => {
    const date = new Date();
    date.setDate(date.getDate() + daysAhead);
    return date.toISOString().split('T')[0];
  };

  const upcomingDays = useMemo(() => {
    return [1, 2, 3].map(day => {
      const dateStr = getNextDays(day);
      const dayBookings = bookings.filter(b => b.date === dateStr);
      return {
        dateStr,
        date: new Date(dateStr),
        bookings: dayBookings,
        totalRiders: dayBookings.reduce((sum, b) => sum + b.riders.length, 0),
      };
    });
  }, [bookings]);

  // Filtered bookings for orders tab
  const filteredBookings = useMemo(() => {
    if (dateFilter) {
      return bookings.filter(b => b.date === dateFilter);
    }
    return bookings;
  }, [bookings, dateFilter]);

  // Sorting Logic
  const [sortConfig, setSortConfig] = useState<{ key: 'date' | 'name' | 'phone' | 'email'; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Filter by Date (Base) - already done in filteredBookings

  // 2. Filter by Search Query
  const searchedBookings = useMemo(() => {
    if (!searchQuery.trim()) return filteredBookings;

    const lower = searchQuery.toLowerCase();
    return filteredBookings.filter(b =>
      b.riders.some(r => r.name?.toLowerCase().includes(lower)) ||
      (b.phone && b.phone.includes(lower)) ||
      (b.email && b.email.toLowerCase().includes(lower)) ||
      b.id.toLowerCase().includes(lower)
    );
  }, [filteredBookings, searchQuery]);

  // 3. Sort the Results
  const sortedBookings = useMemo(() => {
    const sorted = [...searchedBookings];
    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortConfig.key) {
        case 'date':
          comparison = a.date.localeCompare(b.date);
          break;
        case 'name':
          const nameA = a.riders[0]?.name || '';
          const nameB = b.riders[0]?.name || '';
          comparison = nameA.localeCompare(nameB);
          break;
        case 'phone':
          comparison = (a.phone || '').localeCompare(b.phone || '');
          break;
        case 'email':
          comparison = (a.email || '').localeCompare(b.email || '');
          break;
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [searchedBookings, sortConfig]);

  const stats = {
    totalRiders: todayBookings.reduce((sum, b) => sum + b.riders.length, 0),
    fullDay: todayBookings.filter(b => b.session === 'daily').length,
    picnic: todayBookings.filter(b => b.picnic && b.picnic.quantity > 0).length,
    broken: bikes.filter(b => b.status === 'maintenance').length,
  };

  // Low inventory parts
  const lowInventoryParts = partsInventory.filter(p => p.quantity <= p.minQuantity);

  // Export to CSV/Excel function
  const exportToExcel = (type: 'daily' | 'weekly') => {
    const today = new Date();
    let startDate = new Date(today);

    if (type === 'weekly') {
      startDate.setDate(today.getDate() - 7);
    }

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = today.toISOString().split('T')[0];

    const filteredData = bookings.filter(b => {
      if (type === 'daily') return b.date === endStr;
      return b.date >= startStr && b.date <= endStr;
    });

    // Create CSV content
    const headers = ['מספר הזמנה', 'תאריך', 'סשן', 'שם מזמין', 'טלפון', 'אימייל', 'רוכבים', 'סטטוס', 'מחיר'];
    const rows = filteredData.map(b => [
      b.id.slice(-6),
      (() => {
        const [y, m, d] = b.date.split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString('he-IL');
      })(),
      b.session === 'morning' ? 'בוקר' : 'יום מלא',
      b.riders[0]?.name || '',
      b.phone,
      b.email,
      b.riders.length.toString(),
      b.status,
      b.totalPrice.toString()
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bookings_${type}_${endStr}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({ title: `דוח ${type === 'daily' ? 'יומי' : 'שבועי'} יוצא בהצלחה ✅` });
  };

  // Send WhatsApp message
  const sendWhatsApp = (phone: string, bookingId: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const israelPhone = cleanPhone.startsWith('0') ? '972' + cleanPhone.slice(1) : cleanPhone;
    const message = encodeURIComponent(`שלום! 🚴 בנוגע להזמנה מספר #${bookingId.slice(-6)} ב-ramonrentride...`);
    window.open(`https://wa.me/${israelPhone}?text=${message}`, '_blank');
  };

  // Send SMS
  const sendSMS = (phone: string) => {
    window.open(`sms:${phone}`, '_blank');
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/20 to-background flex items-center justify-center">
        <div className="animate-pulse text-xl">טוען...</div>
      </div>
    );
  }

  // If not authenticated or not staff, this will redirect via useEffect
  if (!isAuthenticated || !isStaff) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/20 to-background flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4">מעביר לדף ההתחברות...</p>
          <Link to="/auth">
            <Button>עבור להתחברות</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 via-accent/5 to-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Sticky Header */}
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm pb-4 -mx-4 px-4 md:-mx-8 md:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 pt-4">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" className="gap-2 min-h-[44px]">
                  <Home className="w-5 h-5" />
                  <span className="hidden sm:inline">דף הבית</span>
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">🎛️ לוח בקרה</h1>
                <p className="text-muted-foreground text-sm md:text-base">
                  {displayName || 'משתמש'} | {isAdmin ? 'מנהל' : 'מכונאי'}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout} className="gap-2 min-h-[44px]">
              <LogOut className="w-4 h-4" />
              יציאה
            </Button>
          </div>
        </div>

        <Tabs
          value={searchParams.get('tab') || (isAdmin ? "morning" : "mechanic")}
          onValueChange={(value) => {
            const params = new URLSearchParams(searchParams);
            params.set('tab', value);
            navigate(`/admin?${params.toString()}`, { replace: true });
          }}
          className="space-y-6"
        >
          <TabsList className="flex flex-nowrap overflow-x-auto w-full gap-1 pb-2 scrollbar-hide md:grid md:grid-cols-13 md:overflow-visible md:pb-0">
            {isAdmin && (
              <TabsTrigger value="morning" className="gap-2 min-h-[44px] min-w-[44px] flex-shrink-0">
                <Sun className="w-4 h-4" />
                <span className="hidden md:inline">תדריך בוקר</span>
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="calendar" className="gap-2 min-h-[44px] min-w-[44px] flex-shrink-0">
                <CalendarDays className="w-4 h-4" />
                <span className="hidden md:inline">לוח שנה</span>
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="orders" className="gap-2 min-h-[44px] min-w-[44px] flex-shrink-0">
                <ClipboardList className="w-4 h-4" />
                <span className="hidden md:inline">הזמנות</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="mechanic" className="gap-2 min-h-[44px] min-w-[44px] flex-shrink-0">
              <Wrench className="w-4 h-4" />
              <span className="hidden md:inline">מכונאי</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="fleet" className="gap-2 min-h-[44px] min-w-[44px] flex-shrink-0">
                <Bike className="w-4 h-4" />
                <span className="hidden md:inline">צי</span>
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="coupons" className="gap-2 min-h-[44px] min-w-[44px] flex-shrink-0">
                <Ticket className="w-4 h-4" />
                <span className="hidden md:inline">קופונים</span>
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="picnic" className="gap-2 min-h-[44px] min-w-[44px] flex-shrink-0">
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden md:inline">פיקניק</span>
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="users" className="gap-2 min-h-[44px] min-w-[44px] flex-shrink-0">
                <User className="w-4 h-4" />
                <span className="hidden md:inline">משתמשים</span>
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="history" className="gap-2 min-h-[44px] min-w-[44px] flex-shrink-0">
                <History className="w-4 h-4" />
                <span className="hidden md:inline">היסטוריה</span>
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="content" className="gap-2 min-h-[44px] min-w-[44px] flex-shrink-0">
                <FileEdit className="w-4 h-4" />
                <span className="hidden md:inline">תוכן</span>
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="signatures" className="gap-2 min-h-[44px] min-w-[44px] flex-shrink-0">
                <FileSignature className="w-4 h-4" />
                <span className="hidden md:inline">חתימות</span>
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="prelaunch" className="gap-2 min-h-[44px] min-w-[44px] flex-shrink-0">
                <Bell className="w-4 h-4" />
                <span className="hidden md:inline">השקה</span>
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="settings" className="gap-2 min-h-[44px] min-w-[44px] flex-shrink-0">
                <Settings className="w-4 h-4" />
                <span className="hidden md:inline">הגדרות</span>
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="security" className="gap-2 min-h-[44px] min-w-[44px] flex-shrink-0">
                <ShieldAlert className="w-4 h-4" />
                <span className="hidden md:inline">אבטחה</span>
              </TabsTrigger>
            )}
            {!isAdmin && (
              <TabsTrigger value="parts" className="gap-2 min-h-[44px] min-w-[44px] flex-shrink-0">
                <Package className="w-4 h-4" />
                <span className="hidden md:inline">מלאי</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Morning Brief */}
          <TabsContent value="morning">
            <MorningBriefing
              todayBookings={todayBookings}
              upcomingDays={upcomingDays}
              stats={stats}
              lowInventoryParts={lowInventoryParts}
            />
          </TabsContent>

          {/* Calendar View */}
          <TabsContent value="calendar">
            <BookingCalendar />
          </TabsContent>

          {/* Picnic Menu Management */}
          <TabsContent value="picnic">
            <PicnicMenuManagement />
          </TabsContent>

          {/* Orders */}
          <TabsContent value="orders">
            <div className="space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <h2 className="text-xl font-bold">
                  📦 {dateFilter ? `הזמנות ל-${(() => {
                    const [y, m, d] = dateFilter.split('-').map(Number);
                    return new Date(y, m - 1, d).toLocaleDateString('he-IL');
                  })()}` : 'כל ההזמנות'}
                </h2>
                {dateFilter && (
                  <Link to="/admin?tab=orders">
                    <Button variant="outline" size="sm">
                      הצג את כל ההזמנות
                    </Button>
                  </Link>
                )}
              </div>

              {/* Controls: Export, Search & Sort */}
              <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" onClick={() => exportToExcel('daily')} className="gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    ייצוא יומי
                  </Button>
                  <Button variant="outline" onClick={() => exportToExcel('weekly')} className="gap-2">
                    <Download className="w-4 h-4" />
                    ייצוא שבועי
                  </Button>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">
                  {/* Search Input */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="חיפוש לפי שם, טלפון, אימייל..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-9 w-full sm:w-[250px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Sort Dropdown */}
                  <div className="flex items-center gap-2 bg-muted/40 p-1.5 rounded-lg shrink-0">
                    <Label className="text-sm font-medium whitespace-nowrap px-1">מיון לפי:</Label>
                    <Select
                      value={`${sortConfig.key}-${sortConfig.direction}`}
                      onValueChange={(val) => {
                        const [key, direction] = val.split('-');
                        setSortConfig({ key: key as any, direction: direction as any });
                      }}
                    >
                      <SelectTrigger className="w-[180px] h-9 bg-background">
                        <SelectValue placeholder="בחר מיון" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date-desc">תאריך (מהחדש לישן)</SelectItem>
                        <SelectItem value="date-asc">תאריך (מהישן לחדש)</SelectItem>
                        <SelectItem value="name-asc">שם מזמין (א-ת)</SelectItem>
                        <SelectItem value="name-desc">שם מזמין (ת-א)</SelectItem>
                        <SelectItem value="phone-asc">טלפון (עולה)</SelectItem>
                        <SelectItem value="email-asc">אימייל (א-ת)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {sortedBookings.length === 0 ? (
                <div className="glass-card rounded-xl p-8 text-center">
                  <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery ? 'לא נמצאו הזמנות תואמות לחיפוש' : `אין הזמנות ${dateFilter ? 'לתאריך זה' : 'עדיין'}`}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedBookings.map(booking => (
                    <div key={booking.id} className="glass-card rounded-xl p-6">
                      {/* Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="font-bold text-lg">הזמנה #{booking.id.slice(-6)}</div>
                          <div className="text-muted-foreground">
                            {(() => {
                              // Parse manually to avoid timezone shifts (treat as local date)
                              const [y, m, d] = booking.date.split('-').map(Number);
                              const localDate = new Date(y, m - 1, d);
                              return localDate.toLocaleDateString('he-IL', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              });
                            })()}
                          </div>
                        </div>
                        <Select
                          value={booking.status}
                          onValueChange={(value) => {
                            const oldStatus = booking.status;
                            updateBookingMutation.mutate({ id: booking.id, updates: { status: value as any } });
                            auditActions.logBookingStatusChange(booking.id, oldStatus, value);
                          }}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">ממתין</SelectItem>
                            <SelectItem value="confirmed">מאושר ✅</SelectItem>
                            <SelectItem value="checked-in">נכנס ✅</SelectItem>
                            <SelectItem value="completed">הושלם ✅</SelectItem>
                            <SelectItem value="cancelled">בוטל ❌</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Customer Details Card */}
                      <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg mb-4">
                        <div className="flex justify-between items-start flex-wrap gap-3">
                          <div>
                            <h4 className="font-bold mb-3 flex items-center gap-2">
                              <User className="w-4 h-4" />
                              פרטי מזמין
                            </h4>
                            <div className="grid md:grid-cols-2 gap-3">
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">📱 טלפון:</span>
                                <a href={`tel:${booking.phone}`} className="font-medium text-primary hover:underline">
                                  {booking.phone}
                                </a>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">✉️ אימייל:</span>
                                <a href={`mailto:${booking.email}`} className="font-medium text-primary hover:underline">
                                  {booking.email}
                                </a>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">🕐 סשן:</span>
                                <span className="font-medium">
                                  {booking.session === 'morning' ? '☀️ בוקר (08:00-12:00)' : '🌅 יום מלא (08:00-17:00)'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">💳 תשלום:</span>
                                <span className="font-medium">{booking.paymentMethod || 'לא צוין'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Contact Buttons */}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => sendWhatsApp(booking.phone, booking.id)}
                              className="gap-1 text-green-600 border-green-600 hover:bg-green-50"
                            >
                              <MessageCircle className="w-4 h-4" />
                              וואטסאפ
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.location.href = `mailto:${booking.email}`}
                              className="gap-1"
                            >
                              <Mail className="w-4 h-4" />
                              אימייל
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Riders */}
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">🚴 רוכבים ({booking.riders.length}):</h4>
                        <div className="grid md:grid-cols-2 gap-2">
                          {booking.riders.map((rider, idx) => (
                            <div key={rider.id} className="p-3 bg-muted/50 rounded-lg flex justify-between items-center">
                              <div>
                                <div className="font-medium">{rider.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  גובה: {rider.height} ס"מ
                                </div>
                              </div>
                              <div className="text-sm bg-primary/10 px-2 py-1 rounded">
                                🚲 #{rider.assignedBike} ({rider.assignedSize})
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Picnic Order */}
                      {booking.picnic && booking.picnic.quantity > 0 && (
                        <div className="p-3 bg-accent/10 rounded-lg mb-4">
                          <div className="flex items-center gap-2 font-medium">
                            🧺 חבילת פיקניק x{booking.picnic.quantity}
                          </div>
                          {(booking.picnic.isVegan || booking.picnic.isGlutenFree || booking.picnic.dietaryNotes) && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {booking.picnic.isVegan && '🌱 טבעוני '}
                              {booking.picnic.isGlutenFree && '🌾 ללא גלוטן '}
                              {booking.picnic.dietaryNotes && `| ${booking.picnic.dietaryNotes}`}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Coupon */}
                      {booking.couponCode && (
                        <div className="p-2 bg-success/10 rounded-lg flex items-center gap-2 mb-4">
                          <Gift className="w-4 h-4 text-success" />
                          <span className="text-sm">קופון: <strong className="font-mono">{booking.couponCode}</strong></span>
                        </div>
                      )}

                      {/* Return Photos */}
                      {booking.returnPhotos.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium mb-2">📸 תמונות החזרה:</h4>
                          <div className="flex gap-2 flex-wrap">
                            {booking.returnPhotos.map((photo, idx) => (
                              <img
                                key={idx}
                                src={photo}
                                alt="Return"
                                className="w-20 h-20 object-cover rounded-lg"
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Documents Section */}
                      <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium flex items-center gap-2">
                            <FolderOpen className="w-4 h-4" />
                            מסמכים מצורפים
                          </h4>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {((booking as any).documentsUrls?.length || 0) + ((booking as any).signatureUrl ? 1 : 0)} קבצים
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedBookingForDocs(booking)}
                              className="gap-1 min-h-[44px]"
                            >
                              <Eye className="w-4 h-4" />
                              צפייה
                            </Button>
                            <DocumentUploadButton
                              entityId={booking.id}
                              entityType="booking"
                              size="sm"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="pt-4 border-t border-border flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                          נוצר: {new Date(booking.createdAt).toLocaleDateString('he-IL')}
                        </div>
                        <div className="font-bold text-xl text-primary">{booking.totalPrice}₪</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Mechanic */}
          <TabsContent value="mechanic">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">🔧 יומן מכונאי</h2>
              </div>

              {/* Add New Issue */}
              <div className="glass-card rounded-xl p-6">
                <h3 className="font-bold text-lg mb-4">➕ דווח על תקלה חדשה</h3>
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[120px]">
                    <Label>מספר אופניים</Label>
                    <Select value={newIssueBikeId} onValueChange={setNewIssueBikeId}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="בחר אופניים" />
                      </SelectTrigger>
                      <SelectContent>
                        {bikes.map(bike => (
                          <SelectItem key={bike.id} value={String(bike.id)}>
                            #{bike.stickerNumber} ({bike.size})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <Label>סוג תקלה</Label>
                    <Select value={newIssueType} onValueChange={(v) => setNewIssueType(v as IssueType)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tire">🔧 צמיג</SelectItem>
                        <SelectItem value="chain">⛓️ שרשרת</SelectItem>
                        <SelectItem value="brake">🛑 בלמים</SelectItem>
                        <SelectItem value="other">❓ אחר</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-[2] min-w-[200px]">
                    <Label>תיאור</Label>
                    <Input
                      value={newIssueDescription}
                      onChange={(e) => setNewIssueDescription(e.target.value)}
                      placeholder="תאר את התקלה..."
                      className="mt-1"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={() => {
                        if (!newIssueBikeId) {
                          toast({ title: 'יש לבחור אופניים', variant: 'destructive' });
                          return;
                        }
                        addMechanicIssueMutation.mutate({
                          bikeId: Number(newIssueBikeId),
                          issueType: newIssueType,
                          description: newIssueDescription,
                        });
                        // Also update bike status to maintenance
                        updateBikeMutation.mutate({ id: Number(newIssueBikeId), updates: { status: 'maintenance' } });
                        setNewIssueBikeId('');
                        setNewIssueType('other');
                        setNewIssueDescription('');
                      }}
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      הוסף תקלה
                    </Button>
                  </div>
                </div>
              </div>

              {/* Open Issues */}
              <div className="glass-card rounded-xl p-6 border-2 border-warning/30">
                <h3 className="font-bold text-lg mb-4 text-warning">⚠️ תקלות פתוחות</h3>
                {mechanicIssues.filter(i => !i.resolved).length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">אין תקלות פתוחות ✅</p>
                ) : (
                  <div className="space-y-3">
                    {mechanicIssues.filter(i => !i.resolved).map(issue => (
                      <div key={issue.id} className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
                        {editingIssueId === issue.id ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label>מספר אופניים</Label>
                                <Select value={editIssueBikeId} onValueChange={setEditIssueBikeId}>
                                  <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="בחר אופניים" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {bikes.map(bike => (
                                      <SelectItem key={bike.id} value={String(bike.id)}>
                                        #{bike.stickerNumber} ({bike.size})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>סוג תקלה</Label>
                                <Select value={editIssueType} onValueChange={(v) => setEditIssueType(v as IssueType)}>
                                  <SelectTrigger className="mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="tire">🔧 צמיג</SelectItem>
                                    <SelectItem value="chain">⛓️ שרשרת</SelectItem>
                                    <SelectItem value="brake">🛑 בלמים</SelectItem>
                                    <SelectItem value="other">❓ אחר</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div>
                              <Label>תיאור</Label>
                              <Input
                                value={editIssueDescription}
                                onChange={(e) => setEditIssueDescription(e.target.value)}
                                className="mt-1"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  // Update the issue in Supabase
                                  updateMechanicIssueMutation.mutate({
                                    id: issue.id,
                                    updates: {
                                      bikeId: Number(editIssueBikeId),
                                      issueType: editIssueType,
                                      description: editIssueDescription,
                                    }
                                  });
                                  toast({ title: 'תקלה עודכנה ✅' });
                                  setEditingIssueId(null);
                                }}
                                className="gap-1"
                              >
                                <Save className="w-3 h-3" />
                                שמור
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingIssueId(null)}
                              >
                                ביטול
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{getIssueIcon(issue.issueType)}</span>
                              <div>
                                <div className="font-medium">אופניים #{issue.bikeId}</div>
                                <div className="text-sm text-muted-foreground">
                                  {issue.description && <span className="block">{issue.description}</span>}
                                  {new Date(issue.reportedAt).toLocaleDateString('he-IL')}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingIssueId(issue.id);
                                  setEditIssueBikeId(String(issue.bikeId));
                                  setEditIssueType(issue.issueType);
                                  setEditIssueDescription(issue.description || '');
                                }}
                                className="gap-1"
                              >
                                <Edit className="w-3 h-3" />
                                ערוך
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => {
                                  // Resolve issue in Supabase
                                  updateMechanicIssueMutation.mutate({
                                    id: issue.id,
                                    updates: { resolved: true }
                                  });
                                  // Also update bike status back to available
                                  updateBikeMutation.mutate({ id: issue.bikeId, updates: { status: 'available' } });
                                  toast({ title: 'תקלה טופלה ✅' });
                                }}
                                className="gap-2"
                              >
                                <CheckCircle className="w-4 h-4" />
                                טופל
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Maintenance Log */}
              <div className="glass-card rounded-xl p-6">
                <h3 className="font-bold text-lg mb-4">➕ הוסף רשומת תחזוקה</h3>
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[120px]">
                    <Label>מספר אופניים</Label>
                    <Select value={newLogBikeId} onValueChange={setNewLogBikeId}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="בחר אופניים" />
                      </SelectTrigger>
                      <SelectContent>
                        {bikes.map(bike => (
                          <SelectItem key={bike.id} value={String(bike.id)}>
                            #{bike.stickerNumber} ({bike.size})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-[3] min-w-[200px]">
                    <Label>תיאור עבודה</Label>
                    <Input
                      value={newLogDescription}
                      onChange={(e) => setNewLogDescription(e.target.value)}
                      placeholder="מה בוצע?"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={() => {
                        if (newLogBikeId && newLogDescription) {
                          addMaintenanceLogMutation.mutate({
                            bikeId: Number(newLogBikeId),
                            date: new Date().toISOString(),
                            description: newLogDescription,
                          });
                          auditActions.logMaintenanceLog('new', 'create', { bikeId: Number(newLogBikeId), description: newLogDescription });
                          setNewLogBikeId('');
                          setNewLogDescription('');
                          toast({ title: 'רשומה נוספה ✅' });
                        }
                      }}
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      הוסף
                    </Button>
                  </div>
                </div>
              </div>

              {/* Parts Inventory */}
              <div className="glass-card rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">📦 מלאי חלקים</h3>
                  <Button
                    size="sm"
                    variant={editingParts ? 'default' : 'outline'}
                    onClick={() => {
                      if (editingParts) {
                        updatePartsInventoryMutation.mutate(tempParts);
                        toast({ title: 'מלאי עודכן ✅' });
                      }
                      setEditingParts(!editingParts);
                    }}
                    className="gap-2"
                  >
                    {editingParts ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                    {editingParts ? 'שמור' : 'ערוך'}
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-right p-3">חלק</th>
                        <th className="text-right p-3">כמות</th>
                        <th className="text-right p-3">מינימום</th>
                        <th className="text-right p-3">סטטוס</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tempParts.map((part, idx) => (
                        <tr key={part.id} className="border-t border-border">
                          <td className="p-3">
                            {editingParts ? (
                              <Input
                                value={part.name}
                                onChange={(e) => {
                                  const newParts = [...tempParts];
                                  newParts[idx].name = e.target.value;
                                  setTempParts(newParts);
                                }}
                              />
                            ) : (
                              part.name
                            )}
                          </td>
                          <td className="p-3">
                            {editingParts ? (
                              <Input
                                type="number"
                                value={part.quantity}
                                onChange={(e) => {
                                  const newParts = [...tempParts];
                                  newParts[idx].quantity = Number(e.target.value);
                                  setTempParts(newParts);
                                }}
                                className="w-20"
                              />
                            ) : (
                              <span className={part.quantity <= part.minQuantity ? 'text-destructive font-bold' : ''}>
                                {part.quantity}
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            {editingParts ? (
                              <Input
                                type="number"
                                value={part.minQuantity}
                                onChange={(e) => {
                                  const newParts = [...tempParts];
                                  newParts[idx].minQuantity = Number(e.target.value);
                                  setTempParts(newParts);
                                }}
                                className="w-20"
                              />
                            ) : (
                              part.minQuantity
                            )}
                          </td>
                          <td className="p-3">
                            {part.quantity <= part.minQuantity ? (
                              <span className="bg-destructive/20 text-destructive px-2 py-1 rounded-full text-sm">
                                להזמין! 🛒
                              </span>
                            ) : (
                              <span className="bg-success/20 text-success px-2 py-1 rounded-full text-sm">
                                תקין ✅
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {editingParts && (
                  <Button
                    variant="outline"
                    className="mt-4 gap-2"
                    onClick={() => {
                      setTempParts([
                        ...tempParts,
                        {
                          id: String(Date.now()),
                          name: 'חלק חדש',
                          quantity: 0,
                          minQuantity: 5,
                          needsOrder: true,
                        },
                      ]);
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    הוסף חלק
                  </Button>
                )}
              </div>

              {/* Maintenance History - List Style at BOTTOM */}
              <div className="glass-card rounded-xl p-6">
                <h3 className="font-bold text-lg mb-4">📋 היסטוריית תחזוקה</h3>
                {maintenanceLogs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">אין היסטוריית תחזוקה</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-right p-3">תאריך</th>
                          <th className="text-right p-3">אופניים</th>
                          <th className="text-right p-3">תיאור</th>
                          <th className="text-right p-3">פעולות</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...maintenanceLogs].reverse().map(log => {
                          const bike = bikes.find(b => b.id === log.bikeId);
                          return (
                            <tr key={log.id} className="border-t border-border hover:bg-muted/30">
                              <td className="p-3 text-muted-foreground">
                                {new Date(log.date).toLocaleDateString('he-IL')}
                              </td>
                              <td className="p-3 font-bold">
                                #{bike?.stickerNumber || log.bikeId}
                              </td>
                              <td className="p-3">
                                {editingLogId === log.id ? (
                                  <Input
                                    value={editLogDescription}
                                    onChange={(e) => setEditLogDescription(e.target.value)}
                                    className="min-w-[200px]"
                                  />
                                ) : (
                                  log.description
                                )}
                              </td>
                              <td className="p-3">
                                <div className="flex gap-2">
                                  {editingLogId === log.id ? (
                                    <>
                                      <Button
                                        size="sm"
                                        onClick={() => {
                                          updateMaintenanceLogMutation.mutate({ id: log.id, updates: { description: editLogDescription } });
                                          setEditingLogId(null);
                                          toast({ title: 'רשומה עודכנה ✅' });
                                        }}
                                        className="gap-1"
                                      >
                                        <Save className="w-3 h-3" />
                                        שמור
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setEditingLogId(null)}
                                      >
                                        ביטול
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setEditingLogId(log.id);
                                          setEditLogDescription(log.description);
                                        }}
                                        className="gap-1"
                                      >
                                        <Edit className="w-3 h-3" />
                                        ערוך
                                      </Button>
                                      {isAdmin && (
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          onClick={() => {
                                            if (confirm('למחוק רשומה זו?')) {
                                              deleteMaintenanceLogMutation.mutate(log.id, {
                                                onSuccess: () => {
                                                  auditActions.logMaintenanceLog(log.id, 'delete', { bikeId: log.bikeId });
                                                }
                                              });
                                              toast({ title: 'רשומה נמחקה' });
                                            }
                                          }}
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Parts Tab for Mechanic */}
          {!isAdmin && (
            <TabsContent value="parts">
              <div className="glass-card rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">📦 מלאי חלקים</h3>
                  <Button
                    size="sm"
                    variant={editingParts ? 'default' : 'outline'}
                    onClick={() => {
                      if (editingParts) {
                        updatePartsInventoryMutation.mutate(tempParts);
                        toast({ title: 'מלאי עודכן ✅' });
                      }
                      setEditingParts(!editingParts);
                    }}
                    className="gap-2"
                  >
                    {editingParts ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                    {editingParts ? 'שמור' : 'ערוך'}
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-right p-3">חלק</th>
                        <th className="text-right p-3">כמות</th>
                        <th className="text-right p-3">מינימום</th>
                        <th className="text-right p-3">סטטוס</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tempParts.map((part, idx) => (
                        <tr key={part.id} className="border-t border-border">
                          <td className="p-3">
                            {editingParts ? (
                              <Input
                                value={part.name}
                                onChange={(e) => {
                                  const newParts = [...tempParts];
                                  newParts[idx].name = e.target.value;
                                  setTempParts(newParts);
                                }}
                              />
                            ) : (
                              part.name
                            )}
                          </td>
                          <td className="p-3">
                            {editingParts ? (
                              <Input
                                type="number"
                                value={part.quantity}
                                onChange={(e) => {
                                  const newParts = [...tempParts];
                                  newParts[idx].quantity = Number(e.target.value);
                                  setTempParts(newParts);
                                }}
                                className="w-20"
                              />
                            ) : (
                              <span className={part.quantity <= part.minQuantity ? 'text-destructive font-bold' : ''}>
                                {part.quantity}
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            {editingParts ? (
                              <Input
                                type="number"
                                value={part.minQuantity}
                                onChange={(e) => {
                                  const newParts = [...tempParts];
                                  newParts[idx].minQuantity = Number(e.target.value);
                                  setTempParts(newParts);
                                }}
                                className="w-20"
                              />
                            ) : (
                              part.minQuantity
                            )}
                          </td>
                          <td className="p-3">
                            {part.quantity <= part.minQuantity ? (
                              <span className="bg-destructive/20 text-destructive px-2 py-1 rounded-full text-sm">
                                להזמין! 🛒
                              </span>
                            ) : (
                              <span className="bg-success/20 text-success px-2 py-1 rounded-full text-sm">
                                תקין ✅
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {editingParts && (
                  <Button
                    variant="outline"
                    className="mt-4 gap-2"
                    onClick={() => {
                      setTempParts([
                        ...tempParts,
                        {
                          id: String(Date.now()),
                          name: 'חלק חדש',
                          quantity: 0,
                          minQuantity: 5,
                          needsOrder: true,
                        },
                      ]);
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    הוסף חלק
                  </Button>
                )}
              </div>
            </TabsContent>
          )}

          {/* Fleet */}
          <TabsContent value="fleet">
            <div className="space-y-6">
              {/* Inventory Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-card rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-primary">
                    {bikes.filter(b => b.status === 'available' && ['XS', 'S', 'M', 'L', 'XL'].includes(b.size)).length}
                  </div>
                  <div className="text-sm text-muted-foreground">סה"כ זמין</div>
                </div>
                <div className="glass-card rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-warning">
                    {bikes.filter(b => b.status === 'maintenance').length}
                  </div>
                  <div className="text-sm text-muted-foreground">בתחזוקה</div>
                </div>
                <div className="glass-card rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-accent">
                    {bikes.filter(b => b.status === 'rented').length}
                  </div>
                  <div className="text-sm text-muted-foreground">מושכרים</div>
                </div>
                <div className="glass-card rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-muted-foreground">
                    {bikes.length}
                  </div>
                  <div className="text-sm text-muted-foreground">סה"כ צי</div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">🚲 ניהול צי</h2>
                <Button onClick={async () => {
                  const newId = bikes.length > 0 ? Math.max(...bikes.map(b => b.id)) + 1 : 1;
                  const stickerNumber = `R${String(newId).padStart(2, '0')}`;
                  try {
                    const createdBikeId = await addBikeMutation.mutateAsync({
                      size: 'M',
                      lockCode: String(1000 + Math.floor(Math.random() * 9000)),
                      status: 'available',
                      stickerNumber,
                    });
                    auditActions.logBikeCreate(createdBikeId, { size: 'M', status: 'available', stickerNumber });
                  } catch (e) {
                    console.error("Failed to add bike", e);
                  }
                }} className="gap-2">
                  <Plus className="w-4 h-4" />
                  הוסף אופניים
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {bikes.map(bike => (
                  <div
                    key={bike.id}
                    className={`glass-card rounded-xl p-4 ${editingBike === bike.id ? 'ring-2 ring-primary' : ''
                      }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="font-mono font-bold text-lg">#{bike.stickerNumber}</div>
                      {getStatusIcon(bike.status)}
                    </div>

                    {editingBike === bike.id ? (
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs">שם/מספר</Label>
                          <Input
                            value={bike.stickerNumber}
                            onChange={(e) => updateBikeMutation.mutate({ id: bike.id, updates: { stickerNumber: e.target.value } })}
                            placeholder="מספר מדבקה"
                          />
                        </div>
                        <Select
                          value={bike.size}
                          onValueChange={(value) => updateBikeMutation.mutate({ id: bike.id, updates: { size: value as BikeSize } })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {['XS', 'S', 'M', 'L', 'XL'].map(s => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          value={bike.lockCode}
                          onChange={(e) => updateBikeMutation.mutate({ id: bike.id, updates: { lockCode: e.target.value } })}
                          placeholder="קוד"
                        />
                        <Select
                          value={bike.status}
                          onValueChange={(value) => updateBikeMutation.mutate({ id: bike.id, updates: { status: value as BikeStatus } })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">זמין ✅</SelectItem>
                            <SelectItem value="maintenance">תחזוקה 🛠️</SelectItem>
                            <SelectItem value="rented">מושכר 🚴</SelectItem>
                            <SelectItem value="unavailable">לא זמין ❌</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1 gap-1" onClick={() => setEditingBike(null)}>
                            <Save className="w-4 h-4" />
                            סגור
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeletingBikeId(bike.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-1 mb-3">
                          <div className="text-sm">מידה: <strong>{bike.size}</strong></div>
                          <div className="text-sm">קוד: <strong className="font-mono">{bike.lockCode}</strong></div>
                          <div className="text-xs text-muted-foreground">{getStatusLabel(bike.status)}</div>
                        </div>



                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full gap-2"
                          onClick={() => setEditingBike(bike.id)}
                        >
                          <Edit className="w-4 h-4" />
                          ערוך
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Coupons */}
          <TabsContent value="coupons">
            <div className="space-y-6">
              {/* Create Manual Coupon */}
              <div className="glass-card rounded-xl p-6">
                <h3 className="font-bold text-lg mb-4">🎟️ יצירת קופון ידני</h3>
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <Label>סכום הנחה</Label>
                    <Input
                      type="number"
                      value={couponAmount}
                      onChange={(e) => setCouponAmount(e.target.value)}
                      placeholder="הכנס סכום"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>סוג הנחה</Label>
                    <Select value={couponType} onValueChange={(v) => setCouponType(v as 'percent' | 'fixed')}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">₪ קבוע</SelectItem>
                        <SelectItem value="percent">% אחוזים</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>מייל לאישור</Label>
                    <Input
                      type="email"
                      value={couponEmail}
                      onChange={(e) => setCouponEmail(e.target.value)}
                      placeholder="admin@example.com"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={async () => {
                        if (couponAmount && couponEmail) {
                          const code = generateCouponCode();
                          await createCouponMutation.mutateAsync({
                            code,
                            discount: Number(couponAmount),
                            discountType: couponType,
                            isManual: true,
                            verificationEmail: couponEmail,
                            verified: false,
                          });
                          auditActions.logCouponCreate(code, { discount: Number(couponAmount), discountType: couponType, verificationEmail: couponEmail });
                          // Simulate sending verification email
                          console.log(`📧 שולח מייל אישור ל-${couponEmail} עבור קופון ${code}`);
                          toast({
                            title: 'קופון נוצר!',
                            description: `נשלח מייל אישור ל-${couponEmail}`,
                          });
                          setCouponAmount('');
                          setCouponEmail('');
                        } else {
                          toast({ title: 'נא למלא את כל השדות', variant: 'destructive' });
                        }
                      }}
                      className="w-full gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      צור ושלח לאישור
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">🎟️ קופונים</h2>
                <div className="text-muted-foreground">
                  סה"כ: {coupons.length} קופונים
                </div>
              </div>

              {coupons.length === 0 ? (
                <div className="glass-card rounded-xl p-8 text-center">
                  <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">עדיין לא נוצרו קופונים</p>
                </div>
              ) : (
                <div className="glass-card rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-right p-4 font-medium">קוד קופון</th>
                        <th className="text-right p-4 font-medium">הנחה</th>
                        <th className="text-right p-4 font-medium">סוג</th>
                        <th className="text-right p-4 font-medium">תאריך יצירה</th>
                        <th className="text-right p-4 font-medium">סטטוס</th>
                        <th className="text-right p-4 font-medium">פעולות</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coupons.map(coupon => (
                        <tr key={coupon.id} className="border-t border-border hover:bg-muted/30">
                          <td className="p-4">
                            <span className="font-mono font-bold text-primary">{coupon.code}</span>
                          </td>
                          <td className="p-4">
                            <span className="bg-success/20 text-success px-2 py-1 rounded-full text-sm">
                              {coupon.discountType === 'percent' ? `${coupon.discount}%` : `${coupon.discount}₪`}
                            </span>
                          </td>
                          <td className="p-4 text-muted-foreground">
                            {coupon.isManual ? 'ידני' : 'אוטומטי'}
                          </td>
                          <td className="p-4 text-muted-foreground">
                            {new Date(coupon.createdAt).toLocaleDateString('he-IL')}
                          </td>
                          <td className="p-4">
                            {coupon.usedAt ? (
                              <span className="text-muted-foreground">נוצל ✅</span>
                            ) : coupon.isManual && !coupon.verified ? (
                              <span className="text-warning">ממתין לאישור ⏳</span>
                            ) : (
                              <span className="text-success">פעיל 🟢</span>
                            )}
                          </td>
                          <td className="p-4">
                            {coupon.isManual && !coupon.verified && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  updateCouponMutation.mutate({ id: coupon.id, updates: { verified: true } });
                                  toast({ title: 'קופון אושר ✅' });
                                }}
                                className="gap-1"
                              >
                                <CheckCircle className="w-3 h-3" />
                                אשר
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Users Management - Admin Only */}
          <TabsContent value="users">
            <StaffManagement />
          </TabsContent>

          {/* Site Content Management */}
          <TabsContent value="content">
            <SiteContentManager />
          </TabsContent>

          {/* Security / Rate Limit Telemetry */}
          <TabsContent value="security">
            <RateLimitTelemetry />
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings">
            <div className="space-y-6">
              {/* Payment Methods Manager */}
              <div className="glass-card rounded-xl p-6">
                <PaymentMethodsManager />
              </div>

              {/* Session Settings Manager */}
              <div className="glass-card rounded-xl p-6">
                <SessionSettingsManager />
              </div>

              {/* Height Ranges */}
              <div className="glass-card rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">📏 טווחי גובה</h3>
                  <Button
                    size="sm"
                    variant={editingRanges ? 'default' : 'outline'}
                    onClick={() => {
                      if (editingRanges) {
                        updateHeightRangesMutation.mutate(tempRanges);
                        auditActions.logHeightRangesUpdate({ ranges: tempRanges });
                        toast({ title: 'טווחים עודכנו ✅' });
                      }
                      setEditingRanges(!editingRanges);
                    }}
                    className="gap-2"
                  >
                    {editingRanges ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                    {editingRanges ? 'שמור' : 'ערוך'}
                  </Button>
                </div>

                <div className="grid md:grid-cols-4 gap-4">
                  {tempRanges.map((range, idx) => (
                    <div key={range.size} className="p-4 bg-muted/50 rounded-lg">
                      <div className="font-bold text-center mb-2">מידה {range.size}</div>
                      {editingRanges ? (
                        <div className="space-y-2">
                          <Input
                            type="number"
                            value={range.minHeight}
                            onChange={(e) => {
                              const newRanges = [...tempRanges];
                              newRanges[idx].minHeight = Number(e.target.value);
                              setTempRanges(newRanges);
                            }}
                            placeholder="מינימום"
                          />
                          <Input
                            type="number"
                            value={range.maxHeight}
                            onChange={(e) => {
                              const newRanges = [...tempRanges];
                              newRanges[idx].maxHeight = Number(e.target.value);
                              setTempRanges(newRanges);
                            }}
                            placeholder="מקסימום"
                          />
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground">
                          {range.minHeight} - {range.maxHeight} ס"מ
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div className="glass-card rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">💰 מחירון</h3>
                  <Button
                    size="sm"
                    variant={editingPricing ? 'default' : 'outline'}
                    onClick={() => {
                      if (editingPricing) {
                        updatePricingMutation.mutate(tempPricing);
                        auditActions.logPricingUpdate({ ...tempPricing });
                        toast({ title: 'מחירים עודכנו ✅' });
                      }
                      setEditingPricing(!editingPricing);
                    }}
                    className="gap-2"
                  >
                    {editingPricing ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                    {editingPricing ? 'שמור' : 'ערוך'}
                  </Button>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { key: 'morningSession', label: '☀️ סשן בוקר' },
                    { key: 'dailySession', label: '🌅 סשן יומי' },
                    { key: 'picnic', label: '🧺 פיקניק' },
                    { key: 'lateFee', label: '⏰ קנס איחור' },
                    { key: 'theftFee', label: '🚨 קנס גניבה' },
                    { key: 'securityHold', label: '🔒 עיכבון' },
                  ].map(item => (
                    <div key={item.key} className="p-4 bg-muted/50 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">{item.label}</div>
                      {editingPricing ? (
                        <Input
                          type="number"
                          value={tempPricing[item.key as keyof typeof tempPricing]}
                          onChange={(e) => setTempPricing({
                            ...tempPricing,
                            [item.key]: Number(e.target.value)
                          })}
                        />
                      ) : (
                        <div className="text-xl font-bold">
                          {pricing[item.key as keyof typeof pricing]}₪
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-8">
            <AuditLogDashboard />
            <AuditLogHistory />
          </TabsContent>

          {/* Signatures Tab */}
          <TabsContent value="signatures">
            <BookingSignaturesManager />
          </TabsContent>

          {/* Pre-Launch Tab */}
          <TabsContent value="prelaunch">
            <WaitingListManager />
          </TabsContent>
        </Tabs>

        {/* Document Gallery Dialog for Bookings */}
        {selectedBookingForDocs && (
          <DocumentGallery
            open={!!selectedBookingForDocs}
            onOpenChange={(open) => !open && setSelectedBookingForDocs(null)}
            entityId={selectedBookingForDocs.id}
            riders={selectedBookingForDocs.riders}
            entityType="booking"
            entityName={selectedBookingForDocs.riders?.[0]?.name || 'הזמנה'}
            documents={(selectedBookingForDocs as any).documentsUrls || []}
            signatureUrl={(selectedBookingForDocs as any).signatureUrl}
          />
        )}
        {/* Bike Deletion Confirmation */}
        <AlertDialog open={!!deletingBikeId} onOpenChange={(open) => !open && setDeletingBikeId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>אתה בטוח שברצונך למחוק את האופניים?</AlertDialogTitle>
              <AlertDialogDescription>
                פעולה זו היא בלתי הפיכה ותמחק את כל ההיסטוריה הקשורה לאופניים אלו.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>ביטול</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                onClick={() => {
                  if (deletingBikeId) {
                    removeBikeMutation.mutate(deletingBikeId);
                    setDeletingBikeId(null);
                  }
                }}
              >
                מחק
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
