import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import CvAnalysisPage from "@/pages/cv-analysis";
import MockInterviewPage from "@/pages/mock-interview";
import CareerHubPage from "@/pages/career-hub";
import FeedbackPage from "@/pages/feedback";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/cv-analysis" component={CvAnalysisPage} />
      <ProtectedRoute path="/mock-interview" component={MockInterviewPage} />
      <ProtectedRoute path="/career-hub" component={CareerHubPage} />
      <ProtectedRoute path="/feedback" component={FeedbackPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
