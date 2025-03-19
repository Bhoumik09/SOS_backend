import { z } from "zod";
import { Request } from "express";

/**
 * Zod schema for validating upload request body
 */
export const uploadSchema = z.object({
  name: z.string(),
  mobile: z.string()
});

/**
 * Infer TypeScript type from the Zod schema
 */
export type UploadRequestBody = z.infer<typeof uploadSchema>;

/**
 * Extend Express request type with our validated body and files
 */
export interface UploadRequest extends Request {
  body: UploadRequestBody; // Ensure body follows Zod validation
  files?: {
    image?: Express.Multer.File[]; // Multer's file type
    video?: Express.Multer.File[];
  };
}
