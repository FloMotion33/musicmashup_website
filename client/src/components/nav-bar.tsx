import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { LogIn, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function NavBar() {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <Link href="/">
          <a className="mr-8 flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">mm</span>
            </div>
            <span className="font-bold text-lg">musicmashup.io</span>
          </a>
        </Link>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center space-x-8">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center text-sm font-medium transition-colors hover:text-primary">
                  Products
                  <ChevronDown className="ml-1 h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <Link href="/">
                  <DropdownMenuItem className="cursor-pointer">
                    Mashup Maker
                  </DropdownMenuItem>
                </Link>
                <Link href="/products/bpm">
                  <DropdownMenuItem className="cursor-pointer">
                    BPM Detection
                  </DropdownMenuItem>
                </Link>
                <Link href="/products/vocal-remover">
                  <DropdownMenuItem className="cursor-pointer">
                    Vocal Remover
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
            
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
            <Button variant="outline" size="sm" className="ml-8">
              <LogIn className="mr-2 h-4 w-4" />
              Login
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}