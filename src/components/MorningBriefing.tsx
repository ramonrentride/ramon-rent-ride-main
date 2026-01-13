import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Users, Clock, Wrench, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import type { Booking, PartInventory } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MorningBriefingProps {
  todayBookings: Booking[];
  upcomingDays: Array<{
    dateStr: string;
    date: Date;
    bookings: Booking[];
    totalRiders: number;
  }>;
  stats: {
    totalRiders: number;
    fullDay: number;
    picnic: number;
    broken: number;
  };
  lowInventoryParts: PartInventory[];
}

type BriefingView = 'today' | 'tomorrow' | 'next3';

export default function MorningBriefing({ 
  todayBookings, 
  upcomingDays, 
  stats, 
  lowInventoryParts 
}: MorningBriefingProps) {
  const [view, setView] = useState<BriefingView>('today');
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const tomorrow = upcomingDays[0];

  const getBookingsForView = () => {
    switch (view) {
      case 'today': return todayBookings;
      case 'tomorrow': return tomorrow?.bookings || [];
      case 'next3': return upcomingDays.flatMap(d => d.bookings);
    }
  };

  const getViewTitle = () => {
    switch (view) {
      case 'today': return 'היום';
      case 'tomorrow': return 'מחר';
      case 'next3': return '3 ימים קדימה';
    }
  };

  const viewBookings = getBookingsForView();

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <h2 className="text-2xl font-bold mb-2">
          ☀️ {new Date().toLocaleDateString('he-IL', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </h2>
      </div>

      {/* Low Inventory Alert */}
      {lowInventoryParts.length > 0 && (
        <div className="glass-card rounded-xl p-4 border-2 border-destructive/50 bg-destructive/5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-destructive" />
            <div>
              <h3 className="font-bold text-destructive">⚠️ התראת מלאי נמוך!</h3>
              <p className="text-sm text-muted-foreground">
                {lowInventoryParts.length} חלקים במלאי נמוך: {lowInventoryParts.map(p => p.name).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-6 text-center">
          <Users className="w-8 h-8 text-primary mx-auto mb-2" />
          <div className="text-3xl font-bold">{stats.totalRiders}</div>
          <div className="text-muted-foreground">🚴 רוכבים היום</div>
        </div>
        <div className="glass-card rounded-xl p-6 text-center">
          <Clock className="w-8 h-8 text-accent mx-auto mb-2" />
          <div className="text-3xl font-bold">{stats.fullDay}</div>
          <div className="text-muted-foreground">🌅 יום מלא</div>
        </div>
        <div className="glass-card rounded-xl p-6 text-center">
          <span className="text-3xl mb-2 block">🧺</span>
          <div className="text-3xl font-bold">{stats.picnic}</div>
          <div className="text-muted-foreground">פיקניק</div>
        </div>
        <div className="glass-card rounded-xl p-6 text-center">
          <Wrench className="w-8 h-8 text-warning mx-auto mb-2" />
          <div className="text-3xl font-bold">{stats.broken}</div>
          <div className="text-muted-foreground">בתחזוקה 🛠️</div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 justify-center">
        <Button 
          variant={view === 'today' ? 'default' : 'outline'}
          onClick={() => setView('today')}
        >
          היום ({todayBookings.length})
        </Button>
        <Button 
          variant={view === 'tomorrow' ? 'default' : 'outline'}
          onClick={() => setView('tomorrow')}
        >
          מחר ({tomorrow?.bookings.length || 0})
        </Button>
        <Button 
          variant={view === 'next3' ? 'default' : 'outline'}
          onClick={() => setView('next3')}
        >
          3 ימים ({upcomingDays.reduce((sum, d) => sum + d.bookings.length, 0)})
        </Button>
      </div>

      {/* Bookings List */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="font-bold text-lg mb-4">📋 הזמנות - {getViewTitle()}</h3>
        
        {view === 'next3' ? (
          // Grouped view for next 3 days
          <div className="space-y-4">
            {upcomingDays.map(day => (
              <div key={day.dateStr} className="border border-border rounded-lg overflow-hidden">
                <button
                  className="w-full p-4 bg-muted/30 flex justify-between items-center hover:bg-muted/50"
                  onClick={() => setExpandedDay(expandedDay === day.dateStr ? null : day.dateStr)}
                >
                  <div className="font-medium">
                    {day.date.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'short' })}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-primary font-bold">{day.totalRiders} רוכבים</span>
                    {expandedDay === day.dateStr ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>
                {expandedDay === day.dateStr && (
                  <div className="p-4 space-y-2">
                    {day.bookings.length === 0 ? (
                      <p className="text-muted-foreground text-center py-2">אין הזמנות</p>
                    ) : (
                      day.bookings.map(booking => (
                        <BookingCard key={booking.id} booking={booking} />
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          // Simple list for today/tomorrow
          <ScrollArea className="max-h-[400px]">
            {viewBookings.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">אין הזמנות 🏜️</p>
            ) : (
              <div className="space-y-3">
                {viewBookings.map(booking => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            )}
          </ScrollArea>
        )}
      </div>
    </div>
  );
}

function BookingCard({ booking }: { booking: Booking }) {
  return (
    <div className="p-4 bg-muted/50 rounded-lg flex justify-between items-center">
      <div>
        <div className="font-medium">{booking.riders[0]?.name || 'הזמנה'} #{booking.id.slice(-6)}</div>
        <div className="text-sm text-muted-foreground">
          {booking.riders.length} רוכבים | {booking.session === 'morning' ? '☀️ בוקר' : '🌅 יום מלא'}
          {booking.picnic && booking.picnic.quantity > 0 && ' | 🧺 פיקניק'}
        </div>
      </div>
      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
        booking.status === 'confirmed' ? 'bg-accent/20 text-accent' :
        booking.status === 'checked-in' ? 'bg-success/20 text-success' :
        booking.status === 'completed' ? 'bg-muted text-muted-foreground' :
        'bg-destructive/20 text-destructive'
      }`}>
        {booking.status === 'confirmed' ? 'מאושר ✅' :
         booking.status === 'checked-in' ? 'נכנס ✅' :
         booking.status === 'completed' ? 'הושלם ✅' : 'בוטל ❌'}
      </div>
    </div>
  );
}