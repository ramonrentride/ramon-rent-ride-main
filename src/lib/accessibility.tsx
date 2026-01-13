import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  toggleHighContrast: () => void;
  toggleLargeText: () => void;
  toggleReducedMotion: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    const saved = localStorage.getItem('accessibility-settings');
    return saved ? JSON.parse(saved) : {
      highContrast: false,
      largeText: false,
      reducedMotion: false,
    };
  });

  useEffect(() => {
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
    
    // Apply high contrast
    if (settings.highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    
    // Apply large text
    if (settings.largeText) {
      document.documentElement.classList.add('large-text');
    } else {
      document.documentElement.classList.remove('large-text');
    }
    
    // Apply reduced motion
    if (settings.reducedMotion) {
      document.documentElement.classList.add('reduced-motion');
    } else {
      document.documentElement.classList.remove('reduced-motion');
    }
  }, [settings]);

  const toggleHighContrast = () => {
    setSettings(prev => ({ ...prev, highContrast: !prev.highContrast }));
  };

  const toggleLargeText = () => {
    setSettings(prev => ({ ...prev, largeText: !prev.largeText }));
  };

  const toggleReducedMotion = () => {
    setSettings(prev => ({ ...prev, reducedMotion: !prev.reducedMotion }));
  };

  return (
    <AccessibilityContext.Provider value={{ 
      settings, 
      toggleHighContrast, 
      toggleLargeText, 
      toggleReducedMotion 
    }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
