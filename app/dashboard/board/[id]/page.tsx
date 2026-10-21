"use client";

import { useParams } from "next/navigation";
import { PostDetail } from "@/components/board/PostDetail";

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <PostDetail key={id} id={id} />;
}
