import { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import { NsfwProvider } from "./contexts/NsfwContext";
import { AuthProvider } from "./contexts/AuthContext";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import { IntroVideoScreen } from "./components/intro/IntroVideoScreen";
import InstallPrompt from "./components/pwa/InstallPrompt";
import DiscoverPage from "./pages/DiscoverPage";
import ChatPage from "./pages/ChatPage";
import CreateCharacterPage from "./pages/CreateCharacterPage";
import MessagesPage from "./pages/MessagesPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import AgePolicyPage from "./pages/AgePolicyPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();
const isCapacitor = Capacitor.isNativePlatform();

const App = () => {
  const [showIntro, setShowIntro] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isCapacitor) return;

    let listenerHandle: { remove: () => Promise<void> } | null = null;

    import("@capacitor/app")
      .then(({ App: CapApp }) =>
        CapApp.addListener("appUrlOpen", async (event) => {
          console.log("[Capacitor] Deep link received:", event.url);

          // Close the system browser that was opened for OAuth
          try {
            const { Browser } = await import("@capacitor/browser");
            await Browser.close();
            console.log("[Capacitor] System browser closed after OAuth callback");
          } catch (e) {
            console.warn("[Capacitor] Could not close browser (may not have been open):", e);
          }

          try {
            // The URL may arrive as:
            //   com.syntheticdigitallabs.latingirlsvoice://google-auth#access_token=...&refresh_token=...
            //   com.syntheticdigitallabs.latingirlsvoice://google-auth?code=...
            const hashPart = event.url.split("#")[1] || "";
            const queryPart = (event.url.split("?")[1] || "").split("#")[0];

            const hashParams = new URLSearchParams(hashPart);
            const queryParams = new URLSearchParams(queryPart);

            const accessToken = hashParams.get("access_token") || queryParams.get("access_token");
            const refreshToken = hashParams.get("refresh_token") || queryParams.get("refresh_token");
            const code = queryParams.get("code") || hashParams.get("code");

            if (accessToken && refreshToken) {
              console.log("[Capacitor] Tokens found in deep link, restoring session...");
              sessionStorage.setItem("__cap_oauth_access_token", accessToken);
              sessionStorage.setItem("__cap_oauth_refresh_token", refreshToken);
              window.location.hash = "";
              window.location.reload();
            } else if (code) {
              console.log("[Capacitor] Auth code found in deep link, exchanging...");
              sessionStorage.setItem("__cap_oauth_code", code);
              window.location.reload();
            } else {
              console.warn("[Capacitor] Deep link received but no tokens or code found:", event.url);
            }
          } catch (e) {
            console.error("[Capacitor] Error processing deep link:", e);
          }
        })
      )
      .then((handle) => {
        listenerHandle = handle;
      })
      .catch((err) => {
        console.warn("[Capacitor] Could not load @capacitor/app:", err);
      });

    return () => {
      if (listenerHandle) void listenerHandle.remove();
    };
  }, []);

  useEffect(() => {
    // Check if user has seen intro before
    const hasSeenIntro = localStorage.getItem('intro_video_seen') === 'true';
    setShowIntro(!hasSeenIntro);
  }, []);

  // Show nothing while checking localStorage
  if (showIntro === null) {
    return null;
  }

  // Show intro video if first visit
  if (showIntro) {
    return <IntroVideoScreen onComplete={() => setShowIntro(false)} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <NsfwProvider>
              <Toaster />
              <Sonner />
              <InstallPrompt />
              <BrowserRouter>
                <Routes>
                  <Route element={<MainLayout />}>
                    <Route path="/" element={<DiscoverPage />} />
                    <Route path="/messages" element={<MessagesPage />} />
                    <Route path="/create" element={<CreateCharacterPage />} />
                    <Route path="/subscription" element={<SubscriptionPage />} />
                  </Route>
                  <Route path="/chat/:id" element={<ChatPage />} />
                  <Route path="/privacy" element={<PrivacyPolicyPage />} />
                  <Route path="/terms" element={<TermsOfServicePage />} />
                  <Route path="/age-policy" element={<AgePolicyPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </NsfwProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
