import { z } from "zod";

export const userSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  avatar: z.string().url("Invalid avatar URL"),
  active: z.boolean(),
  role: z.string().min(1, "Role is required"),
  bio: z.string(),
});

export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^[\d\s\-\(\)x+]+$/, "Invalid phone number format"),
  avatar: z.string().url("Invalid avatar URL").optional(),
  active: z.boolean().default(true),
  role: z.string().min(1, "Role is required"),
  bio: z.string().max(500, "Bio must be 500 characters or less"),
});

export const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long").optional(),
  email: z.string().email("Invalid email address").optional(),
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^[\d\s\-\(\)x+]+$/, "Invalid phone number format")
    .optional(),
  avatar: z.string().url("Invalid avatar URL").optional(),
  active: z.boolean().optional(),
  role: z.string().min(1, "Role is required").optional(),
  bio: z.string().max(500, "Bio must be 500 characters or less").optional(),
});

export type UserSchema = z.infer<typeof userSchema>;
export type CreateUserSchema = z.infer<typeof createUserSchema>;
export type UpdateUserSchema = z.infer<typeof updateUserSchema>;

// Phone number regex (flexible format)
const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;

export const userFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters'),
  
  email: z
    .string()
    .email('Invalid email address'),
  
  phoneNumber: z
    .string()
    .regex(phoneRegex, 'Invalid phone number format'),
  
  role: z
    .string()
    .min(1, 'Please select a role'),
  
  active: z
    .boolean()
    .default(true),
  
  avatar: z
    .string()
    .url('Invalid URL format')
    .optional()
    .or(z.literal('')),
  
  bio: z
    .string()
    .max(500, 'Bio must not exceed 500 characters')
    .optional(),
});

export type UserFormValues = z.infer<typeof userFormSchema>;

// Default values for new user
export const defaultUserValues: Partial<UserFormValues> = {
  name: '',
  email: '',
  phoneNumber: '',
  role: '',
  active: true,
  avatar: '',
  bio: '',
};

