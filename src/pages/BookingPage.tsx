import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { usePublicBikes, useAddBooking, useValidateCoupon, useMarkCouponUsed, usePricing, useHeightRanges, usePicnicMenu, useRealtimeSubscription, usePublicAvailability } from '@/hooks/useSupabaseData';
import { useSessionSettings, isSessionEnabled } from '@/hooks/useSessionSettings';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useWaiverText } from '@/hooks/useWaiverText';
import { supabase } from '@/integrations/supabase/client';
import { useAuditActions } from '@/hooks/useAuditLog';
import { useBikeAvailability } from '@/hooks/useBikeAvailability';
import { useI18n } from '@/lib/i18n';
import { isSessionAvailableForDate, getAvailableSessionsForDate } from '@/lib/sessionValidation';
import { InsurancePolicyDialog } from '@/components/InsurancePolicyDialog';
import { RiderSignatures, type RiderSignatureData } from '@/components/RiderSignatures';
import ReactMarkdown from 'react-markdown';
import type { Rider, SessionType, PicnicOrder, Booking, PicnicOrderItem, PicnicMenuItem } from '@/lib/types';
import { validatePhone, validateEmail, validateRiderName, validateDietaryNotes, sanitizeText } from '@/lib/validation';
import { format, startOfToday, addDays, addMonths, isBefore, isAfter } from 'date-fns';
import { he } from 'date-fns/locale';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import {
  Calendar,
  Clock,
  Users,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ShoppingBag,
  Shield,
  FileText,
  CreditCard,
  Check,
  Home,
  Sparkles,
  Sun,
  MessageCircle,
  AlertTriangle,
  Tag,
  X,
  Loader2,
  CalendarDays
} from 'lucide-react';

const MIN_HEIGHT = 120;
const MAX_HEIGHT = 210;

// Generate height options
const heightOptions = Array.from({ length: (MAX_HEIGHT - MIN_HEIGHT) / 5 + 1 }, (_, i) => MIN_HEIGHT + i * 5);

export default function BookingPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, isRTL } = useI18n();

  // Supabase data hooks
  const { data: bikes = [] } = usePublicBikes();
  const { data: pricing } = usePricing();
  const { data: heightRanges = [] } = useHeightRanges();
  const { data: picnicMenuItems = [] } = usePicnicMenu();
  const { data: sessionSettings } = useSessionSettings();
  const { data: paymentMethods = [] } = usePaymentMethods();
  const { waiverText, waiverVersion, isLoading: waiverLoading } = useWaiverText();
  const addBookingMutation = useAddBooking();
  const validateCouponMutation = useValidateCoupon();
  const markCouponUsedMutation = useMarkCouponUsed();
  const auditActions = useAuditActions();

  // Public availability from server (realtime updates)
  const startDate = useMemo(() => format(startOfToday(), 'yyyy-MM-dd'), []);
  const endDate = useMemo(() => format(addMonths(new Date(), 3), 'yyyy-MM-dd'), []);
  const { data: publicAvailability = [] } = usePublicAvailability(startDate, endDate);

  // Enable realtime subscriptions
  useRealtimeSubscription('pricing');
  useRealtimeSubscription('bikes');
  useRealtimeSubscription('picnic_menu');

  // Convert public availability to a lookup map
  const availabilityMap = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    publicAvailability.forEach(({ bookingDate, sessionType, bookedCount }) => {
      if (!map[bookingDate]) map[bookingDate] = {};
      map[bookingDate][sessionType] = bookedCount;
    });
    return map;
  }, [publicAvailability]);

  // Public availability check using server data
  const checkPublicAvailability = useCallback((date: string, session: string, requestedBikes: number) => {
    const TOTAL_BIKES = 12; // Online capacity cap
    const dateData = availabilityMap[date] || {};

    // Calculate booked count based on session overlap logic
    let bookedCount = dateData[session] || 0;

    // Check yesterday's daily (bikes not returned yet)
    const yesterday = format(addDays(new Date(date), -1), 'yyyy-MM-dd');
    const yesterdayData = availabilityMap[yesterday] || {};
    if (yesterdayData['daily']) {
      bookedCount += yesterdayData['daily'];
    }

    // If morning session, daily also blocks
    if (session === 'morning' && dateData['daily']) {
      bookedCount += dateData['daily'];
    }

    // If daily session, morning also blocks
    if (session === 'daily' && dateData['morning']) {
      bookedCount += dateData['morning'];
    }

    const remainingBikes = Math.max(0, TOTAL_BIKES - bookedCount);
    return {
      available: requestedBikes <= remainingBikes,
      remainingBikes,
    };
  }, [availabilityMap]);

  // Availability utilities (bikes only, no bookings needed for customer view)
  const { findBestBike, getSizeForHeight, getTotalActiveBikes, getAvailabilityBySize } = useBikeAvailability(bikes, [], heightRanges);

  // Default pricing fallback
  const pricingData = pricing || {
    morningSession: 80,
    dailySession: 120,
    picnic: 160,
    lateFee: 120,
    theftFee: 2500,
    securityHold: 500,
  };

  const { data: picnicSettings } = useSessionSettings();

  // Check if picnic is enabled in settings (default to true if setting missing)
  const isPicnicEnabled = useMemo(() => isSessionEnabled(picnicSettings, 'picnic'), [picnicSettings]);

  const STEPS = [
    t('dateAndSession'),
    t('riders'),
    ...(isPicnicEnabled ? [t('picnic')] : []), // Conditionally include Picnic step
    t('legalAgreement'),
    t('payment')
  ];

  const [step, setStep] = useState(0);
  const [date, setDate] = useState('');
  const [session, setSession] = useState<SessionType>('morning');
  const [riders, setRiders] = useState<Rider[]>([{ id: '1', name: '', height: 0 }]);
  const [picnic, setPicnic] = useState<PicnicOrder>({
    quantity: 0,
    dietaryNotes: '',
    isVegan: false,
    isGlutenFree: false,
    items: []
  });
  // Per-rider picnic selection: { riderId: { itemId: quantity } }
  const [riderPicnicOrders, setRiderPicnicOrders] = useState<Record<string, Record<string, number>>>({});
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [legalScrolled, setLegalScrolled] = useState(false);
  const [insuranceAccepted, setInsuranceAccepted] = useState(false);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [bookingSubmitted, setBookingSubmitted] = useState(false);
  const [submittedBookingId, setSubmittedBookingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Collapsible rider panels state
  const [openRiders, setOpenRiders] = useState<Record<string, boolean>>({ '1': true });

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; discountType: 'percent' | 'fixed' } | null>(null);
  const [couponError, setCouponError] = useState('');

  // Insurance dialog state
  const [insuranceDialogOpen, setInsuranceDialogOpen] = useState(false);

  // Per-rider signatures state
  const [riderSignatures, setRiderSignatures] = useState<RiderSignatureData[]>([]);

  // Auto-switch session if selected session is disabled
  useEffect(() => {
    if (!sessionSettings) return;

    const morningEnabled = isSessionEnabled(sessionSettings, 'morning', date || undefined);
    const dailyEnabled = isSessionEnabled(sessionSettings, 'daily', date || undefined);

    // If current session is disabled, switch to the available one
    if (session === 'daily' && !dailyEnabled && morningEnabled) {
      setSession('morning');
    }
    if (session === 'morning' && !morningEnabled && dailyEnabled) {
      setSession('daily');
    }
  }, [sessionSettings, date, session]);

  const canShowPicnic = () => {
    if (!isPicnicEnabled) return false;
    if (!date) return false;
    const bookingDate = new Date(date);
    const now = new Date();
    const hoursUntil = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntil >= 12;
  };

  // Calculate total for individual picnic items (across all riders)
  const calculatePicnicItemsTotal = () => {
    let total = 0;
    for (const riderId of Object.keys(riderPicnicOrders)) {
      const riderItems = riderPicnicOrders[riderId];
      for (const [itemId, qty] of Object.entries(riderItems)) {
        const item = picnicMenuItems.find(m => m.id === itemId);
        total += item ? item.price * qty : 0;
      }
    }
    return total;
  };

  const calculateTotal = () => {
    const sessionPrice = session === 'morning' ? pricingData.morningSession : pricingData.dailySession;
    const ridersTotal = riders.length * sessionPrice;
    const picnicTotal = calculatePicnicItemsTotal();
    const subtotal = ridersTotal + picnicTotal;

    if (appliedCoupon) {
      if (appliedCoupon.discountType === 'percent') {
        return subtotal - (subtotal * appliedCoupon.discount / 100);
      } else {
        return Math.max(0, subtotal - appliedCoupon.discount);
      }
    }

    return subtotal;
  };

  const calculateSubtotal = () => {
    const sessionPrice = session === 'morning' ? pricingData.morningSession : pricingData.dailySession;
    const ridersTotal = riders.length * sessionPrice;
    const picnicTotal = calculatePicnicItemsTotal();
    return ridersTotal + picnicTotal;
  };

  const updateRiderPicnicItemQuantity = (riderId: string, itemId: string, delta: number) => {
    setRiderPicnicOrders(prev => {
      const riderItems = { ...(prev[riderId] || {}) };
      const current = riderItems[itemId] || 0;
      const newQty = Math.max(0, current + delta);

      if (newQty === 0) {
        delete riderItems[itemId];
      } else {
        riderItems[itemId] = newQty;
      }

      // If rider has no items, remove rider entry
      if (Object.keys(riderItems).length === 0) {
        const { [riderId]: _, ...rest } = prev;
        return rest;
      }

      return { ...prev, [riderId]: riderItems };
    });
  };

  const getTotalPicnicItems = () => {
    let total = 0;
    for (const riderId of Object.keys(riderPicnicOrders)) {
      const riderItems = riderPicnicOrders[riderId];
      for (const qty of Object.values(riderItems)) {
        total += qty;
      }
    }
    return total;
  };

  const getRiderPicnicTotal = (riderId: string) => {
    const riderItems = riderPicnicOrders[riderId] || {};
    let total = 0;
    for (const [itemId, qty] of Object.entries(riderItems)) {
      const item = picnicMenuItems.find(m => m.id === itemId);
      total += item ? item.price * qty : 0;
    }
    return total;
  };

  const handleCheckCoupon = async () => {
    setCouponError('');
    if (!couponInput.trim()) return;

    try {
      const result = await validateCouponMutation.mutateAsync(couponInput.trim());
      if (result.valid && result.coupon) {
        setAppliedCoupon({
          code: result.coupon.code,
          discount: result.coupon.discount,
          discountType: result.coupon.discountType,
        });
        toast({
          title: '🎉 ' + t('couponApplied'),
          description: result.coupon.discountType === 'percent'
            ? `${result.coupon.discount}% ${isRTL ? 'הנחה' : 'discount'}`
            : `${result.coupon.discount}₪ ${isRTL ? 'הנחה' : 'discount'}`
        });
      } else {
        setCouponError(t(result.error || 'couponNotFound'));
        toast({ title: t('error'), description: t(result.error || 'couponNotFound'), variant: 'destructive' });
      }
    } catch (error) {
      setCouponError(t('couponNotFound'));
      toast({ title: t('error'), description: t('couponNotFound'), variant: 'destructive' });
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError('');
  };

  const maxBikes = getTotalActiveBikes();

  const addRider = () => {
    // Check real-time availability for the selected date/session
    const { remainingBikes } = checkPublicAvailability(date, session, 0);

    if (riders.length >= remainingBikes) {
      toast({
        title: t('error'),
        description: isRTL
          ? `אין יותר אופניים זמינים לתאריך ושעה זו (${remainingBikes} מקסימום)`
          : `No more bikes available for this date and time (${remainingBikes} maximum)`,
        variant: 'destructive'
      });
      return;
    }

    if (riders.length >= maxBikes) {
      toast({
        title: t('error'),
        description: t('maxBikesError'),
        variant: 'destructive'
      });
      return;
    }
    const newId = String(Date.now());
    setRiders([...riders, { id: newId, name: '', height: 0 }]);
    // Auto-open new rider panel
    setOpenRiders(prev => ({ ...prev, [newId]: true }));
  };

  const removeRider = (id: string) => {
    if (riders.length > 1) {
      setRiders(riders.filter(r => r.id !== id));
    }
  };

  const updateRider = (id: string, field: 'name' | 'height' | 'birthDate', value: string | number) => {
    // Sanitize name input
    const sanitizedValue = field === 'name' ? sanitizeText(value as string) : value;
    setRiders(riders.map(r => r.id === id ? { ...r, [field]: sanitizedValue } : r));
  };

  const handleLegalScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 10) {
      setLegalScrolled(true);
    }
  };

  const validateStep = () => {
    switch (step) {
      case 0:
        if (!date) {
          toast({ title: t('error'), description: t('selectDate'), variant: 'destructive' });
          return false;
        }
        // Validate session availability for the selected date
        const sessionCheck = isSessionAvailableForDate(date, session);
        if (!sessionCheck.isAvailable) {
          const errorMsg = session === 'morning'
            ? (isRTL ? 'לא ניתן להזמין סשן בוקר להיום - השעה כבר מאוחרת מדי' : 'Cannot book morning session for today - it\'s too late')
            : (isRTL ? 'לא ניתן להזמין סשן יומי להיום - השעה כבר מאוחרת מדי' : 'Cannot book daily session for today - it\'s too late');
          toast({ title: t('error'), description: errorMsg, variant: 'destructive' });
          return false;
        }
        return true;
      case 1:
        const validRiders = riders.filter(r => r.name && r.height >= MIN_HEIGHT && r.height <= MAX_HEIGHT);
        if (validRiders.length === 0) {
          toast({ title: t('error'), description: t('addAtLeastOneRider'), variant: 'destructive' });
          return false;
        }
        // Check for invalid heights
        const invalidHeightRider = riders.find(r => r.name && (r.height < MIN_HEIGHT || r.height > MAX_HEIGHT));
        if (invalidHeightRider) {
          toast({ title: t('error'), description: t('invalidHeight'), variant: 'destructive' });
          return false;
        }
        // Validate rider names
        for (const rider of validRiders) {
          const nameValidation = validateRiderName(rider.name);
          if (!nameValidation.valid) {
            toast({ title: t('error'), description: nameValidation.error || t('invalidName'), variant: 'destructive' });
            return false;
          }
        }

        // Check inventory availability before checking individual bikes
        const { available, remainingBikes } = checkPublicAvailability(date, session, validRiders.length);
        if (!available) {
          toast({
            title: t('error'),
            description: t('inventoryLimitExceeded').replace('{available}', String(remainingBikes)),
            variant: 'destructive'
          });
          return false;
        }

        // Check bike availability for each rider (with 30% height tolerance)
        for (const rider of validRiders) {
          const bike = findBestBike(rider.height, date, session);
          if (!bike) {
            const idealSize = getSizeForHeight(rider.height);
            toast({
              title: t('noBikesAvailable'),
              description: t('noSuitableBikeForHeight')
                .replace('{height}', String(rider.height))
                .replace('{size}', idealSize || ''),
              variant: 'destructive'
            });
            return false;
          }
        }
        return true;
      case 2:
        // Validate dietary notes if present
        if (picnic.dietaryNotes && picnic.dietaryNotes.length > 0) {
          const dietaryValidation = validateDietaryNotes(picnic.dietaryNotes);
          if (!dietaryValidation.valid) {
            toast({ title: t('error'), description: dietaryValidation.error || 'Invalid dietary notes', variant: 'destructive' });
            return false;
          }
        }
        return true;
      case 3:
        if (!legalScrolled) {
          toast({ title: t('error'), description: t('scrollToReadAgreement'), variant: 'destructive' });
          return false;
        }
        if (!legalAccepted) {
          toast({ title: t('error'), description: t('acceptTerms'), variant: 'destructive' });
          return false;
        }
        // Validate per-rider signatures
        const validRidersForSig = riders.filter(r => r.name && r.height > 0);
        for (const rider of validRidersForSig) {
          const sig = riderSignatures.find(s => s.riderId === rider.id);
          // Check signatures based on rider type
          if (sig.isMinor) {
            // Minors: Require only Guardian Name + Guardian Signature
            if (!sig.guardianName || sig.guardianName.trim().length < 2) {
              toast({
                title: t('error'),
                description: isRTL ? `חסר שם הורה/אפוטרופוס עבור ${rider.name}` : `Missing parent/guardian name for ${rider.name}`,
                variant: 'destructive'
              });
              return false;
            }
            if (!sig.guardianSignatureUrl) {
              toast({
                title: t('error'),
                description: isRTL ? `חסרה חתימת הורה/אפוטרופוס עבור ${rider.name}` : `Missing parent/guardian signature for ${rider.name}`,
                variant: 'destructive'
              });
              return false;
            }
          } else {
            // Adults: Require Rider Signature
            if (!sig.signatureUrl) {
              toast({
                title: t('error'),
                description: isRTL ? `חסרה חתימה עבור ${rider.name}` : `Missing signature for ${rider.name}`,
                variant: 'destructive'
              });
              return false;
            }
          }
        }
        if (!insuranceAccepted) {
          toast({
            title: t('error'),
            description: isRTL ? 'יש לאשר את מדיניות הביטוח והאחריות' : 'Please accept the insurance & liability policy',
            variant: 'destructive'
          });
          return false;
        }
        return true;
      case 4:
        if (!phone || !email) {
          toast({ title: t('error'), description: t('fillPhoneEmail'), variant: 'destructive' });
          return false;
        }

        // Validate phone with proper Israeli format
        const phoneValidation = validatePhone(phone);
        if (!phoneValidation.valid) {
          toast({ title: t('error'), description: phoneValidation.error || t('phoneMustBe10Digits'), variant: 'destructive' });
          return false;
        }

        // Validate email format
        const emailValidation = validateEmail(email);
        if (!emailValidation.valid) {
          toast({ title: t('error'), description: emailValidation.error || t('invalidEmail'), variant: 'destructive' });
          return false;
        }

        if (!paymentMethod) {
          toast({ title: t('error'), description: t('selectPaymentMethod'), variant: 'destructive' });
          return false;
        }
        return true;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      if (step < STEPS.length - 1) {
        setStep(step + 1);
      } else {
        completeBooking();
      }
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  // Generate a stable client identifier for rate limiting
  const getClientIdentifier = useCallback(() => {
    // Use a combination of factors to create a semi-stable identifier
    const stored = sessionStorage.getItem('booking_client_id');
    if (stored) return stored;

    const newId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('booking_client_id', newId);
    return newId;
  }, []);

  const completeBooking = async () => {
    // Prevent double submissions
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Check rate limit before proceeding
      const clientId = getClientIdentifier();
      const { data: rateLimitData, error: rateLimitError } = await supabase
        .rpc('check_booking_rate_limit', { _client_id: clientId });

      if (rateLimitError) {
        console.error('Rate limit check error:', rateLimitError);
        // Continue with booking if rate limit check fails (fail-open)
      } else if (rateLimitData && rateLimitData.length > 0 && !rateLimitData[0].allowed) {
        const retryAfter = rateLimitData[0].retry_after_seconds;
        const minutes = Math.ceil(retryAfter / 60);
        toast({
          title: isRTL ? 'יותר מדי ניסיונות' : 'Too many attempts',
          description: isRTL
            ? `נסו שוב בעוד ${minutes} דקות`
            : `Please try again in ${minutes} minutes`,
          variant: 'destructive'
        });
        setIsSubmitting(false);
        return;
      }

      // Log the booking attempt
      await supabase.rpc('log_booking_attempt', { _client_id: clientId, _was_successful: false });

      // Final availability check before creating booking (prevents overselling)
      const validRidersCount = riders.filter(r => r.name && r.height >= MIN_HEIGHT && r.height <= MAX_HEIGHT).length;
      const { available, remainingBikes } = checkPublicAvailability(date, session, validRidersCount);

      if (!available) {
        toast({
          title: t('error'),
          description: isRTL
            ? `מצטערים, נותרו רק ${remainingBikes} אופניים לתאריך ושעה זו. נסו שוב עם פחות רוכבים.`
            : `Sorry, only ${remainingBikes} bikes remain for this date and time. Try again with fewer riders.`,
          variant: 'destructive'
        });
        setIsSubmitting(false);
        return;
      }

      const assignedBikeIds: number[] = [];
      const validRiders = riders.filter(r => r.name && r.height >= MIN_HEIGHT && r.height <= MAX_HEIGHT).map(rider => {
        const bike = findBestBike(rider.height, date, session, assignedBikeIds);
        if (bike) {
          assignedBikeIds.push(bike.id);
        }
        // Add signature data from riderSignatures
        const sig = riderSignatures.find(s => s.riderId === rider.id);
        return {
          ...rider,
          assignedBike: bike?.id,
          assignedSize: bike?.size,
          isMinor: sig?.isMinor || false,
          // For minors, we use guardian signature as the primary signatureUrl
          signatureUrl: (sig?.isMinor ? sig?.guardianSignatureUrl : sig?.signatureUrl) || undefined,
          guardianName: sig?.guardianName || undefined,
          guardianSignatureUrl: sig?.guardianSignatureUrl || undefined,
        };
      });

      // Build picnic items for the booking (aggregate from all riders)
      const picnicItemsMap: Record<string, { item: PicnicMenuItem; quantity: number }> = {};
      for (const riderId of Object.keys(riderPicnicOrders)) {
        const riderItems = riderPicnicOrders[riderId];
        for (const [itemId, qty] of Object.entries(riderItems)) {
          const item = picnicMenuItems.find(m => m.id === itemId);
          if (item) {
            if (picnicItemsMap[itemId]) {
              picnicItemsMap[itemId].quantity += qty;
            } else {
              picnicItemsMap[itemId] = { item, quantity: qty };
            }
          }
        }
      }

      const picnicItems: PicnicOrderItem[] = Object.entries(picnicItemsMap)
        .filter(([_, data]) => data.quantity > 0)
        .map(([itemId, data]) => ({
          menuItemId: itemId,
          name: data.item.name,
          nameHe: data.item.nameHe,
          quantity: data.quantity,
          price: data.item.price,
        }));

      const picnicOrder: PicnicOrder | undefined = picnicItems.length > 0 ? {
        quantity: getTotalPicnicItems(),
        dietaryNotes: picnic.dietaryNotes,
        isVegan: picnic.isVegan,
        isGlutenFree: picnic.isGlutenFree,
        items: picnicItems,
      } : undefined;

      const booking: Omit<Booking, 'id'> = {
        date,
        session,
        riders: validRiders,
        picnic: picnicOrder,
        status: 'confirmed',
        totalPrice: calculateTotal(),
        securityHold: pricingData.securityHold,
        safetyBriefingCompleted: false,
        bikeConditionConfirmed: false,
        returnPhotos: [],
        createdAt: new Date().toISOString(),
        phone,
        email,
        legalAccepted: true,
        paymentMethod,
        couponCode: appliedCoupon?.code,
      };

      // Add booking - now returns the booking ID
      const bookingId = await addBookingMutation.mutateAsync(booking);

      // Upload per-rider signatures and update booking with waiver details (non-blocking)
      if (bookingId && riderSignatures.length > 0) {
        try {
          // Upload all rider signatures
          for (const sig of riderSignatures) {
            if (sig.signatureUrl) {
              const response = await fetch(sig.signatureUrl);
              const blob = await response.blob();
              const fileName = `${bookingId}_rider_${sig.riderId}_${Date.now()}.png`;
              await supabase.storage.from('signatures').upload(fileName, blob, { contentType: 'image/png' });
            }
            if (sig.guardianSignatureUrl) {
              const response = await fetch(sig.guardianSignatureUrl);
              const blob = await response.blob();
              const fileName = `${bookingId}_guardian_${sig.riderId}_${Date.now()}.png`;
              await supabase.storage.from('signatures').upload(fileName, blob, { contentType: 'image/png' });
            }
          }

          // Update booking with waiver info (riders already contain signature data)
          await supabase
            .from('bookings')
            .update({
              waiver_version: waiverVersion,
              waiver_accepted_at: new Date().toISOString(),
            } as any)
            .eq('id', bookingId);
        } catch (signatureError) {
          console.warn('Signature upload failed (booking still valid):', signatureError);
        }
      }

      // 1. לאחר יצירת ה-bookingId המוצלח
      if (bookingId) {
        // 2. עדכון טבלת bikes לשיוך האופניים שהוקצו להזמנה
        const { error: bikeUpdateError } = await supabase
          .from('bikes')
          .update({
            active_order_id: bookingId,
            active_phone: phone, // הטלפון שהוזן בשלב 4
            status: 'rented'     // מניעת הזמנה כפולה
          })
          .in('id', assignedBikeIds);

        if (bikeUpdateError) {
          console.error('Critical Error: Failed to link bikes:', bikeUpdateError);
          // התראה שקטה למערכת
        }
      }

      // המשך תיעוד הפעולה
      if (bookingId) {
        auditActions.logBookingCreate(bookingId, {
          ridersCount: validRiders.length,
          session,
          date,
          totalPrice: calculateTotal(),
          hasPicnic: picnicItems.length > 0,
        });
      }

      // Mark coupon as used if one was applied (wrapped in try/catch - coupon failure shouldn't fail booking)
      if (appliedCoupon && bookingId) {
        try {
          await markCouponUsedMutation.mutateAsync({ code: appliedCoupon.code, bookingId });
        } catch (couponError) {
          console.warn('Failed to mark coupon as used (booking still valid):', couponError);
          // Show a soft warning but don't fail the booking
          toast({
            title: isRTL ? '⚠️ הערה לגבי קופון' : '⚠️ Coupon Note',
            description: isRTL
              ? 'ההזמנה נקלטה בהצלחה, אך הייתה בעיה בעדכון הקופון. נטפל בזה ידנית.'
              : 'Booking confirmed, but there was an issue with the coupon. We will handle it manually.',
          });
        }
      }

      // Mark the booking attempt as successful
      await supabase.rpc('log_booking_attempt', { _client_id: clientId, _was_successful: true });

      // Show success and redirect to confirmation page
      toast({
        title: isRTL ? '✅ ההזמנה אושרה!' : '✅ Booking confirmed!',
        description: isRTL ? 'מעבירים אותך לדף האישור' : 'Redirecting to confirmation page',
      });

      // Redirect to confirmation page with booking ID
      navigate(`/booking/confirmation?id=${bookingId}`);
    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: t('error'),
        description: t('bookingFailed') || 'Failed to submit booking. Please try again.',
        variant: 'destructive'
      });
    } finally {
      // Add a 2 second cooldown before allowing another submission
      setTimeout(() => setIsSubmitting(false), 2000);
    }
  };

  // Removed old success page - now we redirect to /booking/confirmation

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 via-accent/5 to-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Home Button */}
        <div className="mb-4">
          <Link to="/">
            <Button variant="ghost" className="gap-2">
              <Home className="w-5 h-5" />
              {t('home')}
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">🚴 {t('bikeBooking')}</h1>
          <p className="text-muted-foreground">{t('craterAwaits')}</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8 px-4">
          {STEPS.map((stepName, index) => (
            <div key={index} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${index < step
                ? 'bg-success text-success-foreground'
                : index === step
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
                }`}>
                {index < step ? <Check className="w-5 h-5" /> : index + 1}
              </div>
              {index < STEPS.length - 1 && (
                <div className={`w-8 h-1 mx-1 rounded ${index < step ? 'bg-success' : 'bg-muted'
                  }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="glass-card rounded-2xl p-6 mb-6 animate-fade-in">
          {/* Step 0: Date & Session */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold">{t('dateAndSession')}</h2>
              </div>

              <div>
                <Label>{t('ridingDate')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full mt-2 h-14 justify-start text-lg font-medium ${!date ? 'text-muted-foreground' : ''
                        }`}
                    >
                      <CalendarDays className="mr-3 h-5 w-5 text-primary" />
                      {date ? format(new Date(date), 'EEEE, d בMMMM yyyy', { locale: he }) : t('selectDate')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="center" side="bottom">
                    {/* Legend */}
                    <div className="p-3 border-b bg-muted/30">
                      <div className="flex flex-wrap gap-3 text-xs">
                        <span className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          <span>{isRTL ? '4+ זמינים' : '4+ available'}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-orange-500" />
                          <span>{isRTL ? '1-3 זמינים' : '1-3 available'}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                          <span>{isRTL ? 'מלא' : 'Full'}</span>
                        </span>
                      </div>
                    </div>
                    <CalendarComponent
                      mode="single"
                      selected={date ? new Date(date) : undefined}
                      onSelect={(d) => d && setDate(format(d, 'yyyy-MM-dd'))}
                      disabled={(d) => isBefore(d, startOfToday()) || isAfter(d, addMonths(new Date(), 3))}
                      modifiers={{
                        highAvail: (d) => {
                          if (isBefore(d, startOfToday())) return false;
                          const dateStr = format(d, 'yyyy-MM-dd');
                          const { remainingBikes } = checkPublicAvailability(dateStr, session, 0);
                          return remainingBikes >= 4;
                        },
                        mediumAvail: (d) => {
                          if (isBefore(d, startOfToday())) return false;
                          const dateStr = format(d, 'yyyy-MM-dd');
                          const { remainingBikes } = checkPublicAvailability(dateStr, session, 0);
                          return remainingBikes >= 1 && remainingBikes <= 3;
                        },
                        lowAvail: (d) => {
                          if (isBefore(d, startOfToday())) return false;
                          const dateStr = format(d, 'yyyy-MM-dd');
                          const { remainingBikes } = checkPublicAvailability(dateStr, session, 0);
                          return remainingBikes === 0;
                        },
                      }}
                      modifiersClassNames={{
                        highAvail: 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400',
                        mediumAvail: 'bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400',
                        lowAvail: 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 opacity-60',
                      }}
                      className="pointer-events-auto p-3"
                      locale={isRTL ? he : undefined}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>{t('sessionType')}</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  {(() => {
                    // Check if sessions are enabled in admin settings
                    const morningEnabled = isSessionEnabled(sessionSettings, 'morning', date || undefined);
                    const dailyEnabled = isSessionEnabled(sessionSettings, 'daily', date || undefined);

                    // Check time-based availability (e.g., too late for morning today)
                    const morningTimeAvailable = !date || isSessionAvailableForDate(date, 'morning').isAvailable;
                    const dailyTimeAvailable = !date || isSessionAvailableForDate(date, 'daily').isAvailable;

                    // Session is available only if both enabled AND time-available
                    const morningAvailable = morningEnabled && morningTimeAvailable;
                    const dailyAvailable = dailyEnabled && dailyTimeAvailable;

                    // Get disabled messages
                    const morningSetting = sessionSettings?.find(s => s.sessionType === 'morning');
                    const dailySetting = sessionSettings?.find(s => s.sessionType === 'daily');

                    return (
                      <>
                        {/* Morning session - always visible */}
                        <button
                          type="button"
                          onClick={() => morningAvailable && setSession('morning')}
                          disabled={!morningAvailable}
                          className={`p-6 rounded-xl border-2 transition-all ${!morningEnabled
                            ? 'border-muted bg-muted/30 opacity-50 cursor-not-allowed grayscale'
                            : !morningAvailable
                              ? 'border-muted bg-muted/30 opacity-50 cursor-not-allowed'
                              : session === 'morning'
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:border-primary/50'
                            }`}
                        >
                          <Sun className="w-8 h-8 mx-auto mb-3 text-primary" />
                          <div className="font-bold text-lg">{t('morningSession')} ☀️</div>
                          <div className="text-sm text-muted-foreground">07:00 - 14:00</div>
                          <div className="text-xl font-bold text-primary mt-2">{pricingData.morningSession}₪</div>

                          {/* Custom disabled message from admin */}
                          {!morningEnabled && (
                            <div className="text-xs text-destructive mt-2 font-medium">
                              {isRTL
                                ? (morningSetting?.disabledMessageHe || 'סשן לא זמין')
                                : (morningSetting?.disabledMessageEn || 'Session unavailable')
                              }
                            </div>
                          )}

                          {/* Time-based unavailability */}
                          {morningEnabled && !morningTimeAvailable && date && (
                            <div className="text-xs text-destructive mt-2">{isRTL ? 'לא זמין להיום' : 'Not available today'}</div>
                          )}
                        </button>

                        {/* Daily session - always visible */}
                        <button
                          type="button"
                          onClick={() => dailyAvailable && setSession('daily')}
                          disabled={!dailyAvailable}
                          className={`p-6 rounded-xl border-2 transition-all ${!dailyEnabled
                            ? 'border-muted bg-muted/30 opacity-50 cursor-not-allowed grayscale'
                            : !dailyAvailable
                              ? 'border-muted bg-muted/30 opacity-50 cursor-not-allowed'
                              : session === 'daily'
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:border-primary/50'
                            }`}
                        >
                          <Clock className="w-8 h-8 mx-auto mb-3 text-accent" />
                          <div className="font-bold text-lg">{t('dailySession')} 🌅</div>
                          <div className="text-sm text-muted-foreground">{t('hours24')}</div>
                          <div className="text-xl font-bold text-accent mt-2">{pricingData.dailySession}₪</div>

                          {/* Custom disabled message from admin */}
                          {!dailyEnabled && (
                            <div className="text-xs text-destructive mt-2 font-medium">
                              {isRTL
                                ? (dailySetting?.disabledMessageHe || 'סשן לא זמין')
                                : (dailySetting?.disabledMessageEn || 'Session unavailable')
                              }
                            </div>
                          )}

                          {/* Time-based unavailability */}
                          {dailyEnabled && !dailyTimeAvailable && date && (
                            <div className="text-xs text-destructive mt-2">{isRTL ? 'לא זמין להיום' : 'Not available today'}</div>
                          )}
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Real-time Availability Table */}
              {date && (
                <div className="mt-6 p-4 bg-muted/50 rounded-xl">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    📊 {t('availabilityForDate')}
                  </h3>
                  {(() => {
                    // Calculate availability by size using REAL TIME data from Supabase
                    const sizes = ['S', 'M', 'L', 'XL'] as const;

                    const availabilityBySize = sizes.map(size => {
                      // REAL TIME: Count only bikes that are actually 'available' in the DB
                      const availableOfSize = bikes.filter(b => b.size === size && b.status === 'available').length;
                      const totalOfSize = bikes.filter(b => b.size === size && b.status !== 'unavailable').length;
                      const heightRange = heightRanges?.find(hr => hr.size === size);

                      return {
                        size,
                        total: totalOfSize,
                        available: availableOfSize,
                        minHeight: heightRange?.minHeight || 0,
                        maxHeight: heightRange?.maxHeight || 0,
                      };
                    }).filter(s => s.total > 0);

                    const totalRealAvailable = availabilityBySize.reduce((sum, item) => sum + item.available, 0);

                    return (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border">
                                <th className="py-2 text-start">{t('size')}</th>
                                <th className="py-2 text-start">{t('heightRange')}</th>
                                <th className="py-2 text-start">{t('available')}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {availabilityBySize.map(({ size, available, total, minHeight, maxHeight }) => {
                                const getStatusIcon = () => {
                                  if (available === 0) return '❌';
                                  if (available === 1) return '⚠️';
                                  if (available <= 2) return '⚠️'; // Low stock warning
                                  return '✅';
                                };
                                const getStatusColor = () => {
                                  if (available === 0) return 'text-destructive';
                                  if (available === 1) return 'text-yellow-500';
                                  if (available <= 2) return 'text-yellow-500';
                                  return 'text-green-500';
                                };
                                return (
                                  <tr key={size} className="border-b border-border/50">
                                    <td className="py-2 font-medium">{size}</td>
                                    <td className="py-2 text-muted-foreground">{minHeight}-{maxHeight} {t('heightCm')}</td>
                                    <td className={`py-2 font-semibold ${getStatusColor()}`}>
                                      {getStatusIcon()} {t('bikesAvailable').replace('{available}', String(available))}
                                      {available === 1 && <span className="text-xs ms-1">({t('lastOne')})</span>}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        <div className="mt-3 text-sm text-muted-foreground">
                          {t('totalAvailable').replace('{available}', String(totalRealAvailable))}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Step 1: Riders */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold">{t('riderDetails')}</h2>
              </div>

              {/* Max bikes warning - show when no more bikes available for this date/session */}
              {(() => {
                const { remainingBikes } = checkPublicAvailability(date, session, 0);
                const showWarning = riders.length >= remainingBikes || riders.length >= maxBikes;

                if (!showWarning) return null;

                return (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      {riders.length >= maxBikes
                        ? t('maxBikesError')
                        : (isRTL
                          ? `יש רק ${remainingBikes} אופניים זמינים לתאריך ושעה זו`
                          : `Only ${remainingBikes} bikes available for this date and time`)
                      }
                    </p>
                  </div>
                );
              })()}

              <div className="space-y-3">
                {riders.map((rider, index) => (
                  <Collapsible
                    key={rider.id}
                    open={openRiders[rider.id] ?? false}
                    onOpenChange={(open) => setOpenRiders(prev => ({ ...prev, [rider.id]: open }))}
                  >
                    <div className="bg-muted/50 rounded-xl overflow-hidden">
                      {/* Header - always visible */}
                      <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/70 transition-colors">
                        <span className="font-medium flex items-center gap-2">
                          🚴 {t('rider')} {index + 1}
                          {rider.name && <span className="text-muted-foreground">: {rider.name}</span>}
                        </span>
                        <div className="flex items-center gap-3">
                          {rider.height > 0 && (
                            <span className="text-sm text-muted-foreground bg-background/50 px-2 py-1 rounded">
                              {rider.height} {t('heightCm')}
                            </span>
                          )}
                          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${openRiders[rider.id] ? 'rotate-180' : ''}`} />
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent className="px-4 pb-4 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <Label>{t('fullName')}</Label>
                            <Input
                              value={rider.name}
                              onChange={(e) => updateRider(rider.id, 'name', e.target.value)}
                              placeholder={isRTL ? 'ישראל ישראלי' : 'John Doe'}
                              className="mt-1 input-desert"
                            />
                          </div>
                          <div>
                            <Label>{t('height')} ({t('heightCm')})</Label>
                            <Select
                              value={rider.height ? String(rider.height) : ''}
                              onValueChange={(value) => updateRider(rider.id, 'height', Number(value))}
                            >
                              <SelectTrigger className="mt-1 input-desert">
                                <SelectValue placeholder={t('selectHeight')} />
                              </SelectTrigger>
                              <SelectContent>
                                {heightOptions.map((h) => {
                                  const sizeForHeight = getSizeForHeight(h);
                                  const availability = date ? getAvailabilityBySize(date, session) : [];
                                  const sizeAvailability = availability.find(a => a.size === sizeForHeight);

                                  const ridersWithSameSize = riders.filter(r =>
                                    r.id !== rider.id &&
                                    r.height > 0 &&
                                    getSizeForHeight(r.height) === sizeForHeight
                                  ).length;

                                  const effectiveAvailable = sizeAvailability
                                    ? Math.max(0, sizeAvailability.available - ridersWithSameSize)
                                    : 0;

                                  const getIcon = () => {
                                    if (!date || !sizeForHeight) return '';
                                    if (effectiveAvailable === 0) return '❌';
                                    if (effectiveAvailable === 1) return '⚠️';
                                    return '✅';
                                  };

                                  const getTextColor = () => {
                                    if (!date || !sizeForHeight) return '';
                                    if (effectiveAvailable === 0) return 'text-destructive';
                                    if (effectiveAvailable === 1) return 'text-yellow-600';
                                    return 'text-green-600';
                                  };

                                  return (
                                    <SelectItem
                                      key={h}
                                      value={String(h)}
                                      disabled={date && effectiveAvailable === 0}
                                      className={getTextColor()}
                                    >
                                      {h} {t('heightCm')} {sizeForHeight && `(${sizeForHeight})`} {getIcon()}
                                      {date && effectiveAvailable === 1 && <span className="text-xs opacity-70"> - {t('lastOne')}</span>}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>{isRTL ? 'תאריך לידה' : 'Birth Date'}</Label>
                            <Input
                              type="date"
                              value={rider.birthDate || ''}
                              onChange={(e) => updateRider(rider.id, 'birthDate', e.target.value)}
                              max={new Date().toISOString().split('T')[0]}
                              min="1930-01-01"
                              className="mt-1 input-desert"
                            />
                            {rider.birthDate && (() => {
                              const birthDate = new Date(rider.birthDate);
                              const today = new Date();
                              const age = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
                              const isMinorAge = age < 18;
                              return (
                                <p className={`text-xs mt-1 ${isMinorAge ? 'text-warning font-medium' : 'text-muted-foreground'}`}>
                                  {isRTL ? `גיל: ${age}` : `Age: ${age}`}
                                  {isMinorAge && (
                                    <span className="ml-1">
                                      ⚠️ {isRTL ? 'קטין - נדרשת חתימת הורה' : 'Minor - guardian signature required'}
                                    </span>
                                  )}
                                </p>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Remove rider button */}
                        {riders.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRider(rider.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 w-full"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {isRTL ? 'הסר רוכב' : 'Remove Rider'}
                          </Button>
                        )}
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}

                {/* Add Rider Button - outside rider panels */}
                {(() => {
                  const { remainingBikes } = checkPublicAvailability(date, session, 0);
                  const canAddMore = riders.length < maxBikes && riders.length < remainingBikes;

                  if (!canAddMore) return null;

                  return (
                    <Button
                      onClick={addRider}
                      variant="outline"
                      className="w-full gap-2 border-dashed"
                    >
                      <Plus className="w-4 h-4" />
                      {t('addRider')}
                    </Button>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Step 2: Picnic */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <ShoppingBag className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold">🧺 {t('picnicMeal')}</h2>
              </div>

              <p className="text-muted-foreground text-sm">
                {isRTL ? 'בחרו פריטים לכל רוכב בנפרד:' : 'Select items for each rider:'}
              </p>

              {/* Per-rider picnic selection */}
              {riders.filter(r => r.name && r.height > 0).map((rider, riderIndex) => {
                const riderItems = riderPicnicOrders[rider.id] || {};
                const riderTotal = getRiderPicnicTotal(rider.id);

                return (
                  <div key={rider.id} className="glass-card rounded-xl p-4 space-y-4">
                    <div className="flex justify-between items-center border-b border-border pb-2">
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        {rider.name || `${isRTL ? 'רוכב' : 'Rider'} ${riderIndex + 1}`}
                      </h3>
                      {riderTotal > 0 && (
                        <span className="text-primary font-semibold">{riderTotal}₪</span>
                      )}
                    </div>

                    {/* Categories for this rider */}
                    {['sandwich', 'salad', 'dessert', 'drink', 'snack'].map(category => {
                      const categoryItems = picnicMenuItems.filter(item => item.category === category);
                      if (categoryItems.length === 0) return null;

                      const categoryLabels: Record<string, { he: string; en: string; icon: string }> = {
                        sandwich: { he: 'כריכים', en: 'Sandwiches', icon: '🥪' },
                        salad: { he: 'סלטים', en: 'Salads', icon: '🥗' },
                        dessert: { he: 'קינוחים', en: 'Desserts', icon: '🍎' },
                        drink: { he: 'משקאות', en: 'Drinks', icon: '🥤' },
                        snack: { he: 'חטיפים', en: 'Snacks', icon: '🍫' },
                      };

                      const label = categoryLabels[category];

                      return (
                        <div key={category} className="space-y-2">
                          <h4 className="font-medium text-sm flex items-center gap-2 text-muted-foreground">
                            {label.icon} {isRTL ? label.he : label.en}
                          </h4>
                          <div className="grid gap-2">
                            {categoryItems.map(item => {
                              const qty = riderItems[item.id] || 0;
                              return (
                                <div
                                  key={item.id}
                                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${qty > 0 ? 'border-primary bg-primary/5' : 'border-border'
                                    }`}
                                >
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">
                                      {isRTL ? item.nameHe : item.name}
                                    </div>
                                    {(isRTL ? item.descriptionHe : item.description) && (
                                      <div className="text-xs text-muted-foreground">
                                        {isRTL ? item.descriptionHe : item.description}
                                      </div>
                                    )}
                                    <div className="text-sm font-semibold text-primary mt-1">
                                      {item.price}₪
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={() => updateRiderPicnicItemQuantity(rider.id, item.id, -1)}
                                      disabled={qty === 0}
                                    >
                                      -
                                    </Button>
                                    <span className="w-6 text-center font-medium">{qty}</span>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={() => updateRiderPicnicItemQuantity(rider.id, item.id, 1)}
                                    >
                                      +
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* Total Summary */}
              {getTotalPicnicItems() > 0 && (
                <div className="p-4 bg-primary/10 rounded-xl space-y-2">
                  <div className="flex justify-between font-semibold">
                    <span>{isRTL ? 'סה"כ פריטים:' : 'Total items:'}</span>
                    <span>{getTotalPicnicItems()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-primary">
                    <span>{isRTL ? 'סה"כ לתשלום:' : 'Total:'}</span>
                    <span>{calculatePicnicItemsTotal()}₪</span>
                  </div>
                </div>
              )}

              {/* Dietary preferences */}
              {getTotalPicnicItems() > 0 && (
                <>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={picnic.isVegan}
                        onCheckedChange={(checked) => setPicnic({ ...picnic, isVegan: !!checked })}
                      />
                      <span>🥗 {t('vegan')}</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={picnic.isGlutenFree}
                        onCheckedChange={(checked) => setPicnic({ ...picnic, isGlutenFree: !!checked })}
                      />
                      <span>🌾 {t('glutenFree')}</span>
                    </label>
                  </div>

                  <div>
                    <Label>{t('dietaryNotes')}</Label>
                    <Textarea
                      value={picnic.dietaryNotes}
                      onChange={(e) => setPicnic({ ...picnic, dietaryNotes: sanitizeText(e.target.value) })}
                      placeholder={isRTL ? 'אלרגיות, העדפות...' : 'Allergies, preferences...'}
                      className="mt-2 input-desert"
                      maxLength={500}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 3: Legal + Signature */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold">📜 {t('legalAgreement')}</h2>
              </div>

              {/* Waiver Text - Dynamic from CMS */}
              <div
                className="h-64 overflow-y-auto border border-border rounded-lg p-4 bg-background text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert"
                onScroll={handleLegalScroll}
              >
                {waiverLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <ReactMarkdown>{waiverText}</ReactMarkdown>
                )}
                <p className="font-bold mt-4">👇 {t('scrollToRead')}</p>
              </div>

              {/* Terms Acceptance */}
              <label className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${legalScrolled
                ? 'border-primary bg-primary/10 cursor-pointer'
                : 'border-muted bg-muted/50 cursor-not-allowed opacity-50'
                }`}>
                <Checkbox
                  checked={legalAccepted}
                  onCheckedChange={(checked) => legalScrolled && setLegalAccepted(!!checked)}
                  disabled={!legalScrolled}
                />
                <span className="font-medium">✅ {t('agreeToTerms')}</span>
              </label>

              {/* Per-Rider Signatures */}
              <RiderSignatures
                riders={riders}
                signatures={riderSignatures}
                onSignaturesChange={setRiderSignatures}
              />

              {/* Insurance Policy Checkbox */}
              <div className="p-4 bg-accent/10 border border-accent/20 rounded-xl">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={insuranceAccepted}
                    onCheckedChange={(checked) => {
                      if (checked && !insuranceAccepted) {
                        setInsuranceDialogOpen(true);
                      } else {
                        setInsuranceAccepted(false);
                      }
                    }}
                    className="mt-1"
                  />
                  <div className="text-sm">
                    <span className="font-medium text-foreground">
                      {isRTL ? 'קראתי ואני מאשר את ' : 'I have read and agree to the '}
                    </span>
                    <button
                      type="button"
                      onClick={() => setInsuranceDialogOpen(true)}
                      className="text-primary underline hover:text-primary/80 font-semibold"
                    >
                      {isRTL ? 'מדיניות הביטוח והאחריות' : 'Insurance & Liability Policy'}
                    </button>
                  </div>
                </div>
              </div>

              <InsurancePolicyDialog
                open={insuranceDialogOpen}
                onOpenChange={setInsuranceDialogOpen}
                onAccept={() => setInsuranceAccepted(true)}
              />

              {/* Waiver Version Info */}
              <div className="text-xs text-muted-foreground text-center">
                {isRTL ? `גרסת ויתור: ${waiverVersion}` : `Waiver version: ${waiverVersion}`}
              </div>
            </div>
          )}

          {/* Step 4: Payment */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold">💳 {t('paymentDetails')}</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>📱 {t('mobilePhone')}</Label>
                  <Input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPhone(digitsOnly);
                    }}
                    placeholder="0501234567"
                    className={`mt-2 input-desert ${phone.length > 0 && phone.length !== 10 ? 'border-destructive' : ''}`}
                  />
                  {phone.length > 0 && phone.length !== 10 && (
                    <p className="text-sm text-destructive mt-1">
                      {t('phoneMustBe10Digits')} ({phone.length}/10)
                    </p>
                  )}
                </div>
                <div>
                  <Label>✉️ {t('email')}</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@mail.com"
                    className="mt-2 input-desert"
                  />
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-3">
                <Label>💰 {t('choosePaymentMethod')}</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'credit', icon: '💳', label: t('creditCard'), desc: t('visaMastercard') },
                    { id: 'bit', icon: '📲', label: t('bit'), desc: t('quickPayment') },
                    { id: 'paybox', icon: '📦', label: t('paybox'), desc: t('directTransfer') },
                    { id: 'cash', icon: '💵', label: t('cash'), desc: t('atBikeStation') }
                  ].map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-center ${paymentMethod === method.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                        }`}
                    >
                      <div className="text-3xl mb-2">{method.icon}</div>
                      <div className="font-bold text-sm">{method.label}</div>
                      <div className="text-xs text-muted-foreground">{method.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Coupon Code Input */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  {t('enterCouponCode')}
                </Label>
                {!appliedCoupon ? (
                  <div className="flex gap-2">
                    <Input
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="RAMON5-XXXXXX"
                      className="input-desert flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCheckCoupon}
                      disabled={!couponInput.trim()}
                    >
                      {t('checkCoupon')}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-success/10 border border-success/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-success" />
                      <span className="font-medium text-success">{appliedCoupon.code}</span>
                      <span className="text-sm text-success">
                        ({appliedCoupon.discountType === 'percent' ? `${appliedCoupon.discount}%` : `${appliedCoupon.discount}₪`})
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveCoupon}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                {couponError && (
                  <p className="text-sm text-destructive">{couponError}</p>
                )}
              </div>

              {/* Order Summary */}
              <div className="p-4 bg-muted/50 rounded-xl space-y-3">
                <div className="flex justify-between">
                  <span>🚴 {t('riders')} ({riders.filter(r => r.name).length})</span>
                  <span>{riders.filter(r => r.name).length * (session === 'morning' ? pricingData.morningSession : pricingData.dailySession)}₪</span>
                </div>
                {getTotalPicnicItems() > 0 && (
                  <div className="flex justify-between">
                    <span>🧺 {t('picnic')} ({getTotalPicnicItems()} {isRTL ? 'פריטים' : 'items'})</span>
                    <span>{calculatePicnicItemsTotal()}₪</span>
                  </div>
                )}
                {appliedCoupon && (
                  <div className="flex justify-between text-success">
                    <span>🎟️ {t('couponDiscount')}</span>
                    <span>
                      -{appliedCoupon.discountType === 'percent'
                        ? `${Math.round(calculateSubtotal() * appliedCoupon.discount / 100)}₪ (${appliedCoupon.discount}%)`
                        : `${appliedCoupon.discount}₪`
                      }
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>🔒 {t('securityDeposit')}</span>
                  <span>{pricingData.securityHold}₪</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between font-bold text-lg">
                  <span>{t('totalPayment')}</span>
                  <div className="text-right">
                    {appliedCoupon && (
                      <span className="text-sm text-muted-foreground line-through mr-2">
                        {calculateSubtotal() + pricingData.securityHold}₪
                      </span>
                    )}
                    <span className="text-primary">{calculateTotal() + pricingData.securityHold}₪</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>🔐 {t('securePayment')}</span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-4">
          {step > 0 && (
            <Button
              variant="outline"
              onClick={prevStep}
              className="flex-1 gap-2"
            >
              {isRTL ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              {t('back')}
            </Button>
          )}
          <Button
            onClick={nextStep}
            disabled={step === STEPS.length - 1 && isSubmitting}
            className="flex-1 btn-hero gap-2"
          >
            {step === STEPS.length - 1 ? (
              isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('submitting') || 'Submitting...'}
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  {t('submitBookingRequest')}
                </>
              )
            ) : (
              <>
                {t('continue')}
                {isRTL ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
