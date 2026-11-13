import type { Metadata } from "next";
import { HeroSection } from "@/components/home/hero-section";
import { HomeCta } from "@/components/home/home-cta";
import { ProductsPreview } from "@/components/home/products-preview";
import { SelectedWorks } from "@/components/home/selected-works";
import { ServicesOverview } from "@/components/home/services-overview";
import { StudioIntro } from "@/components/home/studio-intro";
import { Testimonials } from "@/components/home/testimonials";
import { WhyWorkWithUs } from "@/components/home/why-work-with-us";
import { getLocale } from "@/lib/i18n/server";
import {
  getActiveServices,
  getFeaturedProducts,
  getFeaturedProjects,
  getPublishedTestimonials,
} from "@/lib/queries/content";

export const metadata: Metadata = {
  title: { absolute: "ngantuqan: Creative Design Studio" },
  description:
    "ngantuqan is an independent creative design studio building brand identities, content systems, and product interfaces, plus downloadable design templates.",
};

export default async function HomePage() {
  const locale = await getLocale();
  const [projects, services, products, testimonials] = await Promise.all([
    getFeaturedProjects(4, locale),
    getActiveServices(locale),
    getFeaturedProducts(3, locale),
    getPublishedTestimonials(3, locale),
  ]);

  return (
    <>
      <HeroSection services={services} />
      <SelectedWorks projects={projects} />
      <ServicesOverview services={services} />
      <StudioIntro />
      <ProductsPreview products={products} />
      <WhyWorkWithUs />
      <Testimonials testimonials={testimonials} />
      <HomeCta />
    </>
  );
}
