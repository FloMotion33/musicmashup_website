import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Products from "@/pages/products";
import Pricing from "@/pages/pricing";
import Help from "@/pages/help";
import About from "@/pages/about";
import Trending from "@/pages/trending";
import NavBar from "@/components/nav-bar";
import Login from "@/pages/login";
import BpmDetection from "@/pages/bpm-detection";
import VocalRemover from "@/pages/vocal-remover";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/products" component={Products} />
      <Route path="/products/bpm" component={BpmDetection} />
      <Route path="/products/vocal-remover" component={VocalRemover} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/help" component={Help} />
      <Route path="/about" component={About} />
      <Route path="/trending" component={Trending} />
      <Route path="/login" component={Login} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NavBar />
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;