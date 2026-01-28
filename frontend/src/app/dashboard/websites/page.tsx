"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Plus, Globe, ExternalLink, RefreshCw, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

interface WordpressSite {
  id: string;
  siteUrl: string;
  apiKey: string;
  isActive: boolean;
  lastSyncAt: string | null;
  customerId: string | null;
  customer?: { id: string; name: string };
  createdAt: string;
}

interface Customer {
  id: string;
  name: string;
}

export default function WebsitesPage() {
  const { user } = useAuth();
  const [sites, setSites] = useState<WordpressSite[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({
    siteUrl: "",
    apiKey: "",
    connectionCode: "",
    customerId: "",
    method: "code" as "code" | "manual",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sitesRes, customersRes] = await Promise.all([
        api.get("/wordpress-sites"),
        api.get("/customers"),
      ]);
      setSites(sitesRes.data || []);
      setCustomers(customersRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.siteUrl) return;
    
    // Doğrulama: Ya kod ya da API key dolu olmalı
    if (form.method === 'code' && !form.connectionCode) {
        toast.error("Lütfen bağlantı kodunu girin.");
        return;
    }
    if (form.method === 'manual' && !form.apiKey) {
        toast.error("Lütfen API anahtarını girin.");
        return;
    }

    try {
      const payload = {
        siteUrl: form.siteUrl,
        customerId: form.customerId,
        // Yönteme göre doğru veriyi gönder
        ...(form.method === 'code' ? { connectionCode: form.connectionCode } : { apiKey: form.apiKey }),
      };

      await api.post("/wordpress-sites", payload);
      setIsCreateOpen(false);
      setForm({ siteUrl: "", apiKey: "", connectionCode: "", customerId: "", method: "code" });
      fetchData();
      toast.success("Site başarıyla eklendi.");
    } catch (e: any) {
      console.error(e);
      const msg = e.response?.data?.message || "Site eklenirken hata oluştu.";
      toast.error(msg);
    }
  };

  const filteredSites = sites.filter((site) => 
    site.siteUrl.toLowerCase().includes(search.toLowerCase()) || 
    site.customer?.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDownloadPlugin = async () => {
    try {
      // Backend URL'ini dinamik al
      const baseUrl = api.defaults.baseURL || 'http://localhost:3001';
      const downloadUrl = `${baseUrl}/wordpress-sites/download-plugin`;
      
      // Yeni sekmede açmayı dene (bazı tarayıcılar için daha güvenli)
      window.open(downloadUrl, '_blank');
      
      toast.success('Eklenti indirme başlatıldı.');
    } catch (error) {
      console.error('İndirme hatası:', error);
      toast.error('Eklenti indirilemedi.');
    }
  };

  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">WordPress Siteleri</h1>
          <p className="text-muted-foreground">Müşterilerinizin WordPress sitelerini yönetin ve içerik üretin.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" onClick={handleDownloadPlugin} className="gap-2">
            <Download className="h-4 w-4" />
            Eklentiyi İndir (MOI Port)
          </Button>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Yeni Site Ekle
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Site veya müşteri ara..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 h-40 animate-pulse bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSites.map((site) => (
            <Card key={site.id} className="p-6 flex flex-col gap-4 hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold truncate max-w-[200px]" title={site.siteUrl}>
                      {site.siteUrl.replace(/^https?:\/\//, '')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {site.customer?.name || "Ajans Sitesi"}
                    </p>
                  </div>
                </div>
                <div className={`w-2 h-2 rounded-full ${site.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
              </div>

              <div className="mt-auto pt-4 border-t flex items-center justify-between">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" />
                  {site.lastSyncAt ? new Date(site.lastSyncAt).toLocaleDateString() : 'Senkronize edilmedi'}
                </div>
                <Link href={`/dashboard/websites/${site.id}`}>
                  <Button variant="outline" size="sm" className="gap-2">
                    Yönet <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
          
          {filteredSites.length === 0 && (
            <div className="col-span-full py-12 text-center border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">Henüz eklenmiş bir site yok.</p>
            </div>
          )}
        </div>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>WordPress Sitesi Ekle</DialogTitle>
            <DialogDescription>
              WordPress eklentisindeki bağlantı kodunu veya API anahtarını kullanarak sitenizi ekleyin.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Site Adresi (URL)</Label>
              <Input
                required
                placeholder="https://ornek-site.com"
                value={form.siteUrl}
                onChange={(e) => setForm({ ...form, siteUrl: e.target.value })}
              />
            </div>

            <div className="space-y-2">
               <div className="flex items-center gap-4 text-sm mb-2">
                  <Label>Bağlantı Yöntemi:</Label>
                  <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="radio" 
                            name="method" 
                            checked={form.method === 'code'} 
                            onChange={() => setForm({...form, method: 'code'})}
                          />
                          Otomatik (Kod ile)
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="radio" 
                            name="method" 
                            checked={form.method === 'manual'} 
                            onChange={() => setForm({...form, method: 'manual'})}
                          />
                          Manuel (API Key)
                      </label>
                  </div>
               </div>
            </div>

            {form.method === 'code' ? (
                <div className="space-y-2">
                <Label>Bağlantı Kodu</Label>
                <Input
                    required
                    placeholder="WordPress panelindeki 6 haneli kodu girin..."
                    value={form.connectionCode}
                    onChange={(e) => setForm({ ...form, connectionCode: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                    WordPress panelinizde <strong>Ayarlar &gt; MOI Port</strong> sayfasında gördüğünüz kodu buraya girin.
                </p>
                </div>
            ) : (
                <div className="space-y-2">
                <Label>API Anahtarı</Label>
                <Input
                    required
                    type="password"
                    placeholder="wp_plugin_secret_key..."
                    value={form.apiKey}
                    onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                />
                </div>
            )}
            
            <div className="space-y-2">
              <Label>Müşteri (Opsiyonel)</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={form.customerId}
                onChange={(e) => setForm({ ...form, customerId: e.target.value })}
              >
                <option value="">Ajans (Kendim)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
                İptal
              </Button>
              <Button type="submit">Ekle</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
