import React, { useState, useMemo } from 'react';
import { Smartphone, Check, HelpCircle, FileText, CheckCircle2, MessageSquare } from 'lucide-react';
import { Brand, Model, Ticket } from '../types';

interface QuoteFormProps {
  brands: Brand[];
  deductions: Record<string, number>;
  waterPenalty: number;
  floorPrice: number;
  chineseMinPrice?: number;
  formTexts?: any;
  lang: 'bn' | 'en';
  onTicketSubmit: (ticket: Ticket) => void;
}

export default function QuoteForm({
  brands,
  deductions,
  waterPenalty,
  floorPrice,
  chineseMinPrice = 1000,
  formTexts,
  lang,
  onTicketSubmit
}: QuoteFormProps) {
  const [brandText, setBrandText] = useState('');
  const [modelText, setModelText] = useState('');
  const [ram, setRam] = useState(4);
  const [rom, setRom] = useState(64);
  const [selectedDamages, setSelectedDamages] = useState<Set<string>>(new Set());
  
  // Contact info state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Fallback labels
  const t = formTexts || {
    kicker: lang === 'bn' ? 'মূল্য জানুন' : 'Check Price',
    title: lang === 'bn' ? 'আপনার ফোনের দাম কত?' : 'What is your phone worth?',
    hint: lang === 'bn' ? 'বিস্তারিত দিলে আরও সঠিক এস্টিমেট পাবেন' : 'Tap on damaged parts to adjust value',
    water: lang === 'bn' ? 'পানিতে ভিজেছে?' : 'Liquid damaged?',
    brand_label: lang === 'bn' ? 'ব্র্যান্ড' : 'Brand',
    model_label: lang === 'bn' ? 'মডেল' : 'Model',
    ram_label: lang === 'bn' ? 'RAM' : 'RAM',
    rom_label: lang === 'bn' ? 'স্টোরেজ' : 'Storage',
    est_label: lang === 'bn' ? 'আনুমানিক দাম' : 'Estimated Value',
    est_note: lang === 'bn' ? 'চূড়ান্ত দাম ফিজিক্যাল চেকের পর নির্ধারিত হবে' : 'Final value depends on physical verification',
    name_label: lang === 'bn' ? 'আপনার নাম' : 'Your Name',
    phone_label: lang === 'bn' ? 'মোবাইল নম্বর' : 'Phone Number',
    address_label: lang === 'bn' ? 'ঠিকানা (ফ্রি পিকআপের জন্য)' : 'Address (for Free Pickup)',
    submit_text: lang === 'bn' ? 'টিকিট সাবমিট করুন' : 'Submit Ticket'
  };

  // Pricing match logic
  const selectedModelData = useMemo(() => {
    if (!brandText || !modelText) return null;
    
    // Find matching brand (case insensitive)
    const brandMatch = brands.find(b => 
      b.label.toLowerCase() === brandText.toLowerCase() || 
      (b as any).brand_id?.toLowerCase() === brandText.toLowerCase()
    );

    if (!brandMatch) return { price: 1000, base_ram: 4, base_rom: 64 }; // Default for unknown brand

    // Find matching model
    // Preference 1: Exact label + exact RAM + exact ROM
    const exactMatch = brandMatch.models?.find(m => 
      (m.label.toLowerCase() === modelText.toLowerCase() || (m as any).model_id?.toLowerCase() === modelText.toLowerCase()) &&
      m.base_ram === ram &&
      m.base_rom === rom
    );

    if (exactMatch) return {
      price: exactMatch.price,
      base_ram: exactMatch.base_ram || ram,
      base_rom: exactMatch.base_rom || rom
    };

    // Preference 2: Just label
    const modelMatch = brandMatch.models?.find(m => 
      m.label.toLowerCase() === modelText.toLowerCase() || 
      (m as any).model_id?.toLowerCase() === modelText.toLowerCase()
    );

    if (!modelMatch) return { price: 1500, base_ram: 4, base_rom: 64 }; // Default for unknown model

    return {
      price: modelMatch.price,
      base_ram: modelMatch.base_ram || 4,
      base_rom: modelMatch.base_rom || 64
    };
  }, [brandText, modelText, brands, ram, rom]);

  // Damage toggling
  const toggleDamage = (key: string) => {
    setSelectedDamages(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const isChineseBrand = useMemo(() => {
    const cb = ['xiaomi', 'redmi', 'oppo', 'vivo', 'realme', 'huawei', 'itel', 'tecno', 'infinix', 'symphony', 'walton'];
    return cb.some(name => brandText.toLowerCase().includes(name));
  }, [brandText]);

  // Auto-set RAM/ROM when model changes to match its base specs
  React.useEffect(() => {
    if (selectedModelData) {
      // Only auto-set if the current selection doesn't match the model's base
      // to avoid annoying resets while user is manually tweaking, 
      // but the user wants "listing the model ram and rom"
      // So let's just set them.
      setRam(selectedModelData.base_ram);
      setRom(selectedModelData.base_rom);
    }
  }, [modelText, brandText]); // We trigger on modelText/brandText change, not selectedModelData itself to avoid loop if we add ram/rom to dependency (though selectedModelData doesn't depend on them in a circular way now)

  // Estimated Price Calculation
  const estimatedPrice = useMemo(() => {
    if (!brandText || !modelText || !selectedModelData) return 0;

    const { price: basePrice, base_ram, base_rom } = selectedModelData;

    // Apply RAM adjustments (+3% per GB above base, -3% below)
    const ramDiff = ram - base_ram;
    const ramMultiplier = 1 + (ramDiff * 0.03);

    // Apply Storage adjustments (+2% per doubling of base ROM)
    const romDiff = rom - base_rom;
    const romMultiplier = 1 + ((romDiff / base_rom) * 0.02);

    let base = Math.round(basePrice * ramMultiplier * romMultiplier);

    // Subtract penalties
    let multiplier = 1;
    selectedDamages.forEach(d => {
      if (d !== 'water_damage') {
        const damageRate = deductions[d] || 0;
        multiplier -= damageRate;
      }
    });

    if (selectedDamages.has('water_damage')) {
      multiplier *= (1 - (waterPenalty || 0.5));
    }

    // Floor price guarantee
    const calculated = Math.round((base * Math.max(multiplier, 0)) / 100) * 100;
    
    // Special Chinese Brand Logic
    if (isChineseBrand && (selectedDamages.has('dead') || selectedDamages.has('screen'))) {
      return Math.max(chineseMinPrice || 1000, calculated);
    }

    return Math.max(floorPrice || 300, calculated);
  }, [brandText, modelText, selectedModelData, ram, rom, selectedDamages, deductions, waterPenalty, floorPrice, isChineseBrand, chineseMinPrice]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandText || !modelText) {
      setSubmitError(lang === 'bn' ? 'অনুগ্রহ করে ব্র্যান্ড এবং মডেল লিখুন' : 'Please enter brand and model');
      return;
    }

    setSubmitError('');
    setIsSubmitting(true);

    const ticketId = `GAN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const deviceSpec = `${brandText} ${modelText} (${ram}GB/${rom}GB)`;
    const damageTags = Array.from(selectedDamages).join(',');

    const payload = {
      ticketId,
      device: deviceSpec,
      tags: damageTags,
      estimate: `৳ ${estimatedPrice.toLocaleString()}`,
      expected: estimatedPrice,
      name,
      phone,
      address,
      date: new Date().toISOString().split('T')[0],
      slot: 'afternoon'
    };

    try {
      const res = await fetch('/api/submit-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          onTicketSubmit(data.ticket);
          // Clear states after submit
          setName('');
          setPhone('');
          setAddress('');
          setSelectedDamages(new Set());
          setBrandText('');
          setModelText('');
        } else {
          setSubmitError(data.error || 'Submission failed');
        }
      } else {
        setSubmitError('Failed to contact server');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // List of damage items for visual mapping & list
  const damageItems = [
    { key: 'screen', label: lang === 'bn' ? '🖥️ স্ক্রিন ভাঙা' : '🖥️ Screen Broken' },
    { key: 'back', label: lang === 'bn' ? '🔙 ব্যাক পার্ট ফাটা' : '🔙 Back Glass Cracked' },
    { key: 'front_camera', label: lang === 'bn' ? '📷 সামনের ক্যামেরা' : '📷 Front Camera' },
    { key: 'back_camera', label: lang === 'bn' ? '📸 পেছনের ক্যামেরা' : '📸 Back Camera' },
    { key: 'battery', label: lang === 'bn' ? '🔋 চার্জ সমস্যা' : '🔋 Battery Drain' },
    { key: 'charging', label: lang === 'bn' ? '🔌 চার্জিং পোর্ট' : '🔌 Charging Port' },
    { key: 'speaker', label: lang === 'bn' ? '🔊 স্পিকার সমস্যা' : '🔊 Speaker issue' },
    { key: 'mic', label: lang === 'bn' ? '🎤 মাইক্রোফোন' : '🎤 Microphone' },
    { key: 'buttons', label: lang === 'bn' ? '🔘 বাটন নষ্ট' : '🔘 Defective buttons' },
    { key: 'fingerprint', label: lang === 'bn' ? '🖐️ ফিঙ্গারপ্রিন্ট' : '🖐️ Fingerprint/FaceID' },
    { key: 'dead', label: lang === 'bn' ? '💀 ডেড/অন হচ্ছে না' : '💀 Dead / Motherboard' }
  ];

  return (
    <section id="sell" className="py-12 bg-gray-50/50 scroll-mt-6 border-y border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="inline-block text-[11px] font-extrabold uppercase tracking-widest text-green-700 bg-green-50 px-3 py-1 rounded-full mb-3">
            {t.kicker}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-950 font-sans tracking-tight mb-2">
            {t.title}
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 font-semibold">{t.hint}</p>
        </div>

        {/* Two-Column Grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Column 1: Interactive Phone Map & Damages selection */}
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 text-sm mb-4 font-sans flex items-center gap-2 border-b border-gray-50 pb-3">
              <Smartphone size={18} className="text-green-500" />
              {lang === 'bn' ? 'ডিভাইসের ত্রুটিসমূহ চিহ্নিত করুন' : 'Select Phone Damages'}
            </h3>

            {/* Damage Toggles Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 mb-4">
              {damageItems.map((item) => {
                const isActive = selectedDamages.has(item.key);
                const penalty = deductions[item.key] ? `(-${Math.round(deductions[item.key] * 100)}%)` : '';
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => toggleDamage(item.key)}
                    className={`px-4 py-3 rounded-xl text-left text-xs font-semibold border transition-all flex items-center justify-between cursor-pointer ${
                      isActive
                        ? 'bg-red-50 text-red-700 border-red-200 shadow-sm'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-green-300 hover:bg-green-50/30'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="text-[10px] font-mono opacity-80">{penalty}</span>
                  </button>
                );
              })}
            </div>

            {/* Liquid / Water damage (Special penalty) */}
            <button
              type="button"
              onClick={() => toggleDamage('water_damage')}
              className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-between cursor-pointer ${
                selectedDamages.has('water_damage')
                  ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-amber-300 hover:bg-amber-50/10'
              }`}
            >
              <span className="flex items-center gap-2">
                💧 {t.water}
              </span>
              <span className="text-[10px] font-mono opacity-90">
                {deductions['water_damage'] ? `(-${Math.round(deductions['water_damage'] * 100)}%)` : `(-${Math.round(waterPenalty * 100)}%)`}
              </span>
            </button>
          </div>

          {/* Column 2: Specs select & Quote value Form submission */}
          <div className="lg:col-span-5">
            <form onSubmit={handleFormSubmit} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              {/* Brand Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                  {t.brand_label}
                </label>
                <input
                  list="brand-list"
                  type="text"
                  value={brandText}
                  onChange={(e) => setBrandText(e.target.value)}
                  placeholder={lang === 'bn' ? 'ব্র্যান্ডের নাম লিখুন (উদা: Samsung)' : 'Enter Brand (e.g. Samsung)'}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-green-400 focus:bg-white transition-all font-sans"
                  required
                />
                <datalist id="brand-list">
                  {brands.map((b, bIdx) => (
                    <option key={`${b.id || (b as any).brand_id}-${bIdx}`} value={b.label} />
                  ))}
                </datalist>
              </div>

              {/* Model Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                  {t.model_label}
                </label>
                <input
                  list="model-list"
                  type="text"
                  value={modelText}
                  onChange={(e) => setModelText(e.target.value)}
                  placeholder={lang === 'bn' ? 'মডেলের নাম লিখুন (উদা: Galaxy S23)' : 'Enter Model (e.g. Galaxy S23)'}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-green-400 focus:bg-white transition-all font-sans"
                  required
                />
                <datalist id="model-list">
                  {brands
                    .find(b => b.label.toLowerCase() === brandText.toLowerCase())
                    ?.models?.map((m, mIdx) => (
                      <option key={`${m.id || (m as any).model_id}-${mIdx}`} value={m.label} />
                    ))
                  }
                </datalist>
              </div>

              {/* RAM & Storage Selector Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                    {t.ram_label}
                  </label>
                  <input
                    type="number"
                    value={ram}
                    onChange={(e) => setRam(parseInt(e.target.value) || 0)}
                    placeholder="4"
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-green-400 focus:bg-white transition-all font-sans"
                  />
                  <span className="text-[9px] text-gray-400 mt-0.5 block">GB</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                    {t.rom_label}
                  </label>
                  <input
                    type="number"
                    value={rom}
                    onChange={(e) => setRom(parseInt(e.target.value) || 0)}
                    placeholder="64"
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-green-400 focus:bg-white transition-all font-sans"
                  />
                  <span className="text-[9px] text-gray-400 mt-0.5 block">GB</span>
                </div>
              </div>

              {/* Live Price Estimation Showcase Card */}
              <div className="bg-green-500 text-white rounded-2xl p-5 text-center shadow-md border border-green-400 flex flex-col items-center justify-center space-y-1 transform hover:scale-[1.01] transition-transform">
                <span className="text-[10px] uppercase font-bold tracking-widest text-green-100">
                  {t.est_label}
                </span>
                <span className="text-3xl font-extrabold font-sans">
                  ৳ {estimatedPrice.toLocaleString()}
                </span>
                {isChineseBrand && (
                  <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full font-bold mt-1">
                    {lang === 'bn' ? `চাইনিজ ব্র্যান্ডের ডেড/ব্রোকেন মিনিমাম: ৳${chineseMinPrice}` : `Chinese Brand Dead/Broken Min: ৳${chineseMinPrice}`}
                  </span>
                )}
                <span className="text-[10px] text-green-100 font-medium">
                  {t.est_note}
                </span>
              </div>

              {/* Contact Information Fields */}
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.name_label}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-green-400 focus:bg-white transition-all"
                    required
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t.phone_label}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-green-400 focus:bg-white transition-all font-sans"
                    required
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={t.address_label}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-green-400 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {submitError && (
                <div className="text-red-500 text-xs font-semibold text-center py-1">
                  ❌ {submitError}
                </div>
              )}

              {/* Action Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileText size={16} />
                <span>{isSubmitting ? (lang === 'bn' ? 'সাবমিট করা হচ্ছে...' : 'Submitting...') : t.submit_text}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
