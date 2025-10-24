import React, { type ComponentProps } from 'react';

import { cn } from '~/lib/utils';

import GoldBG from 'public/gold-bg.webp';
import PokerBG from 'public/poker-bg.jpg';

interface OverlayProps extends ComponentProps<'div'> {
  variant?: 'fullscreen' | 'compact';
}

export const Overlay = ({
  children,
  className,
  variant = 'fullscreen',
  ...props
}: OverlayProps) => {
  if (variant === 'compact') {
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
              'min-h-[12rem] w-full min-w-[32rem] max-w-[40rem] rounded-2xl p-6',
              className
            )}
            style={{
              backgroundImage: `url(${PokerBG.src})`,
              objectFit: 'cover',
            }}
            {...props}
          >
            {children}
          </div>
        </div>
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
            'min-h-[20rem] w-full min-w-[36rem] rounded-[5rem] p-8',
            className
          )}
          style={{
            backgroundImage: `url(${PokerBG.src})`,
            objectFit: 'cover',
          }}
          {...props}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
