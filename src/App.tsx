/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { ArrowDown, Instagram, Send, Phone, Play, ExternalLink, ArrowUpRight, Menu, X, Check, ChevronDown, Camera, Video, Monitor, Moon, Sun, Zap, Aperture } from 'lucide-react';
import { useRef, ReactNode, FC, useState, useEffect, FormEvent, MouseEvent } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { collection, addDoc, onSnapshot, query, orderBy, doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from './firebase';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import LoadingScreen from './components/LoadingScreen';

// --- Interfaces ---

interface SiteContent {
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

interface Service {
  id: string;
  title: string;
  desc: string;
  price: string;
  icon: string;
  image?: string;
}

interface ProcessStep {
  id: string;
  step: string;
  title: string;
  desc: string;
  image?: string;
}

interface EquipmentItem {
  id: string;
  title: string;
  icon: string;
  items: string[];
  image?: string;
}

interface Testimonial {
  id: string;
  name: string;
  role: string;
  text: string;
  image?: string;
}

interface FAQItem {
  id: string;
  q: string;
  a: string;
}

// --- Default Data (Fallbacks) ---

const DEFAULT_CONTENT: SiteContent = {
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

const CATEGORIES = ["Tijorat", "Reels", "Tadbir", "Mahsulot"];

// --- Components ---

const Cursor = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const mouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", mouseMove);

    return () => {
      window.removeEventListener("mousemove", mouseMove);
    };
  }, []);

  return (
    <>
      <motion.div
        className="cursor-dot fixed top-0 left-0 w-2 h-2 bg-white rounded-full pointer-events-none z-[9999] mix-blend-difference"
        animate={{ x: mousePosition.x - 4, y: mousePosition.y - 4 }}
        transition={{ type: "tween", ease: "backOut", duration: 0 }}
      />
      <motion.div
        className="cursor-outline fixed top-0 left-0 w-8 h-8 border border-white rounded-full pointer-events-none z-[9999] mix-blend-difference"
        animate={{ x: mousePosition.x - 16, y: mousePosition.y - 16 }}
        transition={{ type: "spring", stiffness: 500, damping: 28 }}
      />
    </>
  );
};

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-4 bg-white text-black rounded-full shadow-lg z-40 hover:bg-zinc-200 transition-colors"
        >
          <ArrowDown className="transform rotate-180" size={24} />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

function Section({ children, className = "", id = "" }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={`min-h-screen w-full flex flex-col justify-center px-6 py-24 ${className}`}>
      {children}
    </section>
  );
}

const FadeIn: FC<{ children: ReactNode; delay?: number; className?: string }> = ({ children, delay = 0, className = "" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const TextReveal = ({ children, className = "" }: { children: string; className?: string }) => {
  return (
    <div className={`overflow-hidden ${className}`}>
      <motion.div
        initial={{ y: "100%" }}
        whileInView={{ y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
};

function Navbar({ darkMode, toggleTheme, onOpenBooking, content }: { darkMode: boolean; toggleTheme: () => void; onOpenBooking: () => void; content: SiteContent }) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      
      const sections = document.querySelectorAll("section");
      let current = "";
      sections.forEach((section) => {
        const sectionTop = section.offsetTop;
        if (window.scrollY >= sectionTop - 200) {
          current = section.getAttribute("id") || "";
        }
      });
      setActiveSection(current);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const links = [
    { name: content.sectionTitles?.about || "Asosiy", href: "#home" },
    { name: content.sectionTitles?.about || "Haqida", href: "#about" },
    { name: content.sectionTitles?.portfolio || "Ishlar", href: "#portfolio" },
    { name: content.sectionTitles?.services || "Xizmatlar", href: "#services" },
    { name: content.sectionTitles?.process || "Jarayon", href: "#process" },
  ];

  const handleLinkClick = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const targetId = href.substring(1);
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      window.scrollTo({
        top: targetElement.offsetTop,
        behavior: "smooth"
      });
      setIsOpen(false);
    }
  };

  return (
    <>
      <motion.nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled 
            ? (darkMode ? 'bg-black/80 border-zinc-800' : 'bg-white/80 border-zinc-100') + ' backdrop-blur-md border-b py-4' 
            : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <a href="#" onClick={(e) => handleLinkClick(e, "#home")} className={`text-2xl font-black tracking-tighter z-50 relative ${darkMode ? 'text-white' : 'text-black'}`}>TB.</a>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {links.map(link => (
              <a 
                key={link.name} 
                href={link.href} 
                onClick={(e) => handleLinkClick(e, link.href)}
                className={`text-sm font-medium transition-colors relative ${
                  activeSection === link.href.substring(1) 
                    ? (darkMode ? 'text-white' : 'text-black') 
                    : (darkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-black')
                }`}
              >
                {link.name}
                {activeSection === link.href.substring(1) && (
                  <motion.div 
                    layoutId="activeSection" 
                    className={`absolute -bottom-1 left-0 right-0 h-0.5 ${darkMode ? 'bg-white' : 'bg-black'}`} 
                  />
                )}
              </a>
            ))}
            
            <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800"></div>

            <button onClick={toggleTheme} className={`p-2 rounded-full transition-colors ${darkMode ? 'bg-zinc-800 text-yellow-400' : 'bg-zinc-100 text-zinc-600'}`}>
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button 
              onClick={onOpenBooking}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all transform hover:scale-105 ${darkMode ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'}`}
            >
              {content.uiTexts?.orderBtn || "Buyurtma Berish"}
            </button>
          </div>

          {/* Mobile Toggle */}
          <div className="flex items-center gap-4 md:hidden">
             <button onClick={toggleTheme} className={`p-2 rounded-full transition-colors ${darkMode ? 'bg-zinc-800 text-yellow-400' : 'bg-zinc-100 text-zinc-600'}`}>
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => setIsOpen(!isOpen)} className={`z-50 relative p-2 ${darkMode ? 'text-white' : 'text-black'}`}>
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed inset-0 z-40 flex flex-col items-center justify-center gap-8 md:hidden ${darkMode ? 'bg-black text-white' : 'bg-white text-black'}`}
          >
            {links.map(link => (
              <a 
                key={link.name} 
                href={link.href} 
                onClick={(e) => handleLinkClick(e, link.href)}
                className="text-3xl font-bold"
              >
                {link.name}
              </a>
            ))}
            <button 
              onClick={() => { setIsOpen(false); onOpenBooking(); }}
              className={`mt-4 px-8 py-4 rounded-full text-lg font-bold ${darkMode ? 'bg-white text-black' : 'bg-black text-white'}`}
            >
              {content.uiTexts?.orderBtn || "Buyurtma Berish"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// --- Modals ---

function BookingModal({ isOpen, onClose, darkMode }: { isOpen: boolean; onClose: () => void; darkMode: boolean }) {
  const [formData, setFormData] = useState({ name: '', phone: '', type: 'Reels / TikTok' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, "bookings"), {
        ...formData,
        createdAt: new Date()
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        setFormData({ name: '', phone: '', type: 'Reels / TikTok' });
      }, 2000);
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.");
    }
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative w-full max-w-lg p-8 rounded-3xl shadow-2xl ${darkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white'}`}
          >
            <button onClick={onClose} className={`absolute top-4 right-4 p-2 rounded-full ${darkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'}`}>
              <X size={20} />
            </button>
            
            {success ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="text-white w-8 h-8" />
                </div>
                <h3 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-black'}`}>Rahmat!</h3>
                <p className={darkMode ? 'text-zinc-400' : 'text-zinc-500'}>Sizning so'rovingiz qabul qilindi. Tez orada aloqaga chiqaman.</p>
              </div>
            ) : (
              <>
                <h3 className={`text-2xl font-black mb-2 ${darkMode ? 'text-white' : 'text-black'}`}>Loyiha Boshlaymizmi?</h3>
                <p className={`mb-6 ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Ma'lumotlaringizni qoldiring, tez orada aloqaga chiqaman.</p>
                
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Ismingiz</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className={`w-full p-4 rounded-xl outline-none transition-all ${darkMode ? 'bg-zinc-800 text-white focus:ring-2 focus:ring-white' : 'bg-zinc-50 text-black focus:ring-2 focus:ring-black'}`} 
                      placeholder="Ismingizni kiriting" 
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Telefon Raqam</label>
                    <input 
                      type="tel" 
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className={`w-full p-4 rounded-xl outline-none transition-all ${darkMode ? 'bg-zinc-800 text-white focus:ring-2 focus:ring-white' : 'bg-zinc-50 text-black focus:ring-2 focus:ring-black'}`} 
                      placeholder="+998 90 123 45 67" 
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Loyiha Turi</label>
                    <select 
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className={`w-full p-4 rounded-xl outline-none transition-all ${darkMode ? 'bg-zinc-800 text-white focus:ring-2 focus:ring-white' : 'bg-zinc-50 text-black focus:ring-2 focus:ring-black'}`}
                    >
                      <option>Reels / TikTok</option>
                      <option>Tijorat Reklamasi</option>
                      <option>Tadbir</option>
                      <option>Boshqa</option>
                    </select>
                  </div>
                  <button 
                    disabled={loading}
                    className={`w-full py-4 rounded-xl font-bold text-lg mt-4 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${darkMode ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'}`}
                  >
                    {loading ? 'Yuborilmoqda...' : 'Yuborish'}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// --- Helper ---
const getIcon = (name: string) => {
  switch (name) {
    case 'video': return <Video size={24} />;
    case 'monitor': return <Monitor size={24} />;
    case 'camera': return <Camera size={24} />;
    case 'zap': return <Zap size={24} />;
    case 'aperture': return <Aperture size={24} />;
    default: return <Video size={24} />;
  }
};

// --- Home Component ---

function Home() {
  const containerRef = useRef(null);
  const [activeCategory, setActiveCategory] = useState("Barchasi");
  const [darkMode, setDarkMode] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dynamic Content State
  const [content, setContent] = useState<SiteContent>(DEFAULT_CONTENT);
  const [services, setServices] = useState<Service[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [faq, setFaq] = useState<FAQItem[]>([]);
  const [process, setProcess] = useState<ProcessStep[]>([]);
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);

  const toggleTheme = () => setDarkMode(!darkMode);

  const { scrollYProgress, scrollY } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const heroY = useTransform(scrollY, [0, 500], [0, 200]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);

  // Fetch Data
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);

    // Projects
    const qProjects = query(collection(db, "projects"));
    const unsubscribeProjects = onSnapshot(qProjects, (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Site Content
    const unsubscribeContent = onSnapshot(doc(db, "site_content", "main"), (doc) => {
      if (doc.exists()) {
        setContent(doc.data() as SiteContent);
      }
    });

    // Services
    const qServices = query(collection(db, "services"));
    const unsubscribeServices = onSnapshot(qServices, (snapshot) => {
      setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service)));
    });

    // Testimonials
    const qTestimonials = query(collection(db, "testimonials"));
    const unsubscribeTestimonials = onSnapshot(qTestimonials, (snapshot) => {
      setTestimonials(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Testimonial)));
    });

    // FAQ
    const qFaq = query(collection(db, "faq"));
    const unsubscribeFaq = onSnapshot(qFaq, (snapshot) => {
      setFaq(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FAQItem)));
    });

    // Process
    const qProcess = query(collection(db, "process"), orderBy("step"));
    const unsubscribeProcess = onSnapshot(qProcess, (snapshot) => {
      setProcess(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProcessStep)));
    });

    // Equipment
    const qEquipment = query(collection(db, "equipment"));
    const unsubscribeEquipment = onSnapshot(qEquipment, (snapshot) => {
      setEquipment(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EquipmentItem)));
    });

    return () => {
      clearTimeout(timer);
      unsubscribeProjects();
      unsubscribeContent();
      unsubscribeServices();
      unsubscribeTestimonials();
      unsubscribeFaq();
      unsubscribeProcess();
      unsubscribeEquipment();
    };
  }, []);

  // Visitor Counter
  useEffect(() => {
    const incrementVisitor = async () => {
      const visited = localStorage.getItem('visited');
      if (!visited) {
        const statsRef = doc(db, "stats", "visitors");
        try {
          await updateDoc(statsRef, { count: increment(1) });
          localStorage.setItem('visited', 'true');
        } catch (e) {
          await setDoc(statsRef, { count: 1 });
          localStorage.setItem('visited', 'true');
        }
      }
    };
    incrementVisitor();
  }, []);

  // Google Analytics
  useEffect(() => {
    if (content.gaId) {
      // Check if script already exists
      if (document.querySelector(`script[src*="${content.gaId}"]`)) return;

      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${content.gaId}`;
      document.head.appendChild(script);

      const script2 = document.createElement('script');
      script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${content.gaId}');
      `;
      document.head.appendChild(script2);
    }
  }, [content.gaId]);

  const filteredProjects = activeCategory === "Barchasi" 
    ? projects 
    : projects.filter(p => p.category === activeCategory);

  return (
    <div ref={containerRef} className={`${darkMode ? 'bg-black text-white selection:bg-white selection:text-black' : 'bg-white text-zinc-900 selection:bg-black selection:text-white'} min-h-screen font-sans transition-colors duration-300 overflow-x-hidden`}>
      <AnimatePresence>
        {loading && <LoadingScreen />}
      </AnimatePresence>
      <Cursor />
      <div className="bg-noise" />
      <ScrollToTop />
      <Navbar darkMode={darkMode} toggleTheme={toggleTheme} onOpenBooking={() => setIsBookingOpen(true)} content={content} />
      <BookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} darkMode={darkMode} />
      
      {/* Progress Bar */}
      <motion.div 
        className={`fixed top-0 left-0 right-0 h-1.5 origin-left z-50 ${darkMode ? 'bg-white' : 'bg-black'}`}
        style={{ scaleX: scrollYProgress }}
      />

      <div className={`max-w-7xl mx-auto border-x min-h-screen relative shadow-[0_0_50px_rgba(0,0,0,0.03)] transition-colors duration-300 ${darkMode ? 'bg-black border-zinc-800' : 'bg-white border-zinc-100'}`}>
        
        {/* 1. Cover Page */}
        <Section id="home" className="relative items-center justify-center text-center pb-32 pt-32">
          {content.heroImage && (
            <div className="absolute inset-0 z-0">
               <img src={content.heroImage} alt="Hero" className="w-full h-full object-cover opacity-20" />
               <div className={`absolute inset-0 bg-gradient-to-b ${darkMode ? 'from-black/50 via-black/80 to-black' : 'from-white/50 via-white/80 to-white'}`} />
            </div>
          )}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
            className={`absolute inset-0 z-0 opacity-40 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] ${darkMode ? 'from-zinc-900 via-black to-black' : 'from-zinc-100 via-white to-white'}`}
          />
          
          <div className="z-10 relative flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className={`mb-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border backdrop-blur-sm ${darkMode ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50/50'}`}
            >
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className={`text-xs font-semibold tracking-widest uppercase ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Buyurtmalar uchun ochiq</span>
            </motion.div>

            <motion.h1 
              style={{ y: heroY, opacity: heroOpacity }}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className={`text-6xl md:text-9xl font-black tracking-tighter leading-[0.9] mb-8 whitespace-pre-line ${darkMode ? 'text-white' : 'text-black'}`}
            >
              {content.heroTitle}
            </motion.h1>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="flex flex-col gap-4 items-center"
            >
              <p className={`text-xl md:text-2xl font-medium tracking-tight max-w-lg ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {content.heroSubtitle}
              </p>
              
              <div className="flex gap-4 mt-4">
                <a href="#portfolio" className={`px-8 py-3 rounded-full font-medium transition-colors ${darkMode ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'}`}>
                  {content.uiTexts?.viewWorksBtn || "Ishlarimni ko'rish"}
                </a>
                <button onClick={() => setIsBookingOpen(true)} className={`px-8 py-3 border rounded-full font-medium transition-colors ${darkMode ? 'border-zinc-800 hover:bg-zinc-900' : 'border-zinc-200 hover:bg-zinc-50'}`}>
                  {content.uiTexts?.contactBtn || "Bog'lanish"}
                </button>
              </div>
            </motion.div>
          </div>
        </Section>

        {/* Clients Marquee */}
        <div className={`py-12 border-y overflow-hidden ${darkMode ? 'bg-black border-zinc-800' : 'bg-white border-zinc-100'}`}>
          <div className="flex gap-16 animate-marquee whitespace-nowrap">
            {[...(content.clients || []), ...(content.clients || []), ...(content.clients || [])].map((client, i) => (
              <span key={i} className={`text-2xl md:text-4xl font-black uppercase tracking-tighter opacity-20 ${darkMode ? 'text-white' : 'text-black'}`}>
                {client}
              </span>
            ))}
          </div>
        </div>

        {/* 2. About & Stats Section */}
        <Section id="about" className={darkMode ? 'bg-zinc-900/30' : 'bg-zinc-50/50'}>
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <FadeIn>
              <h2 className={`text-xs font-bold uppercase tracking-[0.2em] mb-8 flex items-center gap-2 ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                <span className={`w-8 h-[1px] ${darkMode ? 'bg-zinc-700' : 'bg-zinc-300'}`}></span>
                {content.sectionTitles?.about || "Haqida"}
              </h2>
              <TextReveal className={`text-3xl md:text-4xl font-light leading-tight mb-8 ${darkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>
                {content.aboutText}
              </TextReveal>

              <div className="grid grid-cols-2 gap-6">
                {content.aboutStats.map((stat, i) => (
                  <div key={i} className={`p-4 rounded-xl border shadow-sm ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'}`}>
                    <h4 className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-black'}`}>{stat.val}</h4>
                    <p className={`text-xs uppercase font-medium ${darkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>{stat.label}</p>
                  </div>
                ))}
              </div>
            </FadeIn>
            
            <FadeIn delay={0.2} className="relative">
              <div className={`aspect-square rounded-2xl overflow-hidden relative ${darkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
                 <div className={`absolute inset-0 flex items-center justify-center ${darkMode ? 'bg-zinc-900 text-zinc-700' : 'bg-zinc-100 text-zinc-300'}`}>
                    <Camera size={64} strokeWidth={1} />
                 </div>
                 <img 
                   src="" 
                   alt="Tohirjon Boltayev" 
                   className="w-full h-full object-cover relative z-10 mix-blend-multiply opacity-80 hover:opacity-100 transition-opacity duration-500"
                   referrerPolicy="no-referrer"
                 />
              </div>
            </FadeIn>
          </div>
        </Section>

        {/* 3. Portfolio Section */}
        <div id="portfolio" className={`px-6 py-24 ${darkMode ? 'bg-black' : 'bg-white'}`}>
          <FadeIn>
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
              <div>
                <h2 className={`text-xs font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2 ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  <span className={`w-8 h-[1px] ${darkMode ? 'bg-zinc-700' : 'bg-zinc-300'}`}></span>
                  {content.sectionTitles?.portfolio || "Portfolio"}
                </h2>
                <h3 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-black'}`}>So'nggi Loyihalar</h3>
              </div>
              
              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                      activeCategory === cat 
                        ? (darkMode ? 'bg-white text-black shadow-lg shadow-white/10' : 'bg-black text-white shadow-lg')
                        : (darkMode ? 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200')
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </FadeIn>
          
            <div className="grid md:grid-cols-2 gap-8 gap-y-16">
              <AnimatePresence mode='popLayout'>
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((project) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.4 }}
                      key={project.id}
                      className="group cursor-pointer"
                      onClick={() => project.videoUrl && window.open(project.videoUrl, '_blank')}
                    >
                      <div className={`aspect-[4/5] w-full mb-6 overflow-hidden relative rounded-2xl shadow-sm transition-all duration-500 group-hover:shadow-2xl ${darkMode ? 'bg-zinc-900 group-hover:shadow-white/5' : 'bg-zinc-100 group-hover:shadow-zinc-200/50'}`}>
                         <img 
                          src={project.image} 
                          alt={project.title}
                          className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20 backdrop-blur-[2px]">
                          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform duration-300">
                            <Play className="w-6 h-6 text-black fill-black ml-1" />
                          </div>
                        </div>
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full shadow-sm text-zinc-900">
                          {project.category}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className={`text-2xl font-bold tracking-tight mb-1 transition-colors ${darkMode ? 'text-white group-hover:text-zinc-400' : 'text-black group-hover:text-zinc-600'}`}>{project.title}</h3>
                          <p className={`text-sm font-medium ${darkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>{project.description}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-mono font-bold px-2 py-1 rounded inline-block ${darkMode ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-black'}`}>{project.stats}</p>
                        </div>
                      </div>
                      
                      {/* Video URL Display */}
                      {project.videoUrl && (
                        <div 
                          className={`text-xs flex items-center gap-1 hover:underline ${darkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(project.videoUrl, '_blank');
                          }}
                        >
                          <Video size={12} />
                          {project.videoUrl}
                        </div>
                      )}
                    </motion.div>
                  ))
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`col-span-full py-20 text-center ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}
                  >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed flex items-center justify-center opacity-50 border-current">
                      <Video size={32} />
                    </div>
                    <p className="text-lg font-medium">{content.uiTexts?.noProjectsTitle || "Hozircha bu kategoriyada loyihalar yo'q."}</p>
                    <p className="text-sm mt-2">{content.uiTexts?.noProjectsDesc || "Tez orada yangi ishlar qo'shiladi."}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
        </div>

        {/* Equipment Section (New) */}
        <Section className={darkMode ? 'bg-zinc-900/50' : 'bg-zinc-50'}>
          <FadeIn>
            <h2 className={`text-xs font-bold uppercase tracking-[0.2em] mb-16 flex items-center gap-2 ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
              <span className={`w-8 h-[1px] ${darkMode ? 'bg-zinc-700' : 'bg-zinc-300'}`}></span>
              {content.sectionTitles?.equipment || "Ishlatiladigan Texnika"}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {equipment.map((item, i) => (
                <div key={i} className={`p-6 rounded-2xl border ${darkMode ? 'bg-black border-zinc-800' : 'bg-white border-zinc-100'}`}>
                  {item.image && (
                    <div className="mb-6 rounded-xl overflow-hidden aspect-video">
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  )}
                  <div className={`mb-4 p-3 rounded-xl inline-block ${darkMode ? 'bg-zinc-900 text-white' : 'bg-zinc-50 text-black'}`}>
                    {getIcon(item.icon)}
                  </div>
                  <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-black'}`}>{item.title}</h3>
                  <ul className="space-y-2">
                    {item.items.map((sub, j) => (
                      <li key={j} className={`text-sm flex items-center gap-2 ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                        {sub}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </FadeIn>
        </Section>

        {/* 4. Process Section */}
        <Section id="process" className={`${darkMode ? 'bg-black' : 'bg-zinc-950'} text-white`}>
          <FadeIn>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-16 flex items-center gap-2">
              <span className="w-8 h-[1px] bg-zinc-700"></span>
              {content.sectionTitles?.process || "Ish Jarayoni"}
            </h2>
            
            <div className="grid md:grid-cols-4 gap-8">
              {process.map((step, index) => (
                <div key={index} className="relative group">
                  {step.image && (
                    <div className="mb-6 rounded-2xl overflow-hidden aspect-[4/3] relative">
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500" />
                      <img src={step.image} alt={step.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  )}
                  <div className="text-6xl font-black text-zinc-800 mb-4 opacity-50">{step.step}</div>
                  <h3 className="text-xl font-bold mb-2 text-white">{step.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{step.desc}</p>
                  {index !== process.length - 1 && (
                    <div className="hidden md:block absolute top-8 right-0 w-full h-[1px] bg-gradient-to-r from-zinc-800 to-transparent translate-x-1/2 -z-10"></div>
                  )}
                </div>
              ))}
            </div>
          </FadeIn>
        </Section>

        {/* 5. Services Section (Enhanced) */}
        <Section id="services" className={darkMode ? 'bg-zinc-900/30' : 'bg-zinc-50'}>
          <FadeIn>
            <h2 className={`text-xs font-bold uppercase tracking-[0.2em] mb-16 flex items-center gap-2 ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
              <span className={`w-8 h-[1px] ${darkMode ? 'bg-zinc-700' : 'bg-zinc-300'}`}></span>
              {content.sectionTitles?.services || "Xizmatlar"}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {services.map((service, index) => (
                <div key={index} className={`group p-8 rounded-2xl border transition-all duration-300 hover:shadow-xl cursor-default flex flex-col justify-between overflow-hidden relative ${darkMode ? 'bg-black border-zinc-800 hover:border-white' : 'bg-white border-zinc-100 hover:border-black'}`}>
                  {service.image && (
                    <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500">
                      <img src={service.image} alt={service.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  )}
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-xl transition-colors duration-300 ${darkMode ? 'bg-zinc-900 text-white group-hover:bg-white group-hover:text-black' : 'bg-zinc-50 text-black group-hover:bg-black group-hover:text-white'}`}>
                        {getIcon(service.icon)}
                      </div>
                      <ArrowUpRight className={`w-5 h-5 transition-colors duration-300 ${darkMode ? 'text-zinc-600 group-hover:text-white' : 'text-zinc-300 group-hover:text-black'}`} />
                    </div>
                    <h3 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-zinc-900'}`}>{service.title}</h3>
                    <p className={`mb-6 leading-relaxed ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{service.desc}</p>
                  </div>
                  <div className={`pt-6 border-t relative z-10 ${darkMode ? 'border-zinc-900' : 'border-zinc-50'}`}>
                    <p className={`text-sm font-medium ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Narx: <span className={`font-bold ${darkMode ? 'text-white' : 'text-black'}`}>{service.price}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </Section>

        {/* 6. Testimonials (New) */}
        <Section className={darkMode ? 'bg-black' : 'bg-white'}>
          <FadeIn>
            <h2 className={`text-xs font-bold uppercase tracking-[0.2em] mb-16 flex items-center gap-2 ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
              <span className={`w-8 h-[1px] ${darkMode ? 'bg-zinc-700' : 'bg-zinc-300'}`}></span>
              {content.sectionTitles?.testimonials || "Mijozlar Fikri"}
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {testimonials.map((t, i) => (
                <div key={i} className={`p-8 rounded-2xl relative ${darkMode ? 'bg-zinc-900' : 'bg-zinc-50'}`}>
                  <div className={`text-4xl font-serif absolute top-4 left-6 ${darkMode ? 'text-zinc-700' : 'text-zinc-300'}`}>"</div>
                  <p className={`text-lg italic mb-6 relative z-10 pt-4 ${darkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>{t.text}</p>
                  <div className="flex items-center gap-4">
                    {t.image ? (
                      <img src={t.image} alt={t.name} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className={`w-10 h-10 rounded-full ${darkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
                    )}
                    <div>
                      <h4 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-black'}`}>{t.name}</h4>
                      <p className={`text-xs ${darkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </Section>

        {/* 7. FAQ (New) */}
        <Section className={darkMode ? 'bg-zinc-900/30' : 'bg-zinc-50'}>
          <FadeIn>
            <h2 className={`text-xs font-bold uppercase tracking-[0.2em] mb-12 flex items-center gap-2 ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
              <span className={`w-8 h-[1px] ${darkMode ? 'bg-zinc-700' : 'bg-zinc-300'}`}></span>
              {content.sectionTitles?.faq || "Ko'p So'raladigan Savollar"}
            </h2>
            <div className="max-w-2xl mx-auto space-y-4">
              {faq.map((item, i) => (
                <details key={i} className={`group rounded-xl border overflow-hidden ${darkMode ? 'bg-black border-zinc-800' : 'bg-white border-zinc-200'}`}>
                  <summary className={`flex justify-between items-center p-6 cursor-pointer list-none font-medium text-lg transition-colors ${darkMode ? 'text-white hover:bg-zinc-900' : 'text-black hover:bg-zinc-50'}`}>
                    {item.q}
                    <ChevronDown className={`w-5 h-5 transition-transform group-open:rotate-180 ${darkMode ? 'text-zinc-600' : 'text-zinc-400'}`} />
                  </summary>
                  <div className={`px-6 pb-6 leading-relaxed ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </FadeIn>
        </Section>

        {/* 8. Contact Section */}
        <Section id="contact" className={`pb-12 ${darkMode ? 'bg-black' : 'bg-white'}`}>
          <FadeIn>
            <h2 className={`text-xs font-bold uppercase tracking-[0.2em] mb-12 flex items-center gap-2 ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
              <span className={`w-8 h-[1px] ${darkMode ? 'bg-zinc-700' : 'bg-zinc-300'}`}></span>
              {content.sectionTitles?.contact || "Bog'lanish"}
            </h2>
            
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className={`text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] mb-8 ${darkMode ? 'text-white' : 'text-black'} whitespace-pre-line`}>
                  {content.uiTexts?.contactTitle || "LOYIHANGIZNI\nMUHOKAMA\nQILAMIZMI?"}
                </h3>
                <p className={`text-xl mb-8 max-w-md ${darkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
                  {content.uiTexts?.contactSubtitle || "Quyidagi havolalar orqali menga yozing yoki qo'ng'iroq qiling. 24 soat ichida javob beraman."}
                </p>
              </div>

              <div className="space-y-4">
                <a href={content.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-between p-6 border rounded-2xl transition-all duration-300 group shadow-sm hover:shadow-xl ${darkMode ? 'border-zinc-800 hover:bg-white hover:text-black hover:border-white' : 'border-zinc-200 hover:bg-black hover:text-white hover:border-black'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full transition-colors ${darkMode ? 'bg-zinc-900 group-hover:bg-black/10' : 'bg-zinc-100 group-hover:bg-white/20'}`}>
                      <Instagram className="w-6 h-6" />
                    </div>
                    <div>
                      <span className={`text-sm block ${darkMode ? 'text-zinc-500 group-hover:text-zinc-500' : 'text-zinc-500 group-hover:text-zinc-400'}`}>Instagram</span>
                      <span className="text-xl font-bold">@tohirjonboltayev</span>
                    </div>
                  </div>
                  <ExternalLink className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                </a>
                
                <a href={content.socialLinks.telegram} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-between p-6 border rounded-2xl transition-all duration-300 group shadow-sm hover:shadow-xl ${darkMode ? 'border-zinc-800 hover:bg-[#229ED9] hover:text-white hover:border-[#229ED9]' : 'border-zinc-200 hover:bg-[#229ED9] hover:text-white hover:border-[#229ED9]'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full transition-colors ${darkMode ? 'bg-zinc-900 group-hover:bg-white/20' : 'bg-zinc-100 group-hover:bg-white/20'}`}>
                      <Send className="w-6 h-6" />
                    </div>
                    <div>
                      <span className={`text-sm block ${darkMode ? 'text-zinc-500 group-hover:text-zinc-200' : 'text-zinc-500 group-hover:text-zinc-200'}`}>Telegram</span>
                      <span className="text-xl font-bold">@tohirjonboltayev</span>
                    </div>
                  </div>
                  <ExternalLink className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                </a>
                
                <a href={`tel:${content.socialLinks.phone}`} className={`flex items-center justify-between p-6 border rounded-2xl transition-all duration-300 group shadow-sm hover:shadow-xl ${darkMode ? 'border-zinc-800 hover:bg-green-600 hover:text-white hover:border-green-600' : 'border-zinc-200 hover:bg-green-600 hover:text-white hover:border-green-600'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full transition-colors ${darkMode ? 'bg-zinc-900 group-hover:bg-white/20' : 'bg-zinc-100 group-hover:bg-white/20'}`}>
                      <Phone className="w-6 h-6" />
                    </div>
                    <div>
                      <span className={`text-sm block ${darkMode ? 'text-zinc-500 group-hover:text-zinc-200' : 'text-zinc-500 group-hover:text-zinc-200'}`}>Telefon</span>
                      <span className="text-xl font-bold">{content.socialLinks.phone}</span>
                    </div>
                  </div>
                  <ExternalLink className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                </a>
              </div>
            </div>

            <div className={`mt-32 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-widest font-bold ${darkMode ? 'border-zinc-800 text-zinc-600' : 'border-zinc-100 text-zinc-400'}`}>
              <span>{content.uiTexts?.footerText || "© 2026 Tohirjon Boltayev. Barcha huquqlar himoyalangan."}</span>
              <div className="flex gap-4 items-center">
                <a href="#" className={darkMode ? 'hover:text-white' : 'hover:text-black'}>Maxfiylik siyosati</a>
                <a href="#" className={darkMode ? 'hover:text-white' : 'hover:text-black'}>Foydalanish shartlari</a>
                <a href="/login" className={`px-2 py-1 rounded border transition-colors ${darkMode ? 'border-zinc-800 hover:bg-zinc-800 hover:text-white' : 'border-zinc-200 hover:bg-zinc-100 hover:text-black'}`}>Admin</a>
              </div>
            </div>
          </FadeIn>
        </Section>

      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<AdminPanel />} />
    </Routes>
  );
}

