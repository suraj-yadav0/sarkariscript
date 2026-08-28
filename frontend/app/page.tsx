import { StatusBoard } from "@/components/StatusBoard";
import { PromptBox } from "@/components/PromptBox";
import { EventsGrid } from "@/components/EventsGrid";
import { HomeCopy, EventsGridTitle, HowItWorksBlock } from "@/components/HomeCopy";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-[1200px] px-3 sm:px-4 md:px-6 w-full max-w-full overflow-x-hidden min-w-0">
      <section className="grid gap-6 sm:gap-8 lg:gap-10 pb-10 sm:pb-16 pt-4 sm:pt-10 md:pt-14 lg:grid-cols-12 min-w-0 w-full">
        <div className="lg:col-span-7 min-w-0 w-full">
          <HomeCopy />
          <div className="mt-4 sm:mt-6 rise" style={{ animationDelay: "160ms" }}>
            <PromptBox />
          </div>
        </div>
        <aside className="lg:col-span-5 min-w-0 w-full">
          <div className="rise lg:sticky lg:top-24" style={{ animationDelay: "240ms" }}>
            <StatusBoard />
          </div>
        </aside>
      </section>

      <section className="border-t border-line py-10 sm:py-14 min-w-0 w-full">
        <EventsGridTitle />
        <EventsGrid />
      </section>

      <section className="border-t border-line py-10 sm:py-14 pb-16 sm:pb-20 min-w-0 w-full">
        <HowItWorksBlock />
      </section>
    </div>
  );
}
