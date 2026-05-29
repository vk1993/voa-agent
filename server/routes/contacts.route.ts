import { FastifyPluginAsync } from "fastify";
import { logAuditEvent } from "../../lib/security/audit-logger";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Fastify routes plugin managing secure contact records.
 * Incorporates active rate limiting, dual-layer role guards, PostgreSQL Row-Level Security,
 * storage boundaries, and critical audit logging traces.
 */
export const contactsRoutes: FastifyPluginAsync = async (app) => {
  
  // Custom Guard: restricts route endpoints based on validated JWT role claims
  const requireRole = (allowedRoles: string[]) => {
    return async (req: any, reply: any) => {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        // Asynchronously log the unauthorized access breach event to DynamoDB/Audit Sim
        await logAuditEvent(
          req.user?.tenantId || "unknown",
          req.user?.email || "anonymous",
          "UNAUTHORIZED_ACCESS_ATTEMPT",
          req.url,
          { attemptedRole: req.user?.role || "NONE" },
          { error: "403 Forbidden", allowedRoles, severity: "WARNING" }
        ).catch((err) => {
          app.log.error(err as Error, "Failed to write unauthorized audit log");
        });

        reply.status(403).send({
          error: "Forbidden",
          code: "ROLE_ACCESS_DENIED",
          message: "You do not possess the required permissions to invoke this action.",
        });
        throw new Error("AUTH_FORBIDDEN");
      }
    };
  };

  // =========================================================================
  // GET /contacts - Retrieve Paginated Contact List
  // =========================================================================
  app.get(
    "/",
    { preHandler: [requireRole(["ADMIN", "SALES_AGENT"])] },
    async (req, reply) => {
      const page = parseInt((req.query as any).page || "1", 10);
      const limit = parseInt((req.query as any).limit || "10", 10);
      const skip = (page - 1) * limit;

      const user = req.user!;

      // Enforce granular role boundary:
      // - ADMIN: sees all tenant contacts.
      // - SALES_AGENT: restricted strictly to contacts they are assigned to.
      const where: any = {};
      if (user.role === "SALES_AGENT") {
        where.assignedAgentId = user.sub;
      }

      // Execute tenant-scoped Prisma query. PostgreSQL RLS operates under the hood,
      // dynamically scoping query boundaries to current tenantId.
      const [contacts, total] = await Promise.all([
        req.db.contact.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        req.db.contact.count({ where }),
      ]);

      // Record standard verification traces in audit logger
      await logAuditEvent(
        user.tenantId,
        user.email,
        "CONTACTS_VIEWED",
        "contacts",
        null,
        { recordCount: contacts.length, page, limit }
      );

      return {
        success: true,
        data: contacts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    }
  );

  // =========================================================================
  // POST /contacts/export - Generate and Export Contacts to Encrypted S3
  // =========================================================================
  app.post(
    "/export",
    { preHandler: [requireRole(["ADMIN"])] },
    async (req, reply) => {
      const user = req.user!;

      // 1. Audit high-risk operation immediately with critical severity level
      await logAuditEvent(
        user.tenantId,
        user.email,
        "DATA_EXPORT_REQUESTED",
        "contacts/export",
        null,
        { severity: "CRITICAL", format: "CSV", status: "INITIATED" }
      );

      // 2. Fetch entire tenant contact catalog under database RLS constraints
      const contacts = await req.db.contact.findMany({
        orderBy: { createdAt: "desc" },
      });

      // 3. Generate high-fidelity CSV payload
      const sanitizeCsvField = (value: string | null | undefined): string => {
        if (!value) return "";
        const str = String(value);
        if (/^[=+\-@\t\r]/.test(str)) {
          return "'" + str;
        }
        return str;
      };

      const csvHeaders = "ID,Name,Phone,Email,Status,LeadScore,BHKType,BudgetMin,BudgetMax\n";
      const csvRows = contacts
        .map(
          (c) =>
            `"${c.id}","${sanitizeCsvField(c.name)}","${sanitizeCsvField(c.phone)}","${sanitizeCsvField(c.email)}","${sanitizeCsvField(c.status)}",${c.leadScore},"${sanitizeCsvField(c.bhkType)}",${c.budgetMin || 0},${c.budgetMax || 0}`
        )
        .join("\n");
      const csvContent = csvHeaders + csvRows;

      // 4. Force strict S3 folder prefix isolation: tenants/{tenantId}/exports/
      const s3Key = `tenants/${user.tenantId}/exports/contacts-export-${Date.now()}.csv`;
      const bucketName = process.env.RECORDINGS_BUCKET_NAME || "voxa-recordings";

      try {
        const s3 = new S3Client({
          region: process.env.AWS_REGION || "ap-south-1",
        });

        // 5. Upload to isolated bucket with mandatory SSE KMS encryption
        await s3.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: s3Key,
            Body: csvContent,
            ContentType: "text/csv",
            ServerSideEncryption: "aws:kms",
          })
        );

        // 6. Generate presigned secure download URL (exactly 1 hour expiry)
        const downloadCommand = new GetObjectCommand({
          Bucket: bucketName,
          Key: s3Key,
        });
        const presignedUrl = await getSignedUrl(s3, downloadCommand, { expiresIn: 3600 });

        return {
          success: true,
          message: "Data export compiled and archived successfully.",
          downloadUrl: presignedUrl,
          expiresInSeconds: 3600,
        };
      } catch (err: any) {
        app.log.error(err as Error, "S3 Contacts Export execution failed");
        reply.status(500).send({
          error: "Internal Server Error",
          code: "STORAGE_ACCESS_DENIED",
          message: "Could not export database contents. Connection to S3 was rejected.",
        });
      }
    }
  );

  // =========================================================================
  // DELETE /contacts/:id - Soft Delete / Archive Contact
  // =========================================================================
  app.delete(
    "/:id",
    { preHandler: [requireRole(["ADMIN"])] },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const user = req.user!;

      // 1. Dual-layer defense: fetch targeted contact explicitly (RLS acts as baseline)
      const contact = await req.db.contact.findFirst({
        where: { id },
      });

      if (!contact) {
        reply.status(404).send({
          error: "Not Found",
          message: "The requested contact record does not exist under your tenant workspace.",
        });
        return;
      }

      // 2. Explicit tenant boundary check (prevent cross-tenant hijacking attempts)
      if (contact.tenantId !== user.tenantId) {
        await logAuditEvent(
          user.tenantId,
          user.email,
          "CROSS_TENANT_HIJACK_ATTEMPT",
          `contacts/${id}`,
          { contactTenantId: contact.tenantId },
          { severity: "CRITICAL", error: "403 Forbidden" }
        );

        reply.status(403).send({
          error: "Forbidden",
          code: "CROSS_TENANT_ACCESS_DENIED",
          message: "Security exception: target contact belongs to a different tenant workspace.",
        });
        return;
      }

      // 3. Execute Soft Delete by updating record status to ARCHIVED
      const archivedContact = await req.db.contact.update({
        where: { id },
        data: { status: "ARCHIVED" },
      });

      // 4. Log high-severity state mutation to audit logs
      await logAuditEvent(
        user.tenantId,
        user.email,
        "CONTACT_DELETED",
        `contacts/${id}`,
        { previousStatus: contact.status },
        { newStatus: archivedContact.status, severity: "CRITICAL" }
      );

      return {
        success: true,
        message: "Contact record successfully archived.",
        contact: archivedContact,
      };
    }
  );

  // --- INTERNAL ROUTES ---
  app.get<{ Params: { id: string } }>(
    "/:id/phone",
    async (req, reply) => {
      const apiKey = req.headers["x-internal-key"];
      if (!apiKey || apiKey !== process.env.INTERNAL_API_KEY) {
        reply.status(401).send({ error: "Unauthorized" });
        return;
      }

      const { id } = req.params;
      // Note: req.db is assumed available as in other routes
      const contact = await req.db.contact.findUnique({
        where: { id },
        select: { phone: true },
      });

      if (!contact) {
        reply.status(404).send({ error: "Contact not found" });
        return;
      }

      return { phone: contact.phone };
    }
  );
};
