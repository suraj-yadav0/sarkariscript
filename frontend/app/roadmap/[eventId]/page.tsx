import type { Metadata } from "next";
import { RoadmapView } from "@/components/RoadmapView";

export const metadata: Metadata = {
  title: "Journey roadmap",
};

export default async function RoadmapPage(
  props: PageProps<"/roadmap/[eventId]">
) {
  const { eventId } = await props.params;
  return <RoadmapView eventId={eventId} />;
}
