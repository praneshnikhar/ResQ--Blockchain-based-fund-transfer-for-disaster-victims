"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { ethers } from 'ethers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Wallet, Coins, Copy, UserCheck, Send, HeartHandshake, Shield } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

import abi from '@/lib/abi.json';
import { CONTRACT_ADDRESS } from '@/lib/constants';
import Link from 'next/link';

declare global {
  interface Window {
    ethereum?: ethers.providers.ExternalProvider;
  }
}

export default function ResQApp() {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [contractBalance, setContractBalance] = useState<string>('0');
  const [donationAmount, setDonationAmount] = useState<string>('');
  const [verifyRecipientAddress, setVerifyRecipientAddress] = useState<string>('');
  const [releaseRecipientAddress, setReleaseRecipientAddress] = useState<string>('');
  const [releaseAmount, setReleaseAmount] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { toast } = useToast();

  const initEthers = useCallback(async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(web3Provider);
        
        const accounts = await web3Provider.listAccounts();
        if (accounts.length > 0) {
          const userAccount = accounts[0];
          const web3Signer = web3Provider.getSigner();
          const resqContract = new ethers.Contract(CONTRACT_ADDRESS, abi, web3Signer);

          setAccount(userAccount);
          setSigner(web3Signer);
          setContract(resqContract);
        }
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initEthers();
  }, [initEthers]);

  const connectWallet = async () => {
    if (provider) {
      try {
        const accounts = await provider.send("eth_requestAccounts", []);
        const userAccount = accounts[0];
        const web3Signer = provider.getSigner();
        const resqContract = new ethers.Contract(CONTRACT_ADDRESS, abi, web3Signer);

        setAccount(userAccount);
        setSigner(web3Signer);
        setContract(resqContract);
        
        toast({
          title: "Wallet Connected",
          description: `Connected to ${userAccount.substring(0, 6)}...${userAccount.substring(userAccount.length - 4)}`,
        });
      } catch (error) {
        console.error("Error connecting wallet:", error);
        toast({
          title: "Connection Failed",
          description: "Could not connect to the wallet.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "MetaMask Not Found",
        description: "Please install MetaMask to use this dApp.",
        variant: "destructive",
      });
    }
  };

  const getContractBalance = useCallback(async () => {
    if (!contract) return;
    try {
      const balance = await contract.contractBalance();
      setContractBalance(ethers.utils.formatEther(balance));
    } catch (error) {
      console.error("Error fetching contract balance:", error);
    }
  }, [contract]);

  const checkAdmin = useCallback(async () => {
    if (!contract || !account) return;
    try {
      const adminAddress = await contract.admin();
      setIsAdmin(adminAddress.toLowerCase() === account.toLowerCase());
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
    }
  }, [contract, account]);

  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setAccount(null); setSigner(null); setContract(null); setIsAdmin(false);
        toast({ title: 'Wallet Disconnected' });
      } else if (accounts[0] !== account) {
        setAccount(accounts[0]);
        if(provider) {
            const web3Signer = provider.getSigner(accounts[0]);
            setSigner(web3Signer);
            setContract(new ethers.Contract(CONTRACT_ADDRESS, abi, web3Signer));
        }
      }
    };
    
    if (window.ethereum) {
        (window.ethereum as any).on('accountsChanged', handleAccountsChanged);
    }

    return () => {
      if ((window.ethereum as any)?.removeListener) {
        (window.ethereum as any).removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, [account, provider]);

  useEffect(() => {
    if(contract) {
      getContractBalance();
      checkAdmin();
    }
  }, [contract, account, getContractBalance, checkAdmin]);
  
  const handleDonate = async () => {
    if (!contract || !donationAmount || parseFloat(donationAmount) <= 0) {
      toast({ title: "Support failed", description: "Please enter a valid amount.", variant: "destructive" });
      return;
    }
    try {
      const tx = await contract.donate({ value: ethers.utils.parseEther(donationAmount) });
      toast({ title: "Processing Support", description: "Waiting for transaction confirmation..." });
      await tx.wait();
      toast({
        title: "Support Successful!",
        description: `Thank you for your support of ${donationAmount} MATIC.`,
        className: "bg-green-100 text-green-800",
      });
      setDonationAmount('');
      getContractBalance();
    } catch (error: any) {
      console.error("Support failed:", error);
      const errorMessage = error.data?.message || error.message;
      toast({ title: "Support Failed", description: errorMessage, variant: "destructive" });
    }
  };

  const handleVerifyRecipient = async () => {
    if (!contract || !ethers.utils.isAddress(verifyRecipientAddress)) {
      toast({ title: "Verification failed", description: "Please enter a valid recipient address.", variant: "destructive" });
      return;
    }
    try {
      const tx = await contract.verifyRecipient(verifyRecipientAddress);
      toast({ title: "Processing Verification", description: "Waiting for transaction confirmation..." });
      await tx.wait();
      toast({ title: "Recipient Verified", description: `Address ${verifyRecipientAddress.substring(0, 6)}... has been verified.`, className: "bg-green-100 text-green-800" });
      setVerifyRecipientAddress('');
    } catch (error: any) {
      console.error("Verification failed:", error);
      const errorMessage = error.data?.message || error.message;
      toast({ title: "Verification Failed", description: errorMessage, variant: "destructive" });
    }
  };

  const handleReleaseFunds = async () => {
    if (!contract || !ethers.utils.isAddress(releaseRecipientAddress) || !releaseAmount || parseFloat(releaseAmount) <= 0) {
      toast({ title: "Release failed", description: "Please enter a valid recipient and amount.", variant: "destructive" });
      return;
    }
    try {
      const tx = await contract.releaseFunds(releaseRecipientAddress, ethers.utils.parseEther(releaseAmount));
      toast({ title: "Processing Release", description: "Waiting for transaction confirmation..." });
      await tx.wait();
      toast({ title: "Funds Released", description: `${releaseAmount} MATIC released to ${releaseRecipientAddress.substring(0, 6)}...`, className: "bg-green-100 text-green-800" });
      setReleaseRecipientAddress('');
      setReleaseAmount('');
      getContractBalance();
    } catch (error: any) {
      console.error("Release failed:", error);
      const errorMessage = error.data?.message || error.message;
      toast({ title: "Release Failed", description: errorMessage, variant: "destructive" });
    }
  };

  const truncatedAccount = useMemo(() => {
    if (!account) return '';
    return `${account.substring(0, 6)}...${account.substring(account.length - 4)}`;
  }, [account]);

  const copyAddress = () => {
    if(account) {
      navigator.clipboard.writeText(account);
      toast({ title: "Address Copied!" });
    }
  }
  
  if (isLoading) {
    return (
        <div className="flex flex-col items-center min-h-screen w-full bg-background font-body p-4 sm:p-6 lg:p-8">
            <header className="w-full max-w-4xl flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <HeartHandshake className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl md:text-4xl font-headline font-bold">ResQ</h1>
                </div>
                <Skeleton className="h-10 w-40 rounded-md" />
            </header>
            <main className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2">
                    <Card className="w-full shadow-lg"><CardHeader><Skeleton className="h-8 w-48 rounded-md" /></CardHeader><CardContent><Skeleton className="h-10 w-1/2 rounded-md" /></CardContent></Card>
                </div>
                <Card className="shadow-lg"><CardHeader><Skeleton className="h-8 w-56 rounded-md" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-12 w-full rounded-md" /><Skeleton className="h-12 w-full rounded-md" /></CardContent></Card>
                <Card className="shadow-lg"><CardHeader><Skeleton className="h-8 w-40 rounded-md" /></CardHeader><CardContent><Skeleton className="h-10 w-full rounded-md" /></CardContent></Card>
            </main>
        </div>
    )
  }
  
  return (
    <div className="flex flex-col items-center min-h-screen w-full bg-background font-body p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-4xl flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
            <HeartHandshake className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-headline font-bold">ResQ</h1>
        </div>
        <div className='flex items-center gap-2'>
            {!account ? (
                <Button onClick={connectWallet} className="shadow-md transition-transform active:scale-95">
                    <Wallet className="mr-2 h-5 w-5" /> Connect Wallet
                </Button>
            ) : (
            <div className="flex items-center gap-2 p-2 rounded-lg border bg-card text-card-foreground">
                <span className="font-mono text-sm">{truncatedAccount}</span>
                <Button variant="ghost" size="icon" onClick={copyAddress} className="h-8 w-8">
                <Copy className="h-4 w-4" />
                </Button>
            </div>
            )}
             <Button asChild variant="outline">
                <Link href="/login">Login</Link>
            </Button>
        </div>
      </header>

      <main className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="md:col-span-2">
            <Card className="w-full shadow-lg">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Coins className="h-7 w-7 text-primary" />
                        <CardTitle className="text-2xl">Contract Balance</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-4xl font-bold font-mono">{parseFloat(contractBalance).toFixed(4)} MATIC</p>
                    <p className="text-sm text-muted-foreground mt-1">Total funds available for causes.</p>
                </CardContent>
            </Card>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
                <HeartHandshake className="h-7 w-7 text-primary" />
                <CardTitle className="text-2xl">Support a Cause</CardTitle>
            </div>
            <CardDescription>Your contribution can save lives. Thank you!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="number"
              placeholder="Amount in MATIC"
              value={donationAmount}
              onChange={(e) => setDonationAmount(e.target.value)}
              disabled={!account}
              className="text-lg"
            />
            <Button onClick={handleDonate} disabled={!account || !donationAmount} className="w-full shadow-md text-lg py-6 transition-transform active:scale-95">
              Support Now
            </Button>
          </CardContent>
        </Card>

        {account && (
            <Card className="shadow-lg">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Shield className="h-7 w-7 text-primary" />
                        <CardTitle className="text-2xl">Admin Panel</CardTitle>
                    </div>
                  <CardDescription>Verify recipients and release funds.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                 {isAdmin ? (
                    <>
                      <div className="space-y-2">
                        <h3 className="font-semibold flex items-center gap-2"><UserCheck className="h-5 w-5" /> Verify Recipient</h3>
                        <Input
                          placeholder="Recipient Address"
                          value={verifyRecipientAddress}
                          onChange={(e) => setVerifyRecipientAddress(e.target.value)}
                          className="font-mono"
                        />
                        <Button onClick={handleVerifyRecipient} className="w-full transition-transform active:scale-95" variant="secondary" disabled={!verifyRecipientAddress}>
                          Verify
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold flex items-center gap-2"><Send className="h-5 w-5" /> Release Funds</h3>
                        <Input
                          placeholder="Recipient Address"
                          value={releaseRecipientAddress}
                          onChange={(e) => setReleaseRecipientAddress(e.target.value)}
                          className="font-mono"
                        />
                        <Input
                          type="number"
                          placeholder="Amount in MATIC"
                          value={releaseAmount}
                          onChange={(e) => setReleaseAmount(e.target.value)}
                        />
                        <Button onClick={handleReleaseFunds} className="w-full transition-transform active:scale-95" variant="secondary" disabled={!releaseRecipientAddress || !releaseAmount}>
                          Release
                        </Button>
                      </div>
                    </>
                 ) : (
                    <p className="text-muted-foreground">You are not the admin. This section is restricted.</p>
                 )}
                </CardContent>
            </Card>
        )}
      </main>

      <footer className="w-full max-w-4xl mt-12 text-center text-muted-foreground text-sm">
        <p>Empowering communities, one rescue at a time.</p>
        <p>Contract Address: <a href={`https://mumbai.polygonscan.com/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer" className="font-mono text-primary hover:underline">{CONTRACT_ADDRESS}</a></p>
      </footer>
    </div>
  );
}
