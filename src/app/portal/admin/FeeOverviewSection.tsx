"use client";

import { useRouter } from "next/navigation";
import FeeOverview from "@/components/fees/FeeOverview";

export default function FeeOverviewSection() {
  const router = useRouter();

  return (
    <FeeOverview
      onNavigateToDeal={(dealId) => router.push(`/portal/deal-manage/${dealId}`)}
    />
  );
}
