"use client";

import {
  Plus,
  Search,
  MoreHorizontal,
  Send,
  Paperclip,
  Smile,
  Circle,
  Bot,
  MessageSquare,
  ShieldCheck,
  Globe,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { LandingHeader, LandingFooter } from "@/components/landing-layout";

function ChatContact({ name, lastMsg, time, online, active, unread }: { 
  name: string, lastMsg: string, time: string, online?: boolean, active?: boolean, unread?: number 
}) {
  return (
    <div className={`p-4 rounded-xl flex items-center gap-4 cursor-pointer transition-all ${active ? 'bg-[#00e676]/10 border border-[#00e676]/20' : 'hover:bg-white/[0.02] border border-transparent hover:border-white/5'}`}>
      <div className="relative">
        <div className="size-12 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center text-sm font-bold text-zinc-400">
          {name.split(' ').map(n => n[0]).join('')}
        </div>
        {online && <Circle size={10} className="absolute bottom-0 right-0 fill-[#00e676] text-[#00e676]" />}
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="flex justify-between items-center mb-1">
          <span className={`text-sm font-bold ${active ? 'text-white' : 'text-zinc-200'}`}>{name}</span>
          <span className="text-[10px] text-zinc-500">{time}</span>
        </div>
        <p className={`text-xs truncate ${unread ? 'text-white font-medium' : 'text-zinc-500'}`}>{lastMsg}</p>
      </div>
      {unread && (
        <div className="size-5 rounded-full bg-[#00e676] flex items-center justify-center text-[10px] font-bold text-black">
          {unread}
        </div>
      )}
    </div>
  );
}

export default function Chat() {
  const [activeContact, setActiveContact] = useState('CE');

  return (
    <div className="bg-[#050505] text-white min-h-screen font-sans selection:bg-[#00e676] selection:text-black">
      <LandingHeader />

      <main className="pt-32 pb-20 px-6 lg:px-8 max-w-7xl mx-auto relative">
        {/* Background Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-[#00e676]/5 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-16 relative z-10">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-bold mb-6"
            >
              <MessageSquare size={14} />
              <span>KESİNTİSİZ İLETİŞİM</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6"
            >
              Ekibinizle <br /><span className="text-[#00e676]">Gerçek Zamanlı</span> Bağlanın
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-zinc-400"
            >
              Projeleriniz üzerinde tartışın, dosya paylaşın ve AI asistanınızla mesajlaşarak iş akışınızı hızlandırın.
            </motion.p>
          </div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col gap-3"
          >
            <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">
              <Zap size={14} className="text-[#00e676]" />
              AI Destekli Sohbet Aktif
            </div>
            <div className="flex gap-4">
              <div className="flex -space-x-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className="size-8 rounded-full border-2 border-[#050505] bg-zinc-800"></div>
                ))}
              </div>
              <div className="text-xs text-zinc-500 font-medium">
                <span className="text-white font-bold">12 Kişi</span> şu an çevrimiçi
              </div>
            </div>
          </motion.div>
        </div>

        {/* Chat Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-20 relative z-10">
          {[
            { label: 'Günlük Mesaj', value: '1.2k', sub: '+12% Bugün', color: 'text-white' },
            { label: 'Aktif Kanallar', value: '12', sub: '3 Yeni Proje', color: 'text-[#00e676]' },
            { label: 'Yanıt Süresi', value: '2.4s', sub: 'AI Hızında', color: 'text-blue-400' },
            { label: 'Dosya Paylaşımı', value: '450MB', sub: 'Son 24 Saat', color: 'text-purple-400' }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-sm"
            >
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">{stat.label}</div>
              <div className={`text-3xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
              <div className="text-[10px] font-medium text-zinc-600 uppercase">{stat.sub}</div>
            </motion.div>
          ))}
        </div>

        {/* Chat Application Interface */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#0a0a0a] border border-white/5 rounded-[32px] overflow-hidden flex flex-col lg:flex-row min-h-[500px] lg:h-[700px] shadow-2xl relative z-10"
        >
          {/* Sidebar */}
          <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col bg-white/[0.01]">
            <div className="p-6 border-b border-white/5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">Mesajlar</h3>
                <button className="size-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400 hover:text-[#00e676] hover:bg-[#00e676]/10 transition-all">
                  <Plus size={18} />
                </button>
              </div>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#00e676] transition-colors" size={16} />
                <input 
                  type="text" 
                  placeholder="Kişi veya grup ara..."
                  className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[#00e676]/50 transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              <div onClick={() => setActiveContact('CE')}>
                <ChatContact 
                  name="Caner Erden" 
                  lastMsg="Tasarım revizyonlarını tamamladım..." 
                  time="10:42" 
                  online={true} 
                  active={activeContact === 'CE'}
                />
              </div>
              <div onClick={() => setActiveContact('AY')}>
                <ChatContact 
                  name="Ahmet Yılmaz" 
                  lastMsg="WhatsApp API dökümanları hazır." 
                  time="Dün" 
                  unread={2}
                  active={activeContact === 'AY'}
                />
              </div>
              <div onClick={() => setActiveContact('ED')}>
                <ChatContact 
                  name="Elif Demir" 
                  lastMsg="Pazartesi günü toplantı?" 
                  time="Dün" 
                  online={true}
                  active={activeContact === 'ED'}
                />
              </div>
              <div onClick={() => setActiveContact('ME')}>
                <ChatContact 
                  name="Marketing Ekibi" 
                  lastMsg="Selin: Yeni kampanya görselleri..." 
                  time="2 gün önce"
                  active={activeContact === 'ME'}
                />
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-[#050505]/50">
            {/* Chat Header */}
            <div className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#0a0a0a]/50 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center text-sm font-bold text-zinc-400">
                  {activeContact}
                </div>
                <div>
                  <div className="text-sm font-bold text-white">
                    {activeContact === 'CE' ? 'Caner Erden' : activeContact === 'AY' ? 'Ahmet Yılmaz' : 'Sohbet'}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#00e676]">
                    <Circle size={8} className="fill-[#00e676]" />
                    <span>Çevrimiçi</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button className="text-zinc-500 hover:text-white transition-colors">
                  <Search size={18} />
                </button>
                <button className="text-zinc-500 hover:text-white transition-colors">
                  <MoreHorizontal size={18} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="flex justify-center">
                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">Bugün</span>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex gap-4 max-w-[70%]">
                  <div className="size-8 rounded-full bg-zinc-800 shrink-0 flex items-center justify-center text-[10px] font-bold text-zinc-500">CE</div>
                  <div className="bg-white/5 border border-white/5 p-4 rounded-2xl rounded-tl-none">
                    <p className="text-sm text-zinc-300 leading-relaxed">Selam, Dashboard UI tasarımlarındaki son revizyonları tamamladım. Yeni renk paletini ve ikon setini uyguladım.</p>
                    <span className="text-[9px] text-zinc-600 mt-2 block">10:40</span>
                  </div>
                </div>

                <div className="flex gap-4 max-w-[70%] self-end flex-row-reverse">
                  <div className="size-8 rounded-full bg-[#00e676] shrink-0 flex items-center justify-center text-[10px] font-bold text-black">MO</div>
                  <div className="bg-[#00e676]/10 border border-[#00e676]/20 p-4 rounded-2xl rounded-tr-none">
                    <p className="text-sm text-white leading-relaxed">Harika görünüyor! Özellikle kart tasarımlarındaki blur efektleri çok modern olmuş. Eline sağlık.</p>
                    <span className="text-[9px] text-[#00e676]/60 mt-2 block text-right">10:42</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Input Area */}
            <div className="p-6 bg-[#0a0a0a]/50 backdrop-blur-md border-t border-white/5">
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-2 flex items-end gap-2 focus-within:border-[#00e676]/30 transition-all">
                <button className="p-2.5 text-zinc-500 hover:text-[#00e676] transition-colors">
                  <Paperclip size={20} />
                </button>
                <textarea 
                  placeholder="Bir mesaj yazın..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-white py-2.5 resize-none h-[42px] max-h-32"
                />
                <button className="p-2.5 text-zinc-500 hover:text-[#00e676] transition-colors">
                  <Smile size={20} />
                </button>
                <button className="p-2.5 bg-[#00e676] text-black rounded-xl hover:scale-105 transition-transform">
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mt-32 grid md:grid-cols-3 gap-8 relative z-10">
          {[
            { 
              icon: <Bot className="text-purple-400" />, 
              title: "AI Entegrasyonu", 
              desc: "Mesajlaşırken yapay zekadan yardım alın, toplantı notlarını özetleyin." 
            },
            { 
              icon: <ShieldCheck className="text-[#00e676]" />, 
              title: "Uçtan Uca Şifreleme", 
              desc: "Tüm verileriniz ve görüşmeleriniz en yüksek güvenlik standartlarıyla korunur." 
            },
            { 
              icon: <Globe className="text-blue-400" />, 
              title: "Grup Kanalları", 
              desc: "Projelerinize özel kanallar oluşturun, tüm ekibi tek bir noktada toplayın." 
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-[32px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group"
            >
              <div className="size-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
