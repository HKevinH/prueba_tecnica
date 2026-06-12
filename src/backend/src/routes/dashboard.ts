import { Router, Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import { classifyPolicyPriority, PriorityBucket } from "../services/priority";

const router = Router();

router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const policies = await prisma.policy.findMany({
      select: { expirationDate: true, status: true },
    });

    const counts: Record<string, number> = {
      active: 0,
      expiring_soon: 0,
      expires_today: 0,
      critical_window: 0,
      outside_window: 0,
      renewed: 0,
      lost: 0,
    };

    for (const p of policies) {
      if (p.status === "renewed") {
        counts.renewed++;
        continue;
      }
      if (p.status === "lost") {
        counts.lost++;
        continue;
      }
      const bucket: PriorityBucket = classifyPolicyPriority(p.expirationDate);
      counts[bucket]++;
    }

    res.json({
      total: policies.length,
      ...counts,
      urgent: counts.expires_today + counts.critical_window,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
