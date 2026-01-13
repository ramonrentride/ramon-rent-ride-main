// App v1.3 - With Booking Confirmation
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { I18nProvider } from "@/lib/i18n";
import { AccessibilityProvider } from "@/lib/accessibility";
import { AccessibilityMenu } from "@/components/AccessibilityMenu";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import Index from "./pages/Index";
import BookingPage from "./pages/BookingPage";
import BookingConfirmationPage from "./pages/BookingConfirmationPage";
import RiderDashboard from "./pages/RiderDashboard";
import RiderInfoPage from "./pages/RiderInfoPage";
import AdminDashboard from "./pages/AdminDashboard";
import GuestPage from "./pages/GuestPage";
import AuthPage from "./pages/AuthPage";
import SetupPage from "./pages/SetupPage";
import TermsLiabilityPage from "./pages/TermsLiabilityPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <AccessibilityProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/booking" element={<BookingPage />} />
              <Route path="/booking/confirmation" element={<BookingConfirmationPage />} />
              <Route path="/dashboard" element={<RiderDashboard />} />
              <Route path="/rider-info" element={<RiderInfoPage />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/setup" element={<SetupPage />} />
              <Route path="/guest" element={<GuestPage />} />
              <Route path="/terms-liability" element={<TermsLiabilityPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <AccessibilityMenu />
            <WhatsAppButton />
          </BrowserRouter>
        </TooltipProvider>
      </AccessibilityProvider>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;
