import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import Index from "./pages/Index";
import Contact from "./pages/Contact";
import RefundCancellation from "./pages/RefundCancellation";
import TermsConditions from "./pages/TermsConditions";
import PaymentStatus from './pages/PaymentStatus';
import PricingPage from './pages/PricingPage';
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SubscriptionProvider>
        <div className="min-h-screen bg-slate-900">
          <Toaster />
          <Sonner theme="dark" />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/payment-status" element={<PaymentStatus />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/refund-cancellation" element={<RefundCancellation />} />
              <Route path="/terms" element={<TermsConditions />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </div>
      </SubscriptionProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
