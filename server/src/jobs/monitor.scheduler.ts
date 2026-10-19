import cron from "node-cron";
import Monitor from "@/features/monitors/monitor.model.js";
import Check from "@/features/checks/check.model.js";
import { performApiCheck } from "@/features/checks/check.service.js";

export function startMonitorScheduler() {
  cron.schedule(
    "* * * * *",
    async () => {
      try {
        const now = new Date();

        const monitors = await Monitor.find({
          $or: [
            { lastCheckedAt: null },
            { lastCheckedAt: { $exists: false } },
            {
              $expr: {
                $lte: [
                  {
                    $add: [
                      "$lastCheckedAt",
                      { $multiply: ["$intervalSeconds", 1000] },
                    ],
                  },
                  now,
                ],
              },
            },
          ],
        });

        for (const monitor of monitors) {
          try {
            const outcome = await performApiCheck(monitor);
            const checkedAt = new Date();

            await Check.create({
              monitorId: monitor._id,
              userId: monitor.userId,
              ...outcome,
              checkedAt,
            });

            if (outcome.status !== "RATE_LIMITED") {
              monitor.currentStatus = outcome.status;
            }

            monitor.lastCheckedAt = checkedAt;
            await monitor.save();

            console.log(
              `Monitor ${monitor._id}: ${outcome.status}, ` +
                `${outcome.responseTimeMs} ms`,
            );
          } catch (error) {
            console.error(`Failed to check monitor ${monitor._id}:`, error);
          }
        }
      } catch (error) {
        console.error("Monitor scheduler failed:", error);
      }
    },
    {
      noOverlap: true,
    },
  );

  console.log("Monitor scheduler started.");
}
