'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Plus, Search, Trash2, Edit2, ExternalLink, Mail, Phone, Users, Briefcase, Wallet, Check, TrendingUp, ArrowUpRight, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  _count?: {
    projects: number;
  };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data);
    } catch (error) {
      console.error('Müşteriler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/customers', formData);
      setIsModalOpen(false);
      setFormData({ name: '', email: '', phone: '' });
      fetchCustomers();
    } catch (error) {
      console.error('Müşteri oluşturulamadı:', error);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm('Bu müşteriyi silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/customers/${id}`);
      fetchCustomers();
    } catch (error) {
      console.error('Müşteri silinemedi:', error);
    }
  };

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    { label: "Toplam Müşteri", value: customers.length, icon: <Users size={20} />, trend: "+12" },
    { label: "Aktif Projeler", value: customers.reduce((acc, c) => acc + (c._count?.projects || 0), 0), icon: <Briefcase size={20} />, trend: "+5" },
    { label: "Yeni Müşteriler", value: "8", icon: <TrendingUp size={20} />, trend: "+2" },
    { label: "Ort. Memnuniyet", value: "4.9/5", icon: <Check size={20} />, trend: "0.0" },
  ];

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold mb-4 uppercase tracking-widest dark:bg-slate-800 dark:text-slate-300"
          >
            <Users size={12} />
            <span>MÜŞTERİ YÖNETİMİ</span>
          </motion.div>
          <h1 className="text-[36px] font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Müşteriler
          </h1>
          <p className="text-slate-500 text-sm mt-2 dark:text-slate-400">
            Müşteri portföyünüzü ve iletişim bilgilerini yönetin.
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-6 h-11 text-sm font-bold transition-all shadow-lg shadow-slate-200 dark:shadow-slate-900/40"
        >
          <Plus className="h-4 w-4" />
          Yeni Müşteri
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-sm group dark:bg-slate-900 dark:border-slate-700 dark:hover:border-slate-600"
          >
            <div className="flex items-center gap-3 text-slate-500 mb-4">
              <div className="p-2 rounded-lg bg-slate-50 text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition-colors dark:bg-slate-800 dark:text-slate-200">
                {stat.icon}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {stat.label}
              </span>
            </div>
            <div className="flex items-end justify-between">
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{stat.value}</div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full dark:bg-emerald-900/30 dark:text-emerald-300">
                <ArrowUpRight size={10} />
                {stat.trend}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/30 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Müşteri veya e-posta ara..."
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-12 pr-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:focus:ring-slate-700/40"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button variant="ghost" className="text-xs font-bold text-slate-500 dark:text-slate-300">
              Filtrele
            </Button>
            <Button variant="ghost" className="text-xs font-bold text-slate-500 dark:text-slate-300">
              Dışa Aktar
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900">
                <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest dark:text-slate-400">Müşteri</th>
                <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest dark:text-slate-400">E-posta</th>
                <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest dark:text-slate-400">Telefon</th>
                <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest dark:text-slate-400">Proje</th>
                <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right dark:text-slate-400">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-slate-400 dark:text-slate-500">Yükleniyor...</td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-slate-400 dark:text-slate-500">Müşteri bulunamadı.</td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group dark:border-slate-800 dark:hover:bg-slate-800/50"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[11px] font-bold text-slate-500 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300">
                          {customer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors dark:text-slate-50 dark:group-hover:text-blue-400">
                          {customer.name}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <Mail size={12} className="text-slate-400 dark:text-slate-500" />
                        {customer.email || '-'}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <Phone size={12} className="text-slate-400 dark:text-slate-500" />
                        {customer.phone || '-'}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold dark:bg-blue-900/30 dark:text-blue-300">
                        <Briefcase size={10} />
                        {customer._count?.projects || 0} Proje
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/dashboard/customers/${customer.id}`}>
                          <button className="size-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-50">
                            <ExternalLink size={14} />
                          </button>
                        </Link>
                        <button
                          onClick={() => handleDeleteCustomer(customer.id)}
                          className="size-8 rounded-lg bg-red-50 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-100 transition-all dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-900/50 dark:hover:text-red-300"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl border border-slate-100 dark:bg-slate-900 dark:border-slate-700"
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-6 dark:text-slate-50">
              Yeni Müşteri Ekle
            </h2>
            <form onSubmit={handleCreateCustomer} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 dark:text-slate-400">
                  Müşteri Adı / Şirket
                </label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:focus:ring-slate-700/40 dark:focus:border-slate-500"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Örn: Acme Inc."
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 dark:text-slate-400">
                  E-posta
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:focus:ring-slate-700/40 dark:focus:border-slate-500"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ornek@sirket.com"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 dark:text-slate-400">
                  Telefon
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:focus:ring-slate-700/40 dark:focus:border-slate-500"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+90 (5XX) XXX XX XX"
                />
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-xl px-6 h-11 text-sm font-bold text-slate-500 dark:text-slate-300"
                  onClick={() => setIsModalOpen(false)}
                >
                  İptal
                </Button>
                <Button 
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-8 h-11 text-sm font-bold transition-all"
                >
                  Müşteri Oluştur
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
