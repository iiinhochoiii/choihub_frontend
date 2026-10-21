"use client";

import { useParams } from "next/navigation";
import { ApprovalDetail } from "@/components/approval/ApprovalDetail";

export default function ApprovalDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <ApprovalDetail key={id} id={id} />;
}
