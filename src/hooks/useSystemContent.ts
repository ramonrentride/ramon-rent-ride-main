import { useSiteContent, SiteContent } from './useSiteContent';

// Helper hook to get system page content with defaults
export function useSystemContent() {
  const { data: safetyItems } = useSiteContent('riderDashboard.safety');
  const { data: dashboardSteps } = useSiteContent('riderDashboard.steps');
  const { data: dashboardMessages } = useSiteContent('riderDashboard.messages');
  const { data: guestUI } = useSiteContent('guestArea.ui');

  // Default safety items
  const defaultSafetyItems = [
    'אני מתחייב/ת לרכב עם קסדה בכל עת',
    'אני מכיר/ה את השבילים המותרים לרכיבה',
    'אני יודע/ת איך להשתמש בהילוכים ובבלמים',
    'יש לי מים וטלפון נייד טעון',
    'אני מודע/ת לסכנות החום והמדבר',
  ];

  // Default step names
  const defaultSteps = ['תדריך בטיחות', 'קודים', 'אישור מצב', 'החזרה', 'תודה'];

  // Get active safety items from CMS or use defaults
  const getSafetyItems = (isRTL: boolean = true): string[] => {
    if (safetyItems && safetyItems.filter(i => i.isActive).length > 0) {
      return safetyItems
        .filter(i => i.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(item => isRTL ? (item.valueHe || '') : (item.valueEn || item.valueHe || ''));
    }
    return defaultSafetyItems;
  };

  // Get step names from CMS or use defaults
  const getStepNames = (isRTL: boolean = true): string[] => {
    if (dashboardSteps && dashboardSteps.length > 0) {
      return defaultSteps.map((defaultName, index) => {
        const step = dashboardSteps.find(s => s.metadata?.stepIndex === index);
        if (step) {
          return isRTL ? (step.valueHe || defaultName) : (step.valueEn || step.valueHe || defaultName);
        }
        return defaultName;
      });
    }
    return defaultSteps;
  };

  // Get message by key from CMS
  const getMessage = (key: string, defaultValue: string, isRTL: boolean = true): string => {
    if (dashboardMessages) {
      const message = dashboardMessages.find(m => m.metadata?.messageKey === key && m.isActive);
      if (message) {
        return isRTL ? (message.valueHe || defaultValue) : (message.valueEn || message.valueHe || defaultValue);
      }
    }
    return defaultValue;
  };

  // Get UI text by key from CMS
  const getUIText = (key: string, defaultValue: string, isRTL: boolean = true): string => {
    if (guestUI) {
      const text = guestUI.find(t => t.metadata?.uiKey === key && t.isActive);
      if (text) {
        return isRTL ? (text.valueHe || defaultValue) : (text.valueEn || text.valueHe || defaultValue);
      }
    }
    return defaultValue;
  };

  return {
    safetyItems,
    dashboardSteps,
    dashboardMessages,
    guestUI,
    getSafetyItems,
    getStepNames,
    getMessage,
    getUIText,
  };
}
