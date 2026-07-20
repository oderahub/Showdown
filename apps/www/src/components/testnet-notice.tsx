'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FlaskConical, AlertCircle } from 'lucide-react';
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

export const TestnetNoticeModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const [hasRead, setHasRead] = useState(false);

  useEffect(() => {
    const acknowledged = localStorage.getItem('testnet_notice_ack');
    const acknowledgedDate = localStorage.getItem('testnet_notice_ack_date');

    if (!acknowledged) {
      setIsOpen(true);
    } else {
      const daysSince = acknowledgedDate
        ? (Date.now() - parseInt(acknowledgedDate)) / (1000 * 60 * 60 * 24)
        : 0;

      if (daysSince > 30) {
        setIsOpen(true);
      }
    }
  }, []);

  const handleConfirm = () => {
    if (hasAcknowledged && hasRead) {
      localStorage.setItem('testnet_notice_ack', 'true');
      localStorage.setItem('testnet_notice_ack_date', Date.now().toString());
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
            <FlaskConical className="h-16 w-16 text-yellow-500" />
          </div>
          <DialogTitle className="text-2xl text-center">
            Testnet Preview
          </DialogTitle>
          <DialogDescription className="text-center">
            Showdown runs on a test network. Nothing here has monetary value.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-yellow-500/10 p-4 border border-yellow-500/20">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-yellow-500 mb-2">Before you play</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Stakes use free testnet tokens with no real-world value</li>
                  <li>• The contracts are unaudited and provided as-is</li>
                  <li>• Shuffle proofs are currently verified client-side, not on-chain</li>
                  <li>• Game state may be reset without notice as development continues</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <Checkbox
                checked={hasAcknowledged}
                id="testnet-confirm"
                onCheckedChange={(checked) => setHasAcknowledged(checked as boolean)}
              />
              <label
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                htmlFor="testnet-confirm"
              >
                I understand this is an unaudited testnet preview and that no real money is at stake
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
            disabled={!hasAcknowledged || !hasRead}
            size="lg"
            onClick={handleConfirm}
          >
            Enter Testnet Preview
          </Button>
        </DialogFooter>

        <p className="text-xs text-center text-muted-foreground mt-2">
          Showdown is a skill-based poker game. This deployment is for testing and
          demonstration only and does not offer real-money play.
        </p>
      </DialogContent>
    </Dialog>
  );
};
