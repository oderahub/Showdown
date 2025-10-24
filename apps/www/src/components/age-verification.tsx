'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shield, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';

export const AgeVerificationModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [hasRead, setHasRead] = useState(false);

  useEffect(() => {
    // Check if user has already verified
    const verified = localStorage.getItem('age_verified');
    const verifiedDate = localStorage.getItem('age_verified_date');

    if (!verified) {
      setIsOpen(true);
    } else {
      // Optional: Re-verify after 30 days
      const daysSinceVerification = verifiedDate
        ? (Date.now() - parseInt(verifiedDate)) / (1000 * 60 * 60 * 24)
        : 0;

      if (daysSinceVerification > 30) {
        setIsOpen(true);
      }
    }
  }, []);

  const handleConfirm = () => {
    if (hasAgreed && hasRead) {
      localStorage.setItem('age_verified', 'true');
      localStorage.setItem('age_verified_date', Date.now().toString());
      localStorage.setItem('terms_accepted', 'true');
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => { /* Prevent closing */ }}>
      <DialogContent
        className="max-w-md"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-16 w-16 text-yellow-500" />
          </div>
          <DialogTitle className="text-2xl text-center">
            Age Verification Required
          </DialogTitle>
          <DialogDescription className="text-center">
            This platform involves real cryptocurrency gambling
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-yellow-500/10 p-4 border border-yellow-500/20">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-yellow-500 mb-2">Legal Requirements</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• You must be 18+ years old (21+ in some jurisdictions)</li>
                  <li>• Online gambling must be legal in your location</li>
                  <li>• This involves real cryptocurrency with financial risk</li>
                  <li>• You are solely responsible for compliance with local laws</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <Checkbox
                checked={hasAgreed}
                id="age-confirm"
                onCheckedChange={(checked) => setHasAgreed(checked as boolean)}
              />
              <label
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                htmlFor="age-confirm"
              >
                I confirm that I am at least 18 years old (21+ where required) and that online gambling is legal in my jurisdiction
              </label>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                checked={hasRead}
                id="terms-confirm"
                onCheckedChange={(checked) => setHasRead(checked as boolean)}
              />
              <label
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                htmlFor="terms-confirm"
              >
                I have read and agree to the{' '}
                <Link
                  className="text-primary underline hover:text-primary/80"
                  href="/terms"
                  target="_blank"
                >
                  Terms & Conditions
                </Link>
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            className="w-full"
            disabled={!hasAgreed || !hasRead}
            size="lg"
            onClick={handleConfirm}
          >
            I Confirm - Enter Platform
          </Button>
        </DialogFooter>

        <p className="text-xs text-center text-muted-foreground mt-2">
          By continuing, you acknowledge the risks involved in cryptocurrency gambling
        </p>
      </DialogContent>
    </Dialog>
  );
};