import React from 'react';
import { ShieldCheck, Phone, Menu, X, Landmark } from 'lucide-react';

interface NavbarProps {
  brand?: string;
  link1?: string;
  link2?: string;
  lang: 'bn' | 'en';
  setLang: (l: 'bn' | 'en') => void;
  onAdminClick: () => void;
  phone?: string;
}

export default function Navbar({
  brand,
  link1,
  link2,
  lang,
  setLang,
  onAdminClick,
  phone
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Brand */}
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
            <span className="font-extrabold text-xl tracking-tight text-gray-950 font-sans flex items-center gap-1">
              {brand || (lang === 'bn' ? 'গাংরে' : 'Gangre')}
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#how" className="text-gray-600 hover:text-green-600 transition-colors">
              {link1 || (lang === 'bn' ? 'কেন ও কীভাবে' : 'Why Us')}
            </a>
            <a href="#sell" className="text-gray-600 hover:text-green-600 transition-colors">
              {link2 || (lang === 'bn' ? 'বিক্রি করুন' : 'Sell Phone')}
            </a>
            <a href="#testimonials" className="text-gray-600 hover:text-green-600 transition-colors">
              {lang === 'bn' ? 'প্রশংসাপত্র' : 'Testimonials'}
            </a>
          </nav>

          {/* Actions & Lang Toggle */}
          <div className="hidden md:flex items-center gap-4">
            {phone && (
              <a
                href={`tel:${phone}`}
                className="flex items-center gap-1.5 text-gray-700 hover:text-green-600 font-semibold text-sm transition-all"
              >
                <Phone size={14} className="text-green-500 animate-bounce" />
                <span>{phone}</span>
              </a>
            )}
            <button
              onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
              className="px-3.5 py-1.5 border border-gray-200 hover:border-green-400 rounded-full text-xs font-bold tracking-wider text-gray-700 hover:text-green-600 transition-all cursor-pointer bg-transparent"
            >
              {lang === 'bn' ? 'ENGLISH' : 'বাংলা'}
            </button>
          </div>

          {/* Mobile Menu Buttons */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
              className="px-3 py-1 border border-gray-200 rounded-full text-[10px] font-bold text-gray-700 cursor-pointer"
            >
              {lang === 'bn' ? 'EN' : 'BN'}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-600 hover:text-green-600 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-gray-100 bg-white px-4 py-4 space-y-3 animate-fadeIn">
          <a
            href="#how"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-gray-700 hover:text-green-600 font-semibold text-sm transition-all py-1"
          >
            {link1 || (lang === 'bn' ? 'কেন ও কীভাবে' : 'Why Us')}
          </a>
          <a
            href="#sell"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-gray-700 hover:text-green-600 font-semibold text-sm transition-all py-1"
          >
            {link2 || (lang === 'bn' ? 'বিক্রি করুন' : 'Sell Phone')}
          </a>
          <a
            href="#testimonials"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-gray-700 hover:text-green-600 font-semibold text-sm transition-all py-1"
          >
            {lang === 'bn' ? 'প্রশংসাপত্র' : 'Testimonials'}
          </a>
          {phone && (
            <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
              <a
                href={`tel:${phone}`}
                className="flex items-center gap-1.5 text-gray-800 font-bold text-sm"
              >
                <Phone size={14} className="text-green-500 animate-bounce" />
                <span>{phone}</span>
              </a>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
