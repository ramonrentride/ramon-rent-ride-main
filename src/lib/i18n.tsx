import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type Language = "he" | "en";

interface Translations {
  [key: string]: {
    he: string;
    en: string;
  };
}

const translations: Translations = {
  // General
  home: { he: "דף הבית", en: "Home" },
  back: { he: "חזרה", en: "Back" },
  continue: { he: "המשך", en: "Continue" },
  save: { he: "שמור", en: "Save" },
  cancel: { he: "ביטול", en: "Cancel" },
  confirm: { he: "אישור", en: "Confirm" },

  // Header
  bikeRentRamon: { he: "ramonrentride", en: "ramonrentride" },
  bikeRentalCrater: { he: "השכרת אופניים במכתש", en: "Bike Rental at the Crater" },
  adminLogin: { he: "כניסת מנהל", en: "Admin Login" },

  // Hero
  autonomousBikeRental: { he: "השכרת אופניים אוטונומית", en: "Autonomous Bike Rental" },
  onTwoWheels: { he: "להכיר את המדבר על שני גלגלים", en: "On Two Wheels" },
  heroDescription: {
    he: "חוויית רכיבה בלתי נשכחת במכתש רמון - אחד הנופים המדהימים בישראל. אופניים מקצועיים, שבילים מסומנים, והרפתקה בטבע.",
    en: "An unforgettable cycling experience at Ramon Crater - one of Israel's most stunning landscapes. Professional bikes, marked trails, and adventure in nature.",
  },
  bookNow: { he: "הזמינו עכשיו", en: "Book Now" },
  riderEntry: { he: "כניסת רוכבים", en: "Rider Entry" },
  guestArea: { he: "אזור אורחים", en: "Guest Area" },

  // Features
  whyChooseUs: { he: "למה לבחור בנו?", en: "Why Choose Us?" },
  featuresDescription: {
    he: "אנחנו מציעים את חוויית הרכיבה הטובה ביותר עם ציוד מקצועי ותחזוקה יום יומית",
    en: "We offer the best cycling experience with professional equipment and daily maintenance",
  },
  professionalBikes: { he: "אופניים מקצועיים", en: "Professional Bikes" },
  professionalBikesDesc: {
    he: "צי של אופניים במידות שונות, מתוחזקים ברמה הגבוהה ביותר",
    en: "Fleet of 20 bikes in various sizes, maintained at the highest level",
  },
  markedTrails: { he: "שבילים מסומנים", en: "Marked Trails" },
  markedTrailsDesc: {
    he: "מסלולים לכל הרמות - מתחילים ועד מתקדמים, עם תמיכת GPS",
    en: "Trails for all levels - beginners to advanced, with GPS support",
  },
  desertPicnic: { he: "פיקניק במדבר", en: "Desert Picnic" },
  desertPicnicDesc: {
    he: "הזמינו ארוחת פיקניק מושלמת לחוויה הגאסטרונומית במדבר",
    en: "Order a perfect picnic meal for a gastronomic desert experience",
  },

  // Nature
  meetingNature: { he: "פגישה עם הטבע", en: "Meeting Nature" },
  natureDescription: {
    he: "במהלך הרכיבה תוכלו לפגוש את תושבי המכתש - יעלי הנובי המרהיבים, ציפורים נדירות, ונופים שלא תשכחו לעולם. הקפידו על שמירת הטבע ושמרו מרחק מבעלי החיים.",
    en: "During your ride, you may encounter the crater's residents - magnificent Nubian ibex, rare birds, and unforgettable landscapes. Please protect nature and keep your distance from wildlife.",
  },
  nubianIbex: { he: "יעלי נובי", en: "Nubian Ibex" },
  vultures: { he: "נשרים", en: "Vultures" },
  eagles: { he: "עיטים", en: "Eagles" },
  foxes: { he: "שועלים", en: "Foxes" },

  // Animal Descriptions
  ibexDescription: {
    he: "יעל הנובי הוא סמל של מדבר הנגב. ניתן לראות להקות של יעלים ברחבי מכתש רמון, במיוחד בשעות הבוקר והערב. הם מטפסים על צוקים תלולים בזריזות מדהימה.",
    en: "The Nubian Ibex is a symbol of the Negev desert. Herds can be spotted throughout Ramon Crater, especially during morning and evening hours. They climb steep cliffs with amazing agility.",
  },
  vultureDescription: {
    he: "הנשר הוא אחת הציפורים הגדולות והמרשימות ביותר בישראל. מכתש רמון הוא בית לקינון נשרים, וניתן לראותם דואים בשמי המכתש.",
    en: "The Griffon Vulture is one of the largest and most impressive birds in Israel. Ramon Crater is home to nesting vultures, and they can be seen soaring above the crater.",
  },
  eagleDescription: {
    he: "עיטים שונים מאכלסים את אזור המכתש, כולל עיט הזהב ועיט החדור. הם ציידים מיומנים שניתן לראותם מרחפים בחיפוש אחר טרף.",
    en: "Various eagles inhabit the crater area, including Golden Eagles and Spotted Eagles. They are skilled hunters that can be seen hovering while searching for prey.",
  },
  foxDescription: {
    he: "שועלי המדבר הם בעלי חיים ביישניים אך סקרניים. ניתן לראותם בעיקר בשעות הדמדומים ובלילה. הם חלק חשוב מהאקוסיסטם המדברי.",
    en: "Desert foxes are shy but curious animals. They can be spotted mainly during twilight hours and at night. They are an important part of the desert ecosystem.",
  },
  learnMore: { he: "למד עוד", en: "Learn More" },
  closeDialog: { he: "סגור", en: "Close" },

  // Gallery
  craterGallery: { he: "גלריית המכתש", en: "Crater Gallery" },
  galleryDescription: { he: "תמונות מהמסלולים הכי יפים שלנו", en: "Photos from our most beautiful trails" },

  // CTA
  readyForAdventure: { he: "מוכנים להרפתקה?", en: "Ready for Adventure?" },
  ctaDescription: {
    he: "הזמינו עכשיו ותגלו את מכתש רמון מזווית אחרת",
    en: "Book now and discover Ramon Crater from a different angle",
  },

  // Footer
  allRightsReserved: { he: "כל הזכויות שמורות", en: "All rights reserved" },

  // Booking
  bikeBooking: { he: "הזמנת אופניים", en: "Bike Booking" },
  craterAwaits: { he: "מכתש רמון מחכה לכם!", en: "Ramon Crater awaits you!" },
  dateAndSession: { he: "תאריך ומשמרת", en: "Date & Session" },
  riders: { he: "רוכבים", en: "Riders" },
  picnic: { he: "פיקניק", en: "Picnic" },
  legalAgreement: { he: "הסכם משפטי", en: "Legal Agreement" },
  payment: { he: "תשלום", en: "Payment" },
  ridingDate: { he: "תאריך רכיבה", en: "Riding Date" },
  sessionType: { he: "סוג משמרת", en: "Session Type" },
  morningSession: { he: "סשן בוקר", en: "Morning Session" },
  dailySession: { he: "סשן יומי", en: "Daily Session" },
  addRider: { he: "הוסף רוכב", en: "Add Rider" },
  riderDetails: { he: "פרטי רוכבים", en: "Rider Details" },
  fullName: { he: "שם מלא", en: "Full Name" },
  height: { he: "גובה", en: "Height" },
  picnicMeal: { he: "ארוחת פיקניק", en: "Picnic Meal" },
  vegan: { he: "טבעוני", en: "Vegan" },
  glutenFree: { he: "ללא גלוטן", en: "Gluten Free" },
  dietaryNotes: { he: "הערות תזונה נוספות", en: "Additional Dietary Notes" },
  scrollToRead: { he: "גלול לסוף ההסכם כדי להמשיך", en: "Scroll to end of agreement to continue" },
  agreeToTerms: { he: "קראתי ואני מסכים/ה לתנאי ההסכם", en: "I have read and agree to the terms" },
  paymentDetails: { he: "פרטי תשלום", en: "Payment Details" },
  mobilePhone: { he: "טלפון נייד", en: "Mobile Phone" },
  email: { he: "אימייל", en: "Email" },
  securityDeposit: { he: "עיכבון בטחוני (יוחזר)", en: "Security Deposit (refundable)" },
  totalPayment: { he: 'סה"כ לתשלום', en: "Total Payment" },
  securePayment: { he: "התשלום מאובטח ומוצפן", en: "Payment is secure and encrypted" },
  payAndBook: { he: "שלם והזמן", en: "Pay & Book" },

  // Rider Dashboard
  riderDashboard: { he: "לוח רוכב", en: "Rider Dashboard" },
  safetyBriefing: { he: "תדריך בטיחות", en: "Safety Briefing" },
  lockCodes: { he: "קודים", en: "Lock Codes" },
  bikeCondition: { he: "אישור מצב", en: "Condition Check" },
  returnBike: { he: "החזרה", en: "Return" },
  thankYou: { he: "תודה", en: "Thank You" },
  safetyConfirmHelmet: { he: "אני מתחייב/ת לרכב עם קסדה בכל עת", en: "I commit to wearing a helmet at all times" },
  safetyConfirmTrails: { he: "אני מכיר/ה את השבילים המותרים לרכיבה", en: "I know the permitted riding trails" },
  safetyConfirmGears: { he: "אני יודע/ת איך להשתמש בהילוכים ובבלמים", en: "I know how to use gears and brakes" },
  safetyConfirmWater: { he: "יש לי מים וטלפון נייד טעון", en: "I have water and a charged phone" },
  safetyConfirmHeat: { he: "אני מודע/ת לסכנות החום והמדבר", en: "I am aware of heat and desert dangers" },
  checkStickerNumber: {
    he: "בדקו שמספר המדבקה על האופניים תואם!",
    en: "Check that the sticker number on the bike matches!",
  },
  lockCode: { he: "קוד מנעול", en: "Lock Code" },
  sticker: { he: "מדבקה", en: "Sticker" },
  checkBeforeRiding: { he: "בדקו לפני היציאה:", en: "Check before riding:" },
  tiresInflated: { he: "האם הצמיגים מנופחים?", en: "Are the tires inflated?" },
  brakesWork: { he: "האם הבלמים עובדים?", en: "Do the brakes work?" },
  helmetFits: { he: "האם הקסדה מתאימה?", en: "Does the helmet fit?" },
  visibleDamage: { he: "האם יש פגמים נראים?", en: "Is there any visible damage?" },
  assignedBikes: { he: "האופניים שהוקצו לכם:", en: "Your assigned bikes:" },
  confirmBikeCondition: { he: "אישרתי - יוצאים!", en: "Confirmed - Let's go!" },
  enjoyRide: { he: "רכיבה נעימה!", en: "Enjoy your ride!" },
  enjoyDescription: {
    he: 'תהנו מהמכתש. כשתסיימו, לחצו על "סיום רכיבה"',
    en: 'Enjoy the crater. When done, click "End Ride"',
  },
  sosButton: { he: "כפתור חירום SOS", en: "SOS Emergency Button" },
  sosDescription: { he: "שולח מיקום לצוות החילוץ", en: "Sends location to rescue team" },
  endRide: { he: "סיום - צלמו", en: "End - Take Photo" },
  confirmReturn: { he: "אישור החזרה", en: "Confirm Return" },
  takeAgain: { he: "צלם שוב", en: "Take Again" },
  confirmReturnGetCoupon: { he: "אשר החזרה וקבל קופון", en: "Confirm Return & Get Coupon" },
  thankYouMessage: { he: "תודה רבה!", en: "Thank You!" },
  thankYouDescription: { he: "היה לנו כיף לארח אתכם במכתש רמון", en: "We enjoyed hosting you at Ramon Crater" },
  giftFromUs: { he: "מתנה מאיתנו!", en: "A Gift From Us!" },
  couponDescription: { he: "קופון 5% הנחה לרכיבה הבאה:", en: "5% discount coupon for your next ride:" },
  couponSentWhatsapp: { he: "הקופון נשלח גם לוואטסאפ שלכם", en: "Coupon also sent to your WhatsApp" },
  depositRefund: { he: "העיכבון הבטחוני יוחזר תוך 48 שעות", en: "Security deposit will be refunded within 48 hours" },
  currentLocation: { he: "מיקום נוכחי", en: "Current Location" },
  callUs: { he: "התקשרו אלינו", en: "Call Us" },
  bookingNotFound: { he: "לא נמצאה הזמנה", en: "Booking Not Found" },
  checkLinkOrContact: { he: "אנא בדקו את הקישור או צרו קשר", en: "Please check the link or contact us" },

  // Weather
  temperature: { he: "טמפרטורה", en: "Temperature" },
  heatwaveAlert: { he: "התראת חום!", en: "Heatwave Alert!" },

  // Accessibility
  accessibility: { he: "נגישות", en: "Accessibility" },
  language: { he: "שפה", en: "Language" },
  highContrast: { he: "ניגודיות גבוהה", en: "High Contrast" },
  largeText: { he: "טקסט גדול", en: "Large Text" },
  reducedMotion: { he: "הפחתת תנועה", en: "Reduced Motion" },

  // FAQ
  faqTitle: { he: "שאלות נפוצות", en: "Frequently Asked Questions" },
  faqDescription: { he: "כל מה שצריך לדעת לפני הרכיבה", en: "Everything you need to know before riding" },
  faqSubtitle: {
    he: "מצאו תשובות לשאלות הנפוצות ביותר על השכרת אופניים במכתש רמון",
    en: "Find answers to the most common questions about bike rental at Ramon Crater",
  },

  // FAQ Questions
  faqHoursQuestion: { he: "מהן שעות הפעילות?", en: "What are the operating hours?" },
  faqHoursAnswer: {
    he: "אנו פועלים בשני מסלולים: סשן בוקר (07:00-14:00) וסשן יומי מלא (24 שעות - החזרה למחרת בשעה 07:00). בימי שישי ושבת יש לתאם מראש.",
    en: "We operate in two sessions: Morning session (07:00-14:00) and full daily session (24 hours - return next day at 07:00). Fridays and Saturdays require advance coordination.",
  },
  faqBikeQuestion: { he: "איך בוחרים לי אופניים?", en: "How are bikes selected for me?" },
  faqBikeAnswer: {
    he: "אנו מתאימים את האופניים לפי גובה הרוכב. יש לנו מידות S/M/L/XL. המערכת שלנו מוצאת את המידה המתאימה ביותר, ואם אינה זמינה - מציעה את המידה הקרובה ביותר.",
    en: "We match bikes according to rider height. We have sizes S/M/L/XL. Our system finds the most suitable size, and if unavailable - suggests the nearest size.",
  },
  faqIncludedQuestion: { he: "מה כלול בעלות השכירות?", en: "What is included in the rental cost?" },
  faqIncludedAnswer: {
    he: "השכירות כוללת אופניים, קסדה, ערכת תיקון בסיסית, ומפת שבילים. חובה להחזיר את כל הציוד בזמן.",
    en: "Rental includes bike, helmet, basic repair kit, and trail map. All equipment must be returned on time.",
  },
  faqLateQuestion: { he: "מה קורה אם מאחרים?", en: "What happens if I'm late?" },
  faqLateAnswer: {
    he: "איחור בהחזרה כרוך בקנס של 120₪. אובדן או גניבה של אופניים כרוכים בעלות של 2,500₪. עיכבון בטחוני של 500₪ נגבה בעת ההזמנה.",
    en: "Late return incurs a ₪120 fine. Loss or theft of bikes costs ₪2,500. A ₪500 security deposit is collected at booking.",
  },
  faqLocationQuestion: { he: "איפה נקודת האיסוף וההחזרה?", en: "Where is the pickup and return point?" },
  faqLocationAnswer: {
    he: "נקודת האיסוף וההחזרה נמצאת במרכז המבקרים של מכתש רמון, ליד מצפה רמון. ניתן לחנות בחינם בחניון הסמוך.",
    en: "Pickup and return point is at the Ramon Crater Visitor Center, near Mitzpe Ramon. Free parking is available in the adjacent lot.",
  },
  faqPhotoQuestion: { he: "למה צריך לצלם בהחזרה?", en: "Why do I need to take a photo at return?" },
  faqPhotoAnswer: {
    he: "עליכם לצלם את האופניים נעולים בעמדת ההחזרה כדי לאשר את סיום ההשכרה. זה מגן עליכם ועלינו ומוודא שההחזרה בוצעה כראוי.",
    en: "You must photograph the bikes locked at the return station to confirm end of rental. This protects both you and us and ensures proper return.",
  },
  faqEmergencyQuestion: { he: "מה עושים במקרה חירום?", en: "What to do in an emergency?" },
  faqEmergencyAnswer: {
    he: "באפליקציה יש כפתור SOS ששולח את המיקום שלכם אלינו ולשירותי החירום. שמרו על קשר טלפוני פתוח ואל תסעו לבד באזורים מרוחקים.",
    en: "The app has an SOS button that sends your location to us and emergency services. Keep phone contact open and don't ride alone in remote areas.",
  },

  // Trails Section
  recommendedTrails: { he: "מסלולים מומלצים", en: "Recommended Trails" },
  trailsDescription: {
    he: "גלו את המסלולים הטובים ביותר במכתש רמון - מתאימים לכל הרמות",
    en: "Discover the best trails in Ramon Crater - suitable for all levels",
  },
  hours: { he: "שעות", en: "hours" },
  km: { he: 'ק"מ', en: "km" },
  openGoogleMaps: { he: "פתח ב-Google Maps", en: "Open in Google Maps" },
  easy: { he: "קל", en: "Easy" },
  moderate: { he: "בינוני", en: "Moderate" },
  hard: { he: "קשה", en: "Hard" },

  // Trail Names
  mountArdonTrail: { he: "מסלול הר ארדון", en: "Mount Ardon Trail" },
  mountArdonDesc: {
    he: "מסלול מרהיב עם נוף פנורמי על המכתש. מתאים למתחילים עם עליות קלות.",
    en: "Stunning trail with panoramic crater views. Suitable for beginners with gentle climbs.",
  },
  colorfulHillsLoop: { he: "לופ הגבעות הצבעוניות", en: "Colorful Hills Loop" },
  colorfulHillsDesc: {
    he: "מעבר דרך סלעים צבעוניים וקניונים מרהיבים. דורש רמת כושר בינונית.",
    en: "Through colorful rocks and stunning canyons. Requires moderate fitness level.",
  },
  grandCanyonTrail: { he: "מסלול הקניון הגדול", en: "Grand Canyon Trail" },
  grandCanyonDesc: {
    he: "מסלול אתגרי עם ירידות ועליות תלולות. לרוכבים מנוסים בלבד!",
    en: "Challenging trail with steep descents and climbs. Experienced riders only!",
  },
  sunriseTrail: { he: "שביל הזריחה", en: "Sunrise Trail" },
  sunriseTrailDesc: {
    he: "מסלול קצר ומושלם לזריחה. נופים עוצרי נשימה על המכתש.",
    en: "Short trail perfect for sunrise. Breathtaking crater views.",
  },

  // WhatsApp
  whatsappMessage: {
    he: "היי, אני מעוניין/ת לשכור אופניים במצפה רמון",
    en: "Hi, I'm interested in renting a bike at Mitzpe Ramon",
  },

  // Booking Validation
  maxBikesError: {
    he: "להזמנות קבוצתיות מעל 15 משתתפים, אנא צרו קשר ישירות דרך וואטסאפ לסידורים מיוחדים.",
    en: "For group bookings of more than 15 participants, please contact us directly via WhatsApp for special arrangements.",
  },
  invalidHeight: {
    he: 'גובה לא תקין. אנא הזן גובה בין 120-210 ס"מ',
    en: "Invalid height. Please enter height between 120-210 cm",
  },
  selectHeight: { he: "בחר גובה", en: "Select Height" },
  heightCm: { he: 'ס"מ', en: "cm" },
  submitBookingRequest: { he: "אישור ותשלום", en: "Confirm & Pay" },
  bookingRequestSent: { he: "בקשת ההזמנה נשלחה!", en: "Booking Request Sent!" },
  pendingApprovalMessage: {
    he: "הבקשה התקבלה! הצוות שלנו יבדוק זמינות ויצור איתכם קשר תוך 60 דקות לסיום ההזמנה.",
    en: "Your request has been received! Our team will verify availability and contact you within 60 minutes to finalize the booking.",
  },
  awaitingConfirmation: { he: "ממתין לאישור", en: "Awaiting Confirmation" },
  bookingPending: { he: "ההזמנה ממתינה לאישור הצוות", en: "Booking pending team approval" },
  selectDate: { he: "יש לבחור תאריך", en: "Please select a date" },
  addAtLeastOneRider: { he: "יש להוסיף לפחות רוכב אחד", en: "Please add at least one rider" },
  noBikesAvailable: { he: "אין אופניים זמינים", en: "No bikes available" },
  noBikesForHeight: {
    he: 'אין אופניים מתאימים לגובה {height} ס"מ בתאריך זה',
    en: "No bikes available for height {height} cm on this date",
  },
  scrollToReadAgreement: { he: "יש לגלול ולקרוא את כל ההסכם", en: "Please scroll and read the entire agreement" },
  acceptTerms: { he: "יש לאשר את תנאי ההסכם", en: "Please accept the terms" },
  fillPhoneEmail: { he: "יש למלא טלפון ואימייל", en: "Please fill in phone and email" },
  selectPaymentMethod: { he: "יש לבחור אמצעי תשלום", en: "Please select a payment method" },
  inventoryLimitExceeded: {
    he: "מצטערים, יש לנו רק {available} אופניים זמינים לתאריך ושעה זו.",
    en: "Sorry, we only have {available} bikes available for this time slot.",
  },
  bikesForRent: {
    he: "{count} אופניים להשכרה",
    en: "{count} bikes for rent",
  },
  error: { he: "שגיאה", en: "Error" },
  submitting: { he: "שולח...", en: "Submitting..." },
  bookingFailed: { he: "יצירת ההזמנה נכשלה. אנא נסה שנית.", en: "Booking creation failed. Please try again." },
  portionsCount: { he: "מספר מנות", en: "Number of portions" },
  perPortion: { he: "למנה", en: "per portion" },
  picnicNotAvailable: {
    he: "הזמנת פיקניק זמינה רק להזמנות מעל 12 שעות מראש",
    en: "Picnic ordering is only available for bookings made more than 12 hours in advance",
  },
  legalTitle: { he: "תנאי השכרת אופניים - ramonrentride", en: "Bike Rental Terms - ramonrentride" },
  securityDeposit2: { he: "ערבון בטחוני", en: "Security Deposit" },
  creditCard: { he: "כרטיס אשראי", en: "Credit Card" },
  visaMastercard: { he: "ויזה / מאסטרקארד", en: "Visa / Mastercard" },
  bit: { he: "ביט", en: "Bit" },
  quickPayment: { he: "תשלום מהיר", en: "Quick Payment" },
  paybox: { he: "פייבוקס", en: "Paybox" },
  directTransfer: { he: "העברה ישירה", en: "Direct Transfer" },
  cash: { he: "מזומן", en: "Cash" },
  atBikeStation: { he: "בעמדת האופניים", en: "At bike station" },
  choosePaymentMethod: { he: "בחרו אמצעי תשלום", en: "Choose payment method" },
  confirmationSent: {
    he: "אישור נשלח למייל ולוואטסאפ. תזכורת תישלח יום לפני ההשכרה.",
    en: "Confirmation sent to email and WhatsApp. Reminder will be sent a day before rental.",
  },
  rider: { he: "רוכב", en: "Rider" },
  hours24: { he: "24 שעות", en: "24 hours" },

  // Coupon
  couponCode: { he: "קוד קופון", en: "Coupon Code" },
  enterCouponCode: { he: "הזן קוד קופון (אופציונלי)", en: "Enter coupon code (optional)" },
  checkCoupon: { he: "בדוק קופון", en: "Check Coupon" },
  couponApplied: { he: "הנחה הופעלה!", en: "Discount applied!" },
  couponDiscount: { he: "הנחת קופון", en: "Coupon Discount" },
  removeCoupon: { he: "הסר קופון", en: "Remove Coupon" },
  couponNotFound: { he: "קופון לא נמצא", en: "Coupon not found" },
  couponAlreadyUsed: { he: "קופון זה כבר נוצל", en: "This coupon has already been used" },
  originalPrice: { he: "מחיר מקורי", en: "Original Price" },
  afterDiscount: { he: "אחרי הנחה", en: "After Discount" },

  // Bike size validation
  noSuitableBikeForHeight: {
    he: 'אין אופניים מתאימים לגובה {height} ס"מ (מידה {size}). נא לבחור גובה אחר או ליצור קשר.',
    en: "No suitable bikes available for height {height}cm (size {size}). Please select a different height or contact us.",
  },
  bikeSizeMismatch: {
    he: "לצערנו, אין אופניים פנויים במידה המתאימה לגובה שהזנת.",
    en: "Unfortunately, there are no available bikes in the suitable size for your height.",
  },

  // Availability display
  availabilityForDate: { he: "זמינות אופניים לתאריך זה", en: "Bike availability for this date" },
  bikesAvailable: { he: "{available} זמינים", en: "{available} available" },
  totalAvailable: { he: 'סה"כ זמין: {available} אופניים', en: "Total: {available} bikes available" },
  sizeNotAvailable: { he: "אין זמין", en: "Not available" },
  lastOne: { he: "אחרון!", en: "Last one!" },
  heightRange: { he: "טווח גבהים", en: "Height range" },
  size: { he: "מידה", en: "Size" },
  available: { he: "זמין", en: "Available" },
  notAvailableForHeight: { he: "לא זמין לגובה זה", en: "Not available for this height" },
  lowAvailability: { he: "זמינות נמוכה", en: "Low availability" },
  phoneMustBe10Digits: { he: "מספר הטלפון חייב להכיל 10 ספרות", en: "Phone number must be exactly 10 digits" },
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("he");

  useEffect(() => {
    document.documentElement.dir = language === "he" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Missing translation for key: ${key}`);
      return key;
    }
    return translation[language];
  };

  const isRTL = language === "he";

  return <I18nContext.Provider value={{ language, setLanguage, t, isRTL }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
