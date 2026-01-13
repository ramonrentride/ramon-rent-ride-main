import { MessageCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export function WhatsAppButton() {
  const { isRTL } = useI18n();
  
  const phoneNumber = '972501234567'; // Replace with actual phone number
  const message = isRTL 
    ? 'היי, אני מעוניין/ת להשכיר אופניים במצפה רמון'
    : 'Hi, I\'m interested in renting a bike at Mitzpe Ramon';
  
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 z-50 flex items-center justify-center w-14 h-14 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
      aria-label="Contact via WhatsApp"
    >
      <MessageCircle className="w-7 h-7" fill="white" />
    </a>
  );
}
