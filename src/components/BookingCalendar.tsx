import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBookings } from '@/hooks/useSupabaseData';
import { 
  ONLINE_AVAILABLE_CAP, 
  getOccupancyLevel, 
  getOccupancyColor, 
  getOccupancyTextColor,
  getOccupancyBorderColor,
  type OccupancyLevel 
} from '@/lib/inventory';
import { ChevronLeft, ChevronRight, Calendar, Users, Bike, ExternalLink, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Booking } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Link, useSearchParams } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BookingCalendarProps {
  onDateSelect?: (date: string, bookings: Booking[]) => void;
}

export default function BookingCalendar({ onDateSelect }: BookingCalendarProps) {
  const { data: bookings = [] } = useBookings();
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
  
  // Get bookings for a specific date
  const getBookingsForDate = (dateStr: string): Booking[] => {
    return bookings.filter(b => b.date === dateStr && b.status !== 'cancelled');
  };
  
  // Get booked bikes count for a date
  const getBookedBikesCount = (dateStr: string): number => {
    const dateBookings = getBookingsForDate(dateStr);
    return dateBookings.reduce((sum, b) => sum + b.riders.length, 0);
  };
  
  // Get calendar data with booking details
  const calendarData = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days: { 
      date: Date; 
      dateStr: string; 
      bookedCount: number; 
      level: OccupancyLevel;
      bookings: Booking[];
    }[] = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const dayBookings = getBookingsForDate(dateStr);
      const bookedCount = dayBookings.reduce((sum, b) => sum + b.riders.length, 0);
      const level = getOccupancyLevel(bookedCount, ONLINE_AVAILABLE_CAP);
      
      days.push({ date, dateStr, bookedCount, level, bookings: dayBookings });
    }
    
    return { days, startDay, daysInMonth };
  }, [year, month, bookings]);
  
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
  
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Get next 5 days for real-time availability
  const getNext5Days = () => {
    const today = new Date();
    const days: { date: string; label: string }[] = [];
    const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    
    for (let i = 0; i < 5; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push({
        date: d.toISOString().split('T')[0],
        label: i === 0 ? 'היום' : i === 1 ? 'מחר' : dayNames[d.getDay()]
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
      {/* Real-time Availability Counter */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-xl flex items-center gap-2">
            <Bike className="w-6 h-6 text-primary" />
            זמינות בזמן אמת
          </h3>
          <Button variant="outline" onClick={() => setJumpDialogOpen(true)} className="gap-2">
            <Search className="w-4 h-4" />
            קפיצה לתאריך
          </Button>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {next5Days.map((day) => (
            <AvailabilityCard 
              key={day.date}
              label={day.label} 
              booked={getBookedBikesCount(day.date)} 
              total={ONLINE_AVAILABLE_CAP} 
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
            <span>0-40%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-orange-500" />
            <span>41-80%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-red-500" />
            <span>81-99%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gray-500" />
            <span>מלא</span>
          </div>
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
          {calendarData.days.map(({ date, dateStr, bookedCount, level, bookings: dayBookings }) => {
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const isPast = date < new Date(todayStr);
            
            return (
              <button
                key={dateStr}
                onClick={() => handleDateClick(dateStr)}
                disabled={isPast}
                className={cn(
                  "min-h-[100px] p-2 rounded-lg flex flex-col items-start justify-start text-left transition-all relative",
                  "hover:ring-2 hover:ring-primary/50 hover:bg-muted/50",
                  isToday && "ring-2 ring-primary bg-primary/5",
                  isSelected && "ring-2 ring-accent",
                  isPast && "opacity-40 cursor-not-allowed bg-muted/20",
                  !isPast && bookedCount > 0 && `border-2 ${getOccupancyBorderColor(level)}`
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
                  
                  {bookedCount > 0 && (
                    <div className={cn(
                      "text-xs font-bold px-1.5 py-0.5 rounded",
                      getOccupancyColor(level),
                      "text-white"
                    )}>
                      {bookedCount} 🚴
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
  total 
}: { 
  label: string; 
  booked: number; 
  total: number; 
}) {
  const available = total - booked;
  const level = getOccupancyLevel(booked, total);
  
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