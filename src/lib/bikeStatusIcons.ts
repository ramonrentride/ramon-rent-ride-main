// Standardized status icons across the entire app
export const BIKE_STATUS_ICONS = {
  available: '✅',    // Ready for rental
  maintenance: '🛠️', // Under repair
  rented: '❌',       // Currently rented out
  qr: '⚡',          // QR Quick Rent mode
} as const;

export type BikeStatusIconKey = keyof typeof BIKE_STATUS_ICONS;

export const getStatusIcon = (status: string): string => {
  const normalizedStatus = status.toLowerCase() as BikeStatusIconKey;
  return BIKE_STATUS_ICONS[normalizedStatus] || BIKE_STATUS_ICONS.available;
};

export const getStatusLabel = (status: string, lang: 'he' | 'en' = 'he'): string => {
  const labels: Record<string, { he: string; en: string }> = {
    available: { he: 'זמין', en: 'Available' },
    maintenance: { he: 'בתחזוקה', en: 'Maintenance' },
    rented: { he: 'מושכר', en: 'Rented' },
    qr: { he: 'QR מהיר', en: 'QR Quick' },
  };
  
  const normalizedStatus = status.toLowerCase();
  return labels[normalizedStatus]?.[lang] || status;
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    available: 'text-green-600 bg-green-100',
    maintenance: 'text-yellow-600 bg-yellow-100',
    rented: 'text-red-600 bg-red-100',
    qr: 'text-blue-600 bg-blue-100',
  };
  
  const normalizedStatus = status.toLowerCase();
  return colors[normalizedStatus] || colors.available;
};
