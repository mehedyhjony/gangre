import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Image, MessageCircle } from 'lucide-react';
import { ChatMessage, FAQ } from '../types';

interface SupportChatProps {
  ticketId: string | null;
  setTicketId: (id: string | null) => void;
  lang: 'bn' | 'en';
  faq: FAQ[];
  chatHelloText?: string;
  chatPlaceholder?: string;
}

export default function SupportChat({
  ticketId,
  setTicketId,
  lang,
  faq,
  chatHelloText,
  chatPlaceholder
}: SupportChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSendingImage, setIsSendingImage] = useState(false);
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load ticket ID on init
  useEffect(() => {
    const saved = localStorage.getItem('gangre_tid');
    if (saved && saved !== 'null' && saved !== 'undefined' && !ticketId) {
      setTicketId(saved);
    }
  }, [ticketId, setTicketId]);

  // Fetch chat messages
  const fetchMessages = async () => {
    if (!ticketId || ticketId === 'null' || ticketId === 'undefined') return;
    try {
      const res = await fetch(`/api/get-chat?ticketId=${encodeURIComponent(ticketId)}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        
        // Count unread admin messages
        if (!isOpen) {
          const unread = data.filter((m: ChatMessage) => m.sender === 'admin' && !m.is_read).length;
          setUnreadCount(unread);
        }
      }
    } catch (err: any) {
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        console.warn('Chat service temporarily unavailable (reconnecting...)');
      } else {
        console.error('Error fetching chat:', err);
      }
    }
  };

  // Poll for messages
  useEffect(() => {
    if (ticketId) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 4000);
      return () => clearInterval(interval);
    }
  }, [ticketId, isOpen]);

  // Clear unread count when chat is opened
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      // Mark messages as read by admin request
      if (ticketId) {
        fetch(`/api/get-chat?ticketId=${encodeURIComponent(ticketId)}`);
      }
    }
  }, [isOpen, ticketId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // Create temporary ticket ID for generic chats
  const ensureTicketId = async () => {
    if (ticketId) return ticketId;
    const newId = `CHT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    
    // Auto submit basic placeholder ticket to keep reference in db
    try {
      await fetch('/api/submit-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: newId,
          device: lang === 'bn' ? 'লাইভ চ্যাট থেকে' : 'From Live Chat',
          tags: '',
          estimate: lang === 'bn' ? 'আলোচনা সাপেক্ষে' : 'To be discussed',
          name: lang === 'bn' ? 'চ্যাট কাস্টমার' : 'Chat Customer',
          phone: '',
          address: '',
          status: 'New'
        })
      });
      localStorage.setItem('gangre_tid', newId);
      setTicketId(newId);
      return newId;
    } catch (e) {
      console.error('Error creating chat session:', e);
      return newId;
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend !== undefined ? textToSend : inputValue.trim();
    if (!text) return;

    if (textToSend === undefined) {
      setInputValue('');
    }

    const currentTid = await ensureTicketId();

    // Optimistically add user message
    const tempMsg: ChatMessage = {
      id: Date.now(),
      ticket_id: currentTid,
      sender: 'user',
      message: text,
      image_url: null,
      is_read: false,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const res = await fetch('/api/send-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: currentTid,
          message: text,
          sender: 'user'
        })
      });

      if (res.ok) {
        fetchMessages();
      }

      // Automated FAQ answer matching
      const query = text.toLowerCase();
      const matchedFaq = faq.find(f => 
        f.keywords.some(kw => query.includes(kw.toLowerCase()))
      );

      if (matchedFaq) {
        setTimeout(() => {
          const botMsg: ChatMessage = {
            id: Date.now() + 1,
            ticket_id: currentTid,
            sender: 'admin',
            message: matchedFaq.reply,
            image_url: null,
            is_read: true,
            created_at: new Date().toISOString()
          };
          setMessages(prev => [...prev, botMsg]);
        }, 1000);
      }
    } catch (err) {
      console.error('Error sending chat message:', err);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const currentTid = await ensureTicketId();
    setIsSendingImage(true);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('ticketId', currentTid);
    formData.append('sender', 'user');
    formData.append('message', lang === 'bn' ? '📷 ছবি যুক্ত করা হয়েছে' : '📷 Image attached');

    try {
      const res = await fetch('/api/send-chat', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        fetchMessages();
      }
    } catch (err) {
      console.error('Error uploading chat image:', err);
    } finally {
      setIsSendingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      {/* Chat Launcher Button */}
      <button
        id="chatBtn"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-40 bg-green-500 hover:bg-green-600 text-white p-3.5 rounded-full shadow-lg transition-transform duration-200 hover:scale-105 flex items-center justify-center cursor-pointer"
        aria-label="Toggle chat support"
      >
        <MessageCircle size={24} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div
          id="chatPanel"
          className="fixed bottom-20 right-4 z-40 w-[350px] sm:w-[380px] h-[480px] bg-white rounded-xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden transition-all duration-300"
        >
          {/* Header */}
          <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
              <span className="font-semibold text-gray-800 text-sm">
                {chatHelloText || (lang === 'bn' ? 'গাংরে লাইভ সাপোর্ট' : 'Gangre Live Support')}
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            >
              <X size={18} />
            </button>
          </div>

          {/* Ticket Reference Info if available */}
          {ticketId && (
            <div className="bg-green-50 px-4 py-1.5 border-b border-green-100 text-[11px] text-green-700 font-mono flex justify-between">
              <span>ID: {ticketId}</span>
              <span className="font-sans font-medium text-green-600">
                {lang === 'bn' ? 'সংযুক্ত টিকিট' : 'Linked Ticket'}
              </span>
            </div>
          )}

          {/* Chat Messages */}
          <div
            ref={chatBodyRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50"
          >
            {/* Welcome Bot Message */}
            <div className="flex justify-start">
              <div className="bg-white border border-gray-100 text-gray-800 px-3 py-2 rounded-lg rounded-tl-none max-w-[85%] text-xs shadow-sm">
                {chatHelloText || (lang === 'bn' ? 'স্বাগতম! আমরা পুরনো বা ভাঙা মোবাইল ফোন কিনি। আপনার ফোন ব্র্যান্ড ও মডেল সিলেক্ট করে দাম জানতে পারেন বা সরাসরি প্রশ্ন করতে পারেন। 😊' : 'Welcome! We buy used & broken mobile phones. You can estimate your device value or ask questions here. 😊')}
              </div>
            </div>

            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`px-3 py-2 rounded-lg max-w-[85%] text-xs shadow-sm ${
                    m.sender === 'user'
                      ? 'bg-green-500 text-white rounded-tr-none'
                      : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                  }`}
                >
                  {m.message && <p className="leading-relaxed whitespace-pre-line">{m.message}</p>}
                  {m.image_url && (
                    <img
                      src={m.image_url}
                      alt="Attachment"
                      className="mt-1.5 max-w-[180px] rounded border border-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(m.image_url!, '_blank')}
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <span
                    className={`block text-[9px] mt-1 text-right leading-none ${
                      m.sender === 'user' ? 'text-green-100' : 'text-gray-400'
                    }`}
                  >
                    {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
              </div>
            ))}

            {isSendingImage && (
              <div className="flex justify-end">
                <div className="bg-green-400 text-white px-3 py-2 rounded-lg rounded-tr-none text-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                  {lang === 'bn' ? 'ছবি পাঠানো হচ্ছে...' : 'Uploading image...'}
                </div>
              </div>
            )}
          </div>

          {/* Quick Replies */}
          {messages.length === 0 && faq.length > 0 && (
            <div className="p-2 border-t border-gray-100 bg-white flex gap-1.5 overflow-x-auto whitespace-nowrap">
              {faq.slice(0, 3).map((f) => (
                <button
                  key={f.id}
                  onClick={() => handleSendMessage(f.keywords[0])}
                  className="bg-gray-100 hover:bg-green-50 hover:text-green-600 text-gray-600 text-[11px] font-medium px-2.5 py-1 rounded-full transition-colors cursor-pointer border border-transparent hover:border-green-200"
                >
                  {f.quickReplies?.[0] || f.keywords[0]}
                </button>
              ))}
            </div>
          )}

          {/* Input Panel */}
          <div className="p-2.5 border-t border-gray-100 bg-white flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
              title={lang === 'bn' ? 'ছবি যুক্ত করুন' : 'Attach Photo'}
            >
              <Image size={18} />
            </button>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              placeholder={chatPlaceholder || (lang === 'bn' ? 'বার্তা লিখুন...' : 'Type message...')}
              className="flex-1 bg-gray-50 border border-gray-200 text-gray-800 text-xs px-3.5 py-2.5 rounded-lg outline-none focus:border-green-400 focus:bg-white transition-all font-sans"
            />
            <button
              onClick={() => handleSendMessage()}
              className="bg-green-500 hover:bg-green-600 text-white p-2.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center shadow-md hover:shadow-lg"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
