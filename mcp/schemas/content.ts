import { z } from "zod";

export const PageMetadataSchema = z.object({
  title: z.string(),
  metaDescription: z.string(),
  keywords: z.array(z.string()),
  canonicalUrl: z.string().url(),
  openGraph: z.object({
    url: z.string(),
    type: z.string(),
    title: z.string(),
    description: z.string(),
    image: z.string(),
    imageAlt: z.string(),
    siteName: z.string(),
    twitterCreator: z.string().optional(),
  }),
  jsonLd: z.record(z.string(), z.unknown()).optional(),
});

export const HeadingSchema = z.object({
  level: z.number().int().min(1).max(6),
  text: z.string(),
  id: z.string(),
});

export const PageContentSchema = z.object({
  path: z.string(),
  url: z.string(),
  title: z.string(),
  description: z.string(),
  markdownContent: z.string(),
  headings: z.array(HeadingSchema),
  metadata: PageMetadataSchema,
  sourceFile: z.string().optional(),
  type: z.enum(["page", "virtual"]).optional(),
});

export const BlogPostSchema = z.object({
  slug: z.string(),
  path: z.string(),
  url: z.string(),
  title: z.string(),
  snippet: z.string(),
  description: z.string(),
  author: z.string(),
  category: z.string(),
  tags: z.array(z.string()),
  publishDate: z.string(),
  content: z.string(),
  headings: z.array(HeadingSchema),
  metadata: PageMetadataSchema,
  draft: z.boolean().optional(),
});

export const PageSummarySchema = z.object({
  path: z.string(),
  url: z.string(),
  title: z.string(),
  description: z.string(),
});

export const SearchResultSchema = z.object({
  title: z.string(),
  url: z.string(),
  path: z.string(),
  summary: z.string(),
  snippet: z.string(),
  type: z.string(),
  score: z.number(),
});

export const PricingPlanSchema = z.object({
  name: z.string(),
  price: z.union([
    z.string(),
    z.object({
      monthly: z.string(),
      annual: z.string().optional(),
      discount: z.string().optional(),
      original: z.string().optional(),
    }),
  ]),
  popular: z.boolean().optional(),
  features: z.array(z.string()),
  button: z
    .object({
      text: z.string(),
      link: z.string(),
    })
    .optional(),
});

export const ServiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string().optional(),
});

export const FaqItemSchema = z.object({
  id: z.string(),
  question: z.string(),
  answer: z.string(),
  category: z.string().optional(),
});

export const ContactInfoSchema = z.object({
  email: z.string(),
  phone: z.string(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
    formatted: z.string(),
  }),
  social: z.record(z.string(), z.string()),
  businessHours: z.record(z.string(), z.string()),
});

export const CompanyInfoSchema = z.object({
  name: z.string(),
  tagline: z.string().optional(),
  description: z.string(),
  founded: z.string().optional(),
  mission: z.string().optional(),
  values: z.array(z.string()).optional(),
  siteUrl: z.string(),
});

export const SearchDocumentSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  path: z.string(),
  summary: z.string(),
  body: z.string(),
  type: z.string(),
});

// Tool input schemas
export const SearchSiteInputSchema = z.object({
  query: z.string().min(1).describe("Search query text"),
  limit: z.number().int().min(1).max(50).optional().describe("Max results"),
});

export const ReadPageInputSchema = z.object({
  path: z
    .string()
    .min(1)
    .describe("Page path, e.g. /pricing or /blog/my-post"),
});

export const GetBlogPostInputSchema = z.object({
  slug: z.string().min(1).describe("Blog post slug"),
});

const emptyToUndefined = (value: unknown) =>
  value === "" || value === null || value === undefined ? undefined : value;

export const BookDemoInputSchema = z.object({
  name: z.string().min(2).max(100).describe("Full name of the person requesting the demo"),
  email: z.string().email().describe("Contact email address"),
  phone: z.preprocess(
    emptyToUndefined,
    z.string().min(7).max(30).optional(),
  ).describe("Phone number (optional)"),
  company: z.preprocess(
    emptyToUndefined,
    z.string().max(150).optional(),
  ).describe("Company or organization name (optional)"),
  requirements: z
    .string()
    .min(5)
    .max(5000)
    .describe("What they need help with — integrations, automation, services, etc."),
  preferredDate: z.preprocess(
    emptyToUndefined,
    z.string().max(100).optional(),
  ).describe("Preferred date or time for the demo (optional)"),
});

export const DemoRequestSchema = z.object({
  id: z.string().uuid(),
  submittedAt: z.string().datetime(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  requirements: z.string(),
  preferredDate: z.string().optional(),
  source: z.literal("mcp"),
});

export type PageMetadata = z.infer<typeof PageMetadataSchema>;
export type PageContent = z.infer<typeof PageContentSchema>;
export type BlogPost = z.infer<typeof BlogPostSchema>;
export type PageSummary = z.infer<typeof PageSummarySchema>;
export type SearchResult = z.infer<typeof SearchResultSchema>;
export type PricingPlan = z.infer<typeof PricingPlanSchema>;
export type Service = z.infer<typeof ServiceSchema>;
export type FaqItem = z.infer<typeof FaqItemSchema>;
export type ContactInfo = z.infer<typeof ContactInfoSchema>;
export type CompanyInfo = z.infer<typeof CompanyInfoSchema>;
export type SearchDocument = z.infer<typeof SearchDocumentSchema>;
export type DemoRequest = z.infer<typeof DemoRequestSchema>;
