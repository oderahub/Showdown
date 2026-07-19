import Image from 'next/image';

import React, { type PropsWithChildren } from 'react';

import PokerTableImage from 'public/poker-table.png';

const GameLayout = ({ children }: PropsWithChildren) => {
  return (
    <div className='relative h-screen'>
      <div className='z-[2] flex h-screen w-full items-center justify-center'>
        {/* The source PNG is 4096x2448 but never renders wider than max-w-7xl
            (1280px). Without `sizes`, next/image requests w=3840, which takes
            ~2 minutes to generate in dev and ships ~4.5MB -- the table stayed
            blank until it finished. `priority` also drops the lazy-load delay,
            since this is the page's backdrop and always in view. */}
        <Image
          priority
          alt='Poker table'
          className='w-full max-w-7xl pt-24'
          sizes='(max-width: 1280px) 100vw, 1280px'
          src={PokerTableImage}
        />
      </div>
      {children}
    </div>
  );
};

export default GameLayout;
