import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Switch, Route } from "wouter";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import ContractBuilder from "./pages/ContractBuilder";
import Decoder from "./pages/Decoder";
import Templates from "./pages/Templates";
import Forum from "./pages/Forum";
import ContractExplorer from "./pages/ContractExplorer";
import TestSuiteGenerator from "./pages/TestSuiteGenerator";

function Router() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/contract-builder" component={ContractBuilder} />
          <Route path="/decoder" component={Decoder} />
          <Route path="/templates" component={Templates} />
          <Route path="/forum" component={Forum} />
          <Route path="/explorer" component={ContractExplorer} />
          <Route path="/test-suite" component={TestSuiteGenerator} />
          <Route>404 Page Not Found</Route>
        </Switch>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  </StrictMode>,
);
