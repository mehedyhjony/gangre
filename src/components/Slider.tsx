import React, { useState, useEffect } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Slider as SliderType } from '../types';

interface SliderProps {
  slides: SliderType[];
  lang: 'bn' | 'en';
}

export default function Slider({ slides, lang }: SliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Auto scroll slides
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides]);

  const handlePrev = () => {
    setActiveIndex(prev => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setActiveIndex(prev => (prev + 1) % slides.length);
  };

  if (!slides || slides.length === 0) {
    return (
      <div className="w-full h-80 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 flex items-center justify-center p-6 text-center shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {lang === 'bn' ? 'গাংরে — ভাঙা মোবাইল কিনি' : 'Gangre — We Buy Broken Phones'}
          </h2>
          <p className="text-sm text-gray-500 max-w-md">
            {lang === 'bn' ? 'পুরনো বা ডিসপ্লে ভাঙা ফোন বিক্রি করুন সর্বোচ্চ মূল্যে। ঘরে বসেই ফ্রি হোম পিকআপ!' : 'Sell used or screen-damaged phones at the best market prices. Free pickup right from your home!'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[460px] sm:h-[420px] md:h-[450px] rounded-2xl overflow-hidden shadow-sm group">
      {/* Slides container */}
      {slides.map((s, idx) => {
        // Parse background colors (e.g. "#e8f5e9,#f0fdf4")
        const colors = (s.bg_color || '#e8f5e9,#f0fdf4').split(',');
        const startColor = colors[0] || '#e8f5e9';
        const endColor = colors[1] || colors[0] || '#f0fdf4';

        return (
          <div
            key={s.id || idx}
            className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out flex items-center ${
              idx === activeIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
            style={{
              background: `linear-gradient(135deg, ${startColor}, ${endColor})`
            }}
          >
            <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-8 md:pt-0">
              {/* Slide text details */}
              <div className="text-center md:text-left space-y-4">
                {s.eye_text && (
                  <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-green-700 bg-green-100/80 px-3.5 py-1 rounded-full">
                    {s.eye_text}
                  </span>
                )}
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-950 leading-[1.2] font-sans">
                  {s.title_line1} <br />
                  <span className="text-green-600 font-sans">{s.title_line2}</span>
                </h1>
                {s.description && (
                  <p className="text-sm text-gray-600 max-w-lg mx-auto md:mx-0 leading-relaxed font-medium">
                    {s.description}
                  </p>
                )}
                <div className="pt-2 flex justify-center md:justify-start">
                  <a
                    href="#sell"
                    className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                  >
                    <span>{lang === 'bn' ? '👉 এখনই দাম জানুন' : '👉 Get Estimate Now'}</span>
                    <ArrowRight size={16} />
                  </a>
                </div>
              </div>

              {/* Slide Image / Visual element */}
              <div className="hidden md:flex items-center justify-center relative h-80">
                {s.image_url ? (
                  <img
                    src={s.image_url}
                    alt={s.title_line1}
                    className="max-h-64 max-w-full object-contain rounded-xl drop-shadow-[0_12px_24px_rgba(0,0,0,0.12)] transition-transform duration-500 hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-[120px] opacity-20 select-none animate-float">📱</div>
                )}

                {/* Floating price badges */}
                {s.price_tag1 && (
                  <div className="absolute top-8 left-8 bg-green-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-md animate-float font-sans">
                    {s.price_tag1}
                  </div>
                )}
                {s.price_tag2 && (
                  <div className="absolute bottom-8 right-8 bg-amber-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-md animate-float font-sans" style={{ animationDelay: '1.5s' }}>
                    {s.price_tag2}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Control Navigation Arrows (Only on hover, desktop) */}
      {slides.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/70 hover:bg-white text-gray-800 p-2 rounded-full shadow-md backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hidden md:flex"
            aria-label="Previous slide"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/70 hover:bg-white text-gray-800 p-2 rounded-full shadow-md backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hidden md:flex"
            aria-label="Next slide"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Control Dots Navigation indicator */}
      {slides.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-y-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                idx === activeIndex ? 'w-7 bg-green-500 shadow-sm' : 'w-2.5 bg-gray-300/80 hover:bg-gray-400'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            ></button>
          ))}
        </div>
      )}
    </div>
  );
}
