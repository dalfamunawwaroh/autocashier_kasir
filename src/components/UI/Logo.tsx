import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

export default function Logo() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-10 w-32 bg-white/5 animate-pulse rounded-lg" />;
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <div className="flex items-center group cursor-pointer">
      <img 
        src={isDark ? "/AutoCashier BW.png" : "/AutoCashier.png"} 
        alt="AutoCashier Logo" 
        className="h-10 md:h-12 w-auto object-contain transition-all duration-500 group-hover:scale-105"
      />
    </div>
  );
}
