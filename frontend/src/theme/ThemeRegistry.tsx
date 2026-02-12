'use client';

import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { useServerInsertedHTML } from 'next/navigation';
import { useState } from 'react';

export default function ThemeRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cache] = useState(() => {
    const cache = createCache({ key: 'mui', prepend: true });
    cache.compat = true;
    return cache;
  });

  useServerInsertedHTML(() => {
    const insertedKeys = Object.keys(cache.inserted);
    if (insertedKeys.length === 0) {
      return null;
    }

    const styles = insertedKeys
      .map((key) => cache.inserted[key])
      .filter((style): style is string => typeof style === 'string');

    return (
      <style
        data-emotion={`${cache.key} ${insertedKeys.join(' ')}`}
        dangerouslySetInnerHTML={{ __html: styles.join(' ') }}
      />
    );
  });

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}
