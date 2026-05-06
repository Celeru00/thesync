"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import {
  listAdvisers as fetchAdvisers,
  type AdviserDirectoryUser,
} from "@/lib/api";
import {
  requestTimeSlots,
  studentAdvisers,
  type AdviserProfile,
} from "@/lib/mock/student-consultations";

const adviserMetadataByName = new Map(
  studentAdvisers.map((adviser) => [adviser.name, adviser] as const),
);

export const adviserQueryKeys = {
  all: ["advisers"] as const,
};

export function useAdvisers(): UseQueryResult<AdviserProfile[], Error> {
  return useQuery({
    queryKey: adviserQueryKeys.all,
    queryFn: listAdvisers,
  });
}

async function listAdvisers(): Promise<AdviserProfile[]> {
  const adviserRows = await fetchAdvisers();

  return adviserRows
    .filter(
      (adviser) =>
        typeof adviser.full_name === "string" && adviser.full_name.trim(),
    )
    .map((adviser) => buildAdviserProfile(adviser))
    .sort((left, right) => left.name.localeCompare(right.name));
}

function buildAdviserProfile(adviser: AdviserDirectoryUser): AdviserProfile {
  const normalizedName = adviser.full_name?.trim() ?? "Unknown adviser";
  const metadata = adviserMetadataByName.get(normalizedName);

  return {
    id: adviser.id,
    name: normalizedName,
    department: metadata?.department ?? "Department unavailable",
    departmentCode: metadata?.departmentCode ?? "N/A",
    availability: metadata?.availability ?? "Medium",
    email:
      adviser.email?.trim() ||
      metadata?.email ||
      "Contact information unavailable",
    expertise: metadata?.expertise ?? [],
    availableSlots:
      metadata?.availableSlots ?? requestTimeSlots.map((slot) => slot.id),
  };
}
