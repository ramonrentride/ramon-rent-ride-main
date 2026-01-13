import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Home, Calendar, Users, Clock, Bike, XCircle, CheckCircle, 
  AlertTriangle, PartyPopper, Info, BookOpen, Phone, MapPin, 
  Shield, ExternalLink, Loader2, ChevronRight, User, ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';
import { useGetBookingsByContact, useCancelBookingPublic } from '@/hooks/useSupabaseData';
import { useSiteContent } from '@/hooks/useSiteContent';
import { getLocalizedValue, getLocalizedMeta } from '@/lib/cmsHelpers';
import heroImage from '@/assets/hero-crater.jpg';

interface FoundBooking {
  id: string;
  date: string;
  session: string;
  status: string;
  totalPrice: number;
  phone: string;
  email: string;
  riders: { id: string; name: string; height: number; assignedBike?: string; assignedSize?: string }[];
  picnic?: any;
  createdAt: string;
}

const GuestPage = () => {
  const { t, isRTL } = useI18n();
  const { toast } = useToast();
  
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [bookings, setBookings] = useState<FoundBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<FoundBooking | null>(null);
  const [showCancelled, setShowCancelled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const getBookingsMutation = useGetBookingsByContact();
  const cancelBookingMutation = useCancelBookingPublic();

  const handleLogin = async () => {
    if (!phoneOrEmail.trim()) {
      toast({
        title: isRTL ? '❌ נא להזין טלפון או אימייל' : '❌ Please enter phone or email',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await getBookingsMutation.mutateAsync(phoneOrEmail.trim());
      
      if (result && result.length > 0) {
        setBookings(result);
        setIsLoggedIn(true);
        setSelectedBooking(null);
        setShowCancelled(false);
      } else {
        toast({
          title: isRTL ? '❌ לא נמצאו הזמנות' : '❌ No bookings found',
          description: isRTL ? 'לא נמצאו הזמנות עם הטלפון/אימייל שהזנת' : 'No bookings found with this phone/email',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: isRTL ? '❌ שגיאה' : '❌ Error',
        description: isRTL ? 'נסה שוב מאוחר יותר' : 'Try again later',
        variant: 'destructive',
      });
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setBookings([]);
    setSelectedBooking(null);
    setPhoneOrEmail('');
    setShowCancelled(false);
  };

  const canCancelForFree = (booking: FoundBooking) => {
    const bookingDate = new Date(booking.date);
    const now = new Date();
    const hoursUntilBooking = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilBooking >= 24;
  };

  const cancelBooking = async () => {
    if (!selectedBooking) return;
    
    try {
      const success = await cancelBookingMutation.mutateAsync({ 
        bookingId: selectedBooking.id, 
        phone: selectedBooking.phone 
      });
      
      if (success) {
        setShowCancelled(true);
        setSelectedBooking(null);
        // Refresh bookings list
        const updatedBookings = bookings.map(b => 
          b.id === selectedBooking.id ? { ...b, status: 'cancelled' } : b
        );
        setBookings(updatedBookings);
        toast({
          title: isRTL ? '✅ ההזמנה בוטלה בהצלחה' : '✅ Booking cancelled successfully',
        });
      } else {
        toast({
          title: isRTL ? '❌ לא ניתן לבטל' : '❌ Cannot cancel',
          description: isRTL ? 'ההזמנה כבר בוטלה או הושלמה' : 'Booking already cancelled or completed',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: isRTL ? '❌ שגיאה בביטול' : '❌ Cancellation error',
        description: isRTL ? 'נסה שוב מאוחר יותר' : 'Try again later',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: JSX.Element; label: string }> = {
      pending: { 
        color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', 
        icon: <Clock className="w-3 h-3" />,
        label: isRTL ? 'ממתין' : 'Pending'
      },
      confirmed: { 
        color: 'bg-green-500/20 text-green-400 border-green-500/30', 
        icon: <CheckCircle className="w-3 h-3" />,
        label: isRTL ? 'מאושר' : 'Confirmed'
      },
      active: { 
        color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', 
        icon: <Bike className="w-3 h-3" />,
        label: isRTL ? 'פעיל' : 'Active'
      },
      completed: { 
        color: 'bg-primary/20 text-primary border-primary/30', 
        icon: <PartyPopper className="w-3 h-3" />,
        label: isRTL ? 'הושלם' : 'Completed'
      },
      cancelled: { 
        color: 'bg-red-500/20 text-red-400 border-red-500/30', 
        icon: <XCircle className="w-3 h-3" />,
        label: isRTL ? 'בוטל' : 'Cancelled'
      },
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge className={`${config.color} gap-1`}>
        {config.icon} {config.label}
      </Badge>
    );
  };

  // Fetch CMS data for quick links
  const { data: linksData } = useSiteContent('guestArea');

  // Icon mapping for CMS content
  const iconMap: Record<string, JSX.Element> = {
    BookOpen: <BookOpen className="w-5 h-5" />,
    MapPin: <MapPin className="w-5 h-5" />,
    Phone: <Phone className="w-5 h-5" />,
    Shield: <Shield className="w-5 h-5" />,
  };

  // Default quick links
  const defaultQuickLinks = [
    { 
      icon: <BookOpen className="w-5 h-5" />, 
      title: isRTL ? 'הוראות רכיבה' : 'Riding Instructions',
      description: isRTL ? 'טיפים לרכיבה בטוחה ותיקונים' : 'Safety tips and repairs',
      href: '/rider-info',
      internal: true
    },
    { 
      icon: <MapPin className="w-5 h-5" />, 
      title: isRTL ? 'מיקום איסוף' : 'Pickup Location',
      description: isRTL ? 'מצפה רמון, ליד מרכז המבקרים' : 'Mitzpe Ramon, near visitor center',
      href: 'https://maps.google.com/?q=30.6103,34.8024',
      internal: false
    },
    { 
      icon: <Phone className="w-5 h-5" />, 
      title: isRTL ? 'צור קשר' : 'Contact Us',
      description: '050-123-4567',
      href: 'tel:+972501234567',
      internal: false
    },
    { 
      icon: <Shield className="w-5 h-5" />, 
      title: isRTL ? 'ביטוח וכיסוי' : 'Insurance & Coverage',
      description: isRTL ? 'פרטי הכיסוי הביטוחי' : 'Insurance coverage details',
      href: '/terms-liability',
      internal: true
    },
  ];

  // Map CMS data or use defaults
  const quickLinks = linksData && linksData.length > 0
    ? linksData.filter(l => l.isActive).map(item => ({
        icon: iconMap[item.metadata?.icon] || <BookOpen className="w-5 h-5" />,
        title: getLocalizedValue(item, isRTL),
        description: getLocalizedMeta(item, 'description', isRTL),
        href: item.metadata?.href || '#',
        internal: item.metadata?.internal ?? false
      }))
    : defaultQuickLinks;

  const isLoading = getBookingsMutation.isPending;
  const isCancelling = cancelBookingMutation.isPending;

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `url(${heroImage})` }}
    >
      <div className="min-h-screen bg-gradient-to-b from-background/95 via-background/90 to-background/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Link to="/">
              <Button variant="outline" className="gap-2 bg-white/10 border-white/20 hover:bg-white/20">
                <Home className="w-4 h-4" />
                🏠 {isRTL ? 'דף הבית' : 'Home'}
              </Button>
            </Link>
            
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              🎫 {isRTL ? 'האזור האישי' : 'My Area'}
            </h1>

            {isLoggedIn && (
              <Button variant="ghost" onClick={handleLogout} className="gap-2 text-muted-foreground hover:text-foreground">
                {isRTL ? 'יציאה' : 'Logout'}
              </Button>
            )}
          </div>

          {/* Login Card - Show when not logged in */}
          {!isLoggedIn && (
            <Card className="glass-card border-white/10 mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <User className="w-5 h-5 text-primary" />
                  {isRTL ? 'כניסה לאזור האישי' : 'Login to My Area'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">
                    {isRTL ? 'טלפון או אימייל' : 'Phone or Email'}
                  </label>
                  <Input
                    placeholder={isRTL ? 'הכנס את הטלפון או האימייל שהזנת בהזמנה...' : 'Enter your phone or email from booking...'}
                    value={phoneOrEmail}
                    onChange={(e) => setPhoneOrEmail(e.target.value)}
                    className="bg-white/5 border-white/20"
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    dir="ltr"
                  />
                </div>
                <Button onClick={handleLogin} disabled={isLoading} className="w-full btn-hero gap-2">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <User className="w-4 h-4" />}
                  {isRTL ? 'כניסה' : 'Login'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Bookings List - Show when logged in and no booking selected */}
          {isLoggedIn && !selectedBooking && !showCancelled && (
            <Card className="glass-card border-white/10 mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  📋 {isRTL ? 'ההזמנות שלי' : 'My Bookings'} ({bookings.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    onClick={() => setSelectedBooking(booking)}
                    className="glass-card rounded-xl p-4 bg-white/5 hover:bg-white/10 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-foreground">{booking.date}</span>
                          {getStatusBadge(booking.status)}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {booking.session === 'morning' ? (isRTL ? 'בוקר' : 'Morning') : (isRTL ? 'יומי' : 'Daily')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {booking.riders.length} {isRTL ? 'רוכבים' : 'riders'}
                          </span>
                          <span className="font-medium text-primary">₪{booking.totalPrice}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Selected Booking Details */}
          {isLoggedIn && selectedBooking && !showCancelled && (
            <Card className="glass-card border-white/10 animate-fade-in mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedBooking(null)}
                      className="gap-1"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      {isRTL ? 'חזרה' : 'Back'}
                    </Button>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      🚴 {isRTL ? 'פרטי ההזמנה' : 'Booking Details'}
                    </CardTitle>
                  </div>
                  {getStatusBadge(selectedBooking.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Booking Info */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="glass-card rounded-xl p-4 bg-white/5">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Calendar className="w-4 h-4" />
                      {isRTL ? 'תאריך' : 'Date'}
                    </div>
                    <p className="text-lg font-semibold text-foreground">{selectedBooking.date}</p>
                  </div>
                  
                  <div className="glass-card rounded-xl p-4 bg-white/5">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Clock className="w-4 h-4" />
                      {isRTL ? 'משמרת' : 'Session'}
                    </div>
                    <p className="text-lg font-semibold text-foreground">
                      {selectedBooking.session === 'morning' 
                        ? (isRTL ? '🌅 בוקר (07:00-14:00)' : '🌅 Morning (07:00-14:00)')
                        : (isRTL ? '🌙 יומי (עד 07:00 למחרת)' : '🌙 Daily (until 07:00 next day)')}
                    </p>
                  </div>
                </div>

                {/* Riders */}
                <div className="glass-card rounded-xl p-4 bg-white/5">
                  <div className="flex items-center gap-2 text-muted-foreground mb-3">
                    <Users className="w-4 h-4" />
                    {isRTL ? 'רוכבים' : 'Riders'} ({selectedBooking.riders.length})
                  </div>
                  <div className="space-y-2">
                    {selectedBooking.riders.map((rider, idx) => (
                      <div key={rider.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <span className="font-medium text-foreground">
                          {idx + 1}. {rider.name}
                        </span>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>📏 {rider.height} ס"מ</span>
                          {rider.assignedBike && (
                            <Badge variant="outline" className="gap-1">
                              <Bike className="w-3 h-3" /> #{rider.assignedBike}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Picnic */}
                {selectedBooking.picnic && selectedBooking.picnic.items && selectedBooking.picnic.items.length > 0 && (
                  <div className="glass-card rounded-xl p-4 bg-accent/10 border border-accent/20">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🧺</span>
                      <div>
                        <p className="font-semibold text-foreground">
                          {isRTL ? 'פיקניק מדברי כלול' : 'Desert Picnic Included'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ₪{selectedBooking.picnic.totalPrice}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Price */}
                <div className="glass-card rounded-xl p-4 bg-primary/10 border border-primary/20">
                  <div className="flex items-center justify-between">
                    <span className="text-lg text-foreground">
                      💰 {isRTL ? 'סה"כ לתשלום' : 'Total Amount'}
                    </span>
                    <span className="text-2xl font-bold text-primary">₪{selectedBooking.totalPrice}</span>
                  </div>
                </div>

                {/* Dashboard Link for confirmed bookings */}
                {selectedBooking.status === 'confirmed' && (
                  <Link to={`/dashboard?booking=${selectedBooking.id}`} className="block">
                    <Button className="w-full btn-hero gap-2">
                      <Bike className="w-5 h-5" />
                      {isRTL ? 'לוח רוכב - המשך התהליך' : 'Rider Dashboard - Continue Process'}
                    </Button>
                  </Link>
                )}

                {/* Cancellation */}
                {selectedBooking.status !== 'cancelled' && selectedBooking.status !== 'completed' && (
                  <div className="border-t border-white/10 pt-6">
                    <div className={`glass-card rounded-xl p-4 mb-4 ${canCancelForFree(selectedBooking) ? 'bg-green-500/10 border border-green-500/20' : 'bg-yellow-500/10 border border-yellow-500/20'}`}>
                      <div className="flex items-start gap-3">
                        {canCancelForFree(selectedBooking) ? (
                          <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                        )}
                        <div>
                          <p className="font-semibold text-foreground">
                            {canCancelForFree(selectedBooking) 
                              ? (isRTL ? '✅ ביטול חינם זמין' : '✅ Free cancellation available')
                              : (isRTL ? '⚠️ ביטול עם עלות' : '⚠️ Cancellation with fee')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {isRTL 
                              ? 'ניתן לבטל ללא עלות עד 24 שעות לפני מועד ההשכרה'
                              : 'Free cancellation up to 24 hours before rental time'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      variant="destructive" 
                      onClick={cancelBooking}
                      disabled={isCancelling}
                      className="w-full gap-2"
                    >
                      {isCancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                      {isRTL ? 'בטל הזמנה' : 'Cancel Booking'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Cancellation Success */}
          {showCancelled && (
            <Card className="glass-card border-white/10 animate-fade-in text-center py-12 mb-8">
              <CardContent>
                <div className="text-6xl mb-6">✅</div>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  {isRTL ? 'ההזמנה בוטלה בהצלחה' : 'Booking Cancelled Successfully'}
                </h2>
                <p className="text-muted-foreground mb-8">
                  {isRTL 
                    ? 'מקווים לראותך בפעם הבאה! 🚴'
                    : 'Hope to see you next time! 🚴'}
                </p>
                <Button onClick={() => setShowCancelled(false)} className="btn-hero gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  {isRTL ? 'חזרה לרשימת ההזמנות' : 'Back to Bookings List'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Quick Links - General Info for Everyone */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              {isRTL ? 'מידע שימושי' : 'Useful Information'}
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              {quickLinks.map((link, index) => (
                link.internal ? (
                  <Link key={index} to={link.href}>
                    <Card className="glass-card border-white/10 hover:bg-white/10 transition-all cursor-pointer h-full">
                      <CardContent className="p-4 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                          {link.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{link.title}</h3>
                          <p className="text-sm text-muted-foreground">{link.description}</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      </CardContent>
                    </Card>
                  </Link>
                ) : (
                  <a key={index} href={link.href} target={link.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
                    <Card className="glass-card border-white/10 hover:bg-white/10 transition-all cursor-pointer h-full">
                      <CardContent className="p-4 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                          {link.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{link.title}</h3>
                          <p className="text-sm text-muted-foreground">{link.description}</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      </CardContent>
                    </Card>
                  </a>
                )
              ))}
            </div>
          </div>

          {/* Important Info Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <Card className="glass-card border-white/10">
              <CardContent className="p-4 text-center">
                <div className="text-3xl mb-2">🧢</div>
                <h3 className="font-semibold text-foreground mb-1">
                  {isRTL ? 'מה להביא' : 'What to Bring'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? 'קסדה, מים, קרם הגנה' : 'Helmet, water, sunscreen'}
                </p>
              </CardContent>
            </Card>
            
            <Card className="glass-card border-white/10">
              <CardContent className="p-4 text-center">
                <div className="text-3xl mb-2">⏰</div>
                <h3 className="font-semibold text-foreground mb-1">
                  {isRTL ? 'תזכורת' : 'Reminder'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? 'הגיעו 15 דקות לפני' : 'Arrive 15 minutes early'}
                </p>
              </CardContent>
            </Card>
            
            <Card className="glass-card border-white/10">
              <CardContent className="p-4 text-center">
                <div className="text-3xl mb-2">🔧</div>
                <h3 className="font-semibold text-foreground mb-1">
                  {isRTL ? 'בעיה באופניים?' : 'Bike Problem?'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? 'התקשרו מיד: 050-123-4567' : 'Call immediately: 050-123-4567'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Insurance Card */}
          <Card className="glass-card border-white/10 mb-8">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {isRTL ? 'ביטוח וכיסוי' : 'Insurance & Coverage'}
                  </h3>
                  <p className="text-muted-foreground mb-3">
                    {isRTL 
                      ? 'כל האופניים מבוטחים. במקרה של נזק או גניבה, יש להודיע מיידית. השתתפות עצמית: ₪500 לנזק, ₪2,500 לגניבה.'
                      : 'All bikes are insured. In case of damage or theft, notify immediately. Deductible: ₪500 for damage, ₪2,500 for theft.'}
                  </p>
                  <Link to="/terms-liability">
                    <Button variant="outline" size="sm" className="gap-2">
                      <BookOpen className="w-4 h-4" />
                      {isRTL ? 'קרא עוד' : 'Read More'}
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default GuestPage;
