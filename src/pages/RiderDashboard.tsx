import { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/lib/store';
import { useSystemContent } from '@/hooks/useSystemContent';
import {
  Shield,
  Bike,
  MapPin,
  Phone,
  Camera,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Lock,
  Send,
  Home,
  Gift,
  Sparkles,
  Heart,
  PartyPopper
} from 'lucide-react';

export default function RiderDashboard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { bookings, bikes, updateBooking, createCoupon } = useAppStore();
  const { getSafetyItems, getStepNames, getMessage } = useSystemContent();
  
  const bookingId = searchParams.get('booking');
  const booking = bookings.find(b => b.id === bookingId);
  
  // Get CMS content with RTL (Hebrew)
  const safetyItemTexts = getSafetyItems(true);
  const DASHBOARD_STEPS = getStepNames(true);

  const [currentStep, setCurrentStep] = useState(0);
  const [safetyChecks, setSafetyChecks] = useState<boolean[]>(Array(safetyItemTexts.length).fill(false));
  const [bikeConfirmed, setBikeConfirmed] = useState(false);
  const [returnPhoto, setReturnPhoto] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [generatedCoupon, setGeneratedCoupon] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset safety checks when safety items change
  useEffect(() => {
    setSafetyChecks(Array(safetyItemTexts.length).fill(false));
  }, [safetyItemTexts.length]);

  useEffect(() => {
    if (booking) {
      if (booking.status === 'completed') {
        setCurrentStep(4);
        setGeneratedCoupon(booking.couponCode || null);
      } else if (booking.safetyBriefingCompleted && booking.bikeConditionConfirmed) {
        setCurrentStep(3);
      } else if (booking.safetyBriefingCompleted) {
        setCurrentStep(1);
      }
    }
  }, [booking]);

  const handleSafetyCheck = (index: number) => {
    const newChecks = [...safetyChecks];
    newChecks[index] = !newChecks[index];
    setSafetyChecks(newChecks);
  };

  const completeSafety = () => {
    if (safetyChecks.every(c => c)) {
      updateBooking(bookingId!, { safetyBriefingCompleted: true });
      setCurrentStep(1);
      toast({ title: getMessage('safety_complete', 'תדריך הבטיחות הושלם ✅') });
    } else {
      toast({ 
        title: getMessage('safety_incomplete', 'יש לאשר את כל הסעיפים'), 
        variant: 'destructive' 
      });
    }
  };

  const confirmBikeCondition = () => {
    updateBooking(bookingId!, { bikeConditionConfirmed: true });
    setBikeConfirmed(true);
    setCurrentStep(3);
    toast({ title: getMessage('bike_confirmed', 'מצב האופניים אושר ✅') });
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          toast({ title: getMessage('location_received', 'המיקום נקלט בהצלחה! 📍') });
        },
        () => {
          toast({ title: getMessage('location_error', 'לא ניתן לקבל מיקום'), variant: 'destructive' });
        }
      );
    }
  };

  const sendSOS = () => {
    getLocation();
    toast({
      title: getMessage('sos_sent', 'SOS נשלח! 🆘'),
      description: location 
        ? `המיקום שלך: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
        : getMessage('sos_location_sent', 'המיקום נשלח לצוות החירום'),
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setReturnPhoto(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const completeReturn = () => {
    if (!returnPhoto) {
      toast({ title: getMessage('photo_required', 'יש לצלם את האופניים נעולים'), variant: 'destructive' });
      return;
    }

    // Generate coupon
    const couponCode = createCoupon(bookingId!);
    setGeneratedCoupon(couponCode);

    updateBooking(bookingId!, { 
      status: 'completed',
      returnPhotos: [returnPhoto],
      couponCode: couponCode
    });

    toast({
      title: getMessage('return_complete', 'ההחזרה הושלמה! 🎉'),
      description: getMessage('return_thanks', 'תודה שרכבתם איתנו!'),
    });

    setCurrentStep(4);
  };

  const goBack = () => {
    if (currentStep > 0 && currentStep < 4) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/20 to-background flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-warning mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">לא נמצאה הזמנה</h1>
          <p className="text-muted-foreground mb-6">אנא בדקו את הקישור או צרו קשר</p>
          <Link to="/">
            <Button className="gap-2">
              <Home className="w-4 h-4" />
              חזרה לדף הבית
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const assignedBikes = booking.riders
    .filter(r => r.assignedBike)
    .map(r => bikes.find(b => b.id === r.assignedBike))
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 via-accent/5 to-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Home Button */}
        <div className="mb-4">
          <Link to="/">
            <Button variant="ghost" className="gap-2">
              <Home className="w-5 h-5" />
              דף הבית
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">לוח רוכב</h1>
          <p className="text-muted-foreground">
            הזמנה #{booking.id.slice(-6)} | {new Date(booking.date).toLocaleDateString('he-IL')}
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between mb-8 px-2">
          {DASHBOARD_STEPS.map((stepName, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                index < currentStep 
                  ? 'bg-success text-success-foreground' 
                  : index === currentStep 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
              }`}>
                {index < currentStep ? <CheckCircle className="w-5 h-5" /> : index + 1}
              </div>
              <span className="text-xs mt-1 text-muted-foreground">{stepName}</span>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="glass-card rounded-2xl p-6 mb-6 animate-fade-in">
          
          {/* Step 0: Safety Briefing */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold">תדריך בטיחות</h2>
              </div>

              <p className="text-muted-foreground">
                לפני שתקבלו את קודי המנעול, יש לאשר שקראתם והבנתם את כללי הבטיחות:
              </p>

              <div className="space-y-3">
                {safetyItemTexts.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSafetyCheck(index)}
                    className={`w-full p-4 rounded-xl border-2 text-right flex items-center gap-3 transition-all ${
                      safetyChecks[index]
                        ? 'border-success bg-success/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      safetyChecks[index] ? 'bg-success text-success-foreground' : 'bg-muted'
                    }`}>
                      {safetyChecks[index] && <CheckCircle className="w-4 h-4" />}
                    </div>
                    <span className="font-medium">{item}</span>
                  </button>
                ))}
              </div>

              <Button 
                onClick={completeSafety}
                className="w-full btn-hero gap-2"
                disabled={!safetyChecks.every(c => c)}
              >
                <Sparkles className="w-5 h-5" />
                אישור והמשך
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </div>
          )}

          {/* Step 1: Codes (moved before condition) */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold">קודי מנעול</h2>
              </div>

              <div className="p-4 bg-accent/10 border border-accent/30 rounded-xl text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  🔍 בדקו שמספר המדבקה על האופניים תואם!
                </p>
              </div>

              <div className="space-y-4">
                {assignedBikes.map((bike, index) => (
                  <div key={bike!.id} className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl border border-primary/20">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-medium">{booking.riders[index]?.name}</span>
                      <span className="text-sm text-muted-foreground">מדבקה #{bike!.stickerNumber}</span>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">קוד מנעול</p>
                      <div className="text-4xl font-mono font-bold text-primary tracking-widest">
                        {bike!.lockCode}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={goBack}
                  className="flex-1 gap-2"
                >
                  <ChevronRight className="w-5 h-5" />
                  חזרה
                </Button>
                <Button 
                  onClick={() => setCurrentStep(2)}
                  className="flex-1 btn-hero gap-2"
                >
                  <Bike className="w-5 h-5" />
                  המשך לאישור
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Bike Condition (moved after codes) */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Bike className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold">אישור מצב אופניים</h2>
              </div>

              <div className="p-4 bg-warning/10 border border-warning/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">בדקו לפני היציאה:</p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>• האם הצמיגים מנופחים?</li>
                      <li>• האם הבלמים עובדים?</li>
                      <li>• האם הקסדה מתאימה?</li>
                      <li>• האם יש פגמים נראים?</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-xl">
                <p className="font-medium mb-2">האופניים שהוקצו לכם:</p>
                {assignedBikes.map((bike, index) => (
                  <div key={bike!.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span>רוכב {index + 1}: {booking.riders[index]?.name}</span>
                    <span className="font-mono bg-primary/10 px-3 py-1 rounded-lg">
                      מדבקה #{bike!.stickerNumber} | מידה {bike!.size}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={goBack}
                  className="flex-1 gap-2"
                >
                  <ChevronRight className="w-5 h-5" />
                  חזרה
                </Button>
                <Button 
                  onClick={confirmBikeCondition}
                  className="flex-1 btn-hero gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  אישרתי - יוצאים!
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Return */}
          {currentStep === 3 && !returnPhoto && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="text-6xl mb-4 animate-float">🚴</div>
                <h2 className="text-2xl font-bold text-foreground mb-2">רכיבה נעימה!</h2>
                <p className="text-muted-foreground">
                  תהנו מהמכתש. כשתסיימו, לחצו על "סיום רכיבה"
                </p>
              </div>

              {/* SOS Button */}
              <button
                onClick={sendSOS}
                className="w-full p-6 bg-destructive/10 border-2 border-destructive rounded-xl flex items-center justify-center gap-3 hover:bg-destructive/20 transition-all"
              >
                <Phone className="w-8 h-8 text-destructive" />
                <div className="text-right">
                  <div className="font-bold text-destructive text-lg">כפתור חירום SOS</div>
                  <div className="text-sm text-destructive/80">שולח מיקום לצוות החילוץ</div>
                </div>
              </button>

              {location && (
                <div className="p-4 bg-muted/50 rounded-xl text-center">
                  <MapPin className="w-5 h-5 mx-auto mb-2 text-accent" />
                  <p className="text-sm font-mono">
                    {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={goBack}
                  className="flex-1 gap-2"
                >
                  <ChevronRight className="w-5 h-5" />
                  חזרה
                </Button>
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 btn-accent gap-2"
                >
                  <Camera className="w-5 h-5" />
                  סיום - צלמו
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>
          )}

          {/* Step 3b: Return Photo */}
          {currentStep === 3 && returnPhoto && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Camera className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold">אישור החזרה</h2>
              </div>

              <div className="relative rounded-xl overflow-hidden">
                <img src={returnPhoto} alt="Return photo" className="w-full" />
                <button
                  onClick={() => setReturnPhoto(null)}
                  className="absolute top-2 left-2 bg-background/80 p-2 rounded-full"
                >
                  צלם שוב
                </button>
              </div>

              <Button 
                onClick={completeReturn}
                className="w-full btn-hero gap-2"
              >
                <Send className="w-5 h-5" />
                אשר החזרה וקבל קופון
              </Button>
            </div>
          )}

          {/* Step 4: Thank You */}
          {currentStep === 4 && (
            <div className="text-center py-8 space-y-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-success/30 to-primary/30 rounded-full flex items-center justify-center mx-auto animate-pulse">
                  <PartyPopper className="w-12 h-12 text-success" />
                </div>
                <div className="absolute -top-2 -right-2 text-4xl animate-bounce">🎉</div>
                <div className="absolute -bottom-2 -left-2 text-3xl animate-bounce delay-100">🚴</div>
              </div>
              
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-2">תודה רבה!</h2>
                <p className="text-lg text-muted-foreground">
                  היה לנו כיף לארח אתכם במכתש רמון
                </p>
              </div>

              <div className="p-6 bg-gradient-to-br from-success/20 to-primary/20 border-2 border-success/40 rounded-2xl">
                <Gift className="w-10 h-10 text-success mx-auto mb-3" />
                <p className="font-bold text-lg mb-2">🎁 מתנה מאיתנו!</p>
                <p className="text-muted-foreground mb-4">קופון 5% הנחה לרכיבה הבאה:</p>
                <div className="bg-background/80 rounded-xl p-4 border-2 border-dashed border-primary">
                  <p className="text-2xl font-mono font-bold text-primary tracking-wider">
                    {generatedCoupon || booking.couponCode || 'RAMON5-XXXXX'}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  📱 הקופון נשלח גם לוואטסאפ שלכם
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <div className="p-4 bg-muted/50 rounded-xl">
                  <Heart className="w-6 h-6 text-destructive mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    העיכבון הבטחוני יוחזר תוך 48 שעות
                  </p>
                </div>

                <Link to="/" className="w-full">
                  <Button className="w-full btn-hero gap-2">
                    <Home className="w-5 h-5" />
                    חזרה לדף הבית
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {currentStep === 3 && !returnPhoto && (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={getLocation}
              className="p-4 glass-card rounded-xl flex flex-col items-center gap-2 hover:bg-muted/50 transition-all"
            >
              <MapPin className="w-6 h-6 text-accent" />
              <span className="text-sm font-medium">מיקום נוכחי</span>
            </button>
            <a
              href="tel:0501234567"
              className="p-4 glass-card rounded-xl flex flex-col items-center gap-2 hover:bg-muted/50 transition-all"
            >
              <Phone className="w-6 h-6 text-primary" />
              <span className="text-sm font-medium">התקשרו אלינו</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
