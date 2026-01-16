import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBookings, useBikes } from '@/hooks/useSupabaseData';
import {
  getOccupancyColor,
  getOccupancyTextColor,
  getOccupancyBorderColor,
  BIKES_PER_SIZE,
  type OccupancyLevel
} from '@/lib/inventory';
import { ChevronLeft, ChevronRight, Calendar, Users, Bike, ExternalLink, Search, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Booking, BikeSize } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Link, useSearchParams } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';

// Dynamic occupancy calculation
export function calculateDayOccupancy(
  dateStr: string,
  bookings: Booking[],
  bikes: any[], // Type is implied from useBikes
  filterSize: BikeSize | 'ALL'
): { bookedCount: number; totalCapacity: number; level: OccupancyLevel } {

  // 1. Calculate Total Capacity DYNAMICALLY from fleet status
  // Used as the "Max" for availability calculations
  let totalCapacity = 0;

  // Filter ONLY active rentable bikes (exclude maintenance/unavailable)
  const activeBikes = bikes.filter(b => b.status !== 'maintenance' && b.status !== 'unavailable');

  if (filterSize === 'ALL') {
    // Sum of all active bikes in the DB
    totalCapacity = activeBikes.length;
  } else {
    // Exact count for the selected size from DB
    totalCapacity = activeBikes.filter(b => b.size === filterSize).length;
  }

  // 2. Calculate Booked Count (including overlaps)
  const yesterday = new Date(dateStr); // input dateStr is already YYYY-MM-DD
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  const relevantBookings = bookings.filter(b => {
    if (b.status === 'cancelled') return false;

    // Booking is for today
    if (b.date === dateStr) return true;

    // Booking was yesterday 'daily' (blocks morning/all of today)
    if (b.date === yesterdayStr && b.session === 'daily') return true;

    return false;
  });

  let bookedCount = 0;
  relevantBookings.forEach(booking => {
    booking.riders.forEach(rider => {
      // Filter by size if selected
      if (filterSize === 'ALL') {
        bookedCount++;
      } else {
        // Count if rider assigned size matches filter
        // OR if no assigned size, we must count it pessimistically (Ghost Booking)
        // because it consumes a bike from the total pool, reducing availability for everyone.
        if (rider.assignedSize === filterSize || !rider.assignedSize) {
          bookedCount++;
        }
      }
    });
  });

  // 3. Determine Level
  let level: OccupancyLevel = 'low';
  if (totalCapacity === 0) {
    level = 'full';
  } else {
    // Ensure we don't show negative availability if overbooked
    if (bookedCount > totalCapacity) bookedCount = totalCapacity;

    const ratio = bookedCount / totalCapacity;
    if (ratio >= 1) level = 'full';
    else if (ratio > 0.8) level = 'high';
    else if (ratio > 0.4) level = 'medium';
  }

  return { bookedCount, totalCapacity, level };
}

interface BookingCalendarProps {
  onDateSelect?: (date: string, bookings: Booking[]) => void;
}

export default function BookingCalendar({ onDateSelect }: BookingCalendarProps) {
  const { data: bookings = [] } = useBookings();
  const { data: bikes = [] } = useBikes(); // Fetch real fleet data
  const [searchParams, setSearchParams] = useSearchParams();

  // Persist month/year in URL to prevent reset on edits
  const monthParam = searchParams.get('calMonth');
  const yearParam = searchParams.get('calYear');
  const now = new Date();
  const year = yearParam ? parseInt(yearParam) : now.getFullYear();
  const month = monthParam ? parseInt(monthParam) : now.getMonth();

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [jumpToDate, setJumpToDate] = useState('');
  const [jumpDialogOpen, setJumpDialogOpen] = useState(false);
  const [sizeFilter, setSizeFilter] = useState<BikeSize | 'ALL'>('ALL'); // New Size Filter State

  // Get bookings for a specific date
  const getBookingsForDate = (dateStr: string): Booking[] => {
    return bookings.filter(b => b.date === dateStr && b.status !== 'cancelled');
  };

  // Get calendar data with dynamic calculations
  const calendarData = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: {
      date: Date;
      dateStr: string;
      bookedCount: number;
      totalCapacity: number;
      level: OccupancyLevel;
      bookings: Booking[];
    }[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      // Use local date string construction instead of toISOString() which shifts to UTC
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const dayBookings = getBookingsForDate(dateStr);

      const { bookedCount, totalCapacity, level } = calculateDayOccupancy(dateStr, bookings, bikes, sizeFilter);

      days.push({ date, dateStr, bookedCount, totalCapacity, level, bookings: dayBookings });
    }

    return { days, startDay, daysInMonth };
  }, [year, month, bookings, bikes, sizeFilter]);

  const updateCalendarParams = useCallback((newMonth: number, newYear: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('calMonth', newMonth.toString());
    params.set('calYear', newYear.toString());
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    let newMonth = month;
    let newYear = year;
    if (direction === 'prev') {
      newMonth = month - 1;
      if (newMonth < 0) {
        newMonth = 11;
        newYear = year - 1;
      }
    } else {
      newMonth = month + 1;
      if (newMonth > 11) {
        newMonth = 0;
        newYear = year + 1;
      }
    }
    updateCalendarParams(newMonth, newYear);
    setSelectedDate(null);
  };

  const navigateYear = (direction: 'prev' | 'next') => {
    const newYear = direction === 'prev' ? year - 1 : year + 1;
    updateCalendarParams(month, newYear);
    setSelectedDate(null);
  };

  const handleDateClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setDialogOpen(true);
    const dateBookings = getBookingsForDate(dateStr);
    onDateSelect?.(dateStr, dateBookings);
  };

  const handleJumpToDate = () => {
    if (!jumpToDate) return;
    const targetDate = new Date(jumpToDate);
    if (!isNaN(targetDate.getTime())) {
      // Navigate to the month/year of the target date
      updateCalendarParams(targetDate.getMonth(), targetDate.getFullYear());
      setSelectedDate(jumpToDate);
      setDialogOpen(true);
      setJumpDialogOpen(false);
      setJumpToDate('');
    }
  };

  const selectedBookings = selectedDate ? getBookingsForDate(selectedDate) : [];

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Get next 5 days for real-time availability
  const getNext5Days = () => {
    const today = new Date();
    const days: { date: string; label: string; booked: number; capacity: number; level: OccupancyLevel }[] = [];
    const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

    for (let i = 0; i < 5; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const { bookedCount, totalCapacity, level } = calculateDayOccupancy(dateStr, bookings, bikes, sizeFilter);

      days.push({
        date: dateStr,
        label: i === 0 ? 'היום' : i === 1 ? 'מחר' : dayNames[d.getDay()],
        booked: bookedCount,
        capacity: totalCapacity,
        level
      });
    }
    return days;
  };

  const next5Days = getNext5Days();

  const weekDays = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
  const monthNames = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ];

  // Helper to get short booking summary
  const getBookingSummary = (booking: Booking): string => {
    const name = booking.riders[0]?.name?.split(' ')[0] || 'הזמנה';
    return `${name}: ${booking.riders.length}`;
  };

  return (
    <div className="space-y-6">
      {/* Header with Availability and Controls */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h3 className="font-bold text-xl flex items-center gap-2">
            <Bike className="w-6 h-6 text-primary" />
            זמינות בזמן אמת
          </h3>

          <div className="flex gap-2 w-full md:w-auto">
            <div className="w-[180px]">
              <Select value={sizeFilter} onValueChange={(v) => setSizeFilter(v as BikeSize | 'ALL')}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    <SelectValue placeholder="סינון לפי גודל" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">כל הגדלים</SelectItem>
                  <SelectItem value="S">Small (S)</SelectItem>
                  <SelectItem value="M">Medium (M)</SelectItem>
                  <SelectItem value="L">Large (L)</SelectItem>
                  <SelectItem value="XL">Extra Large (XL)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" onClick={() => setJumpDialogOpen(true)} className="gap-2 flex-1 md:flex-none">
              <Search className="w-4 h-4" />
              תאריך
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-3">
          {next5Days.map((day) => (
            <AvailabilityCard
              key={day.date}
              label={day.label}
              booked={day.booked}
              total={day.capacity}
              level={day.level}
            />
          ))}
        </div>
      </div>

      {/* Calendar Header with Navigation */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateYear('prev')}>
              <ChevronLeft className="w-4 h-4" />
              <ChevronLeft className="w-4 h-4 -ml-2" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>

          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            {monthNames[month]} {year}
          </h2>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateMonth('next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigateYear('next')}>
              <ChevronRight className="w-4 h-4" />
              <ChevronRight className="w-4 h-4 -ml-2" />
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-4 text-base">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-green-500" />
            <span>פנוי</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-orange-500" />
            <span>עמוס</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-red-500" />
            <span>מלא/סגור</span>
          </div>
          {sizeFilter !== 'ALL' && (
            <span className="text-sm text-muted-foreground mr-auto">
              * מציג זמינות עבור מידה {sizeFilter} בלבד
            </span>
          )}
        </div>

        {/* Weekday Headers - LARGER */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day, i) => (
            <div key={i} className="text-center text-lg font-bold text-muted-foreground py-3">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid - LARGER with booking details */}
        <div className="grid grid-cols-7 gap-2">
          {/* Empty cells for days before the first of the month */}
          {Array.from({ length: calendarData.startDay }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[100px]" />
          ))}

          {/* Day cells */}
          {calendarData.days.map(({ date, dateStr, bookedCount, totalCapacity, level, bookings: dayBookings }) => {
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const isPast = date < new Date(todayStr);

            // Check if blocked due to 0 capacity
            const isBlocked = totalCapacity === 0 && !isPast;

            return (
              <button
                key={dateStr}
                onClick={() => handleDateClick(dateStr)}
                disabled={isPast && false} // Allow clicking past to see history
                className={cn(
                  "min-h-[100px] p-2 rounded-lg flex flex-col items-start justify-start text-left transition-all relative",
                  "hover:ring-2 hover:ring-primary/50 hover:bg-muted/50",
                  isToday && "ring-2 ring-primary bg-primary/5",
                  isSelected && "ring-2 ring-accent",
                  isPast && "opacity-60 bg-muted/20",
                  !isPast && `border-2 ${getOccupancyBorderColor(level)}`
                )}
              >
                {/* Date number - LARGE */}
                <div className="flex items-center justify-between w-full mb-1">
                  <span className={cn(
                    "text-xl font-bold",
                    isToday && "text-primary",
                    isSelected && "text-accent"
                  )}>
                    {date.getDate()}
                  </span>

                  {/* Availability Badge */}
                  {!isPast && (
                    <div className={cn(
                      "text-xs font-bold px-1.5 py-0.5 rounded",
                      getOccupancyColor(level),
                      "text-white"
                    )}>
                      {totalCapacity === 0 ? 'אין אופניים' : (totalCapacity - bookedCount)}
                    </div>
                  )}
                </div>

                {/* Booking details - show first 2 bookings */}
                {dayBookings.length > 0 && (
                  <div className="space-y-0.5 w-full overflow-hidden">
                    {dayBookings.slice(0, 2).map((booking) => (
                      <div
                        key={booking.id}
                        className="text-xs truncate bg-muted/70 px-1 py-0.5 rounded text-foreground"
                      >
                        {getBookingSummary(booking)}
                      </div>
                    ))}
                    {dayBookings.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayBookings.length - 2} עוד
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Date Click Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Calendar className="w-6 h-6" />
              {selectedDate && new Date(selectedDate).toLocaleDateString('he-IL', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedBookings.length === 0 ? (
              <p className="text-muted-foreground text-center py-6 text-lg">
                אין הזמנות לתאריך זה 🏜️
              </p>
            ) : (
              <>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex justify-between items-center text-lg">
                    <span className="text-muted-foreground">סה״כ הזמנות:</span>
                    <span className="font-bold text-xl">{selectedBookings.length}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2 text-lg">
                    <span className="text-muted-foreground">סה״כ רוכבים:</span>
                    <span className="font-bold text-xl">
                      {selectedBookings.reduce((sum, b) => sum + b.riders.length, 0)}
                    </span>
                  </div>
                </div>

                {/* Booking list in dialog */}
                <ScrollArea className="max-h-[300px]">
                  <div className="space-y-2">
                    {selectedBookings.map((booking) => (
                      <div key={booking.id} className="p-3 bg-muted/30 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">
                              {booking.riders[0]?.name || 'לא צוין'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {booking.riders.length} רוכבים | {booking.session === 'morning' ? '☀️ בוקר' : '🌅 יום מלא'}
                            </div>
                          </div>
                          <div className="text-sm font-mono bg-muted px-2 py-1 rounded">
                            #{booking.id.slice(-6)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <Link
                  to={`/admin?tab=orders&date=${selectedDate}`}
                  onClick={() => setDialogOpen(false)}
                >
                  <Button className="w-full gap-2 text-lg py-6">
                    <ExternalLink className="w-5 h-5" />
                    צפה בכל ההזמנות ליום זה
                  </Button>
                </Link>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Jump to Date Dialog */}
      <Dialog open={jumpDialogOpen} onOpenChange={setJumpDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              קפיצה לתאריך
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>בחר תאריך</Label>
              <Input
                type="date"
                value={jumpToDate}
                onChange={(e) => setJumpToDate(e.target.value)}
                className="mt-2 text-lg"
                min={todayStr}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleJumpToDate} className="flex-1">
                פתח תאריך
              </Button>
              <Button variant="outline" onClick={() => setJumpDialogOpen(false)}>
                ביטול
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Availability Card Component - LARGER
function AvailabilityCard({
  label,
  booked,
  total,
  level
}: {
  label: string;
  booked: number;
  total: number;
  level: OccupancyLevel;
}) {
  const available = Math.max(0, total - booked);

  return (
    <div className={cn(
      "rounded-xl p-5 text-center border-2 transition-all",
      getOccupancyBorderColor(level),
      "bg-card"
    )}>
      <div className="text-lg text-muted-foreground mb-1">{label}</div>
      <div className={cn("text-4xl font-bold", getOccupancyTextColor(level))}>
        {available}
      </div>
      <div className="text-sm text-muted-foreground">
        מתוך {total} זמינים
      </div>
    </div>
  );
}