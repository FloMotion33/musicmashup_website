import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

export default function NavBar() {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <Link href="/">
          <a className="mr-6 flex items-center space-x-2">
            <span className="font-bold">MusicMashup</span>
          </a>
        </Link>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="flex items-center">
            <Link href="/products">
              <a className="px-4 py-2 text-sm font-medium hover:text-primary">Products</a>
            </Link>
            <Link href="/pricing">
              <a className="px-4 py-2 text-sm font-medium hover:text-primary">Pricing</a>
            </Link>
            <Link href="/help">
              <a className="px-4 py-2 text-sm font-medium hover:text-primary">Help</a>
            </Link>
            <Link href="/about">
              <a className="px-4 py-2 text-sm font-medium hover:text-primary">About</a>
            </Link>
            <Link href="/trending">
              <a className="px-4 py-2 text-sm font-medium hover:text-primary">Trending Mashups</a>
            </Link>
          </div>
          <div className="flex items-center">
            <Link href="/login">
              <Button variant="outline" size="sm" className="ml-4">
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
