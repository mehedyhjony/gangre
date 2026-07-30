import React, { useState, useEffect, useRef } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Testimonial } from '../types';

interface TestimonialsProps {
  testimonials: Testimonial[];
  lang: 'bn' | 'en';
}

export default function Testimonials({ testimonials, lang }: TestimonialsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  if (!testimonials || testimonials.length === 0) return null;

  const totalItems = testimonials.length;
  
  // Auto slide logic
  useEffect(() => {
    if (!isPaused && totalItems > 1) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % totalItems);
      }, 5000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, totalItems]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % totalItems);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + totalItems) % totalItems);
  };

  return (
    <section id="testimonials" className="py-16 bg-white scroll-mt-6 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block text-[11px] font-extrabold uppercase tracking-widest text-green-700 bg-green-50 px-3 py-1 rounded-full mb-3">
            {lang === 'bn' ? 'প্রশংসাপত্র' : 'Testimonials'}
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-950 font-sans tracking-tight mb-3">
            {lang === 'bn' ? 'আমাদের খুশি গ্রাহকদের কথা' : 'What Our Customers Say'}
          </h2>
          <p className="text-sm sm:text-base text-gray-500 font-medium">
            {lang === 'bn' ? 'গাংরে-র মাধ্যমে যারা পুরনো ফোন বিক্রি করে সেরা দাম পেয়েছেন' : 'Read genuine feedbacks from customers who sold their devices to Gangre'}
          </p>
        </div>

        <div 
          className="relative group"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Slider Container */}
          <div className="relative overflow-hidden py-4">
            <motion.div
              className="flex gap-6"
              animate={{
                x: `calc(-${currentIndex * (100 / 3)}% - ${currentIndex * (24 / 3)}px)`,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{
                width: `${(totalItems / 3) * 100}%`,
                display: 'flex',
              }}
            >
              {testimonials.map((t, idx) => (
                <div
                  key={t.id || idx}
                  className="flex-shrink-0"
                  style={{ width: `calc((100% / ${totalItems}) - 16px)` }}
                >
                  <div className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-500 h-full flex flex-col justify-between group/card hover:-translate-y-1">
                    <div>
                      {/* Stars rating */}
                      <div className="flex gap-1 mb-5">
                        {Array.from({ length: 5 }).map((_, sIdx) => (
                          <Star
                            key={sIdx}
                            size={16}
                            className={
                              sIdx < (t.rating || 5)
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-gray-200'
                            }
                          />
                        ))}
                      </div>

                      {/* Message */}
                      <p className="text-gray-700 text-sm sm:text-base italic leading-relaxed mb-6 font-medium">
                        "{t.message}"
                      </p>
                    </div>

                    {/* Author info */}
                    <div className="flex items-center gap-4 mt-auto pt-6 border-t border-gray-50">
                      {t.image_url ? (
                        <img 
                          src={t.image_url} 
                          alt={t.name} 
                          className="w-12 h-12 rounded-full object-cover border-2 border-green-100 shadow-sm"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-green-100 text-green-700 text-sm font-bold flex items-center justify-center border-2 border-green-50 shadow-sm">
                          {t.name ? t.name.charAt(0) : 'U'}
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-gray-950 text-sm sm:text-base font-sans">
                          {t.name}
                        </h4>
                        <span className="text-[11px] text-green-600 font-bold uppercase tracking-wider flex items-center gap-1">
                          <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                          {lang === 'bn' ? 'ভেরিফাইড কাস্টমার' : 'Verified Customer'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Navigation Controls */}
          {totalItems > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 sm:-translate-x-8 bg-white text-gray-800 p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-green-500 hover:text-white z-10 border border-gray-100"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 sm:translate-x-8 bg-white text-gray-800 p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-green-500 hover:text-white z-10 border border-gray-100"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          {/* Pagination Indicators */}
          <div className="flex justify-center gap-2 mt-10">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 transition-all duration-300 rounded-full ${
                  currentIndex === idx ? 'w-8 bg-green-500' : 'w-2 bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 640px) {
          #testimonials .flex-shrink-0 {
            width: calc(100% - 16px) !important;
          }
          #testimonials .motion-div {
            width: 100% !important;
            transform: translateX(-${currentIndex * 100}%) !important;
          }
        }
        @media (min-width: 641px) and (max-width: 1024px) {
          #testimonials .flex-shrink-0 {
            width: calc(50% - 12px) !important;
          }
        }
      `}} />
    </section>
  );
}
