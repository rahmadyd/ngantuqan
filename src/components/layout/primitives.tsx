import { cn } from "@/lib/utils";

export function Container({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1320px] px-5 md:px-10 lg:px-12 xl:px-16",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Section({
  className,
  children,
  tone = "default",
}: {
  className?: string;
  children: React.ReactNode;
  tone?: "default" | "sunken" | "dark";
}) {
  const tones = {
    default: "",
    sunken: "bg-surface-sunken",
    dark: "dark-surface bg-text text-background",
  } as const;

  return (
    <section className={cn("py-16 md:py-24", tones[tone], className)}>
      {children}
    </section>
  );
}

export function Eyebrow({
  children,
  className,
  rule = true,
}: {
  children: React.ReactNode;
  className?: string;
  rule?: boolean;
}) {
  return (
    <p className={cn("eyebrow", rule && "eyebrow-rule", className)}>{children}</p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = "left",
  eyebrowRule,
  className,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  align?: "left" | "center";
  eyebrowRule?: boolean;
  className?: string;
}) {
  const rule = eyebrowRule ?? align === "left";

  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow ? (
        <Eyebrow
          rule={rule}
          className={cn(align === "center" && "justify-center")}
        >
          {eyebrow}
        </Eyebrow>
      ) : null}
      <h2 className="mt-4 font-display text-[clamp(1.875rem,4vw,2.75rem)] leading-[1.1] font-semibold tracking-[-0.02em] text-balance">
        {title}
      </h2>
      {lede ? <p className="prose-body mt-4">{lede}</p> : null}
    </div>
  );
}
