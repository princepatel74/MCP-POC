import { appendFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { BookDemoInputSchema, type DemoRequest } from "../schemas/content.js";
import { getProjectRoot } from "./paths.js";
import { getContentIndex } from "./content-index.js";
import { logger } from "./logger.js";

export interface BookDemoResult {
  success: boolean;
  requestId: string;
  message: string;
  logged: boolean;
  emailed: boolean;
  contactEmail: string;
}

function getDemoRequestsDir(): string {
  return join(getProjectRoot(), "mcp", "data", "demo-requests");
}

function getDemoRequestsLogPath(): string {
  return join(getDemoRequestsDir(), "requests.jsonl");
}

/** Persist demo request as a JSON line for audit and review. */
function logDemoRequestToFile(request: DemoRequest): void {
  const dir = getDemoRequestsDir();
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  appendFileSync(getDemoRequestsLogPath(), JSON.stringify(request) + "\n", "utf-8");
}

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  to: string;
  from: string;
}

function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.MCP_SMTP_HOST;
  const user = process.env.MCP_SMTP_USER;
  const pass = process.env.MCP_SMTP_PASS;
  const to = process.env.MCP_DEMO_EMAIL_TO;

  if (!host || !user || !pass || !to) {
    return null;
  }

  return {
    host,
    port: Number(process.env.MCP_SMTP_PORT ?? "587"),
    user,
    pass,
    to,
    from: process.env.MCP_DEMO_EMAIL_FROM ?? user,
  };
}

/** Send demo request notification email when SMTP is configured. */
async function emailDemoRequest(
  request: DemoRequest,
  config: SmtpConfig,
): Promise<void> {
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: { user: config.user, pass: config.pass },
  });

  const lines = [
    `New demo request via MCP`,
    ``,
    `Request ID: ${request.id}`,
    `Submitted:  ${request.submittedAt}`,
    ``,
    `Name:         ${request.name}`,
    `Email:        ${request.email}`,
    `Phone:        ${request.phone ?? "Not provided"}`,
    `Company:      ${request.company ?? "Not provided"}`,
    `Preferred:    ${request.preferredDate ?? "Not specified"}`,
    ``,
    `Requirements:`,
    request.requirements,
  ];

  await transporter.sendMail({
    from: config.from,
    to: config.to,
    replyTo: request.email,
    subject: `[Demo Request] ${request.name}${request.company ? ` — ${request.company}` : ""}`,
    text: lines.join("\n"),
  });
}

/**
 * Process a demo booking: validate, log to file, optionally email sales team.
 */
export async function bookDemo(input: unknown): Promise<BookDemoResult> {
  const parsed = BookDemoInputSchema.parse(input);
  const { contact } = getContentIndex();

  const request: DemoRequest = {
    id: randomUUID(),
    submittedAt: new Date().toISOString(),
    name: parsed.name.trim(),
    email: parsed.email.trim().toLowerCase(),
    phone: parsed.phone?.trim(),
    company: parsed.company?.trim(),
    requirements: parsed.requirements.trim(),
    preferredDate: parsed.preferredDate?.trim(),
    source: "mcp",
  };

  logger.info(
    `Demo request: id=${request.id} name="${request.name}" email=${request.email}`,
  );

  logDemoRequestToFile(request);

  let emailed = false;
  const smtp = getSmtpConfig();

  if (smtp) {
    try {
      await emailDemoRequest(request, smtp);
      emailed = true;
      logger.info(`Demo request ${request.id} emailed to ${smtp.to}`);
    } catch (error) {
      logger.error(`Failed to email demo request ${request.id}:`, error);
    }
  } else {
    logger.debug(
      "SMTP not configured (MCP_SMTP_HOST, MCP_SMTP_USER, MCP_SMTP_PASS, MCP_DEMO_EMAIL_TO). Request logged to file only.",
    );
  }

  const contactEmail = contact.email || "sales@satvasolutions.com";

  return {
    success: true,
    requestId: request.id,
    message: emailed
      ? `Demo request received. Our team at ${contactEmail} has been notified and will follow up shortly.`
      : `Demo request received and logged (ID: ${request.id}). Our team at ${contactEmail} will follow up within one business day.`,
    logged: true,
    emailed,
    contactEmail,
  };
}
