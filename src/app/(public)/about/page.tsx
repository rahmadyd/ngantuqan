import type { Metadata } from "next";
import Image from "next/image";
import { Compass, Layers, MessageSquare, PenTool, Sparkles } from "lucide-react";
import { Container, Eyebrow, Section } from "@/components/layout/primitives";
import { ButtonLink } from "@/components/ui/button-link";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();

  return {
    title: t.nav.about,
    description:
      "ngantuqan is an independent creative design studio. Our story, philosophy, capabilities, tools, and the way we work.",
  };
}

const CAPABILITY_ICONS = [PenTool, Layers, Compass, Sparkles, MessageSquare];

const TOOLS = [
  "Figma",
  "Adobe Illustrator",
  "Adobe Photoshop",
  "Adobe InDesign",
  "Canva",
  "Cinema 4D",
  "Blender",
  "Framer",
  "Notion",
  "Aseprite",
];

const WORKFLOW_STEPS = ["01", "02", "03", "04", "05"];

export default async function AboutPage() {
  const t = await getDictionary();

  const capabilities = t.about.capabilities.map((item, index) => ({
    icon: CAPABILITY_ICONS[index],
    title: item.title,
    body: item.body,
  }));

  const workflow = t.about.workflow.map((item, index) => ({
    step: WORKFLOW_STEPS[index],
    title: item.title,
    body: item.body,
  }));

  return (
    <>
      <section className="border-b border-border bg-surface-sunken py-16 md:py-24">
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <Eyebrow>{t.about.eyebrow}</Eyebrow>
              <h1 className="mt-5 font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.03] font-semibold tracking-[-0.03em] text-balance">
                {t.about.title}
              </h1>
            </div>
            <div className="lg:col-span-5 lg:pt-14">
              <p className="prose-body-strong">{t.about.lede1}</p>
              <p className="prose-body mt-4">{t.about.lede2}</p>
            </div>
          </div>
        </Container>
      </section>

      {/* Vision & mission */}
      <Section>
        <Container>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl bg-surface-tint p-8">
              <Eyebrow>{t.about.visionEyebrow}</Eyebrow>
              <p className="mt-4 font-display text-2xl leading-snug font-medium text-balance">
                {t.about.vision}
              </p>
            </div>
            <div className="rounded-xl bg-pink/15 p-8">
              <Eyebrow>{t.about.missionEyebrow}</Eyebrow>
              <p className="mt-4 font-display text-2xl leading-snug font-medium text-balance">
                {t.about.mission}
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* Philosophy */}
      <Section tone="sunken">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <Eyebrow>{t.about.philosophyEyebrow}</Eyebrow>
              <h2 className="mt-4 font-display text-[clamp(1.75rem,3.5vw,2.5rem)] leading-[1.1] font-semibold tracking-[-0.02em]">
                {t.about.philosophyTitle}
              </h2>
            </div>
            <div className="lg:col-span-7 grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {t.about.philosophy.map((item) => (
                <div key={item.title}>
                  <h3 className="font-display text-lg font-semibold">
                    {item.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* Capabilities */}
      <Section>
        <Container>
          <div className="max-w-2xl">
            <Eyebrow>{t.about.capabilitiesEyebrow}</Eyebrow>
            <h2 className="mt-4 font-display text-[clamp(1.75rem,3.5vw,2.5rem)] leading-[1.1] font-semibold tracking-[-0.02em]">
              {t.about.capabilitiesTitle}
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((item) => (
              <div
                key={item.title}
                className="rounded-lg border border-border bg-surface p-6 shadow-sm"
              >
                <div className="flex size-11 items-center justify-center rounded-full bg-surface-tint">
                  <item.icon aria-hidden="true" className="size-5 text-primary" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">
                  {item.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Tools */}
      <Section tone="sunken">
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <Eyebrow>{t.about.toolsEyebrow}</Eyebrow>
              <h2 className="mt-4 font-display text-[clamp(1.75rem,3.5vw,2.5rem)] leading-[1.1] font-semibold tracking-[-0.02em]">
                {t.about.toolsTitle}
              </h2>
              <p className="prose-body mt-4">{t.about.toolsLede}</p>
            </div>
            <div className="lg:col-span-8">
              <ul className="flex flex-wrap gap-3">
                {TOOLS.map((tool) => (
                  <li
                    key={tool}
                    className="rounded-full border border-border bg-surface px-4 py-2 font-label text-sm text-muted"
                  >
                    {tool}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      {/* Workflow */}
      <Section>
        <Container>
          <div className="max-w-2xl">
            <Eyebrow>{t.about.workflowEyebrow}</Eyebrow>
            <h2 className="mt-4 font-display text-[clamp(1.75rem,3.5vw,2.5rem)] leading-[1.1] font-semibold tracking-[-0.02em]">
              {t.about.workflowTitle}
            </h2>
          </div>

          <ol className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            {workflow.map((item) => (
              <li
                key={item.step}
                className="relative rounded-lg border border-border bg-surface p-6 shadow-sm"
              >
                <span className="font-display text-3xl font-semibold text-pink">
                  {item.step}
                </span>
                <h3 className="mt-3 font-display text-lg font-semibold">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {item.body}
                </p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      {/* Closing visual */}
      <section className="pb-16 md:pb-24">
        <Container>
          <div className="relative overflow-hidden rounded-2xl">
            <Image
              src="/images/demo/aurora-cover.svg"
              alt={t.about.closingAlt}
              width={1320}
              height={750}
              className="h-auto w-full"
            />
          </div>
        </Container>
      </section>

      <section className="dark-surface bg-text py-16 text-background md:py-20">
        <Container>
          <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <h2 className="font-display text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.1] font-semibold tracking-[-0.02em] text-balance">
                {t.about.closingTitle}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-background/70">
                {t.about.closingLede}
              </p>
            </div>
            <ButtonLink href="/contact" variant="cream" size="lg">
              {t.about.closingButton}
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  );
}
