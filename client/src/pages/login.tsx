import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Music2 } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="flex flex-col items-center space-y-6 text-center mb-8">
          <div className="h-12 w-12 rounded-full bg-[#2B4D66] flex items-center justify-center">
            <span className="text-white font-bold text-lg">mm</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="text-muted-foreground">Log in to continue creating mashups</p>
          </div>
        </div>

        <form className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="Enter your email" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="Enter your password" />
          </div>
          
          <Button className="w-full" size="lg">
            Log In
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <p className="text-muted-foreground">
            Don't have an account?{" "}
            <a href="/register" className="text-primary hover:underline">
              Sign up
            </a>
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-border">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Music2 className="h-4 w-4" />
            <p>Join thousands of music creators</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
