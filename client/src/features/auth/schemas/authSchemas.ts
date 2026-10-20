import { z } from 'zod'

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Enter your email address.')
  .email('Enter a valid email address.')

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, 'Enter your password.')
    .min(8, 'Password must be at least 8 characters.'),
  remember: z.boolean(),
})

export const signupSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Enter your name.')
      .min(2, 'Name must be at least 2 characters.')
      .max(80, 'Name must be 80 characters or fewer.'),
    email: emailSchema,
    password: z
      .string()
      .min(1, 'Create a password.')
      .min(8, 'Use at least 8 characters.')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
        'Include at least one uppercase letter and one number.',
      ),
    confirmPassword: z.string().min(1, 'Confirm your password.'),
    terms: z.boolean().refine((accepted) => accepted, {
      message: 'Please accept the terms to continue.',
    }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })

export type LoginValues = z.infer<typeof loginSchema>
export type SignupValues = z.infer<typeof signupSchema>
