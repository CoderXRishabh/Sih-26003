import cron from "node-cron";
import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";
import { broadcastSync } from "../socket";

const prisma = new PrismaClient();

export function initReminderCron(io: Server) {
  // Run every hour at minute 0
  cron.schedule("0 * * * *", async () => {
    console.log("[Cron] Running hourly reminder cleanup job...");
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Find reminders created more than 24 hours ago
      const staleReminders = await prisma.reminder.findMany({
        where: {
          createdAt: {
            lt: twentyFourHoursAgo,
          },
        },
      });

      console.log(`[Cron] Found ${staleReminders.length} stale reminders older than 24 hours.`);

      for (const oldReminder of staleReminders) {
        // If recurring (daily or specific_days), spawn next instance
        if (oldReminder.frequency === "daily" || oldReminder.frequency === "specific_days") {
          const newReminder = await prisma.reminder.create({
            data: {
              patientId: oldReminder.patientId,
              type: oldReminder.type,
              label: oldReminder.label,
              scheduledTime: oldReminder.scheduledTime,
              frequency: oldReminder.frequency,
              days: oldReminder.days,
            },
          });

          const newPayload = {
            id: newReminder.id,
            patientId: newReminder.patientId,
            title: newReminder.label,
            time: newReminder.scheduledTime,
            category: newReminder.type,
            frequency: newReminder.frequency,
            days: JSON.parse(newReminder.days || "[]"),
            isCompleted: false,
            completedAt: null,
            createdAt: newReminder.createdAt,
          };

          broadcastSync(io, newReminder.patientId, "reminder", "created", newPayload);
        }

        // Delete old reminder
        await prisma.reminder.delete({ where: { id: oldReminder.id } });

        broadcastSync(io, oldReminder.patientId, "reminder", "deleted", { id: oldReminder.id });
      }
    } catch (err) {
      console.error("[Cron Error]", err);
    }
  });

  console.log("[Cron] Hourly reminder cleanup job scheduled.");
}
