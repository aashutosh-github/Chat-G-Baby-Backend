import z from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(3).max(30),
  age: z.number().min(10).max(100).optional(),
  email: z.preprocess(
    value => (typeof value == "string" ? value.trim().toLowerCase() : ""),
    z.email("Email must be valid"),
  ),
  password: z
    .string()
    .regex(/[A-Z]/, "There should be at least one capital letter in password")
    .regex(/[a-z]/, "There should be at least one small letter in password")
    .regex(/[0-9]/, "There should be at least one number in password")
    .regex(
      /[^a-zA-Z0-9]/,
      "There should be at least one special letter in password",
    )
    .min(8)
    .max(30),
});

export const loginSchema = z.object({
  email: z.preprocess(
    value => (typeof value == "string" ? value.trim().toLowerCase() : ""),
    z.email("Email must be valid"),
  ),
  password: z
    .string()
    .regex(/[A-Z]/, "There should be at least one capital letter in password")
    .regex(/[a-z]/, "There should be at least one small letter in password")
    .regex(/[0-9]/, "There should be at least one number in password")
    .regex(
      /[^a-zA-Z0-9]/,
      "There should be at least one special letter in password",
    )
    .min(8)
    .max(30),
});
