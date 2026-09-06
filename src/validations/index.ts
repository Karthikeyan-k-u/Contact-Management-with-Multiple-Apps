import * as z from 'zod';

export const PHONE_REGEX = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;
export const INSTAGRAM_USERNAME_REGEX = /^[a-zA-Z0-9._]{1,30}$/;

/**
 * Shared Contact Validation Schema
 */
export const contactSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().optional(),
  email: z
    .string()
    .trim()
    .refine((val) => val === '' || z.string().email().safeParse(val).success, {
      message: 'Please enter a valid email address',
    }),
  phone: z
    .string()
    .trim()
    .min(1, 'Phone number is required')
    .refine((val) => PHONE_REGEX.test(val), {
      message: 'Please enter a valid phone number (e.g. +1 415 555-0199)',
    }),
  whatsapp: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || PHONE_REGEX.test(val), {
      message: 'Please include country code for WhatsApp (e.g. +14155550199)',
    }),
  instagram: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || INSTAGRAM_USERNAME_REGEX.test(val.replace(/^@/, '')), {
      message: 'Instagram username should only contain letters, numbers, periods, and underscores (max 30 characters)',
    }),
  company: z.string().trim().optional(),
  jobTitle: z.string().trim().optional(),
  status: z.enum(['Lead', 'Customer', 'Prospect', 'VIP', 'Inactive']),
  website: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) =>
        !val ||
        val.startsWith('http://') ||
        val.startsWith('https://') ||
        !val.includes('.') ||
        z.string().url().safeParse(`https://${val}`).success,
      { message: 'Please enter a valid website URL' }
    ),
  address: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  tags: z.array(z.string()).default([]),
  groupIds: z.array(z.string()).default([]),
  favorite: z.boolean().default(false),
  avatar: z.string().optional(),
});

export type ContactEntityData = z.infer<typeof contactSchema>;

/**
 * Contact Form Schema (with UI-friendly comma-separated tagsString)
 */
export const contactFormSchema = contactSchema.omit({ tags: true }).extend({
  tagsString: z.string().optional(),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

/**
 * Shared Interaction Validation Schema
 */
export const interactionSchema = z.object({
  contactId: z.string().min(1, 'Please select a contact'),
  type: z.enum(['call', 'email', 'sms', 'whatsapp', 'instagram', 'note']),
  direction: z.enum(['incoming', 'outgoing']),
  subject: z.string().trim().min(1, 'Subject or title is required'),
  message: z.string().trim().min(1, 'Notes or message content is required'),
  status: z.string().default('Logged'),
  outcome: z.enum(['Answered', 'No answer', 'Voicemail', 'Busy', 'Callback requested']).optional(),
});

export type InteractionFormData = z.infer<typeof interactionSchema>;

/**
 * Shared Follow-Up Validation Schema
 */
export const followUpSchema = z.object({
  contactId: z.string().min(1, 'Please select a contact'),
  title: z.string().trim().min(1, 'Follow-up title is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  notes: z.string().trim().optional(),
});

export type FollowUpFormData = z.infer<typeof followUpSchema>;

/**
 * Shared Group Validation Schema
 */
export const groupSchema = z.object({
  name: z.string().trim().min(1, 'Group name is required').max(50, 'Group name cannot exceed 50 characters'),
  description: z.string().trim().max(200, 'Description cannot exceed 200 characters').optional(),
  color: z.string().min(1, 'Color accent is required'),
});

export type GroupFormData = z.infer<typeof groupSchema>;
