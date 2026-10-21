"use client";

import { useParams } from "next/navigation";
import { PostEditor } from "@/components/board/PostEditor";

export default function PostEditPage() {
  const { id } = useParams<{ id: string }>();
  return <PostEditor key={id} id={id} />;
}
