import { z } from "zod";

export const BAD_EMAIL_MESSAGE = "Invalid email address.";
export const BAD_USERNAME_MESSAGE = "Invalid username.";
export const BAD_PW_MESSAGE = "Invalid password.";

export const usernameSchema = z
  .string(BAD_USERNAME_MESSAGE)
  .min(3, BAD_USERNAME_MESSAGE)
  .max(30, BAD_USERNAME_MESSAGE);
export const emailSchema = z.email(BAD_EMAIL_MESSAGE);
export const passwordSchema = z
  .string(BAD_PW_MESSAGE)
  .min(8, BAD_PW_MESSAGE)
  .max(128, BAD_PW_MESSAGE)
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).*$/,
    BAD_PW_MESSAGE
  );
