import { FastifyPluginAsync } from "fastify";

export const tenantRoutes: FastifyPluginAsync = async (app) => {
  // POST /tenant/:id/usage — internal, Python worker only
  app.post<{
    Params: { id: string };
    Body: { callMinutes: number; whatsappSent: number;
            inputTokens: number; outputTokens: number };
  }>("/:id/usage", async (req, reply) => {
    const apiKey = req.headers["x-internal-key"];
    if (!apiKey || apiKey !== process.env.INTERNAL_API_KEY) {
      reply.status(401).send({ error: "Unauthorized" }); return;
    }
    const { id: tenantId } = req.params;
    const { callMinutes, whatsappSent, inputTokens, outputTokens } = req.body;
    const periodStart = new Date();
    periodStart.setDate(1); periodStart.setHours(0,0,0,0); // month start
    await req.db.tenantUsage.upsert({
      // @ts-ignore
      where: { tenantId_periodStart: { tenantId, periodStart } },
      create: {
        tenantId, periodStart,
        callMinutes: callMinutes.toFixed(3) as any,
        costCogs: 0, costBilled: 0,
        inputTokens: BigInt(inputTokens),
        outputTokens: BigInt(outputTokens),
        whatsappSent,
      },
      update: {
        callMinutes: { increment: callMinutes as any },
        inputTokens: { increment: BigInt(inputTokens) },
        outputTokens: { increment: BigInt(outputTokens) },
        whatsappSent: { increment: whatsappSent },
      }
    });
    return { success: true };
  });

  // GET /tenant/:id/context — internal, Python agent reads this per call
  app.get<{ Params: { id: string } }>("/:id/context", async (req, reply) => {
    const apiKey = req.headers["x-internal-key"];
    if (!apiKey || apiKey !== process.env.INTERNAL_API_KEY) {
      reply.status(401).send({ error: "Unauthorized" }); return;
    }
    const tenant = await req.db.tenant.findUnique({
      where: { id: req.params.id },
      select: { config: true, vertical: true }
    });
    if (!tenant) { reply.status(404).send({ error: "Not found" }); return; }
    return { context: tenant.config || {} };
  });
};
