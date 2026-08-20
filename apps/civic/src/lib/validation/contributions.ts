import { z } from "zod";
import { entityTypeEnum, flagReasonEnum, noteKindEnum } from "@/lib/db/schema";

const markdownBody = z
  .string()
  .trim()
  .min(1, "Content is required.")
  .max(20000, "Content is too long (max 20,000 characters).");

export const pageSectionInputSchema = z.object({
  headingEn: z.string().trim().min(1, "Heading is required.").max(160),
  headingAm: z.string().trim().max(160).optional().default(""),
  bodyEn: markdownBody,
  bodyAm: z.string().trim().max(20000).optional().default(""),
  layer: z.enum(["official", "community"]),
});

export const pageEditSchema = z.object({
  titleEn: z.string().trim().min(3, "Title is required.").max(160),
  titleAm: z.string().trim().max(160).optional().default(""),
  summaryEn: z.string().trim().min(10, "Summary must be at least 10 characters.").max(600),
  summaryAm: z.string().trim().max(600).optional().default(""),
  sections: z
    .array(pageSectionInputSchema)
    .min(1, "At least one section is required.")
    .max(30, "Too many sections."),
  changeReason: z
    .string()
    .trim()
    .min(5, "Briefly explain the reason for this change.")
    .max(500),
});

export const newPageSchema = z.object({
  title: z.string().trim().min(3, "Title is required.").max(160),
  titleAm: z.string().trim().max(160).optional().default(""),
  summary: z.string().trim().min(10, "Summary must be at least 10 characters.").max(600),
  body: markdownBody,
  categoryId: z.string().uuid().optional().or(z.literal("")),
  changeReason: z.string().trim().min(5, "Briefly explain what this page covers and why.").max(500),
});

export const noteSchema = z.object({
  entityType: z.enum(entityTypeEnum.enumValues),
  entityId: z.string().uuid(),
  kind: z.enum(noteKindEnum.enumValues),
  body: z
    .string()
    .trim()
    .min(20, "Describe your experience in at least 20 characters.")
    .max(5000, "Reports are limited to 5,000 characters."),
  experiencedAt: z
    .string()
    .optional()
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), "Enter a valid date."),
});

export const flagSchema = z.object({
  entityType: z.enum(entityTypeEnum.enumValues),
  entityId: z.string().uuid(),
  reason: z.enum(flagReasonEnum.enumValues),
  details: z.string().trim().max(2000, "Details are limited to 2,000 characters.").optional(),
});

export const documentSubmitSchema = z.object({
  title: z.string().trim().min(3, "Title is required.").max(160),
  description: z.string().trim().min(10, "Describe the document (min 10 characters).").max(2000),
  categoryId: z.string().uuid().optional().or(z.literal("")),
  docType: z.enum(["form", "contract", "template", "letter", "application", "agreement", "other"]),
  language: z.enum(["am", "en", "am+en", "other"]),
  layer: z.enum(["official", "community"]),
  sourceUrl: z
    .string()
    .trim()
    .url("Enter a valid URL (https://...).")
    .max(2000)
    .refine((u) => u.startsWith("http://") || u.startsWith("https://"), "Only http(s) URLs are allowed.")
    .optional()
    .or(z.literal("")),
});

export type PageEditInput = z.infer<typeof pageEditSchema>;
export type NewPageInput = z.infer<typeof newPageSchema>;
export type NoteInput = z.infer<typeof noteSchema>;
export type FlagInput = z.infer<typeof flagSchema>;
export type DocumentSubmitInput = z.infer<typeof documentSubmitSchema>;
