"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HeartHandshake } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export default function HomePage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // This is a mock login for demonstration purposes.
    // In a real application, you would use a proper authentication service.
    try {
      // We store the email to check for admin status on the dashboard.
      localStorage.setItem('userEmail', email);
      router.push('/dashboard');
    } catch (error) {
      console.error("Could not write to localStorage", error);
      toast({
        title: "Login Failed",
        description: "Could not save your session. Please enable storage access in your browser.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm mx-4 shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-3 mb-2">
            <HeartHandshake className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl font-bold">ResQ</CardTitle>
          </div>
          <CardDescription>Login to manage your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@example.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
