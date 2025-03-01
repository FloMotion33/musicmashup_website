import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

export default function NavBar() {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <Link href="/">
          <a className="mr-6 flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-[#2B4D66] flex items-center justify-center">
              <span className="text-white font-bold text-sm">mm</span>
            </div>
            <span className="font-bold">MusicMashup</span>
          </a>
        </Link>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center space-x-6">
            <Link href="/products">
              <a className="text-sm font-medium transition-colors hover:text-primary">Products</a>
            </Link>
            <Link href="/pricing">
              <a className="text-sm font-medium transition-colors hover:text-primary">Pricing</a>
            </Link>
            <Link href="/help">
              <a className="text-sm font-medium transition-colors hover:text-primary">Help</a>
            </Link>
            <Link href="/about">
              <a className="text-sm font-medium transition-colors hover:text-primary">About</a>
            </Link>
            <Link href="/trending">
              <a className="text-sm font-medium transition-colors hover:text-primary">Trending Mashups</a>
            </Link>
          </nav>

          <Link href="/login">
            <Button variant="outline" size="sm">
              <LogIn className="mr-2 h-4 w-4" />
              Login
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}