/**
 * The English dictionary.
 *
 * English is the source language. The Indonesian dictionary in id.ts has the
 * same shape, so TypeScript refuses to build if a key is missing or renamed.
 *
 * Strings that come from the database (project titles, service descriptions,
 * testimonials) are not here: those are content, and they carry their own
 * locale. See src/lib/queries/content.ts.
 */
export const en = {
  nav: {
    primary: "Primary",
    mobile: "Mobile",
    work: "Work",
    services: "Services",
    shop: "Shop",
    about: "About",
    contact: "Contact",
    search: "Search products",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    siteMenu: "Site menu",
    skipToContent: "Skip to content",
    language: "Language",
    switchTo: "Switch to {language}",
    startProject: "Start a Project",
    home: "ngantuqan, home",
  },
  cart: {
    label: "Cart",
    count: "Cart, {count} item",
    countPlural: "Cart, {count} items",
  },
  common: {
    from: "From",
    save: "Save {percent}%",
    view: "View",
    details: "Details",
    viewProject: "View project",
    dayTurnaround: "{count} day turnaround",
    typicalTurnaround: "Typical turnaround",
    revisionPolicy: "Revision policy",
    days: "{count} days",
    range: "{from} to {to}",
    fileFormat: "File format",
    demoContent: "Demo content",
    coverArtwork: "Cover artwork for {title}",
    previewArtwork: "Preview artwork for {title}",
    lastUpdated: "Last updated {date}",
    clearSearch: "Clear search",
    updatingResults: "Updating results",
    loading: "Loading the page",
    previous: "Previous",
    next: "Next",
    page: "Page {number}",
    notTranslated: "This document is published in English. A translation is in preparation.",
  },
  hero: {
    eyebrow: "Independent creative design studio",
    title: "Welcome",
    lede: "We build brand identities, content systems, and product interfaces for studios and small teams, then hand over the tools to keep them running without us.",
    ctaWork: "See the work",
    ctaDiscover: "Discover the work",
    ctaContact: "Start a Project",
    statServices: "Services",
    statDelivery: "Typical delivery",
    statRevisions: "Revision rounds",
    artworkCaption: "Placeholder artwork. Replace before launch.",
  },
  works: {
    eyebrow: "Selected Work",
    title: "Projects we're proud to sign",
    lede: "A sample of recent identity, content, and product work, each one built to be used, not just admired.",
    button: "View All Works",
    link: "Browse the full portfolio",
    emptyTitle: "No selected work yet",
    emptyDescription:
      "Published projects will appear here. Browse the portfolio to see the latest available work.",
  },
  servicesOverview: {
    eyebrow: "What We Do",
    title: "Five ways we can help",
    lede: "Every engagement ends with something your team can run: templates, guidelines, and a source file you actually own.",
    emptyTitle: "No services are available yet",
    emptyDescription:
      "Our studio services will appear here once they are published.",
  },
  studio: {
    eyebrow: "The Studio",
    title: "We design the system, then hand you the keys.",
    body1: "Most studios deliver a file. We deliver the thing that keeps working after the invoice is paid: the grid, the template, the guideline, the component library.",
    body2: "That means asking sharper questions early, documenting the reasoning, and building with the people who will actually maintain the work.",
    button: "About the Studio",
    quote:
      "The goal is never a pretty deliverable. It's a system your team can use on a Tuesday without calling us.",
    quoteAttribution: "Our working principle",
    link: "Start a conversation",
  },
  products: {
    eyebrow: "Digital Products",
    title: "Templates you can use today",
    lede: "Editable design assets built from the same systems we use in client work. Buy once, edit forever.",
    button: "Browse the Shop",
    emptyTitle: "No products are available yet",
    emptyDescription:
      "New templates and design assets will appear here when they are ready to download.",
  },
  why: {
    eyebrow: "Why Work With Us",
    title: "Four things we don't compromise on",
    reasons: [
      {
        title: "Creative approach",
        body: "We look for the idea underneath the brief. The output is usually clearer than what was asked for.",
      },
      {
        title: "Attention to detail",
        body: "Pixel-level spacing, consistent baselines, and a real type scale. The small things are what people feel.",
      },
      {
        title: "Clear communication",
        body: "One point of contact, honest status updates, and no disappearing acts between rounds of feedback.",
      },
      {
        title: "Flexible solutions",
        body: "Systems that fit how your team works, sized to what you can actually maintain.",
      },
    ],
  },
  testimonials: {
    eyebrow: "Testimonials",
    title: "What clients say afterwards",
    emptyTitle: "No client notes yet",
    emptyDescription:
      "Verified feedback from completed projects will appear here.",
  },
  cta: {
    eyebrow: "Let's work together",
    title1: "Tell us what you're making.",
    title2: "We'll tell you how to build it.",
    lede: "Send a brief, a half-formed idea, or a deck that isn't working. You'll get a reply with real questions and an honest read on scope and cost.",
    button: "Start a Project",
    secondary: "See what we offer",
  },
  footer: {
    navigate: "Navigate",
    elsewhere: "Elsewhere",
    legal: "Legal",
    rights: "© {year} ngantuqan. All rights reserved.",
    email: "Email",
  },
  work: {
    eyebrow: "Portfolio",
    metaDescription:
      "Selected brand identity, content system, presentation, and UI/UX design projects by ngantuqan.",
    title: "Work we're happy to show.",
    lede: "Identity systems, content templates, decks, and product interfaces. Filter by discipline or search by project title.",
    filterAll: "All work",
    searchPlaceholder: "Search projects by title",
    searchLabel: "Search projects by title",
    emptyTitle: "No projects match that",
    emptyDescription:
      "Try a different category, or clear the search to see everything we've published.",
    clearFilters: "Clear filters",
    discipline: "Discipline",
    year: "Year",
    client: "Client",
    inProgress: "In progress",
    projectFallback: "Project",
    designFallback: "Design",
    galleryEyebrow: "Final Design",
    galleryTitle: "The gallery",
    galleryAlt: "{title} design",
    ctaEyebrow: "Something similar in mind?",
    ctaTitle: "Start a similar project",
    relatedEyebrow: "Related Projects",
    relatedTitle: "More like this",
    related: "Related work",
    next: "Next project",
    previous: "Previous project",
    servicesTitle: "Services",
    contactTitle: "Need something like this?",
    contactLede:
      "Tell us what you're working on and we'll come back with questions, a scope, and a realistic timeline.",
    contactButton: "Start a Project",
    deliverables: "What you get",
    gallery: "Gallery",
  },
  shop: {
    eyebrow: "Digital Shop",
    metaDescription:
      "Downloadable social media, presentation, poster, and Canva templates plus design assets from ngantuqan.",
    title: "Design tools, ready to use.",
    lede: "Editable templates built from the same systems we use in client work. Buy once, download the source files, make them yours.",
    filterAll: "All products",
    searchPlaceholder: "Search products by title",
    searchLabel: "Search products by title",
    sort: "Sort",
    sortNewest: "Newest",
    sortPriceAsc: "Price, low to high",
    sortPriceDesc: "Price, high to low",
    emptyTitle: "Nothing here yet",
    emptyDescription:
      "No products match that filter. Try another category, or clear the filter to browse everything.",
    clearFilters: "Clear filters",
    addToCart: "Add to cart",
    addedToCart: "Added to cart",
    buyNow: "Buy now",
    downloadNote: "Instant download after payment is confirmed",
    download: "Download",
    readyToSave: "{file}: ready, click to save",
    license: "License",
    compatibility: "Works with",
    includes: "What's inside",
    customTitle: "Need something custom instead?",
    customLede:
      "We build the templates people actually want, built around your brand, not a generic grid.",
    customButton: "Request a Custom Design",
    description: "Description",
    backToShop: "Back to shop",
    previewAlt: "{title} preview",
    deliveryLabel: "Delivery",
    instantDownload: "Instant download",
    licenseTitle: "How you can use it",
    licenseFallback:
      "Personal and commercial use for one brand. Redistribution of the source files is not permitted.",
    licenseLink: "Read the full Digital Product License",
  },
  services: {
    eyebrow: "Services",
    metaDescription:
      "Brand identity, social media design, banner design, presentation design, and UI/UX design services from ngantuqan, each delivered with the tools to maintain it.",
    title: "Five ways to work together.",
    lede: "Every service comes with pricing, deliverables, and a stated turnaround, so you know what you're ordering before you order it.",
    allServices: "All services",
    serviceFallback: "Service",
    turnaround: "Turnaround",
    daysValue: "{count} days",
    roundsFallback: "2 rounds",
    includedEyebrow: "What's included",
    includedTitle: "Everything in the box",
    includedLede:
      "Every package for this service includes the following deliverables.",
    packages: "Packages",
    packagesTitle: "Choose your package",
    packagesLede:
      "Fixed prices, fixed scope. Pick the one that fits, or send us a brief and we'll quote something custom.",
    mostPopular: "Most popular",
    fixedPrice: "Fixed price, excluding applicable taxes",
    orderPackage: "Order this package",
    orderThis: "Order This Service",
    orderTitle: "Tell us about the {title} project.",
    orderLede:
      "The more you can share, the more accurate the quote. Nothing here is a commitment. We reply with questions, a timeline, and a fixed price.",
    price: "Price",
    delivery: "Delivery",
    revisions: "Revisions",
    round: "round",
    rounds: "rounds",
    features: "What's included",
    faq: "FAQ",
    faqTitle: "Common questions",
    faqItems: [
      {
        question: "What do I need to have ready?",
        answer:
          "A brief helps, but it does not have to be polished. Content, links, and rough ideas are enough to start. We will ask for the rest during the first round.",
      },
      {
        question: "Can I reuse the work for my own channels?",
        answer:
          "Yes. You receive the editable source files, so anything we make together is yours to use across your own brand channels.",
      },
      {
        question: "What happens if I need changes after delivery?",
        answer:
          "The revision rounds listed on your package cover the delivery stage. Additional work is quoted separately and never starts without your approval.",
      },
      {
        question: "How does payment work?",
        answer:
          "We quote a fixed price per package. Once you approve the scope we send payment instructions, and work begins when payment is confirmed.",
      },
    ],
    contactTitle: "Ready to start?",
    contactLede:
      "Send us the brief. We'll reply with questions, a timeline, and a fixed price.",
  },
  about: {
    eyebrow: "About the Studio",
    metaDescription:
      "ngantuqan is an independent creative design studio. Our story, philosophy, capabilities, tools, and the way we work.",
    title: "We build the system, then hand you the keys.",
    lede1: "ngantuqan is an independent design studio working with studios, founders, and small in-house teams.",
    lede2:
      "Most studios hand over a file. We hand over a working system: the grid, the template, the guideline, the component library, so the work keeps going after the invoice is paid.",
    visionEyebrow: "Vision",
    vision: "A studio where the work is still useful two years later.",
    missionEyebrow: "Mission",
    mission:
      "Build the smallest system that fully solves the problem, and make sure the team can run it.",
    philosophyEyebrow: "Philosophy",
    philosophyTitle: "Four convictions",
    philosophy: [
      {
        title: "Systems over artifacts",
        body: "A logo is an artifact. A grid, a palette, and a set of rules are a system. We build the second one.",
      },
      {
        title: "Constraints are the brief",
        body: "Format, budget, and deadline are not obstacles to design around. They are what makes the design good.",
      },
      {
        title: "Explain the reasoning",
        body: "A decision you do not understand is a decision you cannot defend. We show our thinking.",
      },
      {
        title: "Leave it maintainable",
        body: "The handover matters more than the reveal. Templates, notes, and a walkthrough are part of the job.",
      },
    ],
    capabilitiesEyebrow: "Capabilities",
    capabilitiesTitle: "What we do well",
    capabilities: [
      {
        title: "Brand identity",
        body: "Marks, logotypes, palettes, type systems, and the written rules that keep them consistent.",
      },
      {
        title: "Content systems",
        body: "Modular grids and editable templates so publishing stays on-brand without a designer on every post.",
      },
      {
        title: "Art direction",
        body: "Photography direction, illustration direction, and the rules that keep a set looking like one thing.",
      },
      {
        title: "Presentation design",
        body: "Deck systems and chart languages that stay readable on a projector, not just on a laptop.",
      },
      {
        title: "Design partnership",
        body: "Ongoing support for teams that need a designer on call without a full retainer.",
      },
    ],
    toolsEyebrow: "Tools",
    toolsTitle: "What we work in",
    toolsLede:
      "Tools follow the problem. We'll recommend what fits your team, not what fits our habit.",
    workflowEyebrow: "Workflow",
    workflowTitle: "How a project runs",
    workflow: [
      {
        title: "Listen",
        body: "A short call and a written brief. We ask about the business problem, not just the visual one.",
      },
      {
        title: "Scope",
        body: "You get a fixed price, a deliverable list, and a delivery date before anything is designed.",
      },
      {
        title: "Design",
        body: "One direction, developed properly. We show work in context, not in isolation.",
      },
      {
        title: "Refine",
        body: "Structured revision rounds against the brief, with the reasoning explained each time.",
      },
      {
        title: "Hand over",
        body: "Source files, a guideline document, and a walkthrough so your team can maintain it.",
      },
    ],
    closingTitle: "Have a project in mind?",
    closingLede:
      "Send a brief or a rough idea. You'll get questions, a scope, and a price.",
    closingButton: "Start a Project",
    closingAlt: "Abstract composition in the ngantuqan brand palette",
  },
  contact: {
    eyebrow: "Contact",
    metaDescription:
      "Get in touch with ngantuqan about brand identity, content systems, presentation, UI/UX, or digital products.",
    title: "Tell us what you're making.",
    lede:
      "A brief, a half-formed idea, or a deck that isn't working: all fine. You'll get a reply with real questions and an honest read on scope and cost.",
    email: "Email",
    responseTime: "Response time",
    responseValue: "Two working days",
    goodToInclude: "Good to include",
    goodToIncludeBody:
      "What you're making, who it's for, your timeline, and a budget range.",
    packageTitle: "Prefer to start with a package?",
    packageBody:
      "Every service has fixed pricing and a stated turnaround. Pick one and skip the scoping conversation.",
    packageLink: "Browse services",
    templateTitle: "Not ready for a brief?",
    templateBody:
      "Download one of our templates and see how we build systems. That usually starts the conversation faster.",
    templateLink: "Visit the shop",
    receivedTitle: "Message received",
    reference: "Your reference is {reference}",
    couldNotSend: "We could not send that",
    fullName: "Full name",
    emailAddress: "Email address",
    companyBrand: "Company / brand name",
    inquiryType: "Inquiry type",
    subject: "Subject",
    message: "Message",
    messageMax: "{count} max",
    messageHint:
      "Tell us about the project, the timeline, and what success looks like.",
    send: "Send message",
    sending: "Sending...",
    replyWithin: "We reply within two working days.",
    inquiryTypeLabels: {
      GENERAL: "General inquiry",
      DESIGN_SERVICE: "Design service",
      COLLABORATION: "Collaboration",
      PARTNERSHIP: "Partnership",
      OTHER: "Other",
    },
    validation: {
      nameRequired: "Please enter your full name.",
      nameTooLong: "That name is too long.",
      emailRequired: "Please enter your email address.",
      emailInvalid: "Please enter a valid email address.",
      companyTooLong: "That company name is too long.",
      inquiryTypeRequired: "Please choose an inquiry type.",
      subjectRequired: "Please add a short subject.",
      subjectTooLong: "That subject is too long.",
      messageRequired: "Please tell us a little more. At least 20 characters.",
      messageTooLong: "That message is too long.",
    },
  },
  order: {
    briefReceived: "Brief received",
    thanks: "Thanks. Your brief is with the studio.",
    lede:
      "We read every brief ourselves. You will hear back within two working days with questions, a timeline, and a fixed price.",
    reference: "Reference",
    submitted: "Brief submitted",
    backToHome: "Back to home",
    couldNotSend: "We could not send that",
    websiteLabel: "Website",
    aboutYou: "About you",
    theProject: "The project",
    serviceLabel: "Service",
    requiredDeliverables: "Required deliverables",
    projectDescriptionHint: "What are we making, and what does done look like?",
    targetAudienceLabel: "Target audience",
    targetAudiencePlaceholder: "Who is this for?",
    designReferences: "Design references",
    designReferencesHint: "Links, brands, or sites whose feel you like.",
    preferredColours: "Preferred colours",
    preferredColoursHint: "Palette, mood, or colours to avoid.",
    budget: "Budget (IDR)",
    optional: "Optional",
    deadline: "Deadline",
    referenceFile: "Reference file",
    removeFile: "Remove the attached file",
    backToService: "Back to {service}",
    pageTitle: "Order {service}",
    notFound: "Order not found",
    projectBrief: "Project brief",
    noPaymentYet: "No payment yet",
    differentService: "Need a different service?",
    packagePriceNote:
      "Picking a package fixes the price. Leaving it open means we send you a quote first.",
    fileSizeNote:
      "Up to {size}. Kept in private storage and only visible to the studio.",
    form: {
      name: "Your name",
      email: "Email",
      company: "Company",
      companyHint: "Optional. It helps us understand the context.",
      package: "Package",
      packageUnsure: "Not sure yet, quote me",
      projectDescription: "What are you making?",
      projectDescriptionHint:
        "What it is, who it is for, and what it has to do. Rough is fine.",
      targetAudience: "Who is it for?",
      targetAudienceHint: "Optional: a mood board, a logo, or a brief document.",
      deliverables: "Anything else?",
      deliverablesHint:
        "Anything beyond the package scope: extra formats, extra sizes, extra pages.",
      attachments: "Attachments",
      attachmentsHint: "Optional: a mood board, a logo, or a brief document.",
      noPayment: "No payment yet. We reply with a quote first.",
      send: "Send the brief",
      sending: "Sending...",
    },
  },
  checkout: {
    title: "Checkout",
    metaDescription: "Review your cart and place the order.",
    eyebrow: "Checkout",
    heading: "Almost yours.",
    lede: "No account, no card form. We take your order, you get the payment details by email, and the files unlock as soon as the payment is confirmed.",
    emptyTitle: "Your cart is empty",
    emptyBody: "Browse the shop and add a template to get started.",
    browseShop: "Browse the shop",
    orderSummary: "Order summary",
    yourDetails: "Your details",
    detailsLede: "We send the download link to this address. No account needed.",
    couldNotPlace: "We could not place the order",
    removeOne: "Remove one {title}",
    addOne: "Add one {title}",
    removeItem: "Remove {title} from the cart",
    subtotal: "Subtotal",
    total: "Total",
    remove: "Remove",
    checkout: "Checkout",
    transferNote:
      "The final total is confirmed from the database when the order is placed, and payment is by transfer. We confirm it by hand.",
    name: "Your name",
    email: "Email",
    submit: "Place order",
    placing: "Placing order...",
    errors: "Something went wrong",
  },
  orderConfirmation: {
    ready: "Your files are ready.",
    waiting: "We are waiting on the payment.",
    readyLede:
      "Download them below. Every link is signed and expires after two minutes, so ask for a fresh one whenever you need it.",
    waitingLede:
      "We have your order. The payment details are below, and we confirm the payment by hand, usually within one working day.",
    orderNumber: "Order number",
    reference: "Reference",
    download: "Download",
    nextSteps: "What happens next",
  },
  orderAccess: {
    title: "Find your order",
    body: "Enter your order number and the email address you used. There is no account to log into. That pair is what proves the order is yours.",
    orderNumber: "Order number",
    email: "Email",
    submit: "Find my order",
    finding: "Looking...",
  },
  actions: {
    checkFields: "Please check the highlighted fields.",
    checkFieldsRetry: "Please check the highlighted fields and try again.",
    contactNoDatabase:
      "The contact form is not connected to a database yet. Please email us directly and we will get back to you.",
    contactSaveFailed:
      "Something went wrong on our side and your message was not saved. Please email us directly and we will get back to you.",
    contactReceived:
      "Thanks. Your message is in. We'll reply within two working days.",
    contactSavedNoEmail:
      "Thanks. Your message has been saved. Email notifications are not configured yet, but we've received your enquiry.",
    orderNoDatabase:
      "The order form is not connected to a database yet. Please email us directly and we will get back to you.",
    orderBriefReceived:
      "Thanks. Your brief is with us. We will reply within two working days.",
    orderSaveFailed:
      "Something went wrong on our side and your brief was not saved. Please email us directly and we will get back to you.",
    serviceUnavailable:
      "That service is no longer available. Please pick another one.",
    packageUnavailable:
      "That package is no longer available. Please pick another one.",
    checkoutNoDatabase:
      "Checkout is not connected to a database yet. Please email us and we will send the files with your invoice.",
    cartUnreadable: "Your cart could not be read. Please add the products again.",
    orderNotFound: "That order could not be found.",
    orderNotPlaced:
      "We could not place the order. Please email us and we will sort it out for you.",
    orderCannotBePaid:
      "This order cannot be paid online. Please email us and we will send you a way to pay.",
    orderPairNotFound:
      "We could not find an order with that number and email address. Check both, or email us and we will look it up.",
    requestUnreadable: "That request could not be read.",
    accessExpired:
      "Your access to this order has expired. Enter your order number and email again.",
    notPaid: "This order has not been paid yet.",
    downloadUnavailable: "That download is not available.",
  },
  rateLimit: {
    contact:
      "You have sent a few messages already. Please wait a moment before sending another",
    orderBrief:
      "You have sent a few briefs already. Please wait a moment before sending another",
    checkout:
      "You have placed a few orders from this connection. Please wait a moment before placing another",
    orderLookup:
      "That is a few too many attempts. Please wait a moment before trying again",
    download:
      "That is a few too many download requests. Please wait a moment before trying again",
    retryInOne:
      "Please try again in about {minutes} minute, or email us and we will pick it up right away.",
    retryInMany:
      "Please try again in about {minutes} minutes, or email us and we will pick it up right away.",
  },
  legal: {
    eyebrow: "Legal",
    privacyTitle: "Privacy Policy",
    termsTitle: "Terms & Conditions",
    refundTitle: "Refund Policy",
    licenseTitle: "Digital Product Licence",
    privacyMetaDescription:
      "How ngantuqan collects, uses, and protects the information you share through this website.",
    termsMetaDescription:
      "The terms that apply when you use the ngantuqan website, commission design work, or buy digital products.",
    refundMetaDescription:
      "The refund policy for digital products purchased from ngantuqan, and how refunds work on commissioned design work.",
    licenseMetaDescription:
      "The licence that applies to every digital product purchased from ngantuqan.",
  },
  errors: {
    oops: "Oops",
    digest: "Reference: {digest}",
    notFoundTitle: "We couldn't find that page",
    notFoundBody:
      "The link may be out of date, or the page may have moved. Here are the places worth going.",
    notFoundHome: "Back to home",
    notFoundWork: "See our work",
    notFoundHeading: "Something went wrong on our side",
    notFoundBodyLong:
      "The page failed to load. Trying again usually sorts it. If it keeps happening, email us and we'll fix it.",
    tryAgain: "Try again",
    goHome: "Go to the home page",
    suggestedPages: "Suggested pages",
  },
};

/**
 * The shape of a dictionary.
 *
 * The Indonesian dictionary has to provide every key in this one, so a
 * missing or renamed string is a build error rather than an English
 * sentence in the middle of an Indonesian page.
 */
export type Dictionary = typeof en;
