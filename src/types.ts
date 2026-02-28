export interface SiteContent {
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  aboutText: string;
  aboutStats: { val: string; label: string }[];
  socialLinks: { instagram: string; telegram: string; phone: string };
  gaId?: string;
  clients?: string[];
  sectionTitles: {
    about: string;
    portfolio: string;
    services: string;
    process: string;
    testimonials: string;
    faq: string;
    contact: string;
    equipment: string;
  };
  uiTexts: {
    orderBtn: string;
    viewWorksBtn: string;
    contactBtn: string;
    sendBtn: string;
    footerText: string;
    contactTitle: string;
    contactSubtitle: string;
    noProjectsTitle: string;
    noProjectsDesc: string;
  };
}

export interface Service {
  id: string;
  title: string;
  desc: string;
  price: string;
  icon: string;
  image?: string;
}

export interface ProcessStep {
  id: string;
  step: string;
  title: string;
  desc: string;
  image?: string;
}

export interface EquipmentItem {
  id: string;
  title: string;
  icon: string;
  items: string[];
  image?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  text: string;
  image?: string;
}

export interface FAQItem {
  id: string;
  q: string;
  a: string;
}

export interface Project {
  id: string;
  title: string;
  category: string;
  image: string;
  videoUrl?: string;
  description?: string;
}
