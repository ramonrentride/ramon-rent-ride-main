import { z } from 'zod';

// Israeli phone number format: 05X-XXXXXXX (10 digits)
const israeliPhoneRegex = /^05\d{8}$/;

// Email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Rider validation schema
export const riderSchema = z.object({
  id: z.string(),
  name: z.string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[\u0590-\u05FFa-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens and apostrophes'),
  height: z.number()
    .min(120, 'Height must be at least 120cm')
    .max(210, 'Height must be at most 210cm'),
  assignedBike: z.number().optional(),
  assignedSize: z.string().optional(),
});

// Contact info validation schema
export const contactSchema = z.object({
  phone: z.string()
    .trim()
    .regex(israeliPhoneRegex, 'Phone must be a valid Israeli mobile number (05XXXXXXXX)'),
  email: z.string()
    .trim()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters'),
});

// Picnic order validation schema
export const picnicSchema = z.object({
  quantity: z.number().min(0).max(50),
  dietaryNotes: z.string().max(500, 'Dietary notes must be less than 500 characters').optional(),
  isVegan: z.boolean().optional(),
  isGlutenFree: z.boolean().optional(),
});

// Full booking validation schema
export const bookingValidationSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  session: z.enum(['morning', 'daily']),
  riders: z.array(riderSchema).min(1, 'At least one rider is required'),
  contact: contactSchema,
  picnic: picnicSchema.optional(),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  legalAccepted: z.literal(true, { 
    errorMap: () => ({ message: 'You must accept the terms and conditions' }) 
  }),
});

// Helper function to validate rider name
export function validateRiderName(name: string): { valid: boolean; error?: string } {
  const result = riderSchema.shape.name.safeParse(name);
  if (!result.success) {
    return { valid: false, error: result.error.issues[0]?.message };
  }
  return { valid: true };
}

// Helper function to validate phone
export function validatePhone(phone: string): { valid: boolean; error?: string } {
  const result = contactSchema.shape.phone.safeParse(phone);
  if (!result.success) {
    return { valid: false, error: result.error.issues[0]?.message };
  }
  return { valid: true };
}

// Helper function to validate email
export function validateEmail(email: string): { valid: boolean; error?: string } {
  const result = contactSchema.shape.email.safeParse(email);
  if (!result.success) {
    return { valid: false, error: result.error.issues[0]?.message };
  }
  return { valid: true };
}

// Helper function to validate dietary notes
export function validateDietaryNotes(notes: string): { valid: boolean; error?: string } {
  const result = picnicSchema.shape.dietaryNotes.safeParse(notes);
  if (!result.success) {
    return { valid: false, error: result.error.issues[0]?.message };
  }
  return { valid: true };
}

// Sanitize text input - basic XSS prevention
export function sanitizeText(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 500); // Limit length
}
