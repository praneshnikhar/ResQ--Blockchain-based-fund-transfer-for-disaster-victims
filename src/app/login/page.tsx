"use client"
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page is deprecated and now redirects to the root login page.
export default function LoginPageRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/');
  }, [router]);

  return null;
}
