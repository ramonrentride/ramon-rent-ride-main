import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { usePublicBikes, usePricing, useHeightRanges, useBookings } from '@/hooks/useSupabaseData';
import { useBikeAvailability } from '@/hooks/useBikeAvailability';
import { useBikeLocking } from '@/hooks/useBikeLocking';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { getStatusIcon } from '@/lib/bikeStatusIcons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Bike, Clock, Users, Phone, Mail, ChevronDown, ChevronUp, Lock, CheckCircle, Shield } from 'lucide-react';
import { toast } from 'sonner';
import type { SessionType, Rider, BikeSize } from '@/lib/types';

const QrBookingPage = () => {
  const navigate = useNavigate();
  const { data: bikes = [] } = usePublicBikes();
  const { data: bookings = [] } = useBookings();
  const { data: heightRanges = [] } = useHeightRanges();
  const { data: pricing } = usePricing();
  const { getAvailableBikes, findBestBike, getAvailabilityBySize } = useBikeAvailability();
  const { lockBikes, releaseAllLocks, sessionId } = useBikeLocking();
  const { securityDeposit, getBaseUrl } = useSystemConfig();

  // Current date/time - always NOW
  const [now] = useState(new Date());
  const currentDate = format(now, 'yyyy-MM-dd');
  const currentHour = now.getHours();
  
  // Auto-select session based on time - QR bookings use 'morning' or 'daily' (valid SessionType)
  const autoSession: SessionType = currentHour < 14 ? 'morning' : 'daily';
  
  // Form state
  const [riderCount, setRiderCount] = useState(1);
  const [riders, setRiders] = useState<Rider[]>([{ id: crypto.randomUUID(), name: '', height: 160 }]);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [assignedBikes, setAssignedBikes] = useState<Array<{ id: number; lockCode: string; size: string }>>([]);
  const [expandedRider, setExpandedRider] = useState<number | null>(0);
  
  // Phone verification state
  const [phoneVerificationRequired, setPhoneVerificationRequired] = useState(false);
  const [verificationPhone, setVerificationPhone] = useState('');
  const [storedBookingPhone, setStoredBookingPhone] = useState('');

  // Get available bikes for current session
  const availableBikes = useMemo(() => {
    return getAvailableBikes(currentDate, autoSession);
  }, [currentDate, autoSession, getAvailableBikes, bikes, bookings]);

  const availabilityBySize = useMemo(() => {
    return getAvailabilityBySize(currentDate, autoSession);
  }, [currentDate, autoSession, getAvailabilityBySize]);

  // Calculate price
  const pricePerBike = autoSession === 'morning' ? (pricing?.morningSession || 80) : (pricing?.dailySession || 120);
  const totalPrice = riderCount * pricePerBike;

  // Update riders array when count changes
  useEffect(() => {
    setRiders(prev => {
      if (riderCount > prev.length) {
        const newRiders: Rider[] = Array(riderCount - prev.length).fill(null).map(() => ({ 
          id: crypto.randomUUID(), 
          name: '', 
          height: 160 
        }));
        return [...prev, ...newRiders];
      }
      return prev.slice(0, riderCount);
    });
  }, [riderCount]);

  // Real-time subscription for bike changes
  useEffect(() => {
    const channel = supabase
      .channel('qr-bikes-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bikes' },
        () => {
          // Bikes updated - the hook will refetch
          console.log('Bikes updated in real-time');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Cleanup locks on unmount
  useEffect(() => {
    return () => {
      releaseAllLocks();
    };
  }, [releaseAllLocks]);

  const handleRiderChange = (index: number, field: keyof Rider, value: string | number) => {
    setRiders(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handlePhoneVerification = () => {
    // Remove dashes/spaces for comparison
    const normalizedInput = verificationPhone.replace(/[-\s]/g, '').trim();
    const normalizedStored = storedBookingPhone.replace(/[-\s]/g, '').trim();
    
    if (normalizedInput === normalizedStored) {
      setPhoneVerificationRequired(false);
      toast.success('✅ אימות הצליח!');
    } else {
      toast.error('❌ מספר טלפון לא תואם. נסה שוב.');
    }
  };

  const handleSubmit = async () => {
    // Validate
    if (!phone || !email) {
      toast.error('נא למלא טלפון ואימייל');
      return;
    }

    const invalidRiders = riders.some(r => !r.name || !r.height);
    if (invalidRiders) {
      toast.error('נא למלא שם וגובה לכל רוכב');
      return;
    }

    if (availableBikes.length < riderCount) {
      toast.error('אין מספיק אופניים זמינים');
      return;
    }

    setIsSubmitting(true);

    try {
      // Find best bikes for each rider
      const bikesToAssign: number[] = [];
      const assignedBikesInfo: typeof assignedBikes = [];
      
      for (const rider of riders) {
        const bike = findBestBike(rider.height!, currentDate, autoSession, bikesToAssign);
        if (!bike) {
          throw new Error(`לא נמצא אופניים מתאימים לגובה ${rider.height}ס"מ`);
        }
        bikesToAssign.push(bike.id);
        assignedBikesInfo.push({
          id: bike.id,
          lockCode: bike.lockCode,
          size: bike.size,
        });
      }

      // Lock all bikes atomically
      const locked = await lockBikes(bikesToAssign);
      if (!locked) {
        throw new Error('האופניים כבר תפוסים, נסה שוב');
      }

      // Convert riders to plain objects for JSON serialization
      const ridersForDb = riders.map((r, i) => ({
        id: r.id,
        name: r.name,
        height: r.height,
        assignedBike: bikesToAssign[i],
        assignedSize: assignedBikesInfo[i].size as BikeSize,
      }));

      // Create booking
      const { data: bookingId, error } = await supabase.rpc('create_booking_public', {
        _date: currentDate,
        _session: autoSession,
        _riders: ridersForDb as unknown as any,
        _picnic: null,
        _status: 'confirmed',
        _total_price: totalPrice,
        _security_hold: securityDeposit,
        _phone: phone,
        _email: email,
        _legal_accepted: true,
        _payment_method: 'qr',
        _coupon_code: null,
      });

      if (error) throw error;

      // Update bikes to rented status
      for (const bikeId of bikesToAssign) {
        await supabase
          .from('bikes')
          .update({ status: 'rented' })
          .eq('id', bikeId);
      }

      // Store phone and require verification before showing codes
      setStoredBookingPhone(phone);
      setAssignedBikes(assignedBikesInfo);
      setBookingComplete(true);
      setPhoneVerificationRequired(true);
      toast.success('ההזמנה הושלמה בהצלחה! נא להזין את הטלפון שלך כדי לראות את קודי המנעול');

    } catch (error: any) {
      console.error('Booking error:', error);
      
      // More specific error messages
      let errorMessage = 'שגיאה ביצירת ההזמנה';
      
      if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        errorMessage = 'בעיית חיבור לאינטרנט. נסה שוב בעוד רגע.';
      } else if (error?.message?.includes('rate limit')) {
        errorMessage = 'יותר מדי ניסיונות. נסה שוב בעוד כמה דקות.';
      } else if (error?.message?.includes('available')) {
        errorMessage = 'האופניים כבר תפוסים. נסה לבחור תאריך או שעה אחרת.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      await releaseAllLocks();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Phone verification screen (before showing codes)
  if (bookingComplete && phoneVerificationRequired) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4" dir="rtl">
        <div className="max-w-md mx-auto space-y-6">
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-2xl text-green-800">ההזמנה הושלמה! 🎉</CardTitle>
              <CardDescription className="text-green-700">
                נא להזין את מספר הטלפון שלך כדי לראות את קודי המנעול
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">אבטחה</p>
                  <p>אנו דורשים אימות טלפון כדי להגן על קודי המנעול שלך</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  מספר טלפון
                </Label>
                <Input
                  type="tel"
                  value={verificationPhone}
                  onChange={(e) => setVerificationPhone(e.target.value)}
                  placeholder="050-1234567"
                  dir="ltr"
                  className="text-left text-lg"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && verificationPhone) {
                      handlePhoneVerification();
                    }
                  }}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground text-center">
                  הזן את מספר הטלפון שהזנת בהזמנה
                </p>
              </div>
              
              <Button 
                onClick={handlePhoneVerification} 
                className="w-full h-12 text-lg"
                disabled={!verificationPhone.trim()}
                size="lg"
              >
                <Shield className="mr-2 h-5 w-5" />
                אשר וצפה בקודים
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/guest')}
              >
                מעבר לאזור האישי
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Success screen with lock codes (only after verification)
  if (bookingComplete && assignedBikes.length > 0 && !phoneVerificationRequired) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4" dir="rtl">
        <div className="max-w-md mx-auto space-y-6">
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-2xl text-green-800">ההזמנה הושלמה!</CardTitle>
              <CardDescription className="text-green-700">
                הנה קודי המנעול שלכם
              </CardDescription>
            </CardHeader>
          </Card>

          {assignedBikes.map((bike, index) => (
            <Card key={bike.id} className="border-2 border-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Bike className="h-5 w-5" />
                    {riders[index]?.name || `רוכב ${index + 1}`}
                  </CardTitle>
                  <Badge variant="outline">מידה {bike.size}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-primary/10 rounded-xl p-6 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Lock className="h-6 w-6 text-primary" />
                    <span className="text-sm text-muted-foreground">קוד מנעול</span>
                  </div>
                  <div className="text-5xl font-mono font-bold tracking-widest text-primary">
                    {bike.lockCode}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">סה"כ לתשלום: ₪{totalPrice}</p>
                <p className="text-sm text-muted-foreground">+ פיקדון ₪{securityDeposit}</p>
              </div>
            </CardContent>
          </Card>

          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => navigate('/')}
          >
            חזרה לדף הבית
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white p-4" dir="rtl">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header with current time */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 text-primary mb-2">
              <Bike className="h-8 w-8" />
              <span className="text-2xl font-bold">⚡ השכרה מהירה</span>
            </div>
            <CardDescription className="text-lg">
              {format(now, 'EEEE, d בMMMM yyyy', { locale: he })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>משמרת: {autoSession === 'morning' ? 'בוקר' : 'יום שלם'}</span>
              </div>
              <Badge variant={availableBikes.length > 3 ? 'default' : 'destructive'}>
                {availableBikes.length} אופניים זמינים
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Availability by size */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">זמינות לפי מידה</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {availabilityBySize.map(({ size, available, minHeight, maxHeight }) => (
                <div 
                  key={size} 
                  className={`p-2 rounded-lg text-center ${available > 0 ? 'bg-green-100' : 'bg-gray-100'}`}
                >
                  <div className="font-bold">{size}</div>
                  <div className="text-xs text-muted-foreground">
                    {minHeight}-{maxHeight} ס"מ
                  </div>
                  <div className={`text-sm ${available > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {available > 0 ? `${getStatusIcon('available')} ${available}` : getStatusIcon('rented')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Rider count */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              מספר רוכבים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setRiderCount(Math.max(1, riderCount - 1))}
                disabled={riderCount <= 1}
              >
                -
              </Button>
              <span className="text-3xl font-bold w-12 text-center">{riderCount}</span>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setRiderCount(Math.min(availableBikes.length, riderCount + 1))}
                disabled={riderCount >= availableBikes.length}
              >
                +
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Riders details */}
        <Card>
          <CardHeader>
            <CardTitle>פרטי רוכבים</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {riders.map((rider, index) => (
              <div key={rider.id} className="border rounded-lg overflow-hidden">
                <button
                  className="w-full p-3 flex items-center justify-between bg-muted/50 hover:bg-muted transition-colors"
                  onClick={() => setExpandedRider(expandedRider === index ? null : index)}
                >
                  <span className="font-medium">
                    רוכב {index + 1}: {rider.name || '(לא הוזן)'}
                  </span>
                  {expandedRider === index ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                
                {expandedRider === index && (
                  <div className="p-4 space-y-4">
                    <div className="space-y-2">
                      <Label>שם</Label>
                      <Input
                        value={rider.name}
                        onChange={(e) => handleRiderChange(index, 'name', e.target.value)}
                        placeholder="שם הרוכב"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>גובה (ס"מ): {rider.height}</Label>
                      <Input
                        type="range"
                        min={120}
                        max={210}
                        value={rider.height}
                        onChange={(e) => handleRiderChange(index, 'height', parseInt(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>120</span>
                        <span>165</span>
                        <span>210</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Contact details */}
        <Card>
          <CardHeader>
            <CardTitle>פרטי יצירת קשר</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                טלפון
              </Label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="050-1234567"
                dir="ltr"
                className="text-left"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                אימייל
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                dir="ltr"
                className="text-left"
              />
            </div>
          </CardContent>
        </Card>

        {/* Price summary */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2 text-center">
              <div className="text-2xl font-bold">₪{totalPrice}</div>
              <div className="text-sm text-muted-foreground">
                {riderCount} × ₪{pricePerBike} + פיקדון ₪{securityDeposit}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit button */}
        <Button
          size="lg"
          className="w-full h-14 text-lg"
          onClick={handleSubmit}
          disabled={isSubmitting || availableBikes.length < riderCount}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              מעבד...
            </>
          ) : (
            <>
              <Lock className="mr-2 h-5 w-5" />
              אשר והמשך לתשלום
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default QrBookingPage;
