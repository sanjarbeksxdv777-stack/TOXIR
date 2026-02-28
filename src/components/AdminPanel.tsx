import { useState, useEffect, FormEvent, DragEvent, ChangeEvent } from 'react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot, query, orderBy, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, Plus, Trash2, Edit2, Video, Image, Save, X, Calendar, User, Phone, Briefcase, LayoutGrid, List, Search, ChevronRight, BarChart3, TrendingUp, Users, Film, AlertCircle, CheckCircle2, MessageSquare, HelpCircle, Settings, Globe, Eye, Camera } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  category: string;
  type: string;
  description: string;
  stats: string;
  image: string;
  videoUrl: string;
}

interface Booking {
  id: string;
  name: string;
  phone: string;
  type: string;
  createdAt: any;
  status?: 'new' | 'completed';
}

interface SiteContent {
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  aboutText: string;
  aboutImage: string;
  aboutStats: { val: string; label: string }[];
  socialLinks: { instagram: string; telegram: string; phone: string };
  gaId?: string;
  clients: string[];
  sectionTitles: {
    about: string;
    portfolio: string;
    services: string;
    process: string;
    testimonials: string;
    faq: string;
    contact: string;
    equipment: string;
    skills: string;
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
  skills: string[];
}

interface Service {
  id: string;
  title: string;
  desc: string;
  price: string;
  icon: string;
  image: string;
}

interface ProcessStep {
  id: string;
  step: string;
  title: string;
  desc: string;
  image: string;
}

interface EquipmentItem {
  id: string;
  title: string;
  icon: string;
  items: string[];
  image: string;
}

interface Testimonial {
  id: string;
  name: string;
  role: string;
  text: string;
  image: string;
}

interface FAQItem {
  id: string;
  q: string;
  a: string;
}

const CATEGORIES = ["Tijorat", "Reels", "Tadbir", "Mahsulot"];

// --- Components ---

const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, y: 50, x: '-50%' }}
    animate={{ opacity: 1, y: 0, x: '-50%' }}
    exit={{ opacity: 0, y: 20, x: '-50%' }}
    className={`fixed bottom-8 left-1/2 z-[70] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border ${type === 'success' ? 'bg-zinc-900 border-green-500/30 text-green-400' : 'bg-zinc-900 border-red-500/30 text-red-400'}`}
  >
    {type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
    <span className="font-medium text-sm text-white">{message}</span>
  </motion.div>
);

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, title: string, message: string }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-zinc-900 p-6 rounded-2xl border border-zinc-800 w-full max-w-sm shadow-2xl"
        >
          <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
          <p className="text-zinc-400 mb-6">{message}</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-white font-medium hover:bg-zinc-700 transition-colors">Bekor qilish</button>
            <button onClick={() => { onConfirm(); onClose(); }} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors">O'chirish</button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'bookings' | 'content' | 'services' | 'testimonials' | 'faq' | 'process' | 'equipment'>('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [content, setContent] = useState<SiteContent | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [faq, setFaq] = useState<FAQItem[]>([]);
  const [process, setProcess] = useState<ProcessStep[]>([]);
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [visitorCount, setVisitorCount] = useState(0);

  const [isEditing, setIsEditing] = useState<Project | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newProject, setNewProject] = useState<Omit<Project, 'id'>>({
    title: '', category: 'Reels', type: '', description: '', stats: '', image: '', videoUrl: ''
  });
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'projects' | 'services' | 'testimonials' | 'faq' | 'process' | 'equipment' | null>(null);
  const navigate = useNavigate();

  const [uploadingImage, setUploadingImage] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // New State for other tabs
  const [newService, setNewService] = useState<Omit<Service, 'id'>>({ title: '', desc: '', price: '', icon: 'video' });
  const [editingService, setEditingService] = useState<Service | null>(null);

  const [newTestimonial, setNewTestimonial] = useState<Omit<Testimonial, 'id'>>({ name: '', role: '', text: '' });
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);

  const [newFaq, setNewFaq] = useState<Omit<FAQItem, 'id'>>({ q: '', a: '' });
  const [editingFaq, setEditingFaq] = useState<FAQItem | null>(null);

  const [newProcess, setNewProcess] = useState<Omit<ProcessStep, 'id'>>({ step: '', title: '', desc: '' });
  const [editingProcess, setEditingProcess] = useState<ProcessStep | null>(null);

  const [newEquipment, setNewEquipment] = useState<Omit<EquipmentItem, 'id'>>({ title: '', icon: 'camera', items: [] });
  const [editingEquipment, setEditingEquipment] = useState<EquipmentItem | null>(null);
  const [equipmentItemsInput, setEquipmentItemsInput] = useState('');

  // ... useEffect ...

  // ... (existing handlers) ...

  const handleDeleteConfirm = async () => {
    if (deleteId && deleteType) {
      try {
        await deleteDoc(doc(db, deleteType, deleteId));
        showToast("Muvaffaqiyatli o'chirildi", 'success');
      } catch (error) {
        showToast("Xatolik yuz berdi", 'error');
      }
      setDeleteId(null);
      setDeleteType(null);
    }
  };

  // Services Handlers
  const handleAddService = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "services"), newService);
      setNewService({ title: '', desc: '', price: '', icon: 'video' });
      setIsAdding(false);
      showToast("Xizmat qo'shildi", 'success');
    } catch (error) { showToast("Xatolik", 'error'); }
  };

  const handleUpdateService = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    try {
      const { id, ...data } = editingService;
      await updateDoc(doc(db, "services", id), data);
      setEditingService(null);
      showToast("Xizmat yangilandi", 'success');
    } catch (error) { showToast("Xatolik", 'error'); }
  };

  // Testimonials Handlers
  const handleAddTestimonial = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "testimonials"), newTestimonial);
      setNewTestimonial({ name: '', role: '', text: '' });
      setIsAdding(false);
      showToast("Fikr qo'shildi", 'success');
    } catch (error) { showToast("Xatolik", 'error'); }
  };

  const handleUpdateTestimonial = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingTestimonial) return;
    try {
      const { id, ...data } = editingTestimonial;
      await updateDoc(doc(db, "testimonials", id), data);
      setEditingTestimonial(null);
      showToast("Fikr yangilandi", 'success');
    } catch (error) { showToast("Xatolik", 'error'); }
  };

  // FAQ Handlers
  const handleAddFaq = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "faq"), newFaq);
      setNewFaq({ q: '', a: '' });
      setIsAdding(false);
      showToast("Savol qo'shildi", 'success');
    } catch (error) { showToast("Xatolik", 'error'); }
  };

  const handleUpdateFaq = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingFaq) return;
    try {
      const { id, ...data } = editingFaq;
      await updateDoc(doc(db, "faq", id), data);
      setEditingFaq(null);
      showToast("Savol yangilandi", 'success');
    } catch (error) { showToast("Xatolik", 'error'); }
  };

  // Process Handlers
  const handleAddProcess = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "process"), newProcess);
      setNewProcess({ step: '', title: '', desc: '' });
      setIsAdding(false);
      showToast("Jarayon bosqichi qo'shildi", 'success');
    } catch (error) { showToast("Xatolik", 'error'); }
  };

  const handleUpdateProcess = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingProcess) return;
    try {
      const { id, ...data } = editingProcess;
      await updateDoc(doc(db, "process", id), data);
      setEditingProcess(null);
      showToast("Jarayon yangilandi", 'success');
    } catch (error) { showToast("Xatolik", 'error'); }
  };

  // Equipment Handlers
  const handleAddEquipment = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const items = equipmentItemsInput.split(',').map(i => i.trim()).filter(i => i);
      await addDoc(collection(db, "equipment"), { ...newEquipment, items });
      setNewEquipment({ title: '', icon: 'camera', items: [] });
      setEquipmentItemsInput('');
      setIsAdding(false);
      showToast("Texnika qo'shildi", 'success');
    } catch (error) { showToast("Xatolik", 'error'); }
  };

  const handleUpdateEquipment = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingEquipment) return;
    try {
      const { id, ...data } = editingEquipment;
      const items = equipmentItemsInput.split(',').map(i => i.trim()).filter(i => i);
      await updateDoc(doc(db, "equipment", id), { ...data, items });
      setEditingEquipment(null);
      setEquipmentItemsInput('');
      showToast("Texnika yangilandi", 'success');
    } catch (error) { showToast("Xatolik", 'error'); }
  };

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      if (!user) navigate('/login');
    });

    const qProjects = query(collection(db, "projects"));
    const unsubscribeProjects = onSnapshot(qProjects, (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
    });

    const qBookings = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
    const unsubscribeBookings = onSnapshot(qBookings, (snapshot) => {
      setBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking)));
    });

    // Content
    const unsubscribeContent = onSnapshot(doc(db, "site_content", "main"), (doc) => {
      if (doc.exists()) {
        setContent(doc.data() as SiteContent);
      } else {
        setContent({
          heroTitle: "TOHIRJON\nBOLTAYEV",
          heroSubtitle: "Brendlar va shaxslar uchun premium mobil kontent yaratuvchi videograf.",
          heroImage: "",
          aboutText: "Men shunchaki video olmayman...",
          aboutImage: "",
          aboutStats: [
            { val: "3+", label: "Yillik Tajriba" },
            { val: "100+", label: "Muvaffaqiyatli Loyiha" },
            { val: "5M+", label: "Umumiy Ko'rishlar" },
            { val: "24/7", label: "Kreativ Yondashuv" }
          ],
          socialLinks: { instagram: "", telegram: "", phone: "" },
          clients: ["Samsung", "Pepsi", "Click", "Payme", "Uzum", "Korzinka", "Murad Buildings", "Golden House"],
          sectionTitles: {
            about: "Haqida",
            portfolio: "Ishlar",
            services: "Xizmatlar",
            process: "Ish Jarayoni",
            testimonials: "Mijozlar Fikri",
            faq: "Ko'p So'raladigan Savollar",
            contact: "Bog'lanish",
            equipment: "Ishlatiladigan Texnika",
            skills: "Ko'nikmalar"
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
          },
          skills: ["DaVinci Resolve", "Adobe Premiere Pro", "After Effects", "Sound Design", "Color Grading", "Storytelling"]
        });
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

    // Visitor Stats
    const unsubscribeStats = onSnapshot(doc(db, "stats", "visitors"), (doc) => {
      if (doc.exists()) {
        setVisitorCount(doc.data().count);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProjects();
      unsubscribeBookings();
      unsubscribeContent();
      unsubscribeServices();
      unsubscribeTestimonials();
      unsubscribeFaq();
      unsubscribeProcess();
      unsubscribeEquipment();
      unsubscribeStats();
    };
  }, [navigate]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleLogout = () => signOut(auth);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!file) return null;
    const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
    if (!apiKey) {
      showToast("IMGBB API kaliti topilmadi", 'error');
      return null;
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        return data.data.url;
      } else {
        showToast("Rasm yuklashda xatolik", 'error');
        return null;
      }
    } catch (error) {
      showToast("Serverga ulanishda xatolik", 'error');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    const url = await uploadImage(file);
    if (url) {
      if (isAdding) {
        setNewProject(prev => ({ ...prev, image: url }));
      } else if (isEditing) {
        setIsEditing(prev => ({ ...prev!, image: url }));
      }
      showToast("Rasm muvaffaqiyatli yuklandi!", 'success');
    }
  };

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleImageUpload(e.target.files[0]);
    }
  };

  const handleAddProject = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "projects"), newProject);
      setNewProject({ title: '', category: 'Reels', type: '', description: '', stats: '', image: '', videoUrl: '' });
      setIsAdding(false);
      showToast("Loyiha muvaffaqiyatli qo'shildi!", 'success');
    } catch (error) {
      showToast("Xatolik yuz berdi", 'error');
    }
  };

  const handleUpdateProject = async (e: FormEvent) => {
    e.preventDefault();
    if (!isEditing) return;
    try {
      const { id, ...data } = isEditing;
      await updateDoc(doc(db, "projects", id), data);
      setIsEditing(null);
      showToast("Loyiha yangilandi", 'success');
    } catch (error) {
      showToast("Xatolik yuz berdi", 'error');
    }
  };

  const toggleBookingStatus = async (id: string, currentStatus: string | undefined) => {
    try {
      const newStatus = currentStatus === 'completed' ? 'new' : 'completed';
      await updateDoc(doc(db, "bookings", id), { status: newStatus });
      showToast(newStatus === 'completed' ? "Buyurtma bajarildi deb belgilandi" : "Buyurtma yangi holatiga qaytarildi", 'success');
    } catch (error) {
      showToast("Xatolik yuz berdi", 'error');
    }
  };

  const handleUpdateContent = async (e: FormEvent) => {
    e.preventDefault();
    if (!content) return;
    try {
      await setDoc(doc(db, "site_content", "main"), content);
      showToast("Ma'lumotlar saqlandi", 'success');
    } catch (error) {
      showToast("Xatolik yuz berdi", 'error');
    }
  };

  const handleHeroImageUpload = async (file: File) => {
    const url = await uploadImage(file);
    if (url) {
      setContent(prev => prev ? ({ ...prev, heroImage: url }) : null);
      showToast("Rasm muvaffaqiyatli yuklandi!", 'success');
    }
  };

  const handleAboutImageUpload = async (file: File) => {
    const url = await uploadImage(file);
    if (url) {
      setContent(prev => prev ? ({ ...prev, aboutImage: url }) : null);
      showToast("Rasm muvaffaqiyatli yuklandi!", 'success');
    }
  };

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats
  const totalViews = projects.reduce((acc, curr) => {
    const match = curr.stats.match(/(\d+(\.\d+)?)M/);
    return acc + (match ? parseFloat(match[1]) : 0);
  }, 0);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>
      
      <ConfirmModal 
        isOpen={!!deleteId} 
        onClose={() => { setDeleteId(null); setDeleteType(null); }} 
        onConfirm={handleDeleteConfirm}
        title="O'chirish"
        message="Haqiqatan ham ushbu ma'lumotni o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi."
      />

      {/* Sidebar / Header */}
      <div className="border-b border-zinc-800 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg shadow-white/10">
              <span className="text-black font-black text-xl">TB.</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight hidden md:block">Admin Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-1 bg-zinc-900/50 p-1.5 rounded-full border border-zinc-800 overflow-x-auto max-w-[200px] md:max-w-none scrollbar-hide">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'projects', label: 'Loyihalar', icon: Film },
              { id: 'bookings', label: 'Buyurtmalar', icon: Users },
              { id: 'content', label: 'Kontent', icon: LayoutGrid },
              { id: 'services', label: 'Xizmatlar', icon: Settings },
              { id: 'testimonials', label: 'Fikrlar', icon: MessageSquare },
              { id: 'faq', label: 'FAQ', icon: HelpCircle },
              { id: 'process', label: 'Jarayon', icon: CheckCircle2 },
              { id: 'equipment', label: 'Texnika', icon: Camera }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-black shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}`}
              >
                <tab.icon size={16} />
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          <button onClick={handleLogout} className="p-3 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <AnimatePresence mode='wait'>
          {activeTab === 'dashboard' ? (
             <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
             >
                <h2 className="text-3xl font-bold">Umumiy Statistika</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Eye size={100} />
                    </div>
                    <h3 className="text-zinc-400 font-medium mb-2">Tashriflar</h3>
                    <p className="text-5xl font-black">{visitorCount}</p>
                  </div>
                  <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Film size={100} />
                    </div>
                    <h3 className="text-zinc-400 font-medium mb-2">Jami Loyihalar</h3>
                    <p className="text-5xl font-black">{projects.length}</p>
                  </div>
                  <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Users size={100} />
                    </div>
                    <h3 className="text-zinc-400 font-medium mb-2">Buyurtmalar</h3>
                    <p className="text-5xl font-black">{bookings.length}</p>
                  </div>
                  <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <TrendingUp size={100} />
                    </div>
                    <h3 className="text-zinc-400 font-medium mb-2">Taxminiy Ko'rishlar</h3>
                    <p className="text-5xl font-black">{totalViews.toFixed(1)}M+</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mt-12">
                   <div className="bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800">
                      <h3 className="text-xl font-bold mb-6">So'nggi Buyurtmalar</h3>
                      <div className="space-y-4">
                        {bookings.slice(0, 5).map(booking => (
                          <div key={booking.id} className="flex items-center justify-between p-4 rounded-2xl bg-black border border-zinc-800">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 font-bold">
                                {booking.name.charAt(0)}
                              </div>
                              <div>
                                <h4 className="font-bold text-sm">{booking.name}</h4>
                                <p className="text-xs text-zinc-500">{booking.type}</p>
                              </div>
                            </div>
                            <span className="text-xs text-zinc-500">{booking.createdAt?.toDate().toLocaleDateString()}</span>
                          </div>
                        ))}
                        {bookings.length === 0 && <p className="text-zinc-500 text-center py-4">Buyurtmalar yo'q</p>}
                      </div>
                   </div>
                   
                   <div className="bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800">
                      <h3 className="text-xl font-bold mb-6">Tezkor Harakatlar</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => { setActiveTab('projects'); setIsAdding(true); }} className="p-6 rounded-2xl bg-black border border-zinc-800 hover:border-white transition-colors text-left group">
                          <Plus className="mb-4 text-zinc-400 group-hover:text-white transition-colors" />
                          <span className="font-bold block">Loyiha Qo'shish</span>
                        </button>
                        <button onClick={() => setActiveTab('bookings')} className="p-6 rounded-2xl bg-black border border-zinc-800 hover:border-white transition-colors text-left group">
                          <List className="mb-4 text-zinc-400 group-hover:text-white transition-colors" />
                          <span className="font-bold block">Buyurtmalarni Ko'rish</span>
                        </button>
                      </div>
                   </div>
                </div>
             </motion.div>
          ) : activeTab === 'content' && content ? (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto"
            >
              <h2 className="text-3xl font-bold mb-8">Sayt Kontenti</h2>
              <form onSubmit={handleUpdateContent} className="space-y-8">
                {/* Hero Section */}
                <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 space-y-6">
                  <h3 className="text-xl font-bold flex items-center gap-2"><LayoutGrid size={20} /> Asosiy Qism (Hero)</h3>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Sarlavha</label>
                    <textarea 
                      value={content.heroTitle} 
                      onChange={e => setContent({...content, heroTitle: e.target.value})} 
                      className="w-full p-4 bg-black border border-zinc-800 rounded-xl focus:border-white outline-none transition-colors h-24 resize-none font-bold text-xl"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Taglavha</label>
                    <textarea 
                      value={content.heroSubtitle} 
                      onChange={e => setContent({...content, heroSubtitle: e.target.value})} 
                      className="w-full p-4 bg-black border border-zinc-800 rounded-xl focus:border-white outline-none transition-colors h-24 resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Orqa Fon Rasmi</label>
                    <div 
                      className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragActive ? 'border-white bg-zinc-800' : 'border-zinc-800 bg-black hover:border-zinc-600'}`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragActive(false);
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) handleHeroImageUpload(e.dataTransfer.files[0]);
                      }}
                    >
                      <input type="file" className="hidden" id="hero-upload" accept="image/*" onChange={(e) => e.target.files && handleHeroImageUpload(e.target.files[0])} disabled={uploadingImage} />
                      
                      {content.heroImage ? (
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden group">
                           <img src={content.heroImage} alt="Hero" className="w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <label htmlFor="hero-upload" className="cursor-pointer px-4 py-2 bg-white text-black rounded-lg font-bold flex items-center gap-2">
                                 <Edit2 size={16} /> O'zgartirish
                              </label>
                           </div>
                        </div>
                      ) : (
                        <label htmlFor="hero-upload" className="cursor-pointer flex flex-col items-center justify-center gap-4">
                          {uploadingImage ? <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Image size={32} className="text-zinc-400" />}
                          <span className="text-zinc-500">Rasm yuklash</span>
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                {/* About Section */}
                <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 space-y-6">
                  <h3 className="text-xl font-bold flex items-center gap-2"><User size={20} /> Haqida</h3>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Matn</label>
                    <textarea 
                      value={content.aboutText} 
                      onChange={e => setContent({...content, aboutText: e.target.value})} 
                      className="w-full p-4 bg-black border border-zinc-800 rounded-xl focus:border-white outline-none transition-colors h-32 resize-none"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {content.aboutStats.map((stat, i) => (
                      <div key={i} className="space-y-2 p-4 bg-black rounded-xl border border-zinc-800">
                        <input 
                          value={stat.val}
                          onChange={e => {
                            const newStats = [...content.aboutStats];
                            newStats[i].val = e.target.value;
                            setContent({...content, aboutStats: newStats});
                          }}
                          className="w-full bg-transparent font-bold text-xl outline-none"
                          placeholder="Qiymat"
                        />
                        <input 
                          value={stat.label}
                          onChange={e => {
                            const newStats = [...content.aboutStats];
                            newStats[i].label = e.target.value;
                            setContent({...content, aboutStats: newStats});
                          }}
                          className="w-full bg-transparent text-xs uppercase text-zinc-500 outline-none"
                          placeholder="Nomi"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Social Links & Analytics */}
                <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 space-y-6">
                  <h3 className="text-xl font-bold flex items-center gap-2"><Globe size={20} /> Ijtimoiy Tarmoqlar & Analytics</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Instagram URL</label>
                      <input 
                        value={content.socialLinks.instagram} 
                        onChange={e => setContent({...content, socialLinks: {...content.socialLinks, instagram: e.target.value}})} 
                        className="w-full p-4 bg-black border border-zinc-800 rounded-xl focus:border-white outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Telegram URL</label>
                      <input 
                        value={content.socialLinks.telegram} 
                        onChange={e => setContent({...content, socialLinks: {...content.socialLinks, telegram: e.target.value}})} 
                        className="w-full p-4 bg-black border border-zinc-800 rounded-xl focus:border-white outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Telefon</label>
                      <input 
                        value={content.socialLinks.phone} 
                        onChange={e => setContent({...content, socialLinks: {...content.socialLinks, phone: e.target.value}})} 
                        className="w-full p-4 bg-black border border-zinc-800 rounded-xl focus:border-white outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Google Analytics ID (G-XXXXXX)</label>
                      <input 
                        value={content.gaId || ''} 
                        onChange={e => setContent({...content, gaId: e.target.value})} 
                        className="w-full p-4 bg-black border border-zinc-800 rounded-xl focus:border-white outline-none transition-colors"
                        placeholder="G-..."
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                       <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Hamkorlar (Vergul bilan ajrating)</label>
                       <textarea
                         value={content.clients ? content.clients.join(', ') : ''}
                         onChange={e => setContent({...content, clients: e.target.value.split(',').map(c => c.trim())})}
                         className="w-full p-4 bg-black border border-zinc-800 rounded-xl focus:border-white outline-none transition-colors h-24 resize-none"
                         placeholder="Samsung, Pepsi, Click..."
                       />
                    </div>
                  </div>
                </div>

                {/* Section Titles */}
                <div className="space-y-6 pt-8 border-t border-zinc-800">
                  <h3 className="text-xl font-bold flex items-center gap-2"><LayoutGrid size={20} /> Bo'lim Sarlavhalari</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    {Object.entries(content.sectionTitles || {}).map(([key, value]) => (
                      <div key={key} className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">{key}</label>
                        <input 
                          value={value} 
                          onChange={e => setContent({
                            ...content, 
                            sectionTitles: { ...content.sectionTitles, [key]: e.target.value }
                          })} 
                          className="w-full p-4 bg-black border border-zinc-800 rounded-xl focus:border-white outline-none transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* UI Texts */}
                <div className="space-y-6 pt-8 border-t border-zinc-800">
                  <h3 className="text-xl font-bold flex items-center gap-2"><MessageSquare size={20} /> Sayt Matnlari va Tugmalar</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    {Object.entries(content.uiTexts || {}).map(([key, value]) => (
                      <div key={key} className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">{key}</label>
                        <input 
                          value={value} 
                          onChange={e => setContent({
                            ...content, 
                            uiTexts: { ...content.uiTexts, [key]: e.target.value }
                          })} 
                          className="w-full p-4 bg-black border border-zinc-800 rounded-xl focus:border-white outline-none transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills */}
                <div className="space-y-6 pt-8 border-t border-zinc-800">
                  <h3 className="text-xl font-bold flex items-center gap-2"><Settings size={20} /> Ko'nikmalar</h3>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Ko'nikmalar (Vergul bilan ajrating)</label>
                    <textarea
                      value={content.skills ? content.skills.join(', ') : ''}
                      onChange={e => setContent({...content, skills: e.target.value.split(',').map(c => c.trim())})}
                      className="w-full p-4 bg-black border border-zinc-800 rounded-xl focus:border-white outline-none transition-colors h-24 resize-none"
                      placeholder="DaVinci Resolve, Premiere Pro, After Effects..."
                    />
                  </div>
                </div>

                <button type="submit" className="w-full py-4 bg-white text-black font-bold text-lg rounded-xl hover:bg-zinc-200 transition-colors sticky bottom-8 shadow-2xl">
                  Saqlash
                </button>
              </form>
            </motion.div>
          ) : activeTab === 'projects' ? (
            <motion.div 
              key="projects"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                  <input 
                    type="text" 
                    placeholder="Qidirish..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl focus:border-white outline-none transition-colors"
                  />
                </div>
                <button 
                  onClick={() => setIsAdding(true)}
                  className="w-full md:w-auto px-6 py-3 bg-white text-black font-bold rounded-2xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={20} /> Yangi Loyiha
                </button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {filteredProjects.map(project => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, scale: 0.9 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      exit={{ opacity: 0, scale: 0.9 }}
                      key={project.id} 
                      className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden group hover:border-zinc-700 transition-colors"
                    >
                      <div className="aspect-[4/5] relative overflow-hidden">
                        <img src={project.image} alt={project.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                        
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <button onClick={() => setIsEditing(project)} className="p-3 bg-white/10 backdrop-blur-md rounded-full hover:bg-white hover:text-black transition-colors border border-white/20">
                            <Edit2 size={18} />
                          </button>
                          <button onClick={() => { setDeleteId(project.id); setDeleteType('projects'); }} className="p-3 bg-red-500/20 text-red-500 backdrop-blur-md rounded-full hover:bg-red-500 hover:text-white transition-colors border border-red-500/20">
                            <Trash2 size={18} />
                          </button>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 p-6">
                          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 block">{project.category}</span>
                          <h3 className="font-bold text-xl mb-1">{project.title}</h3>
                          <p className="text-zinc-400 text-sm line-clamp-1">{project.description}</p>
                        </div>
                      </div>
                      <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-between text-xs text-zinc-500">
                         <div className="flex items-center gap-2">
                            <Video size={14} />
                            <a href={project.videoUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white truncate max-w-[150px]">{project.videoUrl}</a>
                         </div>
                         <span className="font-mono">{project.stats}</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : activeTab === 'services' ? (
            <motion.div key="services" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">Xizmatlar</h2>
                <button onClick={() => setIsAdding(true)} className="px-6 py-3 bg-white text-black font-bold rounded-2xl hover:bg-zinc-200 transition-colors flex items-center gap-2">
                  <Plus size={20} /> Yangi Xizmat
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {services.map(service => (
                  <div key={service.id} className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 flex flex-col justify-between group hover:border-zinc-700 transition-colors">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-zinc-800 rounded-xl text-white">
                          {service.icon === 'video' ? <Video size={24} /> : service.icon === 'monitor' ? <Settings size={24} /> : <Image size={24} />}
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditingService(service)} className="p-2 bg-zinc-800 rounded-lg hover:bg-white hover:text-black transition-colors"><Edit2 size={16} /></button>
                          <button onClick={() => { setDeleteId(service.id); setDeleteType('services'); }} className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"><Trash2 size={16} /></button>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                      <p className="text-zinc-400 text-sm mb-4">{service.desc}</p>
                    </div>
                    <div className="pt-4 border-t border-zinc-800">
                      <p className="text-sm font-bold text-white">{service.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : activeTab === 'testimonials' ? (
            <motion.div key="testimonials" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">Mijozlar Fikri</h2>
                <button onClick={() => setIsAdding(true)} className="px-6 py-3 bg-white text-black font-bold rounded-2xl hover:bg-zinc-200 transition-colors flex items-center gap-2">
                  <Plus size={20} /> Yangi Fikr
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {testimonials.map(t => (
                  <div key={t.id} className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 relative group hover:border-zinc-700 transition-colors">
                    <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingTestimonial(t)} className="p-2 bg-zinc-800 rounded-lg hover:bg-white hover:text-black transition-colors"><Edit2 size={16} /></button>
                      <button onClick={() => { setDeleteId(t.id); setDeleteType('testimonials'); }} className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"><Trash2 size={16} /></button>
                    </div>
                    <p className="text-zinc-300 italic mb-6">"{t.text}"</p>
                    <div>
                      <h4 className="font-bold text-white">{t.name}</h4>
                      <p className="text-xs text-zinc-500">{t.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : activeTab === 'faq' ? (
            <motion.div key="faq" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">FAQ</h2>
                <button onClick={() => setIsAdding(true)} className="px-6 py-3 bg-white text-black font-bold rounded-2xl hover:bg-zinc-200 transition-colors flex items-center gap-2">
                  <Plus size={20} /> Yangi Savol
                </button>
              </div>
              <div className="space-y-4">
                {faq.map(item => (
                  <div key={item.id} className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 group hover:border-zinc-700 transition-colors">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="font-bold text-lg mb-2">{item.q}</h3>
                        <p className="text-zinc-400">{item.a}</p>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button onClick={() => setEditingFaq(item)} className="p-2 bg-zinc-800 rounded-lg hover:bg-white hover:text-black transition-colors"><Edit2 size={16} /></button>
                        <button onClick={() => { setDeleteId(item.id); setDeleteType('faq'); }} className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : activeTab === 'process' ? (
            <motion.div key="process" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">Ish Jarayoni</h2>
                <button onClick={() => setIsAdding(true)} className="px-6 py-3 bg-white text-black font-bold rounded-2xl hover:bg-zinc-200 transition-colors flex items-center gap-2">
                  <Plus size={20} /> Yangi Bosqich
                </button>
              </div>
              <div className="space-y-4">
                {process.map(step => (
                  <div key={step.id} className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 group hover:border-zinc-700 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="text-4xl font-black text-zinc-800">{step.step}</div>
                      <div>
                        <h3 className="font-bold text-lg mb-1">{step.title}</h3>
                        <p className="text-zinc-400">{step.desc}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingProcess(step)} className="p-2 bg-zinc-800 rounded-lg hover:bg-white hover:text-black transition-colors"><Edit2 size={16} /></button>
                      <button onClick={() => { setDeleteId(step.id); setDeleteType('process'); }} className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : activeTab === 'equipment' ? (
            <motion.div key="equipment" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">Texnika</h2>
                <button onClick={() => setIsAdding(true)} className="px-6 py-3 bg-white text-black font-bold rounded-2xl hover:bg-zinc-200 transition-colors flex items-center gap-2">
                  <Plus size={20} /> Yangi Kategoriya
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {equipment.map(item => (
                  <div key={item.id} className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 group hover:border-zinc-700 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-zinc-800 rounded-xl text-white">
                        <Camera size={24} />
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingEquipment(item); setEquipmentItemsInput(item.items.join(', ')); }} className="p-2 bg-zinc-800 rounded-lg hover:bg-white hover:text-black transition-colors"><Edit2 size={16} /></button>
                        <button onClick={() => { setDeleteId(item.id); setDeleteType('equipment'); }} className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-4">{item.title}</h3>
                    <ul className="space-y-2">
                      {item.items.map((i, idx) => (
                        <li key={idx} className="text-zinc-400 text-sm flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                          {i}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="bookings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-bold mb-8">Buyurtmalar Tarixi</h2>
              {bookings.length === 0 ? (
                <div className="text-center py-20 text-zinc-500">
                  <p>Hozircha buyurtmalar yo'q.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {bookings.map(booking => (
                    <div 
                      key={booking.id} 
                      className={`p-6 rounded-3xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-6 transition-all ${booking.status === 'completed' ? 'bg-zinc-900/50 border-zinc-800 opacity-60' : 'bg-zinc-900 border-zinc-700 shadow-lg'}`}
                    >
                      <div className="flex items-center gap-6">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${booking.status === 'completed' ? 'bg-zinc-800 text-green-500' : 'bg-white text-black'}`}>
                          {booking.status === 'completed' ? <CheckCircle2 size={24} /> : <User size={24} />}
                        </div>
                        <div>
                          <h3 className={`font-bold text-xl mb-1 transition-colors ${booking.status === 'completed' ? 'line-through text-zinc-500' : 'text-white'}`}>{booking.name}</h3>
                          <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
                            <span className="flex items-center gap-2"><Phone size={14} /> {booking.phone}</span>
                            <span className="flex items-center gap-2"><Briefcase size={14} /> {booking.type}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 pl-18 md:pl-0 w-full md:w-auto justify-between md:justify-end">
                        <div className="text-right text-zinc-600 text-xs hidden md:block">
                          <div className="flex items-center gap-2 justify-end mb-1">
                            <Calendar size={14} />
                            {booking.createdAt?.toDate().toLocaleDateString()}
                          </div>
                          <div>{booking.createdAt?.toDate().toLocaleTimeString()}</div>
                        </div>
                        <button 
                          onClick={() => toggleBookingStatus(booking.id, booking.status)}
                          className={`px-4 py-2 rounded-xl border text-sm font-bold transition-colors ${booking.status === 'completed' ? 'border-zinc-700 text-zinc-500 hover:text-white hover:border-zinc-500' : 'bg-white text-black border-transparent hover:bg-zinc-200'}`}
                        >
                          {booking.status === 'completed' ? "Qaytarish" : "Bajarildi"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {(isAdding || isEditing || editingService || editingTestimonial || editingFaq || editingProcess || editingEquipment) && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => { setIsAdding(false); setIsEditing(null); setEditingService(null); setEditingTestimonial(null); setEditingFaq(null); setEditingProcess(null); setEditingEquipment(null); }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => { setIsAdding(false); setIsEditing(null); setEditingService(null); setEditingTestimonial(null); setEditingFaq(null); setEditingProcess(null); setEditingEquipment(null); }}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-800 text-zinc-400 transition-colors"
              >
                <X size={24} />
              </button>
              
              {activeTab === 'projects' && (
                <>
                  <h2 className="text-2xl font-bold mb-8">{isAdding ? "Yangi Loyiha" : "Loyihani Tahrirlash"}</h2>
                  <form onSubmit={isAdding ? handleAddProject : handleUpdateProject} className="space-y-6">
                    {/* ... Project Form Fields ... */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Loyiha Nomi</label>
                        <input required value={isAdding ? newProject.title : isEditing?.title} onChange={e => isAdding ? setNewProject({...newProject, title: e.target.value}) : setIsEditing({...isEditing!, title: e.target.value})} className="w-full p-4 bg-black border border-zinc-800 rounded-xl focus:border-white outline-none transition-colors" placeholder="Masalan: Shahar Nafasi" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Kategoriya</label>
                        <select value={isAdding ? newProject.category : isEditing?.category} onChange={e => isAdding ? setNewProject({...newProject, category: e.target.value}) : setIsEditing({...isEditing!, category: e.target.value})} className="w-full p-4 bg-black border border-zinc-800 rounded-xl focus:border-white outline-none transition-colors appearance-none">
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Turi</label>
                        <input required value={isAdding ? newProject.type : isEditing?.type} onChange={e => isAdding ? setNewProject({...newProject, type: e.target.value}) : setIsEditing({...isEditing!, type: e.target.value})} className="w-full p-4 bg-black border border-zinc-800 rounded-xl focus:border-white outline-none transition-colors" placeholder="Masalan: Sport, Fashion" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Statistika</label>
                        <input required value={isAdding ? newProject.stats : isEditing?.stats} onChange={e => isAdding ? setNewProject({...newProject, stats: e.target.value}) : setIsEditing({...isEditing!, stats: e.target.value})} className="w-full p-4 bg-black border border-zinc-800 rounded-xl focus:border-white outline-none transition-colors" placeholder="Masalan: 1.2M Ko'rish" />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Tavsif</label>
                        <textarea required value={isAdding ? newProject.description : isEditing?.description} onChange={e => isAdding ? setNewProject({...newProject, description: e.target.value}) : setIsEditing({...isEditing!, description: e.target.value})} className="w-full p-4 bg-black border border-zinc-800 rounded-xl focus:border-white outline-none transition-colors h-32 resize-none" placeholder="Loyiha haqida qisqacha..." />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Rasm</label>
                        <div className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-all ${dragActive ? 'border-white bg-zinc-800 scale-[1.02]' : 'border-zinc-800 bg-black hover:border-zinc-600'}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
                          <input type="file" id="image-upload" className="hidden" accept="image/*" onChange={handleChange} disabled={uploadingImage} />
                          {(isAdding ? newProject.image : isEditing?.image) ? (
                            <div className="relative w-full aspect-video rounded-lg overflow-hidden group">
                               <img src={isAdding ? newProject.image : isEditing?.image} alt="Preview" className="w-full h-full object-cover" />
                               <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-3">
                                  <p className="text-white font-medium">Rasm yuklangan</p>
                                  <label htmlFor="image-upload" className="cursor-pointer px-4 py-2 bg-white text-black rounded-lg font-bold hover:bg-zinc-200 transition-colors flex items-center gap-2"><Edit2 size={16} /> O'zgartirish</label>
                               </div>
                               {uploadingImage && <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10"><div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" /></div>}
                            </div>
                          ) : (
                            <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center justify-center gap-4 py-8">
                              {uploadingImage ? <div className="flex flex-col items-center gap-3"><div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" /><p className="text-zinc-400 animate-pulse">Yuklanmoqda...</p></div> : <><div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 group-hover:border-zinc-600 transition-colors"><Image size={32} className="text-zinc-400 group-hover:text-white transition-colors" /></div><div><p className="font-bold text-lg text-white">Rasm yuklash</p><p className="text-zinc-500 text-sm">Faylni tanlang yoki shu yerga tashlang</p></div></>}
                            </label>
                          )}
                        </div>
                        <div className="relative">
                           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-zinc-600 text-xs font-bold">URL</span></div>
                           <input value={isAdding ? newProject.image : isEditing?.image} onChange={e => isAdding ? setNewProject({...newProject, image: e.target.value}) : setIsEditing({...isEditing!, image: e.target.value})} className="w-full pl-12 pr-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl text-sm text-zinc-400 focus:border-zinc-700 outline-none transition-colors placeholder:text-zinc-700" placeholder="Yoki to'g'ridan-to'g'ri rasm havolasini kiriting..." />
                        </div>
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Video URL</label>
                        <div className="relative">
                          <Video className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                          <input required value={isAdding ? newProject.videoUrl : isEditing?.videoUrl} onChange={e => isAdding ? setNewProject({...newProject, videoUrl: e.target.value}) : setIsEditing({...isEditing!, videoUrl: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-black border border-zinc-800 rounded-xl focus:border-white outline-none transition-colors" placeholder="https://youtube.com/..." />
                        </div>
                      </div>
                    </div>
                    <button type="submit" className="w-full py-4 bg-white text-black font-bold text-lg rounded-xl hover:bg-zinc-200 transition-colors mt-4">{isAdding ? "Qo'shish" : "Saqlash"}</button>
                  </form>
                </>
              )}

              {activeTab === 'services' && (
                <>
                  <h2 className="text-2xl font-bold mb-8">{isAdding ? "Yangi Xizmat" : "Xizmatni Tahrirlash"}</h2>
                  <form onSubmit={isAdding ? handleAddService : handleUpdateService} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Nomi</label>
                      <input required value={isAdding ? newService.title : editingService?.title} onChange={e => isAdding ? setNewService({...newService, title: e.target.value}) : setEditingService({...editingService!, title: e.target.value})} className="w-full p-4 bg-black border border-zinc-800 rounded-xl focus:border-white outline-none transition-colors" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Tavsif</label>
                      <textarea required value={isAdding ? newService.desc : editingService?.desc} onChange={e => isAdding ? setNewService({...newService, desc: e.target.value}) : setEditingService({...editingService!, desc: e.target.value})} className="w-full p-4 bg-black border border-zinc-800 rounded-xl focus:border-white outline-none transition-colors h-24 resize-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Narx</label>
                        <input required value={isAdding ? newService.price : editingService?.price} onChange={e => isAdding ? setNewService({...newService, price: e.target.value}) : setEditingService({...editingService!, price: e.target.value})} className="w-full p-4 bg-black border border-zinc-800 rounded-xl focus:border-white outline-none transition-colors" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Ikonka</label>
                        <select value={isAdding ? newService.icon : editingService?.icon} onChange={e => isAdding ? setNewService({...newService, icon: e.target.value}) : setEditingService({...editingService!, icon: e.target.value})} className="w-full p-4 bg-black border border-zinc-800 rounded-xl focus:border-white outline-none transition-colors appearance-none">
                          <option value="video">Video</option>
                          <option value="monitor">Monitor</option>
                          <option value="camera">Camera</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Rasm</label>
                      <div className="relative border-2 border-dashed rounded-xl p-4 text-center border-zinc-800 bg-black hover:border-zinc-600 transition-colors">
                        <input type="file" id="service-image-upload" className="hidden" accept="image/*" onChange={async (e) => {
                          if (e.target.files && e.target.files[0]) {
                            const url = await uploadImage(e.target.files[0]);
                            if (url) {
                              if (isAdding) setNewService(prev => ({ ...prev, image: url }));
                              else setEditingService(prev => ({ ...prev!, image: url }));
                              showToast("Rasm yuklandi", 'success');
                            }
                          }
                        }} disabled={uploadingImage} />
                        {(isAdding ? newService.image : editingService?.image) ? (
                          <div className="relative w-full aspect-video rounded-lg overflow-hidden group">
                            <img src={isAdding ? newService.image : editingService?.image} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-3">
                              <label htmlFor="service-image-upload" className="cursor-pointer px-4 py-2 bg-white text-black rounded-lg font-bold hover:bg-zinc-200 transition-colors flex items-center gap-2"><Edit2 size={16} /> O'zgartirish</label>
                            </div>
                          </div>
                        ) : (
                          <label htmlFor="service-image-upload" className="cursor-pointer flex flex-col items-center justify-center gap-4 py-8">
                            {uploadingImage ? <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Image size={32} className="text-zinc-600" /><span className="text-zinc-500 text-sm">Rasm yuklash</span></>}
                          </label>
                        )}
                      </div>
                    </div>
                    <button type="submit" className="w-full py-4 bg-white text-black font-bold text-lg rounded-xl hover:bg-zinc-200 transition-colors mt-4">{isAdding ? "Qo'shish" : "Saqlash"}</button>
                  </form>
                </>
              )}

              {activeTab === 'testimonials' && (
                <>
                  <h2 className="text-2xl font-bold mb-8">{isAdding ? "Yangi Fikr" : "Fikrni Tahrirlash"}</h2>
                  <form onSubmit={isAdding ? handleAddTestimonial : handleUpdateTestimonial} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Ism</label>
                      <input required value={isAdding ? newTestimonial.name : editingTestimonial?.name} onChange={e => isAdding ? setNewTestimonial({...newTestimonial, name: e.target.value}) : setEditingTestimonial({...editingTestimonial!, name: e.target.value})} className="w-full p-4 bg-black border border-zinc-800 rounded-xl focus:border-white outline-none transition-colors" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Lavozim</label>
                      <input required value={isAdding ? newTestimonial.role : editingTestimonial?.role} onChange={e => isAdding ? setNewTestimonial({...newTestimonial, role: e.target.value}) : setEditingTestimonial({...editingTestimonial!, role: e.target.value})} className="w-full p-4 bg-black border border-zinc-800 rounded-xl focus:border-white outline-none transition-colors" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Fikr Matni</label>
                      <textarea required value={isAdding ? newTestimonial.text : editingTestimonial?.text} onChange={e => isAdding ? setNewTestimonial({...newTestimonial, text: e.target.value}) : setEditingTestimonial({...editingTestimonial!, text: e.target.value})} className="w-full p-4 bg-black border border-zinc-800 rounded-xl focus:border-white outline-none transition-colors h-32 resize-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Rasm (Avatar)</label>
                      <div className="relative border-2 border-dashed rounded-xl p-4 text-center border-zinc-800 bg-black hover:border-zinc-600 transition-colors">
                        <input type="file" id="testimonial-image-upload" className="hidden" accept="image/*" onChange={async (e) => {
                          if (e.target.files && e.target.files[0]) {
                            const url = await uploadImage(e.target.files[0]);
                            if (url) {
                              if (isAdding) setNewTestimonial(prev => ({ ...prev, image: url }));
                              else setEditingTestimonial(prev => ({ ...prev!, image: url }));
                              showToast("Rasm yuklandi", 'success');
                            }
                          }
                        }} disabled={uploadingImage} />
                        {(isAdding ? newTestimonial.image : editingTestimonial?.image) ? (
                          <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden group">
                            <img src={isAdding ? newTestimonial.image : editingTestimonial?.image} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-3">
                              <label htmlFor="testimonial-image-upload" className="cursor-pointer p-2 bg-white text-black rounded-full hover:bg-zinc-200 transition-colors"><Edit2 size={16} /></label>
                            </div>
                          </div>
                        ) : (
                          <label htmlFor="testimonial-image-upload" className="cursor-pointer flex flex-col items-center justify-center gap-4 py-8">
                            {uploadingImage ? <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Image size={32} className="text-zinc-600" /><span className="text-zinc-500 text-sm">Rasm yuklash</span></>}
                          </label>
                        )}
                      </div>
                    </div>
                    <button type="submit" className="w-full py-4 bg-white text-black font-bold text-lg rounded-xl hover:bg-zinc-200 transition-colors mt-4">{isAdding ? "Qo'shish" : "Saqlash"}</button>
                  </form>
                </>
              )}

              {activeTab === 'faq' && (
                <>
                  <h2 className="text-2xl font-bold mb-8">{isAdding ? "Yangi Savol" : "Savolni Tahrirlash"}</h2>
                  <form onSubmit={isAdding ? handleAddFaq : handleUpdateFaq} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Savol</label>
                      <input required value={isAdding ? newFaq.q : editingFaq?.q} onChange={e => isAdding ? setNewFaq({...newFaq, q: e.target.value}) : setEditingFaq({...editingFaq!, q: e.target.value})} className="w-full p-4 bg-black border border-zinc-800 rounded-xl focus:border-white outline-none transition-colors" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Javob</label>
                      <textarea required value={isAdding ? newFaq.a : editingFaq?.a} onChange={e => isAdding ? setNewFaq({...newFaq, a: e.target.value}) : setEditingFaq({...editingFaq!, a: e.target.value})} className="w-full p-4 bg-black border border-zinc-800 rounded-xl focus:border-white outline-none transition-colors h-32 resize-none" />
                    </div>
                    <button type="submit" className="w-full py-4 bg-white text-black font-bold text-lg rounded-xl hover:bg-zinc-200 transition-colors mt-4">{isAdding ? "Qo'shish" : "Saqlash"}</button>
                  </form>
                </>
              )}

              {activeTab === 'process' && (
                <>
                  <h2 className="text-2xl font-bold mb-8">{isAdding ? "Yangi Bosqich" : "Bosqichni Tahrirlash"}</h2>
                  <form onSubmit={isAdding ? handleAddProcess : handleUpdateProcess} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Bosqich Raqami (01, 02...)</label>
                      <input required value={isAdding ? newProcess.step : editingProcess?.step} onChange={e => isAdding ? setNewProcess({...newProcess, step: e.target.value}) : setEditingProcess({...editingProcess!, step: e.target.value})} className="w-full p-4 bg-black border border-zinc-800 rounded-xl focus:border-white outline-none transition-colors" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Sarlavha</label>
                      <input required value={isAdding ? newProcess.title : editingProcess?.title} onChange={e => isAdding ? setNewProcess({...newProcess, title: e.target.value}) : setEditingProcess({...editingProcess!, title: e.target.value})} className="w-full p-4 bg-black border border-zinc-800 rounded-xl focus:border-white outline-none transition-colors" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Tavsif</label>
                      <textarea required value={isAdding ? newProcess.desc : editingProcess?.desc} onChange={e => isAdding ? setNewProcess({...newProcess, desc: e.target.value}) : setEditingProcess({...editingProcess!, desc: e.target.value})} className="w-full p-4 bg-black border border-zinc-800 rounded-xl focus:border-white outline-none transition-colors h-32 resize-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Rasm</label>
                      <div className="relative border-2 border-dashed rounded-xl p-4 text-center border-zinc-800 bg-black hover:border-zinc-600 transition-colors">
                        <input type="file" id="process-image-upload" className="hidden" accept="image/*" onChange={async (e) => {
                          if (e.target.files && e.target.files[0]) {
                            const url = await uploadImage(e.target.files[0]);
                            if (url) {
                              if (isAdding) setNewProcess(prev => ({ ...prev, image: url }));
                              else setEditingProcess(prev => ({ ...prev!, image: url }));
                              showToast("Rasm yuklandi", 'success');
                            }
                          }
                        }} disabled={uploadingImage} />
                        {(isAdding ? newProcess.image : editingProcess?.image) ? (
                          <div className="relative w-full aspect-video rounded-lg overflow-hidden group">
                            <img src={isAdding ? newProcess.image : editingProcess?.image} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-3">
                              <label htmlFor="process-image-upload" className="cursor-pointer px-4 py-2 bg-white text-black rounded-lg font-bold hover:bg-zinc-200 transition-colors flex items-center gap-2"><Edit2 size={16} /> O'zgartirish</label>
                            </div>
                          </div>
                        ) : (
                          <label htmlFor="process-image-upload" className="cursor-pointer flex flex-col items-center justify-center gap-4 py-8">
                            {uploadingImage ? <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Image size={32} className="text-zinc-600" /><span className="text-zinc-500 text-sm">Rasm yuklash</span></>}
                          </label>
                        )}
                      </div>
                    </div>
                    <button type="submit" className="w-full py-4 bg-white text-black font-bold text-lg rounded-xl hover:bg-zinc-200 transition-colors mt-4">{isAdding ? "Qo'shish" : "Saqlash"}</button>
                  </form>
                </>
              )}

              {activeTab === 'equipment' && (
                <>
                  <h2 className="text-2xl font-bold mb-8">{isAdding ? "Yangi Texnika Kategoriyasi" : "Kategoriyani Tahrirlash"}</h2>
                  <form onSubmit={isAdding ? handleAddEquipment : handleUpdateEquipment} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Kategoriya Nomi</label>
                      <input required value={isAdding ? newEquipment.title : editingEquipment?.title} onChange={e => isAdding ? setNewEquipment({...newEquipment, title: e.target.value}) : setEditingEquipment({...editingEquipment!, title: e.target.value})} className="w-full p-4 bg-black border border-zinc-800 rounded-xl focus:border-white outline-none transition-colors" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Texnikalar (Vergul bilan ajrating)</label>
                      <textarea required value={equipmentItemsInput} onChange={e => setEquipmentItemsInput(e.target.value)} className="w-full p-4 bg-black border border-zinc-800 rounded-xl focus:border-white outline-none transition-colors h-32 resize-none" placeholder="Sony A7S III, DJI Ronin..." />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Rasm</label>
                      <div className="relative border-2 border-dashed rounded-xl p-4 text-center border-zinc-800 bg-black hover:border-zinc-600 transition-colors">
                        <input type="file" id="equipment-image-upload" className="hidden" accept="image/*" onChange={async (e) => {
                          if (e.target.files && e.target.files[0]) {
                            const url = await uploadImage(e.target.files[0]);
                            if (url) {
                              if (isAdding) setNewEquipment(prev => ({ ...prev, image: url }));
                              else setEditingEquipment(prev => ({ ...prev!, image: url }));
                              showToast("Rasm yuklandi", 'success');
                            }
                          }
                        }} disabled={uploadingImage} />
                        {(isAdding ? newEquipment.image : editingEquipment?.image) ? (
                          <div className="relative w-full aspect-video rounded-lg overflow-hidden group">
                            <img src={isAdding ? newEquipment.image : editingEquipment?.image} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-3">
                              <label htmlFor="equipment-image-upload" className="cursor-pointer px-4 py-2 bg-white text-black rounded-lg font-bold hover:bg-zinc-200 transition-colors flex items-center gap-2"><Edit2 size={16} /> O'zgartirish</label>
                            </div>
                          </div>
                        ) : (
                          <label htmlFor="equipment-image-upload" className="cursor-pointer flex flex-col items-center justify-center gap-4 py-8">
                            {uploadingImage ? <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Image size={32} className="text-zinc-600" /><span className="text-zinc-500 text-sm">Rasm yuklash</span></>}
                          </label>
                        )}
                      </div>
                    </div>
                    <button type="submit" className="w-full py-4 bg-white text-black font-bold text-lg rounded-xl hover:bg-zinc-200 transition-colors mt-4">{isAdding ? "Qo'shish" : "Saqlash"}</button>
                  </form>
                </>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
