import { StatusBoard } from "@/components/StatusBoard";
import { PromptBox } from "@/components/PromptBox";
import { EventsGrid } from "@/components/EventsGrid";
import {
  HomeCopy,
  DemoPersonaQuickBar,
  EventsGridTitle,
  HowItWorksBlock,
} from "@/components/HomeCopy";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-[1200px] px-3.5 sm:px-4 md:px-6 overflow-x-hidden">
      <section className="grid gap-8 sm:gap-10 pb-12 sm:pb-16 pt-6 sm:pt-12 md:pt-16 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-7 min-w-0">
          <HomeCopy />
          <div className="mt-5 sm:mt-7 rise" style={{ animationDelay: "160ms" }}>
            <PromptBox />
          </div>
        </div>
        <aside className="lg:col-span-5 min-w-0">
          <div className="rise lg:sticky lg:top-24" style={{ animationDelay: "240ms" }}>
            <StatusBoard />
          </div>
        </aside>
      </section>

      <section className="border-t border-line py-12">
        <DemoPersonaQuickBar />
        <EventsGridTitle />
        <EventsGrid />
      </section>

      <section className="border-t border-line py-14 pb-20">
        <HowItWorksBlock />
      </section>
    </div>
  );
}
