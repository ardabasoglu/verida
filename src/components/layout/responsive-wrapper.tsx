'use client';

import { ReactNode, useState, useEffect } from 'react';

interface ResponsiveWrapperProps {
  children: ReactNode;
  mobile?: ReactNode;
  tablet?: ReactNode;
  desktop?: ReactNode;
  className?: string;
}

export function ResponsiveWrapper({ 
  children, 
  mobile, 
  tablet, 
  desktop,
  className = '' 
}: ResponsiveWrapperProps) {
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth < 768) {
        setScreenSize('mobile');
      } else if (window.innerWidth < 1024) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const renderContent = () => {
    if (screenSize === 'mobile' && mobile) return mobile;
    if (screenSize === 'tablet' && tablet) return tablet;
    if (screenSize === 'desktop' && desktop) return desktop;
    return children;
  };

  return (
    <div className={className}>
      {renderContent()}
    </div>
  );
}

// Hook for responsive behavior
export function useResponsive() {
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const checkScreenSize = () => {
      if (window.innerWidth < 768) {
        setScreenSize('mobile');
      } else if (window.innerWidth < 1024) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return {
    isMobile: isClient && screenSize === 'mobile',
    isTablet: isClient && screenSize === 'tablet',
    isDesktop: isClient && screenSize === 'desktop',
    screenSize: isClient ? screenSize : 'desktop',
  };
}