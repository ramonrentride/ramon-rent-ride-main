import { useEffect, useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import {
  CheckCircle,
  Calendar,
  Clock,
  Users,
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  Home,
  Bike,
  AlertTriangle,
  Loader2,
  Send,
} from "lucide-react";
import type { Booking, Rider } from "@/lib/types";

export default function BookingConfirmationPage() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("id");
  const { t, isRTL } = useI18n();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [whatsappSent, setWhatsappSent] = useState(false);
  const hasOpenedWhatsApp = useRef(false);

  useEffect(() => {
    if (!bookingId) {
      setError("noBookingId");
      setLoading(false);
      return;
    }

    const fetchBooking = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .rpc("get_booking_by_id", { booking_uuid: bookingId })
          .single();

        if (fetchError) throw fetchError;

        if (data) {
          setBooking({
            id: data.id,
            date: data.date,
            session: data.session as "morning" | "daily",
            riders: (Array.isArray(data.riders) ? data.riders : []) as unknown as Rider[],
            status: data.status as "pending" | "confirmed" | "cancelled" | "completed",
            totalPrice: data.total_price,
            securityHold: data.security_hold || 0,
            phone: data.phone,
            email: data.email,
            createdAt: data.created_at,
            picnic: data.picnic as any,
            paymentMethod: data.payment_method || undefined,
            couponCode: data.coupon_code || undefined,
            safetyBriefingCompleted: data.safety_briefing_completed || false,
            bikeConditionConfirmed: data.bike_condition_confirmed || false,
            returnPhotos: data.return_photos || [],
            legalAccepted: data.legal_accepted || false,
          });
        }
      } catch (err) {
        console.error("Error fetching booking:", err);
        setError("bookingNotFound");
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  // Removed auto-open WhatsApp - now manual button only
  // This prevents issues with blank pages on some devices/browsers

  const formatDateForMessage = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(isRTL ? "he-IL" : "en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const buildWhatsAppConfirmationMessage = () => {
    if (!booking) return "";

    const ridersText = booking.riders
      .map((rider, idx) => `   ${idx + 1}. ${rider.name} (${rider.height}cm)`)
      .join("\n");

    const sessionText = booking.session === "morning"
      ? (isRTL ? "בוקר (07:00-14:00)" : "Morning (07:00-14:00)")
      : (isRTL ? "יומי (24 שעות)" : "Daily (24 hours)");

    const message = isRTL
      ? `שלום! 👋
אישור הזמנה חדשה:

📅 תאריך: ${formatDateForMessage(booking.date)}
⏰ סשן: ${sessionText}
👥 רוכבים:
${ridersText}

💰 סה"כ: ${booking.totalPrice + (booking.securityHold || 0)}₪
   (כולל פיקדון ${booking.securityHold}₪)

🆔 מספר הזמנה: ${booking.id.slice(0, 8)}

תודה שבחרתם ב-ramonrentride! 🚴`
      : `Hi! 👋
New Booking Confirmation:

📅 Date: ${formatDateForMessage(booking.date)}
⏰ Session: ${sessionText}
👥 Riders:
${ridersText}

💰 Total: ${booking.totalPrice + (booking.securityHold || 0)}₪
   (includes ${booking.securityHold}₪ deposit)

🆔 Booking ID: ${booking.id.slice(0, 8)}

Thank you for choosing ramonrentride! 🚴`;

    return message;
  };

  const openWhatsAppConfirmation = () => {
    const message = buildWhatsAppConfirmationMessage();
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/972528281958?text=${encodedMessage}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/10 via-accent/5 to-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/10 via-accent/5 to-background py-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="glass-card rounded-2xl p-8">
            <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">{isRTL ? "הזמנה לא נמצאה" : "Booking Not Found"}</h1>
            <p className="text-muted-foreground mb-6">
              {isRTL ? "לא הצלחנו למצוא את ההזמנה המבוקשת" : "We could not find the requested booking"}
            </p>
            <Link to="/">
              <Button className="gap-2">
                <Home className="w-4 h-4" />
                {t("home")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(isRTL ? "he-IL" : "en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getSessionTime = () => {
    if (booking.session === "morning") {
      return "07:00 - 14:00";
    }
    return isRTL ? "24 שעות" : "24 hours";
  };

  const getStatusBadge = () => {
    switch (booking.status) {
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-success/20 text-success text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            {isRTL ? "מאושר" : "Confirmed"}
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-sm font-medium">
            <Clock className="w-4 h-4" />
            {isRTL ? "ממתין לאישור" : "Pending"}
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-destructive/20 text-destructive text-sm font-medium">
            {isRTL ? "בוטל" : "Cancelled"}
          </span>
        );
      default:
        return null;
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 via-accent/5 to-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <Link to="/">
            <Button variant="ghost" className="gap-2">
              <Home className="w-5 h-5" />
              {t("home")}
            </Button>
          </Link>
        </div>

        {/* Success Message */}
        <div className="glass-card rounded-2xl p-6 mb-6 text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {isRTL ? "ההזמנה התקבלה בהצלחה!" : "Booking Received Successfully!"}
          </h1>
          <p className="text-muted-foreground mb-4">
            {isRTL ? "שלחו לנו הודעת WhatsApp עם פרטי ההזמנה" : "Send us a WhatsApp message with booking details"}
          </p>
          {getStatusBadge()}
        </div>

        {/* Booking Details */}
        <div className="glass-card rounded-2xl p-6 mb-6 space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Bike className="w-5 h-5 text-primary" />
            {isRTL ? "פרטי ההזמנה" : "Booking Details"}
          </h2>

          <div className="grid gap-4">
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Calendar className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">{isRTL ? "תאריך" : "Date"}</p>
                <p className="font-medium">{formatDate(booking.date)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Clock className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">{isRTL ? "סוג שכירות" : "Session"}</p>
                <p className="font-medium">
                  {booking.session === "morning" ? (isRTL ? "בוקר" : "Morning") : isRTL ? "יומי" : "Daily"} -{" "}
                  {getSessionTime()}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Users className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">{isRTL ? "רוכבים" : "Riders"}</p>
                <div className="space-y-1">
                  {booking.riders.map((rider, idx) => (
                    <p key={rider.id} className="font-medium">
                      {idx + 1}. {rider.name} ({rider.height}cm)
                    </p>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{isRTL ? 'סה"כ לתשלום' : "Total"}</span>
                <span className="text-xl font-bold text-primary">
                  {booking.totalPrice + (booking.securityHold || 0)}₪
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {isRTL ? `(כולל פיקדון ${booking.securityHold}₪)` : `(includes ${booking.securityHold}₪ deposit)`}
              </p>
            </div>
          </div>
        </div>

        {/* Important Info */}
        <div className="glass-card rounded-2xl p-6 mb-6 space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            {isRTL ? "מידע חשוב" : "Important Information"}
          </h2>

          <div className="space-y-3 text-sm">
            <div className="p-3 bg-primary/10 rounded-lg">
              <p className="font-medium mb-1">📍 {isRTL ? "כתובת איסוף" : "Pickup Address"}</p>
              <p className="text-muted-foreground">
                {isRTL ? "מצפה רמון, הר עודד 3 מתחם קפה קיבוץ" : "Mitzpe Ramon, Keeboots Cafe"}
              </p>
            </div>

            <div className="p-3 bg-accent/10 rounded-lg">
              <p className="font-medium mb-1">⏰ {isRTL ? "שעות פעילות" : "Operating Hours"}</p>
              <p className="text-muted-foreground">{isRTL ? "כל יום 07:00-14:00" : "Daily 07:00-14:00"}</p>
            </div>

            <div className="p-3 bg-yellow-500/10 rounded-lg">
              <p className="font-medium mb-1">🪪 {isRTL ? "מה להביא" : "What to Bring"}</p>
              <p className="text-muted-foreground">{isRTL ? "תעודת זהות, אמצעי תשלום" : "ID, payment method"}</p>
            </div>
          </div>
        </div>

        {/* Contact Options */}
        <div className="space-y-3">
          <a
            href={`https://wa.me/972528281958?text=${encodeURIComponent(buildWhatsAppConfirmationMessage())}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-medium transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            {isRTL ? "שלח ב-WhatsApp" : "Send via WhatsApp"}
          </a>

          <div className="grid grid-cols-2 gap-3">
            <a
              href="tel:0528281958"
              className="flex items-center justify-center gap-2 py-3 px-4 bg-muted rounded-xl hover:bg-muted/80 transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span className="text-sm">{isRTL ? "התקשרו אלינו" : "Call Us"}</span>
            </a>
            <a
              href={`mailto:info@ramonrentride.co.il`}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-muted rounded-xl hover:bg-muted/80 transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span className="text-sm">{isRTL ? "שלחו מייל" : "Email Us"}</span>
            </a>
          </div>
        </div>

        {/* Booking Reference */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>{isRTL ? "מספר הזמנה:" : "Booking Reference:"}</p>
          <p className="font-mono text-xs bg-muted px-3 py-1 rounded inline-block mt-1">{booking.id}</p>
        </div>
      </div>
    </div>
  );
}
