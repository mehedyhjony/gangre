import React from 'react';

interface TrustCardItem {
  icon?: string;
  title: string;
  desc: string;
}

interface TrustCardsProps {
  kicker?: string;
  title?: string;
  desc?: string;
  cards?: TrustCardItem[];
  floorText?: string;
  lang: 'bn' | 'en';
}

export default function TrustCards({
  kicker,
  title,
  desc,
  cards,
  floorText,
  lang
}: TrustCardsProps) {
  // Fallback defaults
  const defaultKicker = lang === 'bn' ? 'কেন ও কীভাবে' : 'Why Choose Us';
  const defaultTitle = lang === 'bn' ? 'কেন গাংরে আপনার সেরা পছন্দ' : 'Why Gangre Is Your Best Choice';
  const defaultDesc = lang === 'bn' ? 'সহজ ৩ ধাপে পুরনো মোবাইল বিক্রি করার আধুনিক অনলাইন মাধ্যম' : 'The easiest way to sell your used phone in just 3 steps';
  
  const defaultCards: TrustCardItem[] = [
    { icon: '💰', title: lang === 'bn' ? 'সেরা দাম' : 'Best Valuation', desc: lang === 'bn' ? 'মার্কেটের সর্বোচ্চ মূল্য নিশ্চিত' : 'Guaranteed highest valuation in the market' },
    { icon: '🚚', title: lang === 'bn' ? 'ফ্রি পিকআপ' : 'Free Pickup', desc: lang === 'bn' ? 'ঢাকার সব এলাকায় ঘরে বসে বিনামূল্যে পিকআপ' : 'Free doorstep check and pickup service' },
    { icon: '⚡', title: lang === 'bn' ? 'তাৎক্ষণিক টাকা' : 'Instant Payout', desc: lang === 'bn' ? 'বিকাশ, নগদ বা সরাসরি ক্যাশ পেমেন্ট সাথে সাথে' : 'Get paid immediately via bKash, Nagad, or Cash' },
    { icon: '🔒', title: lang === 'bn' ? '১০০% নিরাপদ' : '100% Secure', desc: lang === 'bn' ? 'বিক্রির পর ডিভাইস ফ্যাক্টরি রিসেট ও ডাটা মুছে ফেলা হয়' : 'Complete data wipe and factory reset guarantee' }
  ];

  const displayCards = cards && cards.length > 0 ? cards : defaultCards;

  return (
    <section id="how" className="py-12 bg-white scroll-mt-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="inline-block text-[11px] font-extrabold uppercase tracking-widest text-green-700 bg-green-50 px-3 py-1 rounded-full mb-3">
            {kicker || defaultKicker}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-950 font-sans tracking-tight mb-3">
            {title || defaultTitle}
          </h2>
          <p className="text-sm sm:text-base text-gray-500 leading-relaxed font-medium">
            {desc || defaultDesc}
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayCards.map((card, i) => (
            <div
              key={i}
              className="bg-gray-50 hover:bg-white border border-gray-100 hover:border-green-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center text-center group transform hover:-translate-y-0.5"
            >
              <div className="text-4xl mb-4 p-3 bg-white rounded-xl shadow-sm border border-gray-50 group-hover:bg-green-50/50 transition-colors">
                {card.icon || '📱'}
              </div>
              <h3 className="font-bold text-gray-950 text-base mb-2 font-sans">
                {card.title}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                {card.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Floor badge guarantee */}
        <div className="text-center mt-8">
          <span className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200/60 text-amber-700 text-xs font-semibold px-4 py-2 rounded-full shadow-sm animate-pulse">
            <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
            <span>{floorText || (lang === 'bn' ? 'সর্বনিম্ন ৳৩০০ নিশ্চিত ক্যাশ গ্যারান্টি' : 'Minimum guaranteed ৳300 payout for any phone')}</span>
          </span>
        </div>
      </div>
    </section>
  );
}
