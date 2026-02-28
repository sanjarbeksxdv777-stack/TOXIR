/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { ArrowDown, Instagram, Send, Phone, Play, ExternalLink, ArrowUpRight, Menu, X, Check, ChevronDown, Camera, Video, Monitor, Moon, Sun, Zap, Aperture, Globe, Share2, Download } from 'lucide-react';
import { useRef, ReactNode, FC, useState, useEffect, FormEvent, MouseEvent } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { collection, addDoc, onSnapshot, query, orderBy, doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from './firebase';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import LoadingScreen from './components/LoadingScreen';
import { SiteContent, Service, ProcessStep, EquipmentItem, Testimonial, FAQItem, Project } from './types';
import { DEFAULT_CONTENT_UZ, DEFAULT_CONTENT_RU, DEFAULT_CONTENT_EN, CATEGORIES, LANGUAGES } from './data';

// --- Components ---

const Cursor = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const mouseMove = (e: globalThis.MouseEvent) => {
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

function Navbar({ darkMode, toggleTheme, onOpenBooking, content, lang, setLang }: { darkMode: boolean; toggleTheme: () => void; onOpenBooking: () => void; content: SiteContent; lang: string; setLang: (l: string) => void }) {
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

            <div className="flex items-center gap-2">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={`text-xs font-bold uppercase ${lang === l.code ? (darkMode ? 'text-white' : 'text-black') : (darkMode ? 'text-zinc-600 hover:text-zinc-400' : 'text-zinc-400 hover:text-zinc-600')}`}
                >
                  {l.code}
                </button>
              ))}
            </div>

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
            
            <div className="flex gap-4 mt-4">
               {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => { setLang(l.code); setIsOpen(false); }}
                  className={`text-lg font-bold uppercase ${lang === l.code ? 'underline' : 'opacity-50'}`}
                >
                  {l.code}
                </button>
              ))}
            </div>

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
  const [lang, setLang] = useState('uz');
  
  // Dynamic Content State
  const [content, setContent] = useState<SiteContent>(DEFAULT_CONTENT_UZ);
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

  // Language Effect
  useEffect(() => {
    switch (lang) {
      case 'uz': setContent(DEFAULT_CONTENT_UZ); break;
      case 'ru': setContent(DEFAULT_CONTENT_RU); break;
      case 'en': setContent(DEFAULT_CONTENT_EN); break;
      default: setContent(DEFAULT_CONTENT_UZ);
    }
  }, [lang]);

  // Fetch Data
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);

    // Projects
    const qProjects = query(collection(db, "projects"));
    const unsubscribeProjects = onSnapshot(qProjects, (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Content
    const contentDocId = lang === 'uz' ? 'main' : lang;
    const unsubscribeContent = onSnapshot(doc(db, "site_content", contentDocId), (doc) => {
      if (doc.exists()) {
        setContent(doc.data() as SiteContent);
      } else {
        // Fallback to default content if DB document doesn't exist
        switch (lang) {
          case 'uz': setContent(DEFAULT_CONTENT_UZ); break;
          case 'ru': setContent(DEFAULT_CONTENT_RU); break;
          case 'en': setContent(DEFAULT_CONTENT_EN); break;
          default: setContent(DEFAULT_CONTENT_UZ);
        }
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
  }, [lang]);

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

  const filteredProjects = activeCategory === "Barchasi" 
    ? projects 
    : projects.filter(p => p.category === activeCategory);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Tohirjon Boltayev Portfolio',
          text: 'Check out this amazing portfolio!',
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing', error);
      }
    } else {
      alert('Sharing not supported on this browser');
    }
  };

  return (
    <div ref={containerRef} className={`${darkMode ? 'bg-black text-white selection:bg-white selection:text-black' : 'bg-white text-zinc-900 selection:bg-black selection:text-white'} min-h-screen font-sans transition-colors duration-300 overflow-x-hidden`}>
      <AnimatePresence>
        {loading && <LoadingScreen />}
      </AnimatePresence>
      <Cursor />
      <div className="bg-noise" />
      <ScrollToTop />
      <Navbar darkMode={darkMode} toggleTheme={toggleTheme} onOpenBooking={() => setIsBookingOpen(true)} content={content} lang={lang} setLang={setLang} />
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
              <span className={`text-xs font-semibold tracking-widest uppercase ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Open for Work</span>
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

              <div className="grid grid-cols-2 gap-6 mb-8">
                {content.aboutStats.map((stat, i) => (
                  <div key={i} className={`p-4 rounded-xl border shadow-sm ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'}`}>
                    <h4 className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-black'}`}>{stat.val}</h4>
                    <p className={`text-xs uppercase font-medium ${darkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                 <button onClick={() => alert("Resume tez orada yuklanadi!")} className={`flex items-center gap-2 px-6 py-3 rounded-full border text-sm font-bold ${darkMode ? 'border-zinc-700 hover:bg-zinc-800' : 'border-zinc-300 hover:bg-zinc-100'}`}>
                    <Download size={16} /> Resume
                 </button>
                 <button onClick={handleShare} className={`flex items-center gap-2 px-6 py-3 rounded-full border text-sm font-bold ${darkMode ? 'border-zinc-700 hover:bg-zinc-800' : 'border-zinc-300 hover:bg-zinc-100'}`}>
                    <Share2 size={16} /> Share
                 </button>
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
                <h3 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-black'}`}>Latest Works</h3>
              </div>
              
              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setActiveCategory("Barchasi")}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                      activeCategory === "Barchasi" 
                        ? (darkMode ? 'bg-white text-black shadow-lg shadow-white/10' : 'bg-black text-white shadow-lg')
                        : (darkMode ? 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200')
                    }`}
                  >
                    Barchasi
                  </button>
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
                    >
                      <div className="relative aspect-video overflow-hidden rounded-2xl mb-4">
                        <img 
                          src={project.image} 
                          alt={project.title} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-500" />
                        <div className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                          <ArrowUpRight className="text-black" size={20} />
                        </div>
                      </div>
                      <h4 className={`text-2xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-black'}`}>{project.title}</h4>
                      <p className={`text-sm font-medium ${darkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>{project.category}</p>
                    </motion.div>
                  ))
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="col-span-2 py-24 text-center border border-dashed rounded-3xl border-zinc-200 dark:border-zinc-800"
                  >
                    <p className={`text-lg ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>{content.uiTexts?.noProjectsTitle}</p>
                    <p className={`text-sm ${darkMode ? 'text-zinc-600' : 'text-zinc-500'}`}>{content.uiTexts?.noProjectsDesc}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
        </div>

        {/* 4. Services Section */}
        <Section id="services" className={darkMode ? 'bg-zinc-900/30' : 'bg-zinc-50/50'}>
          <FadeIn>
            <h2 className={`text-xs font-bold uppercase tracking-[0.2em] mb-16 flex items-center gap-2 ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
              <span className={`w-8 h-[1px] ${darkMode ? 'bg-zinc-700' : 'bg-zinc-300'}`}></span>
              {content.sectionTitles?.services || "Xizmatlar"}
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              {services.length > 0 ? services.map((service, i) => (
                <div key={service.id} className={`p-8 rounded-3xl border transition-all duration-300 hover:-translate-y-2 ${darkMode ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-zinc-100 hover:shadow-xl'}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-6 ${darkMode ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-black'}`}>
                    {getIcon(service.icon)}
                  </div>
                  <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-black'}`}>{service.title}</h3>
                  <p className={`text-sm leading-relaxed mb-8 ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{service.desc}</p>
                  <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-black'}`}>{service.price}</div>
                </div>
              )) : (
                // Fallback Services
                [1, 2, 3].map(i => (
                   <div key={i} className={`p-8 rounded-3xl border transition-all duration-300 hover:-translate-y-2 ${darkMode ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-zinc-100 hover:shadow-xl'}`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-6 ${darkMode ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-black'}`}>
                      <Video size={24} />
                    </div>
                    <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-black'}`}>Service {i}</h3>
                    <p className={`text-sm leading-relaxed mb-8 ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Professional video production service description goes here.</p>
                    <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-black'}`}>Start from $100</div>
                  </div>
                ))
              )}
            </div>
          </FadeIn>
        </Section>

        {/* 5. Footer */}
        <footer className={`py-24 px-6 border-t ${darkMode ? 'bg-black border-zinc-800' : 'bg-white border-zinc-100'}`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12">
            <div>
              <h2 className={`text-6xl md:text-8xl font-black tracking-tighter mb-8 ${darkMode ? 'text-white' : 'text-black'}`}>
                {content.uiTexts?.contactTitle}
              </h2>
              <div className="flex gap-4">
                <a href={content.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className={`p-4 rounded-full border transition-colors ${darkMode ? 'border-zinc-800 hover:bg-zinc-900 text-white' : 'border-zinc-200 hover:bg-zinc-50 text-black'}`}>
                  <Instagram />
                </a>
                <a href={content.socialLinks.telegram} target="_blank" rel="noopener noreferrer" className={`p-4 rounded-full border transition-colors ${darkMode ? 'border-zinc-800 hover:bg-zinc-900 text-white' : 'border-zinc-200 hover:bg-zinc-50 text-black'}`}>
                  <Send />
                </a>
                <a href={`tel:${content.socialLinks.phone}`} className={`p-4 rounded-full border transition-colors ${darkMode ? 'border-zinc-800 hover:bg-zinc-900 text-white' : 'border-zinc-200 hover:bg-zinc-50 text-black'}`}>
                  <Phone />
                </a>
              </div>
            </div>
            
            <div className="text-right">
              <p className={`text-sm mb-2 ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>{content.uiTexts?.footerText}</p>
              <p className={`text-xs ${darkMode ? 'text-zinc-600' : 'text-zinc-500'}`}>Designed & Developed with Sanjrbek Otabekov</p>
            </div>
          </div>
        </footer>

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
