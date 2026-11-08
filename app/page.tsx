'use client';

import React, { useState } from 'react';

export default function Home() {
  const [lang, setLang] = useState<'bn' | 'en'>('bn'); // Default language set to Bengali
  const [activeTab, setActiveTab] = useState<'chat' | 'form'>('chat');
  const [query, setQuery] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      text: lang === 'bn' 
        ? 'হ্যালো! আমি ঢাকাতে আপনার প্রয়োজনীয় মেডিকেল টেস্ট এবং হাসপাতাল খুঁজতে সাহায্য করতে পারি। আপনার কোন পরীক্ষাটি দরকার, কোথায় এবং কোন এলাকার হাসপাতাল খুঁজছেন?' 
        : 'Hello! I can help you find a hospital and doctor for medical tests in Dhaka. What test do you need, where, and do you prefer a female or male doctor?'
    }
  ]);

  // Real database test categories (USG, X-Ray, etc.)
  const realTests = [
    { id: 'usg', nameBn: 'আল্ট্রাসনোগ্রাফি (USG)', nameEn: 'Ultrasonography (USG)' },
    { id: 'xray', nameBn: 'এক্স-রে (X-Ray)', nameEn: 'X-ray' },
    { id: 'blood', nameBn: 'ব্লাড টেস্ট (Blood Test)', nameEn: 'Blood Test' }
  ];

  return (
    <main className="min-h-screen bg-[#D1DBE0] text-[#010508] font-sans">
      {/* Top Header Navigation */}
      <header className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-white/60">
        <div className="flex items-center gap-3">
          <div className="bg-[#010508] text-white px-3 py-1.5 rounded-full text-xs font-bold">
            HealthMatch BD
          </div>
          <span className="text-sm font-semibold text-[#51575D]">
            {lang === 'bn' ? 'হাসপাতাল ও টেস্ট ফাইন্ডার' : 'Hospital & Test Finder'}
          </span>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center bg-[#E4E9EC] p-1 rounded-full border border-white">
          <button 
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'chat' ? 'bg-[#010508] text-white shadow-sm' : 'text-[#51575D]'}`}
          >
            {lang === 'bn' ? 'বাংলা ম্যাচ চ্যাট' : 'Bengali Match Chat'}
          </button>
          <button 
            onClick={() => setActiveTab('form')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'form' ? 'bg-[#010508] text-white shadow-sm' : 'text-[#51575D]'}`}
          >
            {lang === 'bn' ? 'ফর্ম সার্চ' : 'Form Search'}
          </button>
        </div>

        {/* Language Switcher */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setLang('en')}
            className={`px-3 py-1 rounded-full text-xs font-bold ${lang === 'en' ? 'bg-[#010508] text-white' : 'bg-white text-[#51575D]'}`}
          >
            EN
          </button>
          <button 
            onClick={() => setLang('bn')}
            className={`px-3 py-1 rounded-full text-xs font-bold ${lang === 'bn' ? 'bg-[#010508] text-white' : 'bg-white text-[#51575D]'}`}
          >
            বাংলা
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        {activeTab === 'chat' ? (
          <div className="bg-white/90 backdrop-blur-md rounded-[32px] p-6 shadow-xl border border-white/80">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-extrabold tracking-tight text-[#010508]">
                {lang === 'bn' ? 'সঠিক ডাক্তার ও পরীক্ষা খুঁজুন সহজে' : 'Find the right test & hospital comfortably'}
              </h1>
              <p className="text-sm text-[#51575D] mt-1">
                {lang === 'bn' ? 'বাংলা বা ইংরেজিতে আপনার প্রয়োজনীয় পরীক্ষা বা হাসপাতালের কথা লিখুন।' : 'Tell me what test or hospital you need, in Bangla or English.'}
              </p>
            </div>

            {/* Chat Messages */}
            <div className="space-y-4 mb-6 max-h-[350px] overflow-y-auto p-4 bg-[#E4E9EC]/50 rounded-[24px]">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] p-4 rounded-[20px] text-sm ${msg.role === 'assistant' ? 'bg-white text-[#010508] shadow-sm' : 'bg-[#010508] text-white'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div className="flex items-center gap-3 bg-white border border-[#D1DBE0] rounded-full px-5 py-3 shadow-sm">
              <input 
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={lang === 'bn' ? 'যেমন: আজিমপুরে আল্ট্রাসনোগ্রাফি কোথায় পাবো?' : 'Type your request in English or Bangla...'}
                className="flex-1 bg-transparent border-none outline-none text-sm text-[#010508]"
              />
              <button 
                onClick={() => {
                  if (!query.trim()) return;
                  setChatMessages(prev => [...prev, { role: 'user', text: query }]);
                  const userQ = query;
                  setQuery('');
                  setTimeout(() => {
                    setChatMessages(prev => [...prev, { 
                      role: 'assistant', 
                      text: lang === 'bn' 
                        ? `আপনার অনুসন্ধানের জন্য "${userQ}"-এর ডেটাবেস ফলাফল যাচাই করা হচ্ছে...` 
                        : `Searching database for "${userQ}"...` 
                    }]);
                  }, 600);
                }}
                className="bg-[#010508] text-white px-5 py-2.5 rounded-full text-xs font-bold hover:opacity-90 transition-opacity"
              >
                {lang === 'bn' ? 'পাঠ পাঠান' : 'Send'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white/90 backdrop-blur-md rounded-[32px] p-8 shadow-xl border border-white/80">
            <h2 className="text-xl font-extrabold mb-4 text-[#010508]">
              {lang === 'bn' ? 'ডাটাবেস ভিত্তিক ফর্ম সার্চ' : 'Database Form Search'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#51575D] uppercase tracking-wider mb-2">
                  {lang === 'bn' ? 'পরীক্ষা / টেস্ট নির্বাচন করুন' : 'Select Exam / Test'}
                </label>
                <select className="w-full bg-[#E4E9EC] border border-[#D1DBE0] rounded-2xl p-3.5 text-sm outline-none">
                  {realTests.map(test => (
                    <option key={test.id} value={test.id}>
                      {lang === 'bn' ? test.nameBn : test.nameEn}
                    </option>
                  ))}
                </select>
              </div>
              <button className="w-full bg-[#010508] text-white py-4 rounded-full font-bold text-sm shadow-md hover:opacity-90 transition-opacity mt-4">
                {lang === 'bn' ? 'অনুসন্ধান করুন' : 'Search Database'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
