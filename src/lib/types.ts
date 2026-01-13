export type BikeSize = 'XS' | 'S' | 'M' | 'L' | 'XL';
export type BikeStatus = 'available' | 'maintenance' | 'rented' | 'unavailable';
export type SessionType = 'morning' | 'daily';
export type IssueType = 'tire' | 'chain' | 'brake' | 'other';

export interface Bike {
  id: number;
  size: BikeSize;
  lockCode: string;
  status: BikeStatus;
  stickerNumber: string;
}

export interface Rider {
  id: string;
  name: string;
  height: number;
  birthDate?: string;
  isMinor?: boolean;
  signatureUrl?: string;
  guardianName?: string;
  guardianSignatureUrl?: string;
  assignedBike?: number;
  assignedSize?: BikeSize;
}

// New picnic menu item type for individual dish ordering
export interface PicnicMenuItem {
  id: string;
  name: string;
  nameHe: string;
  description?: string;
  descriptionHe?: string;
  price: number;
  category: 'sandwich' | 'salad' | 'dessert' | 'drink' | 'snack' | 'food';
  isAvailable: boolean;
  sortOrder: number;
}

// Updated picnic order with individual menu items
export interface PicnicOrderItem {
  menuItemId: string;
  name: string;
  nameHe: string;
  quantity: number;
  price: number;
}

export interface PicnicOrder {
  quantity: number;
  dietaryNotes: string;
  isVegan: boolean;
  isGlutenFree: boolean;
  items?: PicnicOrderItem[]; // Individual menu item selections
}

export interface Booking {
  id: string;
  date: string;
  session: SessionType;
  riders: Rider[];
  picnic?: PicnicOrder;
  includePicnic?: boolean;
  dietaryNotes?: string;
  status: 'pending' | 'confirmed' | 'checked-in' | 'active' | 'completed' | 'cancelled';
  totalPrice: number;
  securityHold: number;
  safetyBriefingCompleted: boolean;
  bikeConditionConfirmed: boolean;
  returnPhotos: string[];
  createdAt: string;
  phone: string;
  contactPhone?: string;
  email: string;
  legalAccepted: boolean;
  couponCode?: string;
  cancelledAt?: string;
  cancelledForFree?: boolean;
  paymentMethod?: string;
}

export interface MechanicIssue {
  id: string;
  bikeId: number;
  issueType: IssueType;
  description: string;
  reportedAt: string;
  resolved: boolean;
  resolvedAt?: string;
}

export interface HeightRange {
  size: BikeSize;
  minHeight: number;
  maxHeight: number;
}

export interface Pricing {
  morningSession: number;
  dailySession: number;
  picnic: number;
  lateFee: number;
  theftFee: number;
  securityHold: number;
}

export interface WeatherData {
  temperature: number;
  condition: string;
  isHeatwave: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  discount: number;
  discountType: 'percent' | 'fixed';
  usedBy?: string;
  usedAt?: string;
  usedByBookingId?: string;
  createdAt: string;
  bookingId?: string;
  isManual?: boolean;
  verificationEmail?: string;
  verified?: boolean;
}

export interface BikeMaintenanceLog {
  id: string;
  bikeId: number;
  date: string;
  description: string;
  technicianName?: string;
  resolved?: boolean;
}

export type UserRole = 'admin' | 'mechanic';

export interface AdminUser {
  id: string;
  name: string;
  password: string;
  role: UserRole;
}

export interface PartInventory {
  id: string;
  name: string;
  quantity: number;
  minQuantity: number;
  needsOrder: boolean;
}
