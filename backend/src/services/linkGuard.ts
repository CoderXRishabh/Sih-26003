import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Checks whether a caregiver has an active link to a specific patient.
 * Must be called before any caregiver-initiated data access to a patient.
 *
 * @returns The link record if active, or null if not authorized.
 */
export async function verifyActiveLink(
  caregiverId: number,
  patientId: number
) {
  const link = await prisma.patientCaregiverLink.findUnique({
    where: {
      patientId_caregiverId: {
        patientId,
        caregiverId,
      },
    },
  });

  if (!link || link.status !== "active") {
    return null;
  }

  return link;
}
