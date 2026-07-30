import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Smartphone,
  Sliders as SlidersIcon,
  HelpCircle,
  Settings,
  ShieldAlert,
  FileText,
  CheckCircle,
  TrendingUp,
  LogOut,
  Send,
  Image as ImageIcon,
  MessageSquare,
  Plus,
  Trash2,
  Edit2,
  Save,
  Check,
  Folder,
  Menu,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X
} from 'lucide-react';
import { Brand, Model, Slider, Testimonial, FAQ, Ticket, ChatMessage } from '../types';
import FileManager from './FileManager';

interface AdminPanelProps {
  onClose: () => void;
  lang: 'bn' | 'en';
}

export default function AdminPanel({ onClose, lang }: AdminPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');
  const [token, setToken] = useState('');

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<'tickets' | 'sliders' | 'brands' | 'faq' | 'testimonials' | 'settings' | 'files'>('tickets');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Stats State
  const [stats, setStats] = useState({ total: 0, new: 0, scheduled: 0, paid: 0, pickup: 0 });

  // Data States
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingImage, setIsSendingImage] = useState(false);
  
  // Sliders state
  const [sliders, setSliders] = useState<Slider[]>([]);
  
  // Brands/Models state
  const [brands, setBrands] = useState<Brand[]>([]);
  
  // FAQs state
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  
  // Testimonials state
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  
  // Settings/Deductions state
  const [deductions, setDeductions] = useState<Record<string, number>>({});
  const [waterPenalty, setWaterPenalty] = useState(0.5);
  const [floorPrice, setFloorPrice] = useState(300);
  const [chineseMinPrice, setChineseMinPrice] = useState(1000);

  // Edit/Add Forms state
  const [newBrandLabel, setNewBrandLabel] = useState('');
  const [newBrandId, setNewBrandId] = useState('');
  const [newModelLabel, setNewModelLabel] = useState('');
  const [newModelPrice, setNewModelPrice] = useState('');
  const [newModelRAM, setNewModelRAM] = useState('4');
  const [newModelROM, setNewModelROM] = useState('64');
  const [selectedBrandForModel, setSelectedBrandForModel] = useState('');

  // Editing state for Brands and Models
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
  const [editingBrandLabel, setEditingBrandLabel] = useState('');
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [editingModelLabel, setEditingModelLabel] = useState('');
  const [editingModelPrice, setEditingModelPrice] = useState('');
  const [editingModelRAM, setEditingModelRAM] = useState('4');
  const [editingModelROM, setEditingModelROM] = useState('64');

  const [newSlide, setNewSlide] = useState<Partial<Slider>>({
    eye_text: '',
    title_line1: '',
    title_line2: '',
    description: '',
    price_tag1: '',
    price_tag2: '',
    bg_color: '#e8f5e9,#f0fdf4',
    image_url: ''
  });

  const [newFaq, setNewFaq] = useState({ keywords: '', reply: '' });
  const [newTestimonial, setNewTestimonial] = useState({ name: '', message: '', rating: 5, image_url: '' });

  const adminChatBodyRef = useRef<HTMLDivElement>(null);
  const adminFileInputRef = useRef<HTMLInputElement>(null);

  // Authenticate Admin
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode })
      });
      const data = await res.json();
      if (data.success && data.token) {
        setToken(data.token);
        localStorage.setItem('gangre_admin_token', data.token);
        setIsAuthenticated(true);
      } else {
        setAuthError(data.error || 'Invalid Code');
      }
    } catch (err) {
      setAuthError('Connection failed');
    }
  };

  // Logout admin
  const handleLogout = () => {
    localStorage.removeItem('gangre_admin_token');
    setToken('');
    setIsAuthenticated(false);
  };

  // Check storage token on mount
  useEffect(() => {
    const saved = localStorage.getItem('gangre_admin_token');
    if (saved) {
      setToken(saved);
      setIsAuthenticated(true);
    }
  }, []);

  // General Fetch headers creator
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  const checkAuth = (res: Response) => {
    if (res.status === 401) {
      if (isAuthenticated) handleLogout();
      return false;
    }
    return true;
  };

  // Fetch Stats & Tickets
  const fetchTicketsAndStats = async () => {
    if (!isAuthenticated) return;
    try {
      const statsRes = await fetch('/api/get-stats', { headers: getHeaders() });
      if (!checkAuth(statsRes)) return;
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      const ticketsRes = await fetch('/api/get-tickets', { headers: getHeaders() });
      if (!checkAuth(ticketsRes)) return;
      if (ticketsRes.ok) {
        const ticketsData = await ticketsRes.json();
        setTickets(ticketsData);
        if (ticketsData.length > 0 && !selectedTicketId) {
          setSelectedTicketId(ticketsData[0].ticket_id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [isFetching, setIsFetching] = useState(false);
  const [dbStatus, setDbStatus] = useState<string>('checking...');

  // Fetch administrative configurations
  const fetchAdminData = async () => {
    if (!isAuthenticated) return;
    setIsFetching(true);
    try {
      const headers = getHeaders();
      const res = await fetch('/api/get-config', { headers });
      if (!checkAuth(res)) return;
      if (!res.ok) throw new Error('Failed to fetch admin config');
      const data = await res.json();
      
      console.log('Admin Data Fetched:', data);
      const fetchedBrands = Array.isArray(data.brands) ? data.brands : [];
      setBrands(fetchedBrands);
      
      const rawDeductions = data.deductions || {};
      if (Array.isArray(rawDeductions)) {
        setDeductions(rawDeductions.reduce((acc: any, curr: any) => {
          acc[curr.deduction_key || curr.damage_key] = parseFloat(curr.value || curr.percentage);
          return acc;
        }, {}));
      } else {
        setDeductions(rawDeductions);
      }
      
      setWaterPenalty(data.waterPenalty || 0.5);
      setFloorPrice(data.floor || 300);
      setChineseMinPrice(data.chineseMinPrice || 1000);

      // Fetch other data
      const [slidesRes, testRes, fullRes] = await Promise.all([
        fetch('/api/get-slides', { headers }),
        fetch('/api/get-testimonials', { headers }),
        fetch('/api/get-full-config')
      ]);

      if (slidesRes.ok) setSliders(await slidesRes.json());
      if (testRes.ok) setTestimonials(await testRes.json());
      if (fullRes.ok) {
        const full = await fullRes.json();
        setFaqs(full.faq || []);
      }
      setDbStatus('connected');
    } catch (e: any) {
      console.error('Fetch Admin Data Error:', e);
      setDbStatus('error: ' + e.message);
    } finally {
      setIsFetching(false);
    }
  };

  // Auto trigger fetching on state ready
  useEffect(() => {
    if (isAuthenticated) {
      fetchTicketsAndStats();
      fetchAdminData();
    }
  }, [isAuthenticated, activeTab]);

  // Handle Ticket Status Updates
  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const res = await fetch('/api/update-ticket', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ ticketId, status })
      });
      if (!checkAuth(res)) return;
      if (res.ok) {
        fetchTicketsAndStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch chat messages of selected ticket
  const fetchChatMessages = async () => {
    if (!selectedTicketId) return;
    try {
      const res = await fetch(`/api/get-chat?ticketId=${encodeURIComponent(selectedTicketId)}`, {
        headers: getHeaders()
      });
      if (!checkAuth(res)) return;
      if (res.ok) {
        const data = await res.json();
        setChatMessages(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Poll for active details thread chat messages
  useEffect(() => {
    if (selectedTicketId && activeTab === 'tickets') {
      fetchChatMessages();
      const interval = setInterval(fetchChatMessages, 4000);
      return () => clearInterval(interval);
    }
  }, [selectedTicketId, activeTab]);

  // Scroll to bottom on admin chat update
  useEffect(() => {
    if (adminChatBodyRef.current) {
      adminChatBodyRef.current.scrollTop = adminChatBodyRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendAdminChat = async () => {
    if (!chatInput.trim() || !selectedTicketId) return;
    const txt = chatInput.trim();
    setChatInput('');

    // Optimistic message
    const tempMsg: ChatMessage = {
      id: Date.now(),
      ticket_id: selectedTicketId,
      sender: 'admin',
      message: txt,
      image_url: null,
      is_read: true,
      created_at: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, tempMsg]);

    try {
      const res = await fetch('/api/send-chat', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          ticketId: selectedTicketId,
          message: txt,
          sender: 'admin'
        })
      });
      if (!checkAuth(res)) return;
      fetchChatMessages();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdminImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTicketId) return;

    setIsSendingImage(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('ticketId', selectedTicketId);
    formData.append('sender', 'admin');
    formData.append('message', '📷 diagnostic snapshot');

    try {
      const res = await fetch('/api/send-chat', {
        method: 'POST',
        headers: getHeaders(), // Use getHeaders for authorization
        body: formData
      });
      if (!checkAuth(res)) return;
      if (res.ok) {
        fetchChatMessages();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingImage(false);
      if (adminFileInputRef.current) {
        adminFileInputRef.current.value = '';
      }
    }
  };

  // Save Settings Config
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formattedDeductions = Object.entries(deductions).map(([key, val]) => ({
        damage_key: key,
        percentage: val
      }));

      const res = await fetch('/api/save-config', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          config: {
            waterPenalty,
            floor: floorPrice,
            chineseMinPrice,
            deductions
          }
        })
      });
      if (!checkAuth(res)) return;
      if (res.ok) {
        // Removed success alert as per user request
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddBrand = async () => {
    if (!newBrandLabel.trim() || !newBrandId.trim()) {
      alert(lang === 'bn' ? 'দয়া করে সব ঘর পূরণ করুন' : 'Please fill all fields');
      return;
    }
    
    // Validate ID: only letters, numbers, and dashes
    if (!/^[a-z0-9-]+$/.test(newBrandId.trim().toLowerCase())) {
      alert(lang === 'bn' ? 'ব্র্যান্ড আইডি অবশ্যই ছোট হাতের অক্ষর ও নম্বর হতে হবে' : 'Brand ID must be lowercase letters and numbers only');
      return;
    }

    const brandId = newBrandId.trim().toLowerCase();
    
    // Check if ID already exists
    if (brands.some(b => (b.id || (b as any).brand_id) === brandId)) {
      alert(lang === 'bn' ? 'এই আইডি ইতিমধ্যে আছে' : 'Brand ID already exists');
      return;
    }

    const newBrand: Brand = {
      id: brandId,
      brand_id: brandId,
      label: newBrandLabel.trim(),
      models: [],
      is_active: true,
      sort_order: brands.length
    };
    
    const updated = [...brands, newBrand];
    
    try {
      const res = await fetch('/api/save-brands', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ brands: updated })
      });
      if (!checkAuth(res)) return;
      if (res.ok) {
        setNewBrandId('');
        setNewBrandLabel('');
        await fetchAdminData();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error || 'Failed to save brand'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Network error while adding brand');
    }
  };

  const handleDeleteBrand = async (brandId: string) => {
    if (!brandId) return;
    
    // Improved confirmation message in both languages
    const confirmMsg = lang === 'bn' 
      ? `আপনি কি নিশ্চিত যে আপনি এই ব্র্যান্ডটি (${brandId}) মুছতে চান? এর ফলে এই ব্র্যান্ডের অধীনে থাকা সকল মডেলও মুছে যাবে।`
      : `Are you sure you want to delete this brand (${brandId})? This will also delete all models under this brand.`;
      
    if (!window.confirm(confirmMsg)) return;
    
    // Robust filtering using both possible ID keys
    const updated = brands.filter(b => {
      const b_id = b.brand_id || b.id || (b as any).brand_id;
      return b_id !== brandId;
    });

    try {
      const res = await fetch('/api/save-brands', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ brands: updated })
      });
      
      if (!checkAuth(res)) return;
      
      if (res.ok) {
        await fetchAdminData();
        // Feedback is important
        alert(lang === 'bn' ? 'ব্র্যান্ড এবং এর মডেলগুলো সফলভাবে মোছা হয়েছে!' : 'Brand and its models deleted successfully!');
      } else {
        const err = await res.json();
        alert(`Error: ${err.error || 'Failed to delete brand'}`);
      }
    } catch (e: any) {
      console.error('Delete brand error:', e);
      alert(`Network error: ${e.message}`);
    }
  };

  const handleAddModel = async () => {
    if (!newModelLabel.trim() || !newModelPrice || !selectedBrandForModel) {
      alert(lang === 'bn' ? 'দয়া করে সব ঘর পূরণ করুন এবং ব্র্যান্ড সিলেক্ট করুন' : 'Please fill all fields and select a brand');
      return;
    }
    
    const mId = `model_${Date.now()}`;
    const updated = brands.map(b => {
      const bId = b.id || (b as any).brand_id;
      const isMatch = bId === selectedBrandForModel;
      if (isMatch) {
        const modelsList = b.models || [];
        const newM: Model = {
          id: mId,
          model_id: mId,
          brand_id: bId,
          label: newModelLabel.trim(),
          price: parseFloat(newModelPrice),
          base_ram: parseInt(newModelRAM) || 4,
          base_rom: parseInt(newModelROM) || 64,
          is_active: true
        };
        return { ...b, models: [...modelsList, newM] };
      }
      return b;
    });

    try {
      const res = await fetch('/api/save-brands', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ brands: updated })
      });
      if (!checkAuth(res)) return;
      if (res.ok) {
        setNewModelLabel('');
        setNewModelPrice('');
        setNewModelRAM('4');
        setNewModelROM('64');
        await fetchAdminData();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error || 'Failed to save model'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Network error while adding model');
    }
  };

  const handleUpdateBrand = async () => {
    if (!editingBrandId || !editingBrandLabel.trim()) return;
    const updated = brands.map(b => {
      if (b.id === editingBrandId || (b as any).brand_id === editingBrandId) {
        return { ...b, label: editingBrandLabel.trim() };
      }
      return b;
    });
    try {
      const res = await fetch('/api/save-brands', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ brands: updated })
      });
      if (!checkAuth(res)) return;
      if (res.ok) {
        setEditingBrandId(null);
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateModel = async () => {
    if (!editingModelId) return;
    const updated = brands.map(b => {
      const models = (b.models || []).map(m => {
        if (m.id === editingModelId || (m as any).model_id === editingModelId) {
          return {
            ...m,
            label: editingModelLabel.trim(),
            price: parseFloat(editingModelPrice) || 0,
            base_ram: parseInt(editingModelRAM) || 4,
            base_rom: parseInt(editingModelROM) || 64
          };
        }
        return m;
      });
      return { ...b, models };
    });
    try {
      const res = await fetch('/api/save-brands', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ brands: updated })
      });
      if (!checkAuth(res)) return;
      if (res.ok) {
        setEditingModelId(null);
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteModel = async (brandId: string, modelId: string) => {
    if (!brandId || !modelId) return;
    
    const confirmMsg = lang === 'bn'
      ? `আপনি কি নিশ্চিত যে আপনি এই মডেলটি (${modelId}) মুছতে চান?`
      : `Are you sure you want to delete this model (${modelId})?`;
      
    if (!window.confirm(confirmMsg)) return;

    const updated = brands.map(b => {
      const b_id = b.id || b.brand_id || (b as any).brand_id;
      if (b_id === brandId) {
        const modelsList = b.models || [];
        return {
          ...b,
          models: modelsList.filter(m => {
            const m_id = m.model_id || m.id || (m as any).model_id;
            return m_id !== modelId;
          })
        };
      }
      return b;
    });

    try {
      const res = await fetch('/api/save-brands', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ brands: updated })
      });
      
      if (!checkAuth(res)) return;
      
      if (res.ok) {
        await fetchAdminData();
        alert(lang === 'bn' ? 'মডেলটি সফলভাবে মোছা হয়েছে!' : 'Model deleted successfully!');
      } else {
        const err = await res.json();
        alert(`Error: ${err.error || 'Failed to delete model'}`);
      }
    } catch (e: any) {
      console.error('Delete model error:', e);
      alert(`Network error: ${e.message}`);
    }
  };

  // Slider Management
  const handleAddSlide = async () => {
    const s: Slider = {
      sort_order: sliders.length,
      image_url: newSlide.image_url || '',
      eye_text: newSlide.eye_text || '',
      title_line1: newSlide.title_line1 || '',
      title_line2: newSlide.title_line2 || '',
      description: newSlide.description || '',
      price_tag1: newSlide.price_tag1 || '',
      price_tag2: newSlide.price_tag2 || '',
      bg_color: newSlide.bg_color || '#e8f5e9,#f0fdf4'
    };
    const updated = [...sliders, s];
    
    try {
      const res = await fetch('/api/save-slides', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ slides: updated })
      });
      if (!checkAuth(res)) return;
      if (res.ok) {
        setNewSlide({
          eye_text: '',
          title_line1: '',
          title_line2: '',
          description: '',
          price_tag1: '',
          price_tag2: '',
          bg_color: '#e8f5e9,#f0fdf4',
          image_url: ''
        });
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSlide = async (idx: number) => {
    const updated = sliders.filter((_, i) => i !== idx);
    try {
      const res = await fetch('/api/save-slides', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ slides: updated })
      });
      if (!checkAuth(res)) return;
      if (res.ok) {
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Testimonials Actions
  const handleAddTestimonial = async () => {
    if (!newTestimonial.name.trim() || !newTestimonial.message.trim()) return;
    const tItem: Testimonial = {
      name: newTestimonial.name.trim(),
      message: newTestimonial.message.trim(),
      rating: newTestimonial.rating,
      image_url: (newTestimonial as any).image_url || null,
      sort_order: testimonials.length
    };
    const updated = [...testimonials, tItem];
    try {
      const res = await fetch('/api/save-testimonials', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ testimonials: updated })
      });
      if (!checkAuth(res)) return;
      if (res.ok) {
        setNewTestimonial({ name: '', message: '', rating: 5, image_url: '' } as any);
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTestimonial = async (idx: number) => {
    const updated = testimonials.filter((_, i) => i !== idx);
    try {
      const res = await fetch('/api/save-testimonials', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ testimonials: updated })
      });
      if (!checkAuth(res)) return;
      if (res.ok) {
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // FAQ Actions
  const handleAddFaq = async () => {
    if (!newFaq.keywords.trim() || !newFaq.reply.trim()) return;
    const keyArray = newFaq.keywords.split(',').map(s => s.trim()).filter(Boolean);
    const newF: FAQ = {
      id: Date.now(),
      sort_order: faqs.length,
      keywords: keyArray,
      reply: newFaq.reply.trim(),
      quickReplies: [keyArray[0] || '']
    };
    const updated = [...faqs, newF];
    try {
      const res = await fetch('/api/save-faq', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ faq: updated })
      });
      if (res.ok) {
        setNewFaq({ keywords: '', reply: '' });
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteFaq = async (idx: number) => {
    const updated = faqs.filter((_, i) => i !== idx);
    try {
      const res = await fetch('/api/save-faq', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ faq: updated })
      });
      if (!checkAuth(res)) return;
      if (res.ok) {
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Return non-authenticated UI passcode form
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex items-center justify-center p-6 font-sans">
        <form onSubmit={handleLogin} className="bg-gray-50 border border-gray-100 p-8 rounded-2xl w-full max-w-sm shadow-xl space-y-4">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="bg-green-100 p-3 rounded-full text-green-600">
              <ShieldAlert size={32} />
            </div>
            <h2 className="font-extrabold text-xl text-gray-950">
              {lang === 'bn' ? 'অ্যাডমিন প্যানেল লগইন' : 'Admin Panel Login'}
            </h2>
            <p className="text-xs text-gray-400">
              {lang === 'bn' ? 'অ্যাডমিন পাসকোড টাইপ করুন' : 'Enter the security passcode to access panel'}
            </p>
          </div>

          <div>
            <input
              type="password"
              placeholder={lang === 'bn' ? 'পাসকোড টাইপ করুন (default: admin123)' : 'Enter Passcode'}
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="w-full bg-white border border-gray-200 text-gray-800 text-xs px-4 py-3 rounded-xl outline-none focus:border-green-400 transition-all font-mono text-center font-bold tracking-widest"
              required
            />
          </div>

          {authError && (
            <div className="text-red-500 text-xs font-semibold text-center py-1">
              ❌ {authError}
            </div>
          )}

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-bold text-xs rounded-xl cursor-pointer bg-white text-center hover:bg-gray-50"
            >
              {lang === 'bn' ? 'বন্ধ করুন' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
            >
              {lang === 'bn' ? 'প্রবেশ করুন' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  const activeTicket = tickets.find(t => t.ticket_id === selectedTicketId);

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col md:flex-row font-sans overflow-hidden">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-50 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-[60] md:relative md:z-auto
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'}
        w-72 bg-gray-50 border-r border-gray-100 flex flex-col justify-between flex-shrink-0 transition-all duration-300 ease-in-out
      `}>
        <div className="relative">
          {/* Brand header */}
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white/50 h-[73px]">
            <div className={`flex items-center gap-2 ${isSidebarCollapsed ? 'md:justify-center w-full' : ''}`}>
              <span className="w-2 h-2 bg-green-500 rounded-full shrink-0"></span>
              {(!isSidebarCollapsed || isMobileMenuOpen) && (
                <span className="font-black text-lg text-gray-950 whitespace-nowrap overflow-hidden">GANGRE ADMIN</span>
              )}
            </div>
            
            {/* Desktop Collapse Button */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden md:flex absolute -right-3 top-8 bg-white border border-gray-100 rounded-full p-1 shadow-sm hover:bg-gray-50 cursor-pointer z-10"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isSidebarCollapsed ? <ChevronRight size={14} className="text-gray-500" /> : <ChevronLeft size={14} className="text-gray-500" />}
            </button>

            {/* Mobile Exit Button */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-lg md:hidden"
            >
              <X size={20} />
            </button>
          </div>

          {/* Nav Items list */}
          <nav className="p-4 space-y-1">
            <button
              onClick={() => {
                setActiveTab('tickets');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center transition-all cursor-pointer ${
                isSidebarCollapsed ? 'md:justify-center' : 'gap-3.5'
              } ${
                activeTab === 'tickets' ? 'bg-green-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              title={isSidebarCollapsed ? (lang === 'bn' ? 'টিকিট ও চ্যাট' : 'Tickets & Chats') : ''}
            >
              <FileText size={16} className="shrink-0" />
              {(!isSidebarCollapsed || isMobileMenuOpen) && <span>{lang === 'bn' ? 'টিকিট ও চ্যাট' : 'Tickets & Chats'}</span>}
            </button>

            <button
              onClick={() => {
                setActiveTab('sliders');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center transition-all cursor-pointer ${
                isSidebarCollapsed ? 'md:justify-center' : 'gap-3.5'
              } ${
                activeTab === 'sliders' ? 'bg-green-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              title={isSidebarCollapsed ? (lang === 'bn' ? 'স্লাইডার সেটিংস' : 'Banners & Sliders') : ''}
            >
              <SlidersIcon size={16} className="shrink-0" />
              {(!isSidebarCollapsed || isMobileMenuOpen) && <span>{lang === 'bn' ? 'স্লাইডার সেটিংস' : 'Banners & Sliders'}</span>}
            </button>

            <button
              onClick={() => {
                setActiveTab('brands');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center transition-all cursor-pointer ${
                isSidebarCollapsed ? 'md:justify-center' : 'gap-3.5'
              } ${
                activeTab === 'brands' ? 'bg-green-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              title={isSidebarCollapsed ? (lang === 'bn' ? 'ব্র্যান্ড ও মডেল' : 'Brands & Models') : ''}
            >
              <Smartphone size={16} className="shrink-0" />
              {(!isSidebarCollapsed || isMobileMenuOpen) && <span>{lang === 'bn' ? 'ব্র্যান্ড ও মডেল' : 'Brands & Models'}</span>}
            </button>

            <button
              onClick={() => {
                setActiveTab('testimonials');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center transition-all cursor-pointer ${
                isSidebarCollapsed ? 'md:justify-center' : 'gap-3.5'
              } ${
                activeTab === 'testimonials' ? 'bg-green-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              title={isSidebarCollapsed ? (lang === 'bn' ? 'টেস্টিমোনিয়াল' : 'Reviews & Feedback') : ''}
            >
              <Users size={16} className="shrink-0" />
              {(!isSidebarCollapsed || isMobileMenuOpen) && <span>{lang === 'bn' ? 'টেস্টিমোনিয়াল' : 'Reviews & Feedback'}</span>}
            </button>

            <button
              onClick={() => {
                setActiveTab('faq');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center transition-all cursor-pointer ${
                isSidebarCollapsed ? 'md:justify-center' : 'gap-3.5'
              } ${
                activeTab === 'faq' ? 'bg-green-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              title={isSidebarCollapsed ? (lang === 'bn' ? 'জিজ্ঞাসা (FAQ)' : 'FAQ Triggers') : ''}
            >
              <HelpCircle size={16} className="shrink-0" />
              {(!isSidebarCollapsed || isMobileMenuOpen) && <span>{lang === 'bn' ? 'জিজ্ঞাসা (FAQ)' : 'FAQ Triggers'}</span>}
            </button>

            <button
              onClick={() => {
                setActiveTab('settings');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center transition-all cursor-pointer ${
                isSidebarCollapsed ? 'md:justify-center' : 'gap-3.5'
              } ${
                activeTab === 'settings' ? 'bg-green-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              title={isSidebarCollapsed ? (lang === 'bn' ? 'মূল্য ও রেট সেটিংস' : 'Valuation Penalties') : ''}
            >
              <Settings size={16} className="shrink-0" />
              {(!isSidebarCollapsed || isMobileMenuOpen) && <span>{lang === 'bn' ? 'মূল্য ও রেট সেটিংস' : 'Valuation Penalties'}</span>}
            </button>

            <button
              onClick={() => {
                setActiveTab('files');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center transition-all cursor-pointer ${
                isSidebarCollapsed ? 'md:justify-center' : 'gap-3.5'
              } ${
                activeTab === 'files' ? 'bg-green-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              title={isSidebarCollapsed ? (lang === 'bn' ? 'ফাইল ম্যানেজার' : 'File Manager') : ''}
            >
              <Folder size={16} className="shrink-0" />
              {(!isSidebarCollapsed || isMobileMenuOpen) && <span>{lang === 'bn' ? 'ফাইল ম্যানেজার' : 'File Manager'}</span>}
            </button>
          </nav>
        </div>

        {/* Footer actions inside sidebar */}
        <div className={`p-4 border-t border-gray-100 space-y-2 bg-white/50 ${isSidebarCollapsed ? 'md:items-center' : ''}`}>
          <button
            onClick={onClose}
            className={`w-full py-2 text-xs border border-gray-200 text-gray-700 font-bold rounded-lg cursor-pointer hover:bg-gray-50 flex items-center justify-center gap-2 bg-white ${isSidebarCollapsed ? 'md:px-0' : ''}`}
            title={isSidebarCollapsed ? (lang === 'bn' ? 'পাবলিক পেজে ফেরত' : 'Back to Public') : ''}
          >
            {(!isSidebarCollapsed || isMobileMenuOpen) ? (lang === 'bn' ? 'পাবলিক পেজে ফেরত' : 'Back to Public') : <LogOut size={13} className="rotate-180" />}
          </button>
          <button
            onClick={handleLogout}
            className={`w-full py-2 text-xs bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg cursor-pointer flex items-center justify-center gap-2 ${isSidebarCollapsed ? 'md:px-0' : ''}`}
            title={isSidebarCollapsed ? (lang === 'bn' ? 'লগআউট' : 'Logout') : ''}
          >
            <LogOut size={13} />
            {(!isSidebarCollapsed || isMobileMenuOpen) && <span>{lang === 'bn' ? 'লগআউট' : 'Logout'}</span>}
          </button>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <main className="flex-1 bg-gray-50 flex flex-col overflow-hidden">
        
        {/* Top summary stats dashboard panel */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-4">
            {/* Mobile Hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 hover:bg-gray-50 rounded-lg text-gray-600 cursor-pointer"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="font-extrabold text-xl text-gray-900 uppercase tracking-tight flex items-center gap-2">
                {activeTab === 'tickets' && (lang === 'bn' ? 'গ্রাহক টিকিট ও লাইভ সাপোর্ট' : 'Customer Tickets & Chats')}
                {activeTab === 'sliders' && (lang === 'bn' ? 'মোবাইল ব্যানার সেটিংস' : 'Banners & Carousels')}
                {activeTab === 'brands' && (lang === 'bn' ? 'ব্র্যান্ড ও মডেল ডাটাবেজ' : 'Brand & Model Database')}
                {activeTab === 'testimonials' && (lang === 'bn' ? 'গ্রাহক প্রতিক্রিয়া ব্যবস্থাপনা' : 'Customer Testimonial Reviews')}
                {activeTab === 'faq' && (lang === 'bn' ? 'অটো-সাপোর্ট FAQ ট্রিগার' : 'Auto FAQ Response Keywords')}
                {activeTab === 'settings' && (lang === 'bn' ? 'মূল্য ও ত্রুটির পেনাল্টি রেট' : 'Valuation Rates & Penalties')}
                {activeTab === 'files' && (lang === 'bn' ? 'সার্ভার ফাইল ম্যানেজার' : 'Server File Manager')}
                
                {isAuthenticated && (
                  <button 
                    onClick={fetchAdminData}
                    className={`p-1.5 text-gray-300 hover:text-green-500 transition-colors cursor-pointer rounded-full hover:bg-gray-50 ${isFetching ? 'animate-spin text-green-500' : ''}`}
                    title="Refresh Data"
                  >
                    <RefreshCw size={14} />
                  </button>
                )}
              </h1>
            <p className="text-xs text-gray-400 font-medium font-sans">
              Gangre Administration Workspace · July 2026
            </p>
          </div>
        </div>

        {/* Mini Stats tracker */}
          <div className="flex flex-wrap gap-2 text-[11px] font-bold font-mono">
            <span className="bg-gray-100 text-gray-800 px-2.5 py-1 rounded-lg">TOTAL: {stats.total}</span>
            <span className="bg-red-50 text-red-700 px-2.5 py-1 rounded-lg">NEW: {stats.new}</span>
            <span className="bg-yellow-50 text-yellow-700 px-2.5 py-1 rounded-lg">SCHED: {stats.scheduled}</span>
            <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-lg">PAID: {stats.paid}</span>
          </div>
        </header>

        {/* Content body based on active tabs */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          
          {/* TAB 1: TICKETS & CHAT split layout */}
          {activeTab === 'tickets' && (
            <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Tickets List Column */}
              <div className="lg:col-span-5 bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col h-[500px] lg:h-full overflow-hidden">
                <div className="p-4 border-b border-gray-100 font-bold text-xs text-gray-500 uppercase tracking-wider bg-gray-50/50">
                  {lang === 'bn' ? 'টিকেট তালিকা' : 'Tickets Queue'} ({tickets.length})
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                  {tickets.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-xs">
                      No tickets submitted yet.
                    </div>
                  ) : (
                    tickets.map(t => (
                      <button
                        key={t.ticket_id}
                        onClick={() => setSelectedTicketId(t.ticket_id)}
                        className={`w-full p-4 text-left flex flex-col gap-1.5 transition-all outline-none border-l-4 hover:bg-gray-50/50 cursor-pointer ${
                          selectedTicketId === t.ticket_id
                            ? 'bg-green-50/40 border-l-green-500'
                            : 'border-l-transparent'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-mono font-bold text-[11px] text-gray-500">{t.ticket_id}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            t.status === 'New' ? 'bg-red-50 text-red-700 border border-red-200' :
                            t.status === 'Scheduled' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                            t.status === 'Pickup' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            'bg-green-50 text-green-700 border border-green-200'
                          }`}>
                            {t.status}
                          </span>
                        </div>
                        <h4 className="font-bold text-gray-950 text-sm font-sans">{t.device}</h4>
                        <div className="flex justify-between text-[11px] text-gray-400 font-medium">
                          <span>{t.name || 'Anonymous'} ({t.phone || 'No phone'})</span>
                          <span className="text-green-600 font-bold">{t.estimate}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Chat Thread Details Column */}
              <div className="lg:col-span-7 bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col h-[550px] lg:h-full overflow-hidden">
                {activeTicket ? (
                  <>
                    {/* Ticket Details summary inside chat column */}
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 font-mono">{activeTicket.ticket_id}</span>
                        <h3 className="font-extrabold text-sm text-gray-950 font-sans">{activeTicket.device}</h3>
                        <p className="text-xs text-gray-500 font-medium">
                          👤 {activeTicket.name} · 📞 <a href={`tel:${activeTicket.phone}`} className="text-green-600 hover:underline">{activeTicket.phone}</a>
                        </p>
                        {activeTicket.address && (
                          <p className="text-[11px] text-gray-400 font-medium">
                            📍 {activeTicket.address}
                          </p>
                        )}
                        {activeTicket.tags && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {activeTicket.tags.split(',').map(tg => (
                              <span key={tg} className="text-[9px] font-bold bg-red-50 text-red-700 px-2 py-0.5 rounded border border-red-100">
                                {tg}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Status selectors */}
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <span className="text-[10px] font-extrabold text-gray-400 text-right uppercase tracking-wider">
                          Change Status
                        </span>
                        <div className="flex gap-1">
                          {['New', 'Scheduled', 'Pickup', 'Paid'].map(st => (
                            <button
                              key={st}
                              onClick={() => updateTicketStatus(activeTicket.ticket_id, st)}
                              className={`px-2.5 py-1 rounded text-[10px] font-extrabold cursor-pointer transition-all border ${
                                activeTicket.status === st
                                  ? 'bg-green-500 text-white border-green-600 shadow-sm'
                                  : 'bg-white hover:bg-gray-50 text-gray-600 border-gray-200'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                        <div className="text-right text-green-600 font-extrabold text-sm pt-1">
                          Estimate: {activeTicket.estimate}
                        </div>
                      </div>
                    </div>

                    {/* Chat messaging logs frame */}
                    <div ref={adminChatBodyRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                      {chatMessages.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 text-xs font-semibold">
                          No messages with customer yet. Say Hello!
                        </div>
                      ) : (
                        chatMessages.map(m => (
                          <div
                            key={m.id}
                            className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`px-3 py-2 rounded-lg max-w-[85%] text-xs shadow-sm ${
                              m.sender === 'admin'
                                ? 'bg-green-500 text-white rounded-tr-none'
                                : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                            }`}>
                              {m.message && <p className="leading-relaxed whitespace-pre-line">{m.message}</p>}
                              {m.image_url && (
                                <img
                                  src={m.image_url}
                                  alt="Attachment"
                                  className="mt-1.5 max-w-[180px] rounded border border-gray-100"
                                  referrerPolicy="no-referrer"
                                />
                              )}
                              <span className={`block text-[9px] mt-1 text-right ${m.sender === 'admin' ? 'text-green-100' : 'text-gray-400'}`}>
                                {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>
                          </div>
                        ))
                      )}

                      {isSendingImage && (
                        <div className="flex justify-end">
                          <div className="bg-green-400 text-white px-3 py-2 rounded-lg rounded-tr-none text-xs flex items-center gap-1.5 shadow-sm">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                            Uploading diagnositic image...
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Input message footer */}
                    <div className="p-3 border-t border-gray-100 bg-white flex gap-2">
                      <input
                        type="file"
                        ref={adminFileInputRef}
                        onChange={handleAdminImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        onClick={() => adminFileInputRef.current?.click()}
                        className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                        title="Upload Snapshot"
                      >
                        <ImageIcon size={18} />
                      </button>
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSendAdminChat();
                        }}
                        placeholder="Type reply to client..."
                        className="flex-1 bg-gray-50 border border-gray-200 text-gray-800 text-xs px-3.5 py-2.5 rounded-lg outline-none focus:border-green-400 focus:bg-white transition-all"
                      />
                      <button
                        onClick={handleSendAdminChat}
                        className="bg-green-500 hover:bg-green-600 text-white p-2.5 rounded-lg transition-colors flex items-center justify-center cursor-pointer shadow"
                      >
                        <Send size={15} />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-gray-400 text-xs font-semibold">
                    Select a ticket from the left queue to respond.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SLIDERS */}
          {activeTab === 'sliders' && (
            <div className="space-y-6 max-w-4xl">
              {/* Add form */}
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-900 text-sm font-sans border-b border-gray-50 pb-2">
                  Add New Banner Slide
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                  <div>
                    <label className="block text-gray-500 mb-1 font-bold">Kicker Eye Catcher</label>
                    <input
                      type="text"
                      placeholder="e.g. ঈদ অফার"
                      value={newSlide.eye_text || ''}
                      onChange={(e) => setNewSlide({ ...newSlide, eye_text: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg outline-none focus:border-green-400"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-1 font-bold">Banner Title Line 1</label>
                    <input
                      type="text"
                      placeholder="e.g. পুরনো মোবাইল"
                      value={newSlide.title_line1 || ''}
                      onChange={(e) => setNewSlide({ ...newSlide, title_line1: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg outline-none focus:border-green-400"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-1 font-bold">Banner Title Line 2 (Colored)</label>
                    <input
                      type="text"
                      placeholder="e.g. বিক্রি করুন সঠিক দামে"
                      value={newSlide.title_line2 || ''}
                      onChange={(e) => setNewSlide({ ...newSlide, title_line2: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg outline-none focus:border-green-400"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-1 font-bold">Price Tag Top Left</label>
                    <input
                      type="text"
                      placeholder="e.g. ৳ সর্বোচ্চ দাম"
                      value={newSlide.price_tag1 || ''}
                      onChange={(e) => setNewSlide({ ...newSlide, price_tag1: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg outline-none focus:border-green-400"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-1 font-bold">Price Tag Bottom Right</label>
                    <input
                      type="text"
                      placeholder="e.g. ফ্রি পিকআপ"
                      value={newSlide.price_tag2 || ''}
                      onChange={(e) => setNewSlide({ ...newSlide, price_tag2: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg outline-none focus:border-green-400"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-1 font-bold">Unsplash Image URL / Link</label>
                    <input
                      type="text"
                      placeholder="Image link URL"
                      value={newSlide.image_url || ''}
                      onChange={(e) => setNewSlide({ ...newSlide, image_url: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg outline-none focus:border-green-400 font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-gray-500 mb-1 font-bold">Description Details</label>
                    <textarea
                      placeholder="Banner description..."
                      value={newSlide.description || ''}
                      onChange={(e) => setNewSlide({ ...newSlide, description: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg outline-none focus:border-green-400 h-16"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddSlide}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Save & Append Slide
                </button>
              </div>

              {/* Slider lists */}
              <div className="space-y-4">
                <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider font-sans">
                  Active Banners List
                </h4>
                {sliders.map((s, idx) => (
                  <div key={idx} className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm flex justify-between items-center gap-4">
                    <div className="flex gap-4 items-center">
                      {s.image_url ? (
                        <img src={s.image_url} className="w-16 h-12 object-contain rounded bg-gray-50" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-16 h-12 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">No Image</div>
                      )}
                      <div>
                        <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">{s.eye_text}</span>
                        <h4 className="font-bold text-sm text-gray-950">{s.title_line1} {s.title_line2}</h4>
                        <p className="text-xs text-gray-400 truncate max-w-md">{s.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteSlide(idx)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-lg cursor-pointer transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: BRANDS */}
          {activeTab === 'brands' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start max-w-6xl">
              {/* Brands Controls Column */}
              <div className="space-y-6">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                  <h3 className="font-bold text-gray-900 text-sm font-sans border-b border-gray-50 pb-2">
                    Create New Brand
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-gray-500 font-semibold mb-1">Brand ID (Slug)</label>
                      <input
                        type="text"
                        placeholder="e.g. oppo"
                        value={newBrandId}
                        onChange={(e) => setNewBrandId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg outline-none focus:border-green-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-500 font-semibold mb-1">Brand label name</label>
                      <input
                        type="text"
                        placeholder="e.g. Samsung"
                        value={newBrandLabel}
                        onChange={(e) => setNewBrandLabel(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg outline-none focus:border-green-400"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleAddBrand}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1"
                  >
                    <Plus size={14} /> Add Brand
                  </button>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                  <h3 className="font-bold text-gray-900 text-sm font-sans border-b border-gray-50 pb-2">
                    Create New Phone Model
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-gray-500 font-semibold mb-1">Select Brand</label>
                      <select
                        value={selectedBrandForModel}
                        onChange={(e) => setSelectedBrandForModel(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg outline-none focus:border-green-400 font-sans"
                      >
                        <option value="">— Select Brand —</option>
                        {brands.map((b, bIdx) => (
                          <option key={`${b.id || (b as any).brand_id}-${bIdx}`} value={b.id || (b as any).brand_id}>{b.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-gray-500 font-semibold mb-1">Model Label Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Galaxy S24 Ultra"
                          value={newModelLabel}
                          onChange={(e) => setNewModelLabel(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg outline-none focus:border-green-400"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-500 font-semibold mb-1">Base Valuation Price (৳)</label>
                        <input
                          type="number"
                          placeholder="e.g. 52000"
                          value={newModelPrice}
                          onChange={(e) => setNewModelPrice(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg outline-none focus:border-green-400 font-mono"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-gray-500 font-semibold mb-1">Base RAM (GB)</label>
                        <input
                          type="number"
                          placeholder="4"
                          value={newModelRAM}
                          onChange={(e) => setNewModelRAM(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg outline-none focus:border-green-400 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-500 font-semibold mb-1">Base Storage (GB)</label>
                        <input
                          type="number"
                          placeholder="64"
                          value={newModelROM}
                          onChange={(e) => setNewModelROM(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg outline-none focus:border-green-400 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleAddModel}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1"
                  >
                    <Plus size={14} /> Add Model
                  </button>
                </div>
              </div>

              {/* Brands & Models display tree column */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider font-sans flex justify-between items-center">
                  Active Brand Directory Tree
                  <span className="text-[10px] text-gray-400 font-mono">Status: {dbStatus}</span>
                </h3>
                
                {brands.length === 0 && (
                  <div className="bg-white border border-dashed border-gray-200 rounded-xl p-8 text-center">
                    <Smartphone className="mx-auto text-gray-200 mb-2" size={32} />
                    <p className="text-gray-400 text-xs italic">No brands added yet</p>
                  </div>
                )}

                {brands.map((b, bIdx) => {
                  const bId = b.id || (b as any).brand_id;
                  const isEditingBrand = editingBrandId === bId;
                  
                  return (
                    <div key={`${bId}-${bIdx}`} className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                        {isEditingBrand ? (
                          <div className="flex items-center gap-2 flex-1 mr-4">
                            <input
                              type="text"
                              value={editingBrandLabel}
                              onChange={(e) => setEditingBrandLabel(e.target.value)}
                              className="bg-white border border-gray-300 rounded px-2 py-1 text-sm flex-1 outline-none focus:border-green-500"
                              autoFocus
                            />
                            <button onClick={handleUpdateBrand} className="text-green-600 p-1 cursor-pointer"><Save size={16}/></button>
                            <button onClick={() => setEditingBrandId(null)} className="text-gray-400 p-1 cursor-pointer"><X size={16}/></button>
                          </div>
                        ) : (
                          <span className="font-bold text-sm text-gray-900 flex items-center gap-2">
                            {b.label} 
                            <span className="font-mono text-xs text-gray-400">({bId})</span>
                            <button 
                              onClick={() => {
                                setEditingBrandId(bId);
                                setEditingBrandLabel(b.label);
                              }}
                              className="text-gray-300 hover:text-blue-500 transition-colors cursor-pointer"
                            >
                              <Edit2 size={12} />
                            </button>
                          </span>
                        )}
                        
                        {!isEditingBrand && (
                          <button
                            onClick={() => handleDeleteBrand(bId)}
                            className="text-red-400 hover:text-red-600 p-1.5 rounded-lg cursor-pointer transition-all hover:bg-red-50"
                            title={lang === 'bn' ? 'ব্র্যান্ড মুছুন' : 'Delete Brand'}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      <div className="divide-y divide-gray-50 max-h-56 overflow-y-auto">
                        {(b.models || []).length === 0 ? (
                          <div className="p-3 text-center text-gray-400 text-xs">No models in this brand.</div>
                        ) : (
                          b.models?.map((m, mIdx) => {
                            const mId = m.id || (m as any).model_id;
                            const isEditingModel = editingModelId === mId;
                            
                            return (
                              <div key={`${mId}-${mIdx}`} className="p-3 flex justify-between items-center text-xs font-medium">
                                {isEditingModel ? (
                                  <div className="flex flex-col gap-2 flex-1 mr-4">
                                    <input
                                      type="text"
                                      value={editingModelLabel}
                                      onChange={(e) => setEditingModelLabel(e.target.value)}
                                      className="bg-gray-50 border border-gray-300 rounded px-2 py-1 outline-none focus:border-green-500"
                                      placeholder="Model Name"
                                    />
                                    <div className="grid grid-cols-3 gap-1">
                                      <input
                                        type="number"
                                        value={editingModelPrice}
                                        onChange={(e) => setEditingModelPrice(e.target.value)}
                                        className="bg-gray-50 border border-gray-300 rounded px-1 py-1 outline-none focus:border-green-500"
                                        placeholder="Price"
                                      />
                                      <input
                                        type="number"
                                        value={editingModelRAM}
                                        onChange={(e) => setEditingModelRAM(e.target.value)}
                                        className="bg-gray-50 border border-gray-300 rounded px-1 py-1 outline-none focus:border-green-500"
                                        placeholder="RAM"
                                      />
                                      <input
                                        type="number"
                                        value={editingModelROM}
                                        onChange={(e) => setEditingModelROM(e.target.value)}
                                        className="bg-gray-50 border border-gray-300 rounded px-1 py-1 outline-none focus:border-green-500"
                                        placeholder="ROM"
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <button onClick={handleUpdateModel} className="bg-green-500 text-white px-2 py-1 rounded text-[10px] cursor-pointer">Save</button>
                                      <button onClick={() => setEditingModelId(null)} className="bg-gray-300 text-gray-700 px-2 py-1 rounded text-[10px] cursor-pointer">Cancel</button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex flex-col">
                                      <span className="text-gray-800 font-sans flex items-center gap-2">
                                        {m.label}
                                        <button 
                                          onClick={() => {
                                            setEditingModelId(mId);
                                            setEditingModelLabel(m.label);
                                            setEditingModelPrice(m.price.toString());
                                            setEditingModelRAM((m.base_ram || 4).toString());
                                            setEditingModelROM((m.base_rom || 64).toString());
                                          }}
                                          className="text-gray-300 hover:text-blue-500 transition-colors cursor-pointer"
                                        >
                                          <Edit2 size={11} />
                                        </button>
                                      </span>
                                      <span className="text-[10px] text-gray-400 font-mono">
                                        Base: {m.base_ram || 4}GB / {m.base_rom || 64}GB
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="font-mono text-green-600 font-bold">৳ {Math.round(m.price).toLocaleString()}</span>
                                      <button
                                        onClick={() => handleDeleteModel(bId, mId)}
                                        className="text-red-300 hover:text-red-500 p-1 rounded transition-colors cursor-pointer hover:bg-red-50"
                                        title={lang === 'bn' ? 'মডেল মুছুন' : 'Delete Model'}
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: TESTIMONIALS */}
          {activeTab === 'testimonials' && (
            <div className="space-y-6 max-w-4xl">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-900 text-sm font-sans border-b border-gray-50 pb-2">
                  Create New Client Review Card
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block text-gray-500 mb-1 font-bold">Customer Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Mehedi Hasan"
                      value={newTestimonial.name}
                      onChange={(e) => setNewTestimonial({ ...newTestimonial, name: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg outline-none focus:border-green-400"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-1 font-bold">Avatar Image URL (Optional)</label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={newTestimonial.image_url || ''}
                      onChange={(e) => setNewTestimonial({ ...newTestimonial, image_url: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg outline-none focus:border-green-400"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-1 font-bold">Rating Star (1-5)</label>
                    <select
                      value={newTestimonial.rating}
                      onChange={(e) => setNewTestimonial({ ...newTestimonial, rating: parseInt(e.target.value) })}
                      className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg outline-none focus:border-green-400 font-sans font-bold text-amber-500"
                    >
                      <option value="5">★★★★★ (5 Stars)</option>
                      <option value="4">★★★★☆ (4 Stars)</option>
                      <option value="3">★★★☆☆ (3 Stars)</option>
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-gray-500 mb-1 font-bold">Review Feedback Text Message</label>
                    <textarea
                      placeholder="Feedback text message..."
                      value={newTestimonial.message}
                      onChange={(e) => setNewTestimonial({ ...newTestimonial, message: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg outline-none focus:border-green-400 h-20"
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddTestimonial}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Save Testimonial
                </button>
              </div>

              {/* List */}
              <div className="space-y-3">
                <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider font-sans">
                  Active Feedbacks
                </h4>
                {testimonials.map((t, idx) => (
                  <div key={idx} className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm flex justify-between items-center gap-4 text-xs font-medium">
                    <div className="flex items-center gap-3">
                      {t.image_url ? (
                        <img src={t.image_url} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-100" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center font-bold">
                          {t.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="flex gap-1 text-amber-400 font-bold text-[10px] mb-1">
                          {'★'.repeat(t.rating)}
                        </div>
                        <h4 className="font-bold text-gray-950">{t.name}</h4>
                        <p className="text-gray-500 italic">"{t.message}"</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteTestimonial(idx)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-lg cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: FAQ */}
          {activeTab === 'faq' && (
            <div className="space-y-6 max-w-4xl">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-900 text-sm font-sans border-b border-gray-50 pb-2">
                  Create Auto-Reply FAQ Trigger
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-gray-500 mb-1 font-bold">Matching Keywords (comma separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. দাম, মূল্য, রেট, price, rate"
                      value={newFaq.keywords}
                      onChange={(e) => setNewFaq({ ...newFaq, keywords: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 px-3.5 py-2.5 rounded-lg outline-none focus:border-green-400"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-1 font-bold">Automated Support Reply Answer</label>
                    <textarea
                      placeholder="Automatic bot message answer..."
                      value={newFaq.reply}
                      onChange={(e) => setNewFaq({ ...newFaq, reply: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 px-3.5 py-2.5 rounded-lg outline-none focus:border-green-400 h-20"
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddFaq}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Save FAQ Trigger
                </button>
              </div>

              {/* List */}
              <div className="space-y-3">
                <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider font-sans">
                  Configured FAQ Triggers
                </h4>
                {faqs.map((f, idx) => (
                  <div key={idx} className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm flex justify-between items-center gap-4 text-xs font-medium">
                    <div>
                      <div className="flex flex-wrap gap-1 mb-1.5">
                        {f.keywords.map(kw => (
                          <span key={kw} className="bg-green-50 text-green-700 font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-green-100">
                            {kw}
                          </span>
                        ))}
                      </div>
                      <p className="text-gray-700 leading-relaxed">{f.reply}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteFaq(idx)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-lg cursor-pointer flex-shrink-0"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: SETTINGS / PENALTIES */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6 max-w-2xl font-sans text-xs">
              <h3 className="font-bold text-gray-900 text-sm font-sans border-b border-gray-50 pb-2 flex items-center gap-2">
                <Settings size={18} className="text-green-500 animate-spin-slow" />
                Valuation Rules & Penalty Rates
              </h3>

              {/* Base parameters */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-500 mb-1 font-bold">Liquid Damage Penalty (Percentage)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.50 for 50%"
                    value={waterPenalty}
                    onChange={(e) => setWaterPenalty(parseFloat(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg outline-none focus:border-green-400 font-mono text-xs font-bold"
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">0.50 means 50% value reduction</span>
                </div>
                <div>
                  <label className="block text-gray-500 mb-1 font-bold">Minimum Floor Valuation Price (৳)</label>
                  <input
                    type="number"
                    placeholder="300"
                    value={floorPrice}
                    onChange={(e) => setFloorPrice(parseInt(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg outline-none focus:border-green-400 font-mono text-xs font-bold text-green-600"
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">Minimum price guaranteed for any submission</span>
                </div>
                <div>
                  <label className="block text-gray-500 mb-1 font-bold">Chinese Brand Base Min Price (৳)</label>
                  <input
                    type="number"
                    placeholder="1000"
                    value={chineseMinPrice}
                    onChange={(e) => setChineseMinPrice(parseInt(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg outline-none focus:border-green-400 font-mono text-xs font-bold text-orange-600"
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">For Chinese brands with RAM/ROM variations</span>
                </div>
              </div>

              {/* Individual damage part deductions percentage mapping */}
              <div className="border-t border-gray-100 pt-4 space-y-4">
                <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider font-sans flex items-center gap-2">
                  Deductions for individual damages
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(deductions).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center gap-3">
                      <span className="text-gray-700 font-bold capitalize">{key.replace('_', ' ')}</span>
                      <input
                        type="number"
                        step="0.01"
                        value={value}
                        onChange={(e) => {
                          const nVal = parseFloat(e.target.value);
                          setDeductions(prev => ({ ...prev, [key]: nVal }));
                        }}
                        className="w-24 bg-gray-50 border border-gray-200 px-2 py-1.5 rounded outline-none focus:border-green-400 text-center font-mono font-bold"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit saving changes */}
              <div className="border-t border-gray-100 pt-4 text-right">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 inline-flex"
                >
                  <Save size={14} /> Save Configuration
                </button>
              </div>
            </form>
          )}

          {activeTab === 'files' && (
            <div className="h-full">
              <FileManager token={token} lang={lang} />
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
