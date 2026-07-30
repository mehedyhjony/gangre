import React, { useState, useEffect } from 'react';
import { Phone, ShieldAlert, Sparkles, RefreshCw, X, MessageSquare, Check, HelpCircle, MessageCircle } from 'lucide-react';

import Navbar from './components/Navbar';
import Slider from './components/Slider';
import TrustCards from './components/TrustCards';
import QuoteForm from './components/QuoteForm';
import Testimonials from './components/Testimonials';
import SupportChat from './components/SupportChat';
import AdminPanel from './components/AdminPanel';

import { Brand, Slider as SliderType, Testimonial, FAQ, Ticket, PageContent } from './types';

export default function App() {
  const [lang, setLang] = useState<'bn' | 'en'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gangre_lang');
      return (saved === 'en' || saved === 'bn') ? saved : 'bn';
    }
    return 'bn';
  });
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  
  // Persist language choice
  useEffect(() => {
    localStorage.setItem('gangre_lang', lang);
  }, [lang]);
  
  // App Config Loaded States
  const [brands, setBrands] = useState<Brand[]>([]);
  const [deductions, setDeductions] = useState<Record<string, number>>({});
  const [waterPenalty, setWaterPenalty] = useState(0.5);
  const [floorPrice, setFloorPrice] = useState(300);
  const [chineseMinPrice, setChineseMinPrice] = useState(1000);
  const [content, setContent] = useState<PageContent>({});
  const [slides, setSlides] = useState<SliderType[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [faq, setFaq] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active Ticket submitted popup details
  const [submittedTicket, setSubmittedTicket] = useState<Ticket | null>(null);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);

  // Load configuration from API
  const loadConfiguration = async () => {
    try {
      const res = await fetch('/api/get-full-config');
      if (res.ok) {
        const d = await res.json();
        if (d.config) {
          setBrands(d.config.brands || []);
          setDeductions(d.config.deductions || {});
          setWaterPenalty(d.config.waterPenalty !== undefined ? d.config.waterPenalty : 0.5);
          setFloorPrice(d.config.floor !== undefined ? d.config.floor : 300);
          setChineseMinPrice(d.config.chineseMinPrice !== undefined ? d.config.chineseMinPrice : 1000);
        }
        if (d.content) setContent(d.content);
        if (d.slides) setSlides(d.slides);
        if (d.testimonials) setTestimonials(d.testimonials);
        if (d.faq) setFaq(d.faq);
      }
    } catch (err) {
      console.error('Error loading config:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConfiguration();
  }, []);

  const handleTicketSubmitted = (ticket: Ticket) => {
    setSubmittedTicket(ticket);
    setActiveTicketId(ticket.ticket_id);
    localStorage.setItem('gangre_tid', ticket.ticket_id);
  };

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#admin') {
        setIsAdminOpen(true);
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="space-y-4">
          <RefreshCw size={42} className="text-green-500 animate-spin mx-auto" />
          <h2 className="font-extrabold text-lg text-gray-800">
            {lang === 'bn' ? 'গাংরে লোড হচ্ছে...' : 'Gangre is loading...'}
          </h2>
          <p className="text-xs text-gray-400 font-semibold">
            {lang === 'bn' ? 'পুরনো মোবাইলের নতুন মূল্য নির্ধারণ করুন' : 'Valuing your used mobile devices'}
          </p>
        </div>
      </div>
    );
  }

  const c = content;
  const phoneNumber = c.footer?.phone || '01303893960';

  return (
    <div className={`min-h-screen bg-white text-gray-950 font-sans flex flex-col justify-between selection:bg-green-100`}>
      
      {/* Top Navigation */}
      <Navbar
        brand={c.nav?.brand}
        link1={c.nav?.link1}
        link2={c.nav?.link2}
        lang={lang}
        setLang={setLang}
        onAdminClick={() => setIsAdminOpen(true)}
        phone={phoneNumber}
      />

      {/* Main Content Areas */}
      <main className="flex-1 space-y-2 py-2">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Slider Carousel Banners */}
          <Slider slides={slides} lang={lang} />
        </div>

        {/* trust indicators cards */}
        <TrustCards
          kicker={c.hero?.kicker_title}
          title={c.hero?.main_title}
          desc={c.hero?.description}
          cards={c.tp_cards}
          floorText={c.hero?.floor_text}
          lang={lang}
        />

        {/* Valuation calculator form */}
        <QuoteForm
          brands={brands}
          deductions={deductions}
          waterPenalty={waterPenalty}
          floorPrice={floorPrice}
          chineseMinPrice={chineseMinPrice}
          formTexts={c.form}
          lang={lang}
          onTicketSubmit={handleTicketSubmitted}
        />

        {/* Customer reviews feed */}
        <Testimonials testimonials={testimonials} lang={lang} />

        {/* Safety standards layout section */}
        <section className="py-12 bg-white max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-gray-50 p-6 md:p-10 rounded-3xl border border-gray-100">
            <div className="flex justify-center text-6xl md:text-8xl select-none animate-float">
              🛡️
            </div>
            <div className="space-y-4">
              <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest text-green-700 bg-green-100/60 px-3.5 py-1 rounded-full">
                {c.safety?.kicker || (lang === 'bn' ? 'নিরাপত্তা নিশ্চয়তা' : 'Safety First')}
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-950 font-sans tracking-tight leading-tight">
                {c.safety?.title || (lang === 'bn' ? 'আপনার ডাটা ও পেমেন্ট — দুটোই ১০০% নিরাপদ' : 'Your Data and Payout are 100% Secure')}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed font-medium">
                {c.safety?.description || (lang === 'bn' ? 'মোবাইল ফোন বিক্রির পর আমরা সেটিকে সম্পূর্ণ ফ্যাক্টরি রিসেট করি। আমরা আপনার ডাটা সুরক্ষায় শতভাগ প্রতিশ্রুতিশীল। কোনো লুকানো সার্ভিস ফি বা চার্জ নেই।' : 'Every mobile phone we buy goes through complete diagnostic formatting and military-grade data wipe. Zero hidden commissions or service charges.')}
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <a
                  href="#sell"
                  className="bg-green-500 hover:bg-green-600 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md"
                >
                  {c.safety?.btn2 || (lang === 'bn' ? 'আজই বিক্রি করুন' : 'Sell Today')}
                </a>
                <a
                  href={`tel:${phoneNumber}`}
                  className="bg-transparent border border-gray-200 hover:border-green-400 text-gray-700 hover:text-green-600 font-bold text-xs px-5 py-3 rounded-xl transition-colors"
                >
                  {c.safety?.btn1 || (lang === 'bn' ? 'সরাসরি কল করুন' : 'Call Directly')}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* call-to-action details banner */}
        <section className="py-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50/50 p-8 rounded-3xl border border-green-100 text-center space-y-4 shadow-sm">
            <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest text-green-700 bg-green-100 px-3 py-1 rounded-full">
              {c.cta?.kicker || (lang === 'bn' ? 'আজই করুন' : 'Get Started')}
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-950 font-sans">
              {c.cta?.title || (lang === 'bn' ? 'আপনার পুরনো ফোনের সঠিক দাম বুঝে নিন' : 'Value Your Used Mobile Device Now')}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 font-medium max-w-xl mx-auto leading-relaxed">
              {c.cta?.desc || (lang === 'bn' ? '২ মিনিটে অনলাইনে এস্টিমেট মূল্য হিসাব করুন এবং ঢাকা শহরের যেকোনো জায়গা থেকে ফ্রি হোম পিকআপ বুক করুন।' : 'Calculate device price in under 2 minutes and claim guaranteed instant cash payout with free doorstep verification.')}
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <a
                href="#sell"
                className="bg-green-500 hover:bg-green-600 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5"
              >
                {c.cta?.btn1 || (lang === 'bn' ? 'ফর্ম পূরণ করুন' : 'Fill Form')}
              </a>
              <a
                href={`tel:${phoneNumber}`}
                className="bg-white border border-gray-200 hover:border-green-400 text-gray-700 hover:text-green-600 font-bold text-xs px-6 py-3 rounded-xl shadow-sm transition-colors"
              >
                {c.cta?.btn2 || (lang === 'bn' ? 'কল করুন' : 'Call Support')}
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Branding Area */}
      <footer className="bg-gray-50 border-t border-gray-100 py-12 font-sans mt-12 pb-24 md:pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pb-6 border-b border-gray-100">
            <div className="text-center md:text-left space-y-1">
              <div className="font-extrabold text-lg text-gray-950 flex items-center justify-center md:justify-start gap-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>{c.footer?.brand || (lang === 'bn' ? 'গাংরে' : 'Gangre')}</span>
              </div>
              <p className="text-xs text-gray-400 font-semibold">
                {c.footer?.tagline || (lang === 'bn' ? 'পুরনো মোবাইলের নতুন মূল্য' : 'Used Mobiles Best Valuation')}
              </p>
            </div>
            
            {/* Quick footer actions */}
            <div className="flex flex-wrap gap-6 text-xs font-semibold text-gray-500">
              <a href="#how" className="hover:text-green-600 transition-colors">
                {lang === 'bn' ? 'কেন ও কীভাবে' : 'Why Us'}
              </a>
              <a href="#sell" className="hover:text-green-600 transition-colors">
                {lang === 'bn' ? 'মূল্য জানুন' : 'Estimate Price'}
              </a>
              <a href="#testimonials" className="hover:text-green-600 transition-colors">
                {lang === 'bn' ? 'প্রতিক্রিয়া' : 'Feedback'}
              </a>
              <a 
                href={`https://wa.me/8801303893960`} 
                target="_blank" 
                rel="noreferrer" 
                className="hover:text-green-600 transition-colors flex items-center gap-1"
              >
                <MessageCircle size={14} className="text-green-500" />
                WhatsApp
              </a>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-gray-400 font-medium">
            <p>
              {c.footer?.copyright || (lang === 'bn' ? '© ২০২৬ গাংরে · সর্বস্বত্ব সংরক্ষিত' : '© 2026 Gangre · All Rights Reserved')}
            </p>
            <p className="font-mono text-[10px] text-gray-300">
              Crafted with Excellence
            </p>
          </div>
        </div>
      </footer>

      {/* Floating Bottom Direct calling action bar */}
      <a
        href={`tel:${phoneNumber}`}
        className="fixed bottom-4 left-4 z-40 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 py-3 rounded-full font-bold text-sm shadow-xl flex items-center gap-2 transform hover:scale-105 transition-transform duration-200 cursor-pointer border border-green-400 hover:shadow-green-500/20"
      >
        <Phone size={16} className="animate-bounce" />
        <span className="font-mono tracking-wider">{phoneNumber}</span>
      </a>

      {/* Interactive floating Support chat module */}
      <SupportChat
        ticketId={activeTicketId}
        setTicketId={setActiveTicketId}
        lang={lang}
        faq={faq}
        chatHelloText={c.chat?.hello}
        chatPlaceholder={c.chat?.placeholder}
      />

      {/* Ticket Submitted successfully details popup / modal */}
      {submittedTicket && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-scaleUp">
            <div className="text-center space-y-2">
              <div className="bg-green-100 text-green-600 p-3 rounded-full w-14 h-14 flex items-center justify-center mx-auto shadow-sm">
                <Check size={28} className="stroke-[3]" />
              </div>
              <h3 className="font-extrabold text-xl text-gray-900 font-sans">
                {lang === 'bn' ? 'টিকিট সফলভাবে পাঠানো হয়েছে!' : 'Ticket Submitted Successfully!'}
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed font-semibold">
                {lang === 'bn' ? 'আমাদের প্রতিনিধি খুব শীঘ্রই আপনার ঠিকানায় যোগাযোগ করবেন।' : 'Our support agent will contact you soon on your phone.'}
              </p>
            </div>

            {/* Ticket details summary card */}
            <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl space-y-2 text-xs font-semibold text-gray-600">
              <div className="flex justify-between border-b border-gray-100 pb-1.5">
                <span>{lang === 'bn' ? 'টিকিট আইডি (Ticket ID)' : 'Ticket ID'}</span>
                <span className="font-mono font-bold text-green-600 text-sm">{submittedTicket.ticket_id}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-1.5">
                <span>{lang === 'bn' ? 'ডিভাইসের নাম' : 'Device name'}</span>
                <span className="text-gray-950 font-sans text-right max-w-[200px] truncate">{submittedTicket.device}</span>
              </div>
              <div className="flex justify-between">
                <span>{lang === 'bn' ? 'এস্টিমেটেড দাম' : 'Value Estimate'}</span>
                <span className="text-green-600 text-sm font-extrabold">{submittedTicket.estimate}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setSubmittedTicket(null)}
                className="flex-1 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl cursor-pointer bg-white"
              >
                {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
              <button
                onClick={() => {
                  setSubmittedTicket(null);
                  // Open chat directly
                  const chatBtn = document.getElementById('chatBtn');
                  if (chatBtn) {
                    chatBtn.click();
                  }
                }}
                className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <MessageSquare size={14} />
                <span>{lang === 'bn' ? 'চ্যাট করুন' : 'Start Chat'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen admin administration layout */}
      {isAdminOpen && (
        <AdminPanel
          onClose={() => {
            setIsAdminOpen(false);
            // Refresh configuration states on close to apply edits instantly!
            loadConfiguration();
          }}
          lang={lang}
        />
      )}
      
    </div>
  );
}
