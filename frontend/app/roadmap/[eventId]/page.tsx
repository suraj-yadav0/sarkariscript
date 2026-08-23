import type { Metadata } from "next";
import { RoadmapView } from "@/components/RoadmapView";

export const metadata: Metadata = {
  title: "Journey roadmap",
};

interface Props {
  params: Promise<{ eventId: string }>;
}

export default async function RoadmapPage({ params }: Props) {
  const resolved = await params;
  return <RoadmapView eventId={resolved.eventId} />;
}
