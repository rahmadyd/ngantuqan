import type {
  Category,
  Product,
  Project,
  Service,
  SiteSettings,
  Testimonial,
} from "@/types/models";

/**
 * DEMONSTRATION DATA — clearly marked per master_design.md §15.
 *
 * This module is the fallback used ONLY when Supabase credentials are absent,
 * so the site can be reviewed and built without a live project. Every record
 * is prefixed with "DEMO" and no order, revenue, or download row is fabricated.
 *
 * When NEXT_PUBLIC_SUPABASE_URL is configured, the query layer never touches
 * this file. See src/lib/queries/*.ts
 */

export const DEMO_CATEGORIES: Category[] = [
  {
    id: "cat-portfolio-social",
    name: "Social Media Design",
    slug: "social-media-design",
    type: "PORTFOLIO",
    description: "Campaign and feed systems built for scroll-stopping brands.",
    translations: {
      id: {
        name: "Desain Media Sosial",
        description:
          "Sistem kampanye dan feed yang dirancang untuk memancing perhatian merek.",
      },
    },
  },
  {
    id: "cat-portfolio-branding",
    name: "Branding",
    slug: "branding",
    type: "PORTFOLIO",
    description: "Identity work — marks, systems, and guidelines.",
    translations: {
      id: {
        name: "Branding",
        description:
          "Pengembangan identitas, mulai dari logo, sistem visual, hingga panduan penggunaan.",
      },
    },
  },
  {
    id: "cat-portfolio-banner",
    name: "Banner Design",
    slug: "banner-design",
    type: "PORTFOLIO",
    description: "Promotional graphics for web and print.",
    translations: {
      id: {
        name: "Desain Banner",
        description: "Grafik promosi untuk media web dan cetak.",
      },
    },
  },
  {
    id: "cat-portfolio-presentation",
    name: "Presentation",
    slug: "presentation",
    type: "PORTFOLIO",
    description: "Pitch decks and keynote systems.",
    translations: {
      id: {
        name: "Presentasi",
        description: "Pitch deck dan sistem materi presentasi.",
      },
    },
  },
  {
    id: "cat-portfolio-uiux",
    name: "UI/UX Design",
    slug: "ui-ux-design",
    type: "PORTFOLIO",
    description: "Product interfaces and design systems.",
    translations: {
      id: {
        name: "Desain UI/UX",
        description: "Antarmuka produk dan sistem desain.",
      },
    },
  },
  {
    id: "cat-product-templates",
    name: "Social Media Templates",
    slug: "social-media-templates",
    type: "PRODUCT",
    description: "Ready-to-edit feed and story templates.",
    translations: {
      id: {
        name: "Template Media Sosial",
        description: "Template feed dan story yang siap diedit.",
      },
    },
  },
  {
    id: "cat-product-presentation",
    name: "Presentation Templates",
    slug: "presentation-templates",
    type: "PRODUCT",
    description: "Slide systems for pitch decks and reports.",
    translations: {
      id: {
        name: "Template Presentasi",
        description: "Sistem slide untuk pitch deck dan laporan.",
      },
    },
  },
  {
    id: "cat-product-poster",
    name: "Poster Templates",
    slug: "poster-templates",
    type: "PRODUCT",
    description: "Print-ready poster layouts.",
    translations: {
      id: {
        name: "Template Poster",
        description: "Tata letak poster siap cetak.",
      },
    },
  },
  {
    id: "cat-product-canva",
    name: "Canva Templates",
    slug: "canva-templates",
    type: "PRODUCT",
    description: "Editable templates sized for Canva.",
    translations: {
      id: {
        name: "Template Canva",
        description: "Template yang dapat diedit dengan ukuran sesuai Canva.",
      },
    },
  },
  {
    id: "cat-product-design-assets",
    name: "Design Assets",
    slug: "design-assets",
    type: "PRODUCT",
    description: "Ready-to-use assets for promotional and digital content.",
    translations: {
      id: {
        name: "Aset Desain",
        description: "Aset siap pakai untuk materi promosi dan konten digital.",
      },
    },
  },
  {
    id: "cat-service-brand",
    name: "Branding & Visual Identity",
    slug: "branding-visual-identity",
    type: "SERVICE",
    description: "Logo, palette, type, and usage guidelines.",
    translations: {
      id: {
        name: "Branding & Identitas Visual",
        description:
          "Logo, palet warna, tipografi, dan panduan penggunaan identitas.",
      },
    },
  },
];

export const DEMO_PROJECTS: Project[] = [
  {
    id: "proj-aurora",
    title: "DEMO — Aurora Coffee Rebrand",
    slug: "demo-aurora-coffee-rebrand",
    description:
      "A full identity refresh for a specialty roaster. We rebuilt the mark around a rising-sun arc, paired it with a warm terracotta palette, and shipped a 40-page guideline covering packaging, cups, and store signage.",
    cover_image: "/images/demo/aurora-cover.svg",
    client_name: "Aurora Coffee (sample)",
    project_year: 2025,
    is_featured: true,
    is_published: true,
    seo_title: "Aurora Coffee Rebrand — Brand Identity Case Study",
    seo_description:
      "How we rebuilt a specialty coffee brand identity, from logo through packaging and signage guidelines.",
    translations: {
      id: {
        title: "DEMO: Rebrand Aurora Coffee",
        description:
          "Refresh identitas menyeluruh untuk roaster kopi spesialis. Kami membangun kembali logo dengan busur matahari terbit, memadukannya dengan palet terakota hangat, dan menyusun panduan 40 halaman yang mencakup kemasan, gelas, serta signage toko.",
        client_name: "Aurora Coffee (contoh)",
        seo_title: "Rebrand Aurora Coffee: Studi Kasus Identitas Brand",
        seo_description:
          "Cara kami membangun ulang identitas merek kopi pilihan, dari logo hingga panduan kemasan dan signage.",
      },
    },
    category_id: "cat-portfolio-branding",
    category: {
      id: "cat-portfolio-branding",
      name: "Branding",
      slug: "branding",
    },
    images: [
      {
        id: "img-aurora-1",
        image_url: "/images/demo/aurora-01.svg",
        alt_text: "Aurora Coffee primary logo mark on a cream background",
        display_order: 0,
        translations: {
          id: {
            alt_text: "Logo utama Aurora Coffee di atas latar krem",
          },
        },
      },
      {
        id: "img-aurora-2",
        image_url: "/images/demo/aurora-02.svg",
        alt_text: "Aurora Coffee packaging layout with terracotta label",
        display_order: 1,
        translations: {
          id: {
            alt_text: "Tata letak kemasan Aurora Coffee dengan label terakota",
          },
        },
      },
      {
        id: "img-aurora-3",
        image_url: "/images/demo/aurora-03.svg",
        alt_text: "Aurora Coffee colour palette and typography specimens",
        display_order: 2,
        translations: {
          id: {
            alt_text: "Contoh palet warna dan tipografi Aurora Coffee",
          },
        },
      },
    ],
  },
  {
    id: "proj-kiln",
    title: "DEMO — Kiln Ceramics Social Campaign",
    slug: "demo-kiln-ceramics-social-campaign",
    description:
      "A twelve-week content system for a ceramics studio. We designed a modular grid, a set of 30 editable post frames, and a shoot template so the in-house team could keep publishing without a designer on call.",
    cover_image: "/images/demo/kiln-cover.svg",
    client_name: "Kiln Ceramics (sample)",
    project_year: 2025,
    is_featured: true,
    is_published: true,
    seo_title: "Kiln Ceramics Social Campaign — Content System",
    seo_description:
      "A modular social media system that let a ceramics studio publish consistently without external design support.",
    translations: {
      id: {
        title: "DEMO: Kampanye Sosial Kiln Ceramics",
        description:
          "Sistem konten selama dua belas minggu untuk studio keramik. Kami merancang grid modular, 30 bingkai unggahan yang dapat diedit, dan templat shooting agar tim internal dapat terus menerbitkan konten tanpa bergantung pada desainer.",
        client_name: "Kiln Ceramics (contoh)",
        seo_title: "Kampanye Sosial Kiln Ceramics: Sistem Konten",
        seo_description:
          "Sistem media sosial modular yang membantu studio keramik menerbitkan konten secara konsisten tanpa dukungan desain eksternal.",
      },
    },
    category_id: "cat-portfolio-social",
    category: {
      id: "cat-portfolio-social",
      name: "Social Media Design",
      slug: "social-media-design",
    },
    images: [
      {
        id: "img-kiln-1",
        image_url: "/images/demo/kiln-01.svg",
        alt_text: "Kiln Ceramics social post grid layout",
        display_order: 0,
        translations: {
          id: {
            alt_text: "Tata letak grid unggahan media sosial Kiln Ceramics",
          },
        },
      },
      {
        id: "img-kiln-2",
        image_url: "/images/demo/kiln-02.svg",
        alt_text: "Kiln Ceramics story template in mint and coral",
        display_order: 1,
        translations: {
          id: {
            alt_text: "Template story Kiln Ceramics dengan warna mint dan koral",
          },
        },
      },
    ],
  },
  {
    id: "proj-northwind",
    title: "DEMO — Northwind Pitch Deck",
    slug: "demo-northwind-pitch-deck",
    description:
      "A 28-slide investor deck for a logistics startup. We built a chart system, a typographic hierarchy that survives projector contrast, and a layout the founding team could extend without breaking the rhythm.",
    cover_image: "/images/demo/northwind-cover.svg",
    client_name: "Northwind (sample)",
    project_year: 2024,
    is_featured: true,
    is_published: true,
    seo_title: "Northwind Pitch Deck — Presentation Design",
    seo_description:
      "A 28-slide investor deck with a chart system and hierarchy that holds up on a projector.",
    translations: {
      id: {
        title: "DEMO: Pitch Deck Northwind",
        description:
          "Pitch deck investor 28 slide untuk startup logistik. Kami membangun sistem grafik, hierarki tipografi yang tetap terbaca pada kontras proyektor, dan tata letak yang dapat dikembangkan tim pendiri tanpa merusak ritme visual.",
        client_name: "Northwind (contoh)",
        seo_title: "Pitch Deck Northwind: Desain Presentasi",
        seo_description:
          "Pitch deck investor 28 slide dengan sistem grafik dan hierarki yang tetap optimal pada proyektor.",
      },
    },
    category_id: "cat-portfolio-presentation",
    category: {
      id: "cat-portfolio-presentation",
      name: "Presentation",
      slug: "presentation",
    },
    images: [
      {
        id: "img-northwind-1",
        image_url: "/images/demo/northwind-01.svg",
        alt_text: "Northwind deck cover slide",
        display_order: 0,
        translations: {
          id: {
            alt_text: "Slide sampul deck Northwind",
          },
        },
      },
      {
        id: "img-northwind-2",
        image_url: "/images/demo/northwind-02.svg",
        alt_text: "Northwind revenue chart slide",
        display_order: 1,
        translations: {
          id: {
            alt_text: "Slide grafik pendapatan Northwind",
          },
        },
      },
    ],
  },
  {
    id: "proj-verde",
    title: "DEMO — Verde Market Banner Set",
    slug: "demo-verde-market-banner-set",
    description:
      "A seasonal campaign banner set for an online grocery: eight responsive banners, one grid, and a colour system that let the marketing team swap seasonal accents without a redesign.",
    cover_image: "/images/demo/verde-cover.svg",
    client_name: "Verde Market (sample)",
    project_year: 2024,
    is_featured: false,
    is_published: true,
    seo_title: "Verde Market Banner Set — Promotional Design",
    seo_description:
      "Eight responsive promotional banners built on one grid and a swappable accent system.",
    translations: {
      id: {
        title: "DEMO: Rangkaian Banner Verde Market",
        description:
          "Rangkaian banner kampanye musiman untuk toko bahan makanan daring: delapan banner responsif, satu grid, dan sistem warna yang memungkinkan tim pemasaran mengganti aksen musiman tanpa membuat ulang desain.",
        client_name: "Verde Market (contoh)",
        seo_title: "Rangkaian Banner Verde Market: Desain Promosi",
        seo_description:
          "Delapan banner promosi responsif yang dibangun dengan satu grid dan sistem aksen yang mudah diganti.",
      },
    },
    category_id: "cat-portfolio-banner",
    category: {
      id: "cat-portfolio-banner",
      name: "Banner Design",
      slug: "banner-design",
    },
    images: [
      {
        id: "img-verde-1",
        image_url: "/images/demo/verde-01.svg",
        alt_text: "Verde Market banner in mint",
        display_order: 0,
        translations: {
          id: {
            alt_text: "Banner Verde Market dengan warna mint",
          },
        },
      },
    ],
  },
  {
    id: "proj-lumen",
    title: "DEMO — Lumen Banking App UI",
    slug: "demo-lumen-banking-app-ui",
    description:
      "A design system and 24 screens for a mobile banking app. We focused on a legible transaction list, a two-tap transfer flow, and a colour language for money states that survives colour-blind simulation.",
    cover_image: "/images/demo/lumen-cover.svg",
    client_name: "Lumen (sample)",
    project_year: 2025,
    is_featured: true,
    is_published: true,
    seo_title: "Lumen Banking App — UI/UX Design",
    seo_description:
      "A mobile banking design system and 24 screens built around legibility and fast transfer flows.",
    translations: {
      id: {
        title: "DEMO: UI Aplikasi Perbankan Lumen",
        description:
          "Sistem desain dan 24 layar untuk aplikasi perbankan seluler. Kami berfokus pada daftar transaksi yang mudah dibaca, alur transfer dalam dua ketukan, dan bahasa warna untuk status transaksi yang tetap terbaca dalam simulasi buta warna.",
        client_name: "Lumen (contoh)",
        seo_title: "Aplikasi Perbankan Lumen: Desain UI/UX",
        seo_description:
          "Sistem desain perbankan seluler dan 24 layar yang dibangun untuk keterbacaan serta alur transfer yang cepat.",
      },
    },
    category_id: "cat-portfolio-uiux",
    category: {
      id: "cat-portfolio-uiux",
      name: "UI/UX Design",
      slug: "ui-ux-design",
    },
    images: [
      {
        id: "img-lumen-1",
        image_url: "/images/demo/lumen-01.svg",
        alt_text: "Lumen banking app transaction list screen",
        display_order: 0,
        translations: {
          id: {
            alt_text: "Layar daftar transaksi aplikasi perbankan Lumen",
          },
        },
      },
      {
        id: "img-lumen-2",
        image_url: "/images/demo/lumen-02.svg",
        alt_text: "Lumen transfer flow screens",
        display_order: 1,
        translations: {
          id: {
            alt_text: "Layar alur transfer Lumen",
          },
        },
      },
    ],
  },
  {
    id: "proj-halcyon",
    title: "DEMO — Halcyon Skincare Launch Kit",
    slug: "demo-halcyon-skincare-launch-kit",
    description:
      "Launch assets for a skincare line: a key visual, six social frames, and a one-page product sheet. The brief was to feel clinical without feeling cold, so we leaned on generous whitespace and a single coral accent.",
    cover_image: "/images/demo/halcyon-cover.svg",
    client_name: "Halcyon (sample)",
    project_year: 2023,
    is_featured: false,
    is_published: true,
    seo_title: "Halcyon Skincare Launch Kit — Brand Campaign",
    seo_description:
      "Launch assets for a skincare line — key visual, social frames, and a product sheet.",
    translations: {
      id: {
        title: "DEMO: Kit Peluncuran Skincare Halcyon",
        description:
          "Aset peluncuran untuk lini skincare: satu key visual, enam bingkai media sosial, dan lembar produk satu halaman. Brief-nya meminta kesan klinis tanpa terasa dingin, sehingga kami mengandalkan ruang kosong yang lapang dan satu aksen warna coral.",
        client_name: "Halcyon (contoh)",
        seo_title: "Kit Peluncuran Skincare Halcyon: Kampanye Brand",
        seo_description:
          "Aset peluncuran untuk lini skincare, mencakup key visual, bingkai media sosial, dan lembar produk.",
      },
    },
    category_id: "cat-portfolio-social",
    category: {
      id: "cat-portfolio-social",
      name: "Social Media Design",
      slug: "social-media-design",
    },
    images: [
      {
        id: "img-halcyon-1",
        image_url: "/images/demo/halcyon-01.svg",
        alt_text: "Halcyon skincare key visual",
        display_order: 0,
        translations: {
          id: {
            alt_text: "Key visual skincare Halcyon",
          },
        },
      },
    ],
  },
];

export const DEMO_SERVICES: Service[] = [
  {
    id: "svc-social",
    title: "Social Media Design",
    slug: "social-media-design",
    description:
      "A feed system you can actually keep up with. We design a modular grid and a set of editable frames so publishing stays consistent without a designer on every post.",
    cover_image: "/images/demo/service-social.svg",
    deliverables: [
      "Feed grid design",
      "Editable post templates",
      "Story and reel cover set",
      "Colour and type guidelines",
      "Caption style guide",
    ],
    turnaround_days: 5,
    revision_policy: "2 revision rounds included",
    translations: {
      id: {
        title: "Desain Media Sosial",
        description:
          "Sistem feed yang benar-benar dapat dikelola dengan mudah. Kami merancang grid modular dan kumpulan bingkai yang dapat diedit agar publikasi tetap konsisten tanpa memerlukan desainer untuk setiap unggahan.",
        deliverables: [
          "Desain grid feed",
          "Template unggahan yang dapat diedit",
          "Set sampul story dan reel",
          "Panduan warna dan tipografi",
          "Panduan gaya caption",
        ],
        revision_policy: "Termasuk 2 ronde revisi",
      },
    },
    is_active: true,
    category_id: "cat-service-brand",
    packages: [
      {
        id: "pkg-social-starter",
        service_id: "svc-social",
        name: "Starter",
        description: "A single month of content, designed as a repeatable system.",
        price: 450000,
        revision_count: 2,
        delivery_days: 5,
        features: [
          "12 post designs",
          "4 story templates",
          "1 revision round per post",
          "Editable source files",
        ],
        translations: {
          id: {
            name: "Starter",
            description:
              "Konten selama satu bulan, dirancang sebagai sistem yang dapat digunakan berulang.",
            features: [
              "12 desain unggahan",
              "4 template story",
              "1 ronde revisi per unggahan",
              "File sumber yang dapat diedit",
            ],
          },
        },
        is_active: true,
      },
      {
        id: "pkg-social-growth",
        service_id: "svc-social",
        name: "Growth",
        description: "A quarter of content with a deeper template library and a launch set.",
        price: 1250000,
        revision_count: 3,
        delivery_days: 7,
        features: [
          "36 post designs",
          "12 story templates",
          "Launch announcement set",
          "2 revision rounds per batch",
          "Editable source files",
        ],
        translations: {
          id: {
            name: "Growth",
            description:
              "Konten selama satu kuartal dengan pustaka template yang lebih lengkap dan set peluncuran.",
            features: [
              "36 desain unggahan",
              "12 template story",
              "Set pengumuman peluncuran",
              "2 ronde revisi per batch",
              "File sumber yang dapat diedit",
            ],
          },
        },
        is_active: true,
      },
      {
        id: "pkg-social-retainer",
        service_id: "svc-social",
        name: "Retainer",
        description: "Ongoing design support with priority turnaround and monthly planning.",
        price: 3200000,
        revision_count: 4,
        delivery_days: 3,
        features: [
          "Everything in Growth",
          "Monthly content planning call",
          "Priority 3-day turnaround",
          "Unlimited working files",
        ],
        translations: {
          id: {
            name: "Retainer",
            description:
              "Dukungan desain berkelanjutan dengan pengerjaan prioritas dan perencanaan bulanan.",
            features: [
              "Semua yang ada di Growth",
              "Rapat perencanaan konten bulanan",
              "Pengerjaan prioritas 3 hari",
              "File kerja tanpa batas",
            ],
          },
        },
        is_active: true,
      },
    ],
  },
  {
    id: "svc-banner",
    title: "Banner & Promotional Design",
    slug: "banner-promotional-design",
    description:
      "Campaign artwork that scales across every placement you need — web heroes, display banners, email headers, and paid social — from a single grid.",
    cover_image: "/images/demo/service-banner.svg",
    deliverables: [
      "Responsive banner set",
      "Source design files",
      "Copy and layout variants",
      "Export guide for each placement",
      "Editable templates",
    ],
    turnaround_days: 4,
    revision_policy: "2 revision rounds included",
    translations: {
      id: {
        title: "Desain Banner & Promosi",
        description:
          "Karya kampanye yang dapat disesuaikan untuk setiap penempatan yang Anda perlukan: hero web, banner display, header email, dan media sosial berbayar, semuanya berasal dari satu grid.",
        deliverables: [
          "Set banner responsif",
          "File desain sumber",
          "Varian naskah dan tata letak",
          "Panduan ekspor untuk setiap penempatan",
          "Template yang dapat diedit",
        ],
        revision_policy: "Termasuk 2 ronde revisi",
      },
    },
    is_active: true,
    category_id: null,
    packages: [
      {
        id: "pkg-banner-single",
        service_id: "svc-banner",
        name: "Single Campaign",
        description: "One campaign across six placements.",
        price: 350000,
        revision_count: 2,
        delivery_days: 4,
        features: [
          "6 banner sizes",
          "2 layout variants",
          "2 revision rounds",
          "PNG + JPG exports",
        ],
        translations: {
          id: {
            name: "Kampanye Tunggal",
            description: "Satu kampanye untuk enam penempatan.",
            features: [
              "6 ukuran banner",
              "2 varian tata letak",
              "2 ronde revisi",
              "Ekspor PNG + JPG",
            ],
          },
        },
        is_active: true,
      },
      {
        id: "pkg-banner-multi",
        service_id: "svc-banner",
        name: "Multi-Campaign",
        description: "Three campaigns with a shared seasonal system.",
        price: 950000,
        revision_count: 3,
        delivery_days: 6,
        features: [
          "18 banner sizes",
          "3 seasonal accent sets",
          "3 revision rounds",
          "Editable template library",
        ],
        translations: {
          id: {
            name: "Multi-Kampanye",
            description:
              "Tiga kampanye dengan sistem musiman yang sama.",
            features: [
              "18 ukuran banner",
              "3 set aksen musiman",
              "3 ronde revisi",
              "Pustaka template yang dapat diedit",
            ],
          },
        },
        is_active: true,
      },
    ],
  },
  {
    id: "svc-branding",
    title: "Branding & Visual Identity",
    slug: "branding-visual-identity",
    description:
      "A logo is a starting point, not an identity. We build the full system — mark, palette, type, and the written rules that keep it consistent after we leave.",
    cover_image: "/images/demo/service-branding.svg",
    deliverables: [
      "Logo suite with clear-space rules",
      "Colour palette with accessibility values",
      "Typography pairing",
      "Brand guideline document",
      "Business card and stationery set",
      "Social media avatar kit",
    ],
    turnaround_days: 14,
    revision_policy: "3 revision rounds on the mark",
    translations: {
      id: {
        title: "Branding & Identitas Visual",
        description:
          "Logo hanyalah awal, bukan identitas. Kami membangun sistem lengkap: logo, palet warna, tipografi, dan aturan tertulis yang menjaga konsistensi identitas setelah kami selesai bekerja.",
        deliverables: [
          "Set logo dengan aturan ruang kosong",
          "Palet warna dengan nilai aksesibilitas",
          "Kombinasi tipografi",
          "Dokumen panduan brand",
          "Set kartu nama dan stationary",
          "Kit avatar media sosial",
        ],
        revision_policy: "3 ronde revisi untuk logo",
      },
    },
    is_active: true,
    category_id: "cat-service-brand",
    packages: [
      {
        id: "pkg-brand-core",
        service_id: "svc-branding",
        name: "Core",
        description: "The identity essentials, delivered as a practical system.",
        price: 2500000,
        revision_count: 3,
        delivery_days: 14,
        features: [
          "Primary and secondary mark",
          "Colour and type system",
          "1-page guideline sheet",
          "3 revision rounds",
        ],
        translations: {
          id: {
            name: "Dasar",
            description:
              "Elemen inti identitas, dikirimkan sebagai sistem praktis.",
            features: [
              "Logo utama dan sekunder",
              "Sistem warna dan tipografi",
              "Lembar panduan 1 halaman",
              "3 ronde revisi",
            ],
          },
        },
        is_active: true,
      },
      {
        id: "pkg-brand-full",
        service_id: "svc-branding",
        name: "Full Identity",
        description: "The complete package with applications and a full guideline document.",
        price: 6500000,
        revision_count: 4,
        delivery_days: 21,
        features: [
          "Everything in Core",
          "40-page guideline document",
          "Stationery and business card set",
          "Social avatar and cover kit",
          "Packaging application mockups",
        ],
        translations: {
          id: {
            name: "Identitas Lengkap",
            description:
              "Paket lengkap dengan penerapan dan dokumen panduan lengkap.",
            features: [
              "Semua yang ada di Dasar",
              "Dokumen panduan 40 halaman",
              "Set stationary dan kartu nama",
              "Kit avatar dan sampul media sosial",
              "Mockup penerapan kemasan",
            ],
          },
        },
        is_active: true,
      },
    ],
  },
  {
    id: "svc-presentation",
    title: "Presentation Design",
    slug: "presentation-design",
    description:
      "Decks that read well from the back row. We build the slide system first, then populate it — so you can add a section a week before the meeting without breaking anything.",
    cover_image: "/images/demo/service-presentation.svg",
    deliverables: [
      "Slide master and layout system",
      "Chart and data visualisation style",
      "Designed slide content",
      "Icon and image direction",
      "Editable source file",
    ],
    turnaround_days: 7,
    revision_policy: "2 revision rounds on the full deck",
    translations: {
      id: {
        title: "Desain Presentasi",
        description:
          "Presentasi yang tetap terbaca dari barisan belakang. Kami membangun sistem slide terlebih dahulu, lalu mengisinya, sehingga Anda dapat menambahkan bagian satu minggu sebelum rapat tanpa merusak keseluruhan.",
        deliverables: [
          "Slide master dan sistem tata letak",
          "Gaya grafik dan visualisasi data",
          "Konten slide yang dirancang",
          "Arah ikon dan gambar",
          "File sumber yang dapat diedit",
        ],
        revision_policy: "2 ronde revisi untuk seluruh deck",
      },
    },
    is_active: true,
    category_id: null,
    packages: [
      {
        id: "pkg-deck-15",
        service_id: "svc-presentation",
        name: "15-slide Deck",
        description: "A focused deck for a single narrative.",
        price: 1200000,
        revision_count: 2,
        delivery_days: 7,
        features: [
          "15 designed slides",
          "2 chart styles",
          "2 revision rounds",
          "Editable source file",
        ],
        translations: {
          id: {
            name: "Deck 15 Slide",
            description: "Deck yang fokus untuk satu narasi.",
            features: [
              "15 slide yang dirancang",
              "2 gaya grafik",
              "2 ronde revisi",
              "File sumber yang dapat diedit",
            ],
          },
        },
        is_active: true,
      },
      {
        id: "pkg-deck-30",
        service_id: "svc-presentation",
        name: "30-slide Deck",
        description: "A full pitch or report with a reusable layout system.",
        price: 2200000,
        revision_count: 3,
        delivery_days: 10,
        features: [
          "30 designed slides",
          "Full layout system",
          "3 chart styles",
          "3 revision rounds",
          "Editable source file",
        ],
        translations: {
          id: {
            name: "Deck 30 Slide",
            description:
              "Pitch atau laporan lengkap dengan sistem tata letak yang dapat digunakan kembali.",
            features: [
              "30 slide yang dirancang",
              "Sistem tata letak lengkap",
              "3 gaya grafik",
              "3 ronde revisi",
              "File sumber yang dapat diedit",
            ],
          },
        },
        is_active: true,
      },
    ],
  },
  {
    id: "svc-uiux",
    title: "UI/UX Design",
    slug: "ui-ux-design",
    description:
      "Product interfaces designed around the tasks people actually came to do. We start with the flows, then the screens, and hand over a system your developers can build from.",
    cover_image: "/images/demo/service-uiux.svg",
    deliverables: [
      "User flow and wireframes",
      "High-fidelity screen designs",
      "Component library",
      "Responsive specifications",
      "Developer handoff notes",
    ],
    turnaround_days: 21,
    revision_policy: "2 revision rounds per stage",
    translations: {
      id: {
        title: "Desain UI/UX",
        description:
          "Antarmuka produk yang dirancang berdasarkan tugas yang ingin diselesaikan pengguna. Kami mulai dari alur, kemudian menyusun layar, dan menyerahkan sistem yang dapat langsung dikembangkan oleh tim pengembang.",
        deliverables: [
          "Alur pengguna dan wireframe",
          "Desain layar resolusi tinggi",
          "Pustaka komponen",
          "Spesifikasi responsif",
          "Catatan serah terima untuk pengembang",
        ],
        revision_policy: "2 ronde revisi untuk setiap tahap",
      },
    },
    is_active: true,
    category_id: null,
    packages: [
      {
        id: "pkg-uiux-screen",
        service_id: "svc-uiux",
        name: "Screen Set",
        description: "A focused set of screens for a single flow.",
        price: 4500000,
        revision_count: 2,
        delivery_days: 14,
        features: [
          "Up to 8 screens",
          "Wireframes for the flow",
          "Component library",
          "2 revision rounds per stage",
        ],
        translations: {
          id: {
            name: "Set Layar",
            description: "Kumpulan layar terfokus untuk satu alur.",
            features: [
              "Hingga 8 layar",
              "Wireframe untuk alur",
              "Pustaka komponen",
              "2 ronde revisi per tahap",
            ],
          },
        },
        is_active: true,
      },
      {
        id: "pkg-uiux-product",
        service_id: "svc-uiux",
        name: "Product Design",
        description: "End-to-end product design with research support.",
        price: 12000000,
        revision_count: 3,
        delivery_days: 30,
        features: [
          "Up to 24 screens",
          "User flow and wireframes",
          "Full component library",
          "Responsive specifications",
          "Developer handoff session",
        ],
        translations: {
          id: {
            name: "Desain Produk",
            description:
              "Desain produk menyeluruh dengan dukungan riset.",
            features: [
              "Hingga 24 layar",
              "Alur pengguna dan wireframe",
              "Pustaka komponen lengkap",
              "Spesifikasi responsif",
              "Sesi serah terima kepada pengembang",
            ],
          },
        },
        is_active: true,
      },
    ],
  },
];

export const DEMO_PRODUCTS: Product[] = [
  {
    id: "prod-aurora-story",
    title: "DEMO — Aurora Story Template Kit",
    slug: "demo-aurora-story-template-kit",
    description:
      "Thirty editable story frames built on a single editorial grid. Change the accent colour once and every frame follows. Includes a highlight cover, quote card, product frame, and a poll layout.",
    cover_image: "/images/demo/product-story.svg",
    price: 145000,
    discount_price: 99000,
    file_format: "FIG, Canva, PNG",
    compatibility: "Figma, Canva, Adobe Photoshop",
    license_terms:
      "Personal and small-business use for one brand. Redistribution of the source files is not permitted.",
    translations: {
      id: {
        title: "DEMO: Kit Template Story Aurora",
        description:
          "Tiga puluh bingkai story yang dapat diedit dan dibangun dengan satu grid editorial. Ubah warna aksen satu kali dan seluruh bingkai akan mengikuti. Termasuk sampul sorotan, kartu kutipan, bingkai produk, dan tata letak jajak pendapat.",
        file_format: "FIG, Canva, PNG",
        compatibility: "Figma, Canva, Adobe Photoshop",
        license_terms:
          "Untuk penggunaan pribadi dan usaha kecil oleh satu merek. Distribusi ulang file sumber tidak diperbolehkan.",
      },
    },
    is_featured: true,
    is_published: true,
    category_id: "cat-product-templates",
    category: {
      id: "cat-product-templates",
      name: "Social Media Templates",
      slug: "social-media-templates",
    },
    images: [
      {
        id: "img-story-1",
        image_url: "/images/demo/product-story-01.svg",
        alt_text: "Aurora story kit cover frame",
        display_order: 0,
        translations: {
          id: {
            alt_text: "Sampul kit template story Aurora",
          },
        },
      },
      {
        id: "img-story-2",
        image_url: "/images/demo/product-story-02.svg",
        alt_text: "Aurora story kit quote card",
        display_order: 1,
        translations: {
          id: {
            alt_text: "Kartu kutipan kit template story Aurora",
          },
        },
      },
    ],
  },
  {
    id: "prod-pitch",
    title: "DEMO — Pitch Deck Template",
    slug: "demo-pitch-deck-template",
    description:
      "A 40-slide investor deck template with a chart system, a financial table style, and layouts for team, roadmap, traction, and the ask. Fully editable.",
    cover_image: "/images/demo/product-deck.svg",
    price: 275000,
    discount_price: null,
    file_format: "FIG, PPTX, KEY",
    compatibility: "Figma, PowerPoint, Keynote, Google Slides",
    license_terms:
      "Personal and commercial use for one brand. Reselling the template as-is is not permitted.",
    translations: {
      id: {
        title: "DEMO: Template Pitch Deck",
        description:
          "Template pitch deck investor 40 slide dengan sistem grafik, gaya tabel keuangan, serta tata letak untuk tim, peta jalan, traeksi, dan kebutuhan pendanaan. Sepenuhnya dapat diedit.",
        file_format: "FIG, PPTX, KEY",
        compatibility: "Figma, PowerPoint, Keynote, Google Slides",
        license_terms:
          "Untuk penggunaan pribadi dan komersial oleh satu merek. Menjual ulang template tanpa perubahan tidak diperbolehkan.",
      },
    },
    is_featured: true,
    is_published: true,
    category_id: "cat-product-presentation",
    category: {
      id: "cat-product-presentation",
      name: "Presentation Templates",
      slug: "presentation-templates",
    },
    images: [
      {
        id: "img-deck-1",
        image_url: "/images/demo/product-deck-01.svg",
        alt_text: "Pitch deck template cover slide",
        display_order: 0,
        translations: {
          id: {
            alt_text: "Slide sampul template pitch deck",
          },
        },
      },
    ],
  },
  {
    id: "prod-poster",
    title: "DEMO — Poster Set: Bold Type",
    slug: "demo-poster-set-bold-type",
    description:
      "Twelve A3 and A2 poster layouts built around expressive typography. Two-column grid, oversized numerals, and a colour system with print-safe CMYK values.",
    cover_image: "/images/demo/product-poster.svg",
    price: 195000,
    discount_price: null,
    file_format: "AI, PSD, PDF",
    compatibility: "Adobe Illustrator, Adobe Photoshop, InDesign",
    license_terms:
      "Commercial print and digital use for one brand. Redistribution of source files is not permitted.",
    translations: {
      id: {
        title: "DEMO: Set Poster: Bold Type",
        description:
          "Dua belas tata letak poster A3 dan A2 yang dibangun dengan tipografi ekspresif. Grid dua kolom, angka berukuran besar, dan sistem warna dengan nilai CMYK yang aman untuk cetak.",
        file_format: "AI, PSD, PDF",
        compatibility: "Adobe Illustrator, Adobe Photoshop, InDesign",
        license_terms:
          "Untuk penggunaan cetak komersial dan digital oleh satu merek. Distribusi ulang file sumber tidak diperbolehkan.",
      },
    },
    is_featured: false,
    is_published: true,
    category_id: "cat-product-poster",
    category: {
      id: "cat-product-poster",
      name: "Poster Templates",
      slug: "poster-templates",
    },
    images: [
      {
        id: "img-poster-1",
        image_url: "/images/demo/product-poster-01.svg",
        alt_text: "Bold Type poster layout",
        display_order: 0,
        translations: {
          id: {
            alt_text: "Tata letak poster Bold Type",
          },
        },
      },
    ],
  },
  {
    id: "prod-canva",
    title: "DEMO — Canva Starter Bundle",
    slug: "demo-canva-starter-bundle",
    description:
      "Forty-two Canva-sized layouts for social posts, stories, and pins. Set the brand palette once and every template picks it up.",
    cover_image: "/images/demo/product-canva.svg",
    price: 89000,
    discount_price: 59000,
    file_format: "Canva, PNG, PDF",
    compatibility: "Canva (free and pro tiers)",
    license_terms:
      "Personal and small-business use for one brand. Template resale is not permitted.",
    translations: {
      id: {
        title: "DEMO: Paket Starter Canva",
        description:
          "Empat puluh dua tata letak berukuran Canva untuk unggahan sosial, story, dan pin. Atur palet brand sekali dan seluruh template langsung mengikuti.",
        file_format: "Canva, PNG, PDF",
        compatibility: "Canva ( paket gratis dan pro)",
        license_terms:
          "Untuk penggunaan pribadi dan usaha kecil oleh satu merek. Penjualan ulang template tidak diperbolehkan.",
      },
    },
    is_featured: true,
    is_published: true,
    category_id: "cat-product-canva",
    category: {
      id: "cat-product-canva",
      name: "Canva Templates",
      slug: "canva-templates",
    },
    images: [
      {
        id: "img-canva-1",
        image_url: "/images/demo/product-canva-01.svg",
        alt_text: "Canva bundle layout preview",
        display_order: 0,
        translations: {
          id: {
            alt_text: "Pratinjau tata letak paket Canva",
          },
        },
      },
    ],
  },
  {
    id: "prod-icons",
    title: "DEMO — Soft Geometry Icon Pack",
    slug: "demo-soft-geometry-icon-pack",
    description:
      "One hundred and twenty icons drawn on a 2px grid with rounded caps. Ships as SVG, Figma components, and a PNG set for pitch decks.",
    cover_image: "/images/demo/product-icons.svg",
    price: 165000,
    discount_price: null,
    file_format: "SVG, FIG, PNG",
    compatibility: "Figma, Adobe Illustrator, Sketch, any vector editor",
    license_terms:
      "Unlimited project use for one brand. Icon resale as a standalone pack is not permitted.",
    translations: {
      id: {
        title: "DEMO: Paket Ikon Geometri Lembut",
        description:
          "Seratus dua puluh ikon yang digambar pada grid 2px dengan ujung membulat. Tersedia dalam format SVG, komponen Figma, dan set PNG untuk pitch deck.",
        file_format: "SVG, FIG, PNG",
        compatibility: "Figma, Adobe Illustrator, Sketch, editor vektor apa pun",
        license_terms:
          "Penggunaan proyek tanpa batas untuk satu merek. Penjualan ulang ikon sebagai paket terpisah tidak diperbolehkan.",
      },
    },
    is_featured: false,
    is_published: true,
    category_id: "cat-product-canva",
    category: {
      id: "cat-product-canva",
      name: "Design Assets",
      slug: "design-assets",
    },
    images: [
      {
        id: "img-icons-1",
        image_url: "/images/demo/product-icons-01.svg",
        alt_text: "Soft Geometry icon sheet preview",
        display_order: 0,
        translations: {
          id: {
            alt_text: "Pratinjau lembar ikon Soft Geometry",
          },
        },
      },
    ],
  },
  {
    id: "prod-brand-kit",
    title: "DEMO — Mini Brand Kit",
    slug: "demo-mini-brand-kit",
    description:
      "A compact brand kit for a new venture: a logo grid, colour swatches, type pairing, and ten social templates. A sensible start before a full identity.",
    cover_image: "/images/demo/product-brandkit.svg",
    price: 350000,
    discount_price: 249000,
    file_format: "FIG, Canva, PDF",
    compatibility: "Figma, Canva, Adobe Photoshop",
    license_terms:
      "Personal and commercial use for one brand. Redistribution of source files is not permitted.",
    translations: {
      id: {
        title: "DEMO: Mini Brand Kit",
        description:
          "Brand kit ringkas untuk usaha baru: grid logo, contoh warna, kombinasi tipografi, dan sepuluh template media sosial. Awal yang cocok sebelum identitas visual lengkap.",
        file_format: "FIG, Canva, PDF",
        compatibility: "Figma, Canva, Adobe Photoshop",
        license_terms:
          "Untuk penggunaan pribadi dan komersial oleh satu merek. Distribusi ulang file sumber tidak diperbolehkan.",
      },
    },
    is_featured: false,
    is_published: true,
    category_id: "cat-product-templates",
    category: {
      id: "cat-product-templates",
      name: "Social Media Templates",
      slug: "social-media-templates",
    },
    images: [
      {
        id: "img-brandkit-1",
        image_url: "/images/demo/product-brandkit-01.svg",
        alt_text: "Mini brand kit preview",
        display_order: 0,
        translations: {
          id: {
            alt_text: "Pratinjau Mini Brand Kit",
          },
        },
      },
    ],
  },
];

export const DEMO_TESTIMONIALS: Testimonial[] = [
  {
    id: "test-1",
    customer_name: "DEMO Sample Client",
    customer_role: "DEMO — Brand owner",
    content:
      "The brief was clear, the questions were sharper than ours, and the delivery came two days early. The guideline document is the part we actually use every week.",
    translations: {
      id: {
        customer_name: "DEMO Klien Contoh",
        customer_role: "DEMO: Pemilik Brand",
        content:
          "Brief-nya jelas, pertanyaannya bahkan lebih tajam daripada pertanyaan kami, dan pengerjaannya selesai dua hari lebih awal. Dokumen panduan adalah bagian yang benar-benar kami gunakan setiap minggu.",
      },
    },
    avatar_url: null,
    project_id: "proj-aurora",
    is_featured: true,
    is_published: true,
    project: {
      id: "proj-aurora",
      title: "DEMO — Aurora Coffee Rebrand",
      slug: "demo-aurora-coffee-rebrand",
    },
  },
  {
    id: "test-2",
    customer_name: "DEMO Sample Client",
    customer_role: "DEMO — Marketing lead",
    content:
      "We went from a blank page every Monday to a system the team runs itself. The templates are the work — everything else was just setup.",
    translations: {
      id: {
        customer_name: "DEMO Klien Contoh",
        customer_role: "DEMO: Head Pemasaran",
        content:
          "Kami berpindah dari halaman kosong setiap Senin menjadi sistem yang dapat dikelola sendiri oleh tim. Template adalah inti pekerjaannya, sedangkan bagian lain hanya pengaturan awal.",
      },
    },
    avatar_url: null,
    project_id: "proj-kiln",
    is_featured: true,
    is_published: true,
    project: {
      id: "proj-kiln",
      title: "DEMO — Kiln Ceramics Social Campaign",
      slug: "demo-kiln-ceramics-social-campaign",
    },
  },
  {
    id: "test-3",
    customer_name: "DEMO Sample Client",
    customer_role: "DEMO — Founder",
    content:
      "Our deck used to be rebuilt from scratch for every meeting. Now we add slides to the master and it still looks like one document.",
    translations: {
      id: {
        customer_name: "DEMO Klien Contoh",
        customer_role: "DEMO: Pendiri",
        content:
          "Dulu deck kami harus dibuat dari nol untuk setiap rapat. Sekarang kami cukup menambahkan slide ke master dan tampilannya tetap seperti satu dokumen yang utuh.",
      },
    },
    avatar_url: null,
    project_id: "proj-northwind",
    is_featured: true,
    is_published: true,
    project: {
      id: "proj-northwind",
      title: "DEMO — Northwind Pitch Deck",
      slug: "demo-northwind-pitch-deck",
    },
  },
  {
    id: "test-4",
    customer_name: "DEMO Sample Client",
    customer_role: "DEMO — Product lead",
    content:
      "The transfer flow went from five screens to two, and support tickets about it dropped. That is the whole review.",
    translations: {
      id: {
        customer_name: "DEMO Klien Contoh",
        customer_role: "DEMO: Head Produk",
        content:
          "Alur transfer turun dari lima layar menjadi dua layar, dan jumlah tiket dukungan tentang alur tersebut juga berkurang. Itu seluruh penilaian kami.",
      },
    },
    avatar_url: null,
    project_id: "proj-lumen",
    is_featured: false,
    is_published: true,
    project: {
      id: "proj-lumen",
      title: "DEMO — Lumen Banking App UI",
      slug: "demo-lumen-banking-app-ui",
    },
  },
];

export const DEMO_SETTINGS: SiteSettings = {
  studioName: "ngantuqan",
  tagline: "Creative Design Studio & Digital Marketplace",
  email: "hello@ngantuqan.studio",
  logoUrl: null,
  socials: [
    { platform: "Instagram", url: "https://instagram.com/ngantuqan" },
    { platform: "Behance", url: "https://behance.net/ngantuqan" },
    { platform: "LinkedIn", url: "https://linkedin.com/company/ngantuqan" },
  ],
  footerNote:
    "An independent design studio building brand identities, content systems, and design tools.",
  translations: {
    id: {
      tagline: "Studio Desain Kreatif & Marketplace Digital",
      footerNote:
        "Studio desain independen yang membangun identitas brand, sistem konten, dan alat desain.",
    },
  },
};
