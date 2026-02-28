import { SiteContent } from './types';

export const LANGUAGES = [
  { code: 'uz', label: 'O\'zbek' },
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' }
];

export const DEFAULT_CONTENT_UZ: SiteContent = {
  heroTitle: "TOHIRJON\nBOLTAYEV",
  heroSubtitle: "Brendlar va shaxslar uchun premium mobil kontent yaratuvchi videograf.",
  heroImage: "",
  aboutText: "Men shunchaki video olmayman, men hissiyotlarni va qadriyatlarni vizual tilga o'giraman. 3 yillik tajriba davomida 50 dan ortiq brendlar bilan ishladim. Mening maqsadim — sizning mahsulotingiz yoki xizmatingizni mijozlar xotirasida qoladigan darajada taqdim etish.",
  aboutStats: [
    { val: "3+", label: "Yillik Tajriba" },
    { val: "100+", label: "Muvaffaqiyatli Loyiha" },
    { val: "5M+", label: "Umumiy Ko'rishlar" },
    { val: "24/7", label: "Kreativ Yondashuv" }
  ],
  socialLinks: {
    instagram: "https://instagram.com",
    telegram: "https://telegram.org",
    phone: "+998901234567"
  },
  clients: ["Samsung", "Pepsi", "Click", "Payme", "Uzum", "Korzinka", "Murad Buildings", "Golden House"],
  sectionTitles: {
    about: "Haqida",
    portfolio: "Ishlar",
    services: "Xizmatlar",
    process: "Ish Jarayoni",
    testimonials: "Mijozlar Fikri",
    faq: "Ko'p So'raladigan Savollar",
    contact: "Bog'lanish",
    equipment: "Ishlatiladigan Texnika"
  },
  uiTexts: {
    orderBtn: "Buyurtma Berish",
    viewWorksBtn: "Ishlarimni Ko'rish",
    contactBtn: "Bog'lanish",
    sendBtn: "Yuborish",
    footerText: "© 2026 Tohirjon Boltayev. Barcha huquqlar himoyalangan.",
    contactTitle: "LOYIHANGIZNI\nMUHOKAMA\nQILAMIZMI?",
    contactSubtitle: "Quyidagi havolalar orqali menga yozing yoki qo'ng'iroq qiling. 24 soat ichida javob beraman.",
    noProjectsTitle: "Hozircha bu kategoriyada loyihalar yo'q.",
    noProjectsDesc: "Tez orada yangi ishlar qo'shiladi."
  }
};

export const DEFAULT_CONTENT_RU: SiteContent = {
  heroTitle: "ТОХИРЖОН\nБОЛТАЕВ",
  heroSubtitle: "Премиальный мобильный контент для брендов и личностей.",
  heroImage: "",
  aboutText: "Я не просто снимаю видео, я перевожу эмоции и ценности на визуальный язык. За 3 года работы я сотрудничал с более чем 50 брендами. Моя цель — представить ваш продукт или услугу так, чтобы она осталась в памяти клиентов.",
  aboutStats: [
    { val: "3+", label: "Лет Опыта" },
    { val: "100+", label: "Успешных Проектов" },
    { val: "5M+", label: "Просмотров" },
    { val: "24/7", label: "Креативный Подход" }
  ],
  socialLinks: {
    instagram: "https://instagram.com",
    telegram: "https://telegram.org",
    phone: "+998901234567"
  },
  clients: ["Samsung", "Pepsi", "Click", "Payme", "Uzum", "Korzinka", "Murad Buildings", "Golden House"],
  sectionTitles: {
    about: "Обо мне",
    portfolio: "Портфолио",
    services: "Услуги",
    process: "Процесс",
    testimonials: "Отзывы",
    faq: "FAQ",
    contact: "Контакты",
    equipment: "Оборудование"
  },
  uiTexts: {
    orderBtn: "Заказать",
    viewWorksBtn: "Смотреть Работы",
    contactBtn: "Связаться",
    sendBtn: "Отправить",
    footerText: "© 2026 Тохиржон Болтаев. Все права защищены.",
    contactTitle: "ОБСУДИМ\nВАШ ПРОЕКТ?",
    contactSubtitle: "Напишите или позвоните мне по ссылкам ниже. Я отвечу в течение 24 часов.",
    noProjectsTitle: "В этой категории пока нет проектов.",
    noProjectsDesc: "Скоро будут добавлены новые работы."
  }
};

export const DEFAULT_CONTENT_EN: SiteContent = {
  heroTitle: "TOHIRJON\nBOLTAYEV",
  heroSubtitle: "Premium mobile content creator for brands and individuals.",
  heroImage: "",
  aboutText: "I don't just shoot videos; I translate emotions and values into a visual language. With over 3 years of experience, I've worked with 50+ brands. My goal is to present your product or service in a memorable way.",
  aboutStats: [
    { val: "3+", label: "Years Experience" },
    { val: "100+", label: "Successful Projects" },
    { val: "5M+", label: "Total Views" },
    { val: "24/7", label: "Creative Approach" }
  ],
  socialLinks: {
    instagram: "https://instagram.com",
    telegram: "https://telegram.org",
    phone: "+998901234567"
  },
  clients: ["Samsung", "Pepsi", "Click", "Payme", "Uzum", "Korzinka", "Murad Buildings", "Golden House"],
  sectionTitles: {
    about: "About",
    portfolio: "Portfolio",
    services: "Services",
    process: "Process",
    testimonials: "Testimonials",
    faq: "FAQ",
    contact: "Contact",
    equipment: "Equipment"
  },
  uiTexts: {
    orderBtn: "Order Now",
    viewWorksBtn: "View Works",
    contactBtn: "Contact Me",
    sendBtn: "Send",
    footerText: "© 2026 Tohirjon Boltayev. All rights reserved.",
    contactTitle: "LET'S DISCUSS\nYOUR PROJECT?",
    contactSubtitle: "Write or call me via the links below. I'll reply within 24 hours.",
    noProjectsTitle: "No projects in this category yet.",
    noProjectsDesc: "New works coming soon."
  }
};

export const CATEGORIES = ["Tijorat", "Reels", "Tadbir", "Mahsulot"];
