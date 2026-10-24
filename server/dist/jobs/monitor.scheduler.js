import cron from "node-cron";
import Monitor from "../features/monitors/monitor.model.js";
import Check from "../features/checks/check.model.js";
import { performApiCheck } from "../features/checks/check.service.js";
export function startMonitorScheduler() {
    cron.schedule("* * * * *", async () => {
        try {
            const now = new Date();
            const monitors = await Monitor.find({
                isPaused: { $ne: true },
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
                    const activeMonitor = await Monitor.findOne({
                        _id: monitor._id,
                        isPaused: { $ne: true },
                    });
                    if (!activeMonitor)
                        continue;
                    const outcome = await performApiCheck(activeMonitor);
                    const checkedAt = new Date();
                    await Check.create({
                        monitorId: activeMonitor._id,
                        userId: activeMonitor.userId,
                        ...outcome,
                        checkedAt,
                    });
                    if (outcome.status !== "RATE_LIMITED") {
                        activeMonitor.currentStatus = outcome.status;
                    }
                    activeMonitor.lastCheckedAt = checkedAt;
                    await activeMonitor.save();
                    console.log(`Monitor ${activeMonitor._id}: ${outcome.status}, ` +
                        `${outcome.responseTimeMs} ms`);
                }
                catch (error) {
                    console.error(`Failed to check monitor ${monitor._id}:`, error);
                }
            }
        }
        catch (error) {
            console.error("Monitor scheduler failed:", error);
        }
    }, {
        noOverlap: true,
    });
    console.log("Monitor scheduler started.");
}
//# sourceMappingURL=monitor.scheduler.js.map