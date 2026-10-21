"use client";

import { useParams } from "next/navigation";
import { CompanyDetail } from "@/components/admin/CompanyDetail";

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <CompanyDetail key={id} tenantId={id} />;
}
