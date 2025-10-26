'use client';

import React, { type ComponentProps, useState } from 'react';

import { cn } from '~/lib/utils';

import GoldBG from 'public/gold-bg.webp';
import PokerBG from 'public/poker-bg.jpg';
import { Minimize2, Maximize2 } from 'lucide-react';

interface OverlayProps extends ComponentProps<'div'> {
  variant?: 'fullscreen' | 'compact';
  minimizable?: boolean;
  title?: string;
}

export const Overlay = ({
  children,
  className,
  variant = 'fullscreen',
  minimizable = false,
  title = '',
  ...props
}: OverlayProps) => {
  const [isMinimized, setIsMinimized] = useState(false);

  if (variant === 'compact') {
    // Compact mode minimized - Show compact indicator at top
    if (minimizable && isMinimized) {
      return (
        <div className='pointer-events-none fixed inset-0 z-40'>
          <button
            type='button'
            className='pointer-events-auto fixed left-[50%] top-8 z-40 flex translate-x-[-50%] cursor-pointer items-center gap-3 rounded-full border border-amber-500/50 bg-background px-6 py-3 shadow-2xl transition-all hover:scale-105'
            style={{
              backgroundImage: `url(${GoldBG.src})`,
              objectFit: 'cover',
            }}
            onClick={() => setIsMinimized(false)}
          >
            <div className='font-poker text-lg text-amber-400'>{title}</div>
            <Maximize2 className='h-5 w-5 text-amber-400' />
          </button>
        </div>
      );
    }

    // Compact mode: Fixed bottom-center, doesn't block the game view
    return (
      <div className='pointer-events-none fixed inset-0 z-40'>
        <div
          className='pointer-events-auto fixed bottom-8 left-[50%] z-40 flex max-h-[60vh] translate-x-[-50%] gap-4 overflow-y-auto rounded-3xl border bg-background p-3 shadow-2xl'
          style={{
            backgroundImage: `url(${GoldBG.src})`,
            objectFit: 'cover',
          }}
        >
          <div
            className={cn(
              'relative min-h-[12rem] w-full min-w-[32rem] max-w-[40rem] rounded-2xl p-6',
              className
            )}
            style={{
              backgroundImage: `url(${PokerBG.src})`,
              objectFit: 'cover',
            }}
            {...props}
          >
            {Boolean(minimizable) && (
              <button
                type='button'
                className='absolute right-4 top-4 rounded-full bg-amber-500/20 p-2 transition-all hover:bg-amber-500/40'
                onClick={() => setIsMinimized(true)}
              >
                <Minimize2 className='h-5 w-5 text-amber-400' />
              </button>
            )}
            {children}
          </div>
        </div>
      </div>
    );
  }

  // Minimized state - Show compact indicator at top
  if (minimizable && isMinimized) {
    return (
      <div className='pointer-events-none fixed inset-0 z-40'>
        <button
          type='button'
          className='pointer-events-auto fixed left-[50%] top-8 z-40 flex translate-x-[-50%] cursor-pointer items-center gap-3 rounded-full border border-amber-500/50 bg-background px-6 py-3 shadow-2xl transition-all hover:scale-105'
          style={{
            backgroundImage: `url(${GoldBG.src})`,
            objectFit: 'cover',
          }}
          onClick={() => setIsMinimized(false)}
        >
          <div className='font-poker text-lg text-amber-400'>{title}</div>
          <Maximize2 className='h-5 w-5 text-amber-400' />
        </button>
      </div>
    );
  }

  // Fullscreen mode: Original behavior for shuffle/waiting/ended stages
  return (
    <div className='fixed inset-0 z-50 bg-black/80'>
      <div
        className='fixed left-[50%] top-[50%] z-50 flex translate-x-[-50%] translate-y-[-50%] gap-4 rounded-[6rem] border bg-background p-3'
        style={{
          backgroundImage: `url(${GoldBG.src})`,
          objectFit: 'cover',
        }}
      >
        <div
          className={cn(
            'relative min-h-[20rem] w-full min-w-[36rem] rounded-[5rem] p-8',
            className
          )}
          style={{
            backgroundImage: `url(${PokerBG.src})`,
            objectFit: 'cover',
          }}
          {...props}
        >
          {Boolean(minimizable) && (
            <button
              type='button'
              className='absolute right-4 top-4 rounded-full bg-amber-500/20 p-2 transition-all hover:bg-amber-500/40'
              onClick={() => setIsMinimized(true)}
            >
              <Minimize2 className='h-5 w-5 text-amber-400' />
            </button>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};
