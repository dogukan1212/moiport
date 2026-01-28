"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api, { getBaseURL } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  Sparkles, 
  Image as ImageIcon, 
  Send, 
  Save, 
  RefreshCw,
  Loader2,
  Check,
  ExternalLink,
  Search,
  BrainCircuit,
  Settings2,
  Trash2,
  Pencil
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function WebsiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [site, setSite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Analysis State
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);

  // Content State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [titleMode, setTitleMode] = useState<"suggest" | "custom">("suggest");
  const [suggestedTitles, setSuggestedTitles] = useState<string[]>([]);
  const [isSuggestingTitles, setIsSuggestingTitles] = useState(false);
  
  // Scheduling State
  const [date, setDate] = useState<Date>();
  
  // Options
  const [articleLength, setArticleLength] = useState<"SHORT" | "MEDIUM" | "LONG">("MEDIUM");
  const [aiModel, setAiModel] = useState("gemini-1.5-flash");
  
  // Image State
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageQuery, setImageQuery] = useState("");
  const [images, setImages] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [isSearchingImages, setIsSearchingImages] = useState(false);
  
  // Categories State
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // Tags State
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const [kpi, setKpi] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const [isEditPostOpen, setIsEditPostOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editStatus, setEditStatus] = useState<"draft" | "publish" | "future">(
    "draft",
  );
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editTagInput, setEditTagInput] = useState("");
  const [editSelectedCategories, setEditSelectedCategories] = useState<string[]>(
    [],
  );
  const [editFeaturedImageUrl, setEditFeaturedImageUrl] = useState("");
  const [editDate, setEditDate] = useState<Date>();
  const [isEditImageModalOpen, setIsEditImageModalOpen] = useState(false);
  const [editImageQuery, setEditImageQuery] = useState("");
  const [editImages, setEditImages] = useState<any[]>([]);
  const [editSelectedImage, setEditSelectedImage] = useState<any>(null);
  const [isSearchingEditImages, setIsSearchingEditImages] = useState(false);
  const [isUploadingEditImage, setIsUploadingEditImage] = useState(false);

  useEffect(() => {
    if (params.id) {
        fetchSite();
        fetchCategories();
        fetchKpi();
        fetchPosts();
    }
  }, [params.id]);

  const fetchKpi = async () => {
    try {
      const res = await api.get(`/wordpress-sites/${params.id}/kpi`);
      setKpi(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const res = await api.get(`/wordpress-sites/${params.id}/posts`);
      setPosts(res.data || []);
    } catch (e) {
      console.error(e);
      toast.error("Gönderilen yazılar alınamadı");
    } finally {
      setLoadingPosts(false);
    }
  };

  const fetchCategories = async () => {
      try {
          const res = await api.get(`/wordpress-sites/${params.id}/categories`);
          setCategories(res.data || []);
      } catch (e) {
          console.error(e);
          toast.error("Kategoriler alınamadı");
      }
  };

  const fetchSite = async () => {
    try {
      const res = await api.get(`/wordpress-sites/${params.id}`);
      setSite(res.data);
      
      // Load saved analysis if exists
      if (res.data.siteAnalysis) {
          try {
              const analysis = typeof res.data.siteAnalysis === 'string' 
                ? JSON.parse(res.data.siteAnalysis) 
                : res.data.siteAnalysis;
              setAnalysisData(analysis);
          } catch (e) {
              console.error("Failed to parse saved analysis", e);
          }
      }
    } catch (e) {
      console.error(e);
      toast.error("Site bilgileri alınamadı");
    } finally {
      setLoading(false);
    }
  };

  const analyzeSite = async () => {
    setAnalyzing(true);
    try {
        const res = await api.post("/ai/analyze-site", {
            url: site.siteUrl,
            deepSearch: true,
            siteId: site.id
        });
        setAnalysisData(res.data);
        toast.success("Site analizi tamamlandı ve kaydedildi");
    } catch (e: any) {
        console.error(e);
        const msg = e?.response?.data?.message || "Site analizi başarısız oldu";
        toast.error(msg);
    } finally {
        setAnalyzing(false);
    }
  };

  const suggestTitles = async () => {
      if (!topic) return toast.warning("Lütfen bir konu/anahtar kelime girin");
      setIsSuggestingTitles(true);
      try {
          const res = await api.post("/ai/suggest-titles", {
              topic,
              context: analysisData ? JSON.stringify(analysisData) : undefined,
              aiModel
          });
          setSuggestedTitles(res.data.titles || []);
      } catch (e) {
          console.error(e);
          toast.error("Başlık önerilemedi");
      } finally {
          setIsSuggestingTitles(false);
      }
  };

  const generateContent = async () => {
    if (!title && titleMode === 'custom') return toast.warning("Lütfen bir başlık girin");
    if (!title && titleMode === 'suggest') return toast.warning("Lütfen bir başlık seçin veya oluşturun");
    
    setIsGenerating(true);
    try {
      const res = await api.post("/ai/generate-content", {
        type: "BLOG_POST",
        topic: title, // Use selected title as topic/instruction
        sector: analysisData?.niche || "General",
        context: analysisData ? JSON.stringify(analysisData) : undefined,
        tone: analysisData?.tone || "Professional",
        length: articleLength,
        aiModel
      });
      
      const result = res.data;
      if (typeof result === 'object') {
          setContent(result.content || result.html_content || "");
          if (result.tags && Array.isArray(result.tags)) {
              setTags(result.tags);
          }
      } else {
          setContent(result);
      }
      
      toast.success("İçerik oluşturuldu");
      
      // Auto suggest images based on title
      setImageQuery(title);
    } catch (e) {
      console.error(e);
      toast.error("İçerik oluşturulamadı");
    } finally {
      setIsGenerating(false);
    }
  };

  // ... (rest of image functions)
  const searchImages = async () => {
    if (!imageQuery) return;
    setIsSearchingImages(true);
    try {
      const res = await api.post("/ai/suggest-images", {
        query: imageQuery,
        perPage: 12,
        locale: "tr-TR"
      });
      setImages(res.data || []);
    } catch (e) {
      console.error(e);
      toast.error("Görsel aranırken hata oluştu");
    } finally {
      setIsSearchingImages(false);
    }
  };

  const searchEditImages = async () => {
    if (!editImageQuery) return;
    setIsSearchingEditImages(true);
    try {
      const res = await api.post("/ai/suggest-images", {
        query: editImageQuery,
        perPage: 12,
        locale: "tr-TR",
      });
      setEditImages(res.data || []);
    } catch (e) {
      console.error(e);
      toast.error("Görsel aranırken hata oluştu");
    } finally {
      setIsSearchingEditImages(false);
    }
  };

  const uploadEditImage = async (file: File) => {
    setIsUploadingEditImage(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await api.post("/chat/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data?.error) {
        toast.error(res.data.error);
        return;
      }
      const rel = String(res.data?.url || "");
      const base = getBaseURL().replace(/\/$/, "");
      const absolute = rel.startsWith("http") ? rel : `${base}${rel}`;
      setEditSelectedImage(null);
      setEditFeaturedImageUrl(absolute);
      toast.success("Görsel yüklendi");
    } catch (e: any) {
      console.error(e);
      const msg = e.response?.data?.message || "Görsel yüklenemedi";
      toast.error(msg);
    } finally {
      setIsUploadingEditImage(false);
    }
  };

  // Date selection handler to preserve time or set default time
  const handleDateSelect = (newDate: Date | undefined) => {
    if (!newDate) {
      setDate(undefined);
      return;
    }
    
    const now = new Date();
    const dateWithTime = new Date(newDate);
    
    if (date) {
      // Preserve existing time
      dateWithTime.setHours(date.getHours());
      dateWithTime.setMinutes(date.getMinutes());
    } else {
      // First time selection
      // Default to current time
      dateWithTime.setHours(now.getHours());
      dateWithTime.setMinutes(now.getMinutes());

      // If the resulting time is in the past (e.g. selected today but earlier time), add 1 hour
      if (dateWithTime < now) {
         dateWithTime.setHours(now.getHours() + 1);
      }
    }
    
    setDate(dateWithTime);
  };

  const publishToWordpress = async (status: "draft" | "publish" | "future") => {
    if (!title || !content) return toast.warning("Başlık ve içerik gerekli");
    
    // Schedule check
    if (status === 'future') {
        if (!date) {
            return toast.warning("Planlama için tarih seçmelisiniz");
        }
        if (date < new Date()) {
            return toast.warning("Geçmiş bir tarihe planlama yapamazsınız. Lütfen ileri bir tarih/saat seçin.");
        }
    }

    try {
      const cleanedTags = Array.from(
        new Set(tags.map((t) => t.trim()).filter((t) => t.length > 0)),
      );
      const payload: any = { 
        title, 
        content, 
        status, 
        featuredImage: selectedImage?.src?.large,
        categories: selectedCategories,
        tags: cleanedTags,
      };

      if (status === 'future' && date) {
          // Send UTC time to avoid timezone issues
          // toISOString returns something like 2024-01-27T12:00:00.000Z
          // We need YYYY-MM-DD HH:mm:ss
          const gmtDate = date.toISOString().slice(0, 19).replace('T', ' ');
          payload.date_gmt = gmtDate;
      }

      await api.post(`/wordpress-sites/${site.id}/posts`, payload);
      
      const successMsg = status === 'future' 
        ? `Yazı ${format(date!, 'd MMMM yyyy HH:mm', { locale: tr })} tarihine planlandı.`
        : `Yazı WordPress'e ${status === 'draft' ? 'taslak' : 'yayın'} olarak gönderildi.`;
        
      toast.success(successMsg);
      fetchKpi();
      fetchPosts();
    } catch (e: any) {
      console.error(e);
      const msg = e.response?.data?.message || "Gönderim başarısız";
      toast.error(msg);
    }
  };

  const statusLabel = (status: string) => {
    if (status === "publish") return "Yayın";
    if (status === "future") return "Planlı";
    if (status === "draft") return "Taslak";
    if (status === "trash") return "Çöp";
    return status;
  };

  const openEditPost = (post: any) => {
    setEditingPost(post);
    setEditTitle(post.title || "");
    setEditContent(post.content || "");
    setEditStatus((post.status as any) || "draft");
    try {
      const parsedTags = post.tags ? JSON.parse(post.tags) : [];
      setEditTags(Array.isArray(parsedTags) ? parsedTags : []);
    } catch {
      setEditTags([]);
    }
    try {
      const parsedCats = post.categories ? JSON.parse(post.categories) : [];
      const cats = Array.isArray(parsedCats) ? parsedCats : [];
      setEditSelectedCategories(cats.map((c: any) => String(c)));
    } catch {
      setEditSelectedCategories([]);
    }
    setEditFeaturedImageUrl(post.featuredImageUrl || "");
    setEditSelectedImage(null);
    setEditImages([]);
    setEditImageQuery(post.title || "");
    setEditDate(post.scheduledAt ? new Date(post.scheduledAt) : undefined);
    setIsEditPostOpen(true);
  };

  const updatePost = async () => {
    if (!editingPost) return;
    if (!editTitle) return toast.warning("Başlık gerekli");
    if (editStatus === "future") {
      if (!editDate) return toast.warning("Planlama için tarih seçmelisiniz");
      if (editDate < new Date()) {
        return toast.warning("Geçmiş bir tarihe planlama yapamazsınız.");
      }
    }

    try {
      const cleanedTags = Array.from(
        new Set(editTags.map((t) => t.trim()).filter((t) => t.length > 0)),
      );

      const payload: any = {
        title: editTitle,
        content: editContent,
        status: editStatus,
        featuredImage: editFeaturedImageUrl || null,
        categories: editSelectedCategories,
        tags: cleanedTags,
      };

      if (editStatus === "future" && editDate) {
        const gmtDate = editDate.toISOString().slice(0, 19).replace("T", " ");
        payload.date_gmt = gmtDate;
      }

      await api.patch(
        `/wordpress-sites/${site.id}/posts/${editingPost.id}`,
        payload,
      );
      toast.success("Yazı güncellendi");
      setIsEditPostOpen(false);
      setEditingPost(null);
      fetchKpi();
      fetchPosts();
    } catch (e: any) {
      console.error(e);
      const msg = e.response?.data?.message || "Güncelleme başarısız";
      toast.error(msg);
    }
  };

  const deletePost = async (post: any) => {
    if (!post?.id) return;
    const ok = window.confirm("Bu yazıyı silmek istediğinize emin misiniz?");
    if (!ok) return;
    try {
      await api.delete(`/wordpress-sites/${site.id}/posts/${post.id}`);
      toast.success("Yazı silindi");
      fetchKpi();
      fetchPosts();
    } catch (e: any) {
      console.error(e);
      const msg = e.response?.data?.message || "Silme başarısız";
      toast.error(msg);
    }
  };

  if (loading) return <div className="p-8">Yükleniyor...</div>;
  if (!site) return <div className="p-8">Site bulunamadı.</div>;

  return (
    <div className="h-full flex flex-col p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{site.siteUrl}</h1>
          <p className="text-muted-foreground text-sm">İçerik Üretimi ve Planlama</p>
        </div>
        <div className="ml-auto flex gap-2">
           {!analysisData ? (
               <Button variant="secondary" onClick={analyzeSite} disabled={analyzing}>
                   {analyzing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <BrainCircuit className="h-4 w-4 mr-2" />}
                   Siteyi Öğren / Analiz Et
               </Button>
           ) : (
               <Badge variant="outline" className="h-9 px-4 text-green-600 bg-green-50 border-green-200 gap-2">
                   <Check className="h-3 w-3" /> Site Analiz Edildi
               </Badge>
           )}
           <Button variant="outline" onClick={() => window.open(site.siteUrl, '_blank')}>
             <ExternalLink className="h-4 w-4 mr-2" />
             Siteye Git
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Toplam</div>
          <div className="text-2xl font-semibold">{kpi?.total ?? "-"}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Yayın</div>
          <div className="text-2xl font-semibold">{kpi?.published ?? "-"}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Planlı</div>
          <div className="text-2xl font-semibold">{kpi?.scheduled ?? "-"}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Taslak</div>
          <div className="text-2xl font-semibold">{kpi?.drafts ?? "-"}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Son Gönderim</div>
          <div className="text-sm font-medium">
            {kpi?.lastSentAt
              ? format(new Date(kpi.lastSentAt), "d MMM yyyy HH:mm", {
                  locale: tr,
                })
              : "-"}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
        {/* Left Column: AI Tools */}
        <div className="lg:col-span-4 space-y-6">
            {analysisData && (
                <Card className="p-4 bg-muted/20">
                    <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <BrainCircuit className="h-4 w-4" />
                        Site Analiz Özeti
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-2">
                        <Badge variant="outline" className="bg-background">Niş: {analysisData.niche}</Badge>
                        <Badge variant="outline" className="bg-background">Ton: {analysisData.tone}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {analysisData.keywords?.slice(0, 5).map((k: string, i: number) => (
                            <span key={i} className="text-[10px] bg-background border px-1.5 py-0.5 rounded text-muted-foreground">
                                {k}
                            </span>
                        ))}
                    </div>
                </Card>
            )}

            <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-gray-500" />
                  İçerik Ayarları
                </h3>
                
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>AI Modeli</Label>
                        <Select value={aiModel} onValueChange={setAiModel}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash (Hızlı)</SelectItem>
                                <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro (Akıllı)</SelectItem>
                                <SelectItem value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Deneysel)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Makale Uzunluğu</Label>
                        <Select value={articleLength} onValueChange={(v: any) => setArticleLength(v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="SHORT">Kısa (300 kelime)</SelectItem>
                                <SelectItem value="MEDIUM">Orta (600 kelime)</SelectItem>
                                <SelectItem value="LONG">Uzun (1000+ kelime)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Kategoriler</Label>
                        <div className="border rounded-md p-2 max-h-40 overflow-y-auto space-y-1">
                            {categories.length > 0 ? categories.map((cat) => (
                                <div key={cat.id} className="flex items-center space-x-2">
                                    <input 
                                        type="checkbox" 
                                        id={`cat-${cat.id}`}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        checked={selectedCategories.includes(cat.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedCategories([...selectedCategories, cat.id]);
                                            } else {
                                                setSelectedCategories(selectedCategories.filter(id => id !== cat.id));
                                            }
                                        }}
                                    />
                                    <label htmlFor={`cat-${cat.id}`} className="text-sm cursor-pointer select-none">
                                        {cat.name}
                                    </label>
                                </div>
                            )) : (
                                <p className="text-xs text-muted-foreground p-1">Kategori bulunamadı.</p>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                İçerik Sihirbazı
              </h3>
              
              <Tabs value={titleMode} onValueChange={(v: any) => setTitleMode(v)} className="w-full">
                  <TabsList className="w-full grid grid-cols-2 mb-4">
                      <TabsTrigger value="suggest">Başlık Öner</TabsTrigger>
                      <TabsTrigger value="custom">Kendi Başlığım</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="suggest" className="space-y-4">
                      <div className="space-y-2">
                        <Label>Anahtar Kelime / Konu</Label>
                        <div className="flex gap-2">
                            <Input 
                                placeholder="Örn: SEO ipuçları"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                            />
                            <Button size="icon" variant="secondary" onClick={suggestTitles} disabled={isSuggestingTitles || !topic}>
                                {isSuggestingTitles ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                            </Button>
                        </div>
                      </div>

                      {suggestedTitles.length > 0 && (
                          <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">Önerilen Başlıklar (Seçmek için tıkla)</Label>
                              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                  {suggestedTitles.map((t, i) => (
                                      <div 
                                        key={i} 
                                        className={`p-2 text-sm rounded cursor-pointer border hover:bg-muted transition-colors ${title === t ? 'border-primary bg-primary/5' : 'border-transparent bg-secondary/50'}`}
                                        onClick={() => setTitle(t)}
                                      >
                                          {t}
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}
                  </TabsContent>
                  
                  <TabsContent value="custom" className="space-y-4">
                      <div className="space-y-2">
                        <Label>Makale Başlığı</Label>
                        <Input 
                            placeholder="Başlığınızı girin..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                      </div>
                  </TabsContent>
              </Tabs>

                <Button 
                  className="w-full mt-6" 
                  onClick={generateContent}
                  disabled={isGenerating || !title}
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Makaleyi Oluştur
                </Button>
            </Card>

            <Card className="p-6">
                 <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Görsel Seçimi
                    </h3>
                    <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
                        Pexels
                    </Badge>
                 </div>
                 
                 {selectedImage ? (
                  <div className="relative group rounded-lg overflow-hidden border mb-4">
                    <img src={selectedImage.src.medium} alt="Selected" className="w-full h-40 object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <Button variant="destructive" size="sm" onClick={() => setSelectedImage(null)}>Kaldır</Button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] p-1 truncate">
                      Photo by {selectedImage.photographer} on Pexels
                    </div>
                  </div>
                ) : (
                  <div className="h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground bg-muted/30 mb-4">
                    <ImageIcon className="h-8 w-8 mb-2 opacity-20" />
                    <span className="text-xs">Görsel seçilmedi</span>
                  </div>
                )}

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setImageQuery(title || topic || "");
                    setIsImageModalOpen(true);
                    if ((title || topic) && images.length === 0) searchImages();
                  }}
                >
                  Görsel Ara / Değiştir
                </Button>
            </Card>
        </div>

        {/* Right Column: Editor */}
        <Card className="lg:col-span-8 p-6 flex flex-col gap-4 h-full min-h-[600px]">
          <div className="flex items-center justify-between border-b pb-4">
             <div className="space-y-1 w-full">
                 <Label className="text-muted-foreground text-xs">Aktif Başlık</Label>
                 <Input 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    className="text-lg font-bold border-none shadow-none px-0 h-auto focus-visible:ring-0"
                    placeholder="Başlık seçilmedi..."
                 />
             </div>
          </div>
          
          {/* Tags Section */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Etiketler (Enter ile ekle)</Label>
            <div className="flex flex-wrap gap-2 mb-2 p-2 bg-muted/20 rounded-md min-h-[40px]">
                {tags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="gap-1 pr-1">
                        {tag}
                        <div 
                            className="cursor-pointer hover:bg-muted rounded-full p-0.5"
                            onClick={() => setTags(tags.filter((_, index) => index !== i))}
                        >
                            <span className="sr-only">Kaldır</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </div>
                    </Badge>
                ))}
                <Input 
                    className="flex-1 min-w-[120px] border-none shadow-none h-6 bg-transparent focus-visible:ring-0 p-0 text-sm"
                    placeholder={tags.length === 0 ? "Etiket yazıp Enter'a basın..." : ""}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && tagInput.trim()) {
                            e.preventDefault();
                            if (!tags.includes(tagInput.trim())) {
                                setTags([...tags, tagInput.trim()]);
                            }
                            setTagInput("");
                        }
                        if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
                            setTags(tags.slice(0, -1));
                        }
                    }}
                />
            </div>
          </div>
          
          <div className="space-y-2 flex-1 flex flex-col">
            <Textarea 
              value={content} 
              onChange={(e) => setContent(e.target.value)} 
              placeholder="AI tarafından oluşturulan içerik buraya gelecek..."
              className="flex-1 min-h-[400px] resize-none font-mono text-sm leading-relaxed p-4 border-none focus-visible:ring-0 bg-muted/10"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t items-center">
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("w-[240px] justify-start text-left font-normal", !date && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP HH:mm", { locale: tr }) : <span>Tarih Seç (Planla)</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={handleDateSelect}
                        locale={tr}
                        initialFocus
                    />
                    <div className="p-3 border-t">
                        <Input 
                            type="time" 
                            className="w-full" 
                            onChange={(e) => {
                                if (date && e.target.value) {
                                    const [h, m] = e.target.value.split(':');
                                    const newDate = new Date(date);
                                    newDate.setHours(parseInt(h));
                                    newDate.setMinutes(parseInt(m));
                                    setDate(newDate);
                                }
                            }}
                        />
                    </div>
                </PopoverContent>
            </Popover>

            <div className="flex gap-2 ml-auto">
                {date ? (
                    <Button onClick={() => publishToWordpress("future")} className="bg-orange-600 hover:bg-orange-700 text-white">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        Planla
                    </Button>
                ) : (
                    <>
                        <Button variant="outline" onClick={() => publishToWordpress("draft")}>
                        <Save className="h-4 w-4 mr-2" />
                        Taslak
                        </Button>
                        <Button onClick={() => publishToWordpress("publish")}>
                        <Send className="h-4 w-4 mr-2" />
                        Yayınla
                        </Button>
                    </>
                )}
            </div>
          </div>
        </Card>
      </div>

      <Card className="mt-6 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Gönderilen Yazılar</h2>
            <p className="text-sm text-muted-foreground">
              Panelden gönderilen yazıları buradan yönetebilirsiniz.
            </p>
          </div>
          <Button variant="outline" onClick={fetchPosts} disabled={loadingPosts}>
            {loadingPosts ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Yenile
          </Button>
        </div>

        <div className="border rounded-md overflow-hidden">
          <div className="grid grid-cols-12 bg-muted/30 text-xs text-muted-foreground px-3 py-2">
            <div className="col-span-6">Başlık</div>
            <div className="col-span-2">Durum</div>
            <div className="col-span-3">Tarih</div>
            <div className="col-span-1 text-right">İşlem</div>
          </div>
          {loadingPosts ? (
            <div className="p-6 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Yükleniyor...
            </div>
          ) : posts.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              Henüz gönderilmiş bir yazı yok.
            </div>
          ) : (
            posts.map((p) => (
              <div
                key={p.id}
                className="grid grid-cols-12 px-3 py-3 border-t items-center gap-2"
              >
                <div className="col-span-6">
                  <div className="font-medium text-sm truncate">{p.title}</div>
                  {p.postUrl && (
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline"
                      onClick={() => window.open(p.postUrl, "_blank")}
                    >
                      WordPress'te Aç
                    </button>
                  )}
                </div>
                <div className="col-span-2">
                  <Badge variant="secondary">{statusLabel(p.status)}</Badge>
                </div>
                <div className="col-span-3 text-sm text-muted-foreground">
                  {p.createdAt
                    ? format(new Date(p.createdAt), "d MMM yyyy HH:mm", {
                        locale: tr,
                      })
                    : "-"}
                </div>
                <div className="col-span-1 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => openEditPost(p)}
                    title="Düzenle"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => deletePost(p)}
                    title="Sil"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Dialog open={isEditPostOpen} onOpenChange={setIsEditPostOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] !max-w-7xl sm:!max-w-7xl">
          <DialogHeader>
            <DialogTitle>Yazıyı Düzenle</DialogTitle>
            <DialogDescription>
              Değişiklikler WordPress'e yansıtılır.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="space-y-4 md:col-span-3">
              <div className="space-y-2">
                <Label>Başlık</Label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>İçerik</Label>
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[520px] resize-none"
                />
              </div>
            </div>

            <div className="space-y-4 md:col-span-2">
              <div className="space-y-2">
                <Label>Durum</Label>
                <Select
                  value={editStatus}
                  onValueChange={(v: any) => setEditStatus(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Taslak</SelectItem>
                    <SelectItem value="publish">Yayınla</SelectItem>
                    <SelectItem value="future">Planla</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editStatus === "future" && (
                <div className="flex gap-3 items-center">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] justify-start text-left font-normal",
                          !editDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editDate ? (
                          format(editDate, "PPP HH:mm", { locale: tr })
                        ) : (
                          <span>Tarih Seç (Planla)</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={editDate}
                        onSelect={(d) => setEditDate(d)}
                        locale={tr}
                        initialFocus
                      />
                      <div className="p-3 border-t">
                        <Input
                          type="time"
                          className="w-full"
                          onChange={(e) => {
                            if (editDate && e.target.value) {
                              const [h, m] = e.target.value.split(":");
                              const newDate = new Date(editDate);
                              newDate.setHours(parseInt(h));
                              newDate.setMinutes(parseInt(m));
                              setEditDate(newDate);
                            }
                          }}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              <div className="space-y-2">
                <Label>Öne Çıkan Görsel</Label>
                <Card className="p-4">
                  {editFeaturedImageUrl ? (
                    <div className="relative group rounded-lg overflow-hidden border mb-3">
                      <img
                        src={editFeaturedImageUrl}
                        alt="Featured"
                        className="w-full h-40 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setEditFeaturedImageUrl("");
                            setEditSelectedImage(null);
                          }}
                        >
                          Kaldır
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground bg-muted/30 mb-3">
                      <ImageIcon className="h-8 w-8 mb-2 opacity-20" />
                      <span className="text-xs">Görsel seçilmedi</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setEditImageQuery(editTitle || "");
                        setIsEditImageModalOpen(true);
                        if (editTitle && editImages.length === 0) searchEditImages();
                      }}
                    >
                      Pexels
                    </Button>

                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingEditImage}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          uploadEditImage(file);
                          e.currentTarget.value = "";
                        }}
                      />
                    </div>
                  </div>

                  {isUploadingEditImage && (
                    <div className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Yükleniyor...
                    </div>
                  )}
                </Card>
              </div>

              <div className="space-y-2">
                <Label>Kategoriler</Label>
                <div className="border rounded-md p-2 max-h-40 overflow-y-auto space-y-1">
                  {categories.length > 0 ? (
                    categories.map((cat) => (
                      <div key={cat.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`edit-cat-${cat.id}`}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          checked={editSelectedCategories.includes(String(cat.id))}
                          onChange={(e) => {
                            const id = String(cat.id);
                            if (e.target.checked) {
                              setEditSelectedCategories([
                                ...editSelectedCategories,
                                id,
                              ]);
                            } else {
                              setEditSelectedCategories(
                                editSelectedCategories.filter((x) => x !== id),
                              );
                            }
                          }}
                        />
                        <label
                          htmlFor={`edit-cat-${cat.id}`}
                          className="text-sm cursor-pointer select-none"
                        >
                          {cat.name}
                        </label>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground p-1">
                      Kategori bulunamadı.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Etiketler (Enter ile ekle)
                </Label>
                <div className="flex flex-wrap gap-2 mb-2 p-2 bg-muted/20 rounded-md min-h-[40px]">
                  {editTags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="gap-1 pr-1">
                      {tag}
                      <div
                        className="cursor-pointer hover:bg-muted rounded-full p-0.5"
                        onClick={() =>
                          setEditTags(
                            editTags.filter((_: any, index: number) => index !== i),
                          )
                        }
                      >
                        <span className="sr-only">Kaldır</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M18 6 6 18" />
                          <path d="m6 6 12 12" />
                        </svg>
                      </div>
                    </Badge>
                  ))}
                  <Input
                    className="flex-1 min-w-[120px] border-none shadow-none h-6 bg-transparent focus-visible:ring-0 p-0 text-sm"
                    placeholder={
                      editTags.length === 0 ? "Etiket yazıp Enter'a basın..." : ""
                    }
                    value={editTagInput}
                    onChange={(e) => setEditTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && editTagInput.trim()) {
                        e.preventDefault();
                        if (!editTags.includes(editTagInput.trim())) {
                          setEditTags([...editTags, editTagInput.trim()]);
                        }
                        setEditTagInput("");
                      }
                      if (e.key === "Backspace" && !editTagInput && editTags.length > 0) {
                        setEditTags(editTags.slice(0, -1));
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={() => setIsEditPostOpen(false)}>
              Vazgeç
            </Button>
            <Button onClick={updatePost}>Güncelle</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditImageModalOpen} onOpenChange={setIsEditImageModalOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Görsel Seçimi (Pexels)</DialogTitle>
            <DialogDescription>
              Öne çıkan görseli Pexels'ten seçin.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 mb-4">
            <Input
              value={editImageQuery}
              onChange={(e) => setEditImageQuery(e.target.value)}
              placeholder="Görsel ara..."
              onKeyDown={(e) => e.key === "Enter" && searchEditImages()}
            />
            <Button onClick={searchEditImages} disabled={isSearchingEditImages}>
              {isSearchingEditImages ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-1">
            {editImages.map((img) => (
              <div
                key={img.id}
                className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${editSelectedImage?.id === img.id ? "border-primary ring-2 ring-primary ring-offset-2" : "border-transparent"}`}
                onClick={() => setEditSelectedImage(img)}
              >
                <img
                  src={img.src.medium}
                  alt={img.alt}
                  className="w-full h-32 object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                {editSelectedImage?.id === img.id && (
                  <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1">
                    <Check className="h-3 w-3" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] p-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                  {img.photographer}
                </div>
              </div>
            ))}
            {!isSearchingEditImages && editImages.length === 0 && (
              <div className="col-span-full text-center py-10 text-muted-foreground">
                Görsel bulunamadı veya arama yapılmadı.
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-2 border-t">
            <Button variant="ghost" onClick={() => setIsEditImageModalOpen(false)}>
              Vazgeç
            </Button>
            <Button
              onClick={() => {
                if (!editSelectedImage) return;
                setEditFeaturedImageUrl(editSelectedImage.src.large);
                setIsEditImageModalOpen(false);
              }}
              disabled={!editSelectedImage}
            >
              Seçimi Onayla
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Picker Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Görsel Seçimi (Pexels)</DialogTitle>
            <DialogDescription>
              Makaleniz için ücretsiz stok fotoğraf seçin.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex gap-2 mb-4">
            <Input 
              value={imageQuery} 
              onChange={(e) => setImageQuery(e.target.value)} 
              placeholder="Görsel ara..."
              onKeyDown={(e) => e.key === 'Enter' && searchImages()}
            />
            <Button onClick={searchImages} disabled={isSearchingImages}>
              {isSearchingImages ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-1">
            {images.map((img) => (
              <div 
                key={img.id} 
                className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${selectedImage?.id === img.id ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-transparent'}`}
                onClick={() => setSelectedImage(img)}
              >
                <img src={img.src.medium} alt={img.alt} className="w-full h-32 object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                {selectedImage?.id === img.id && (
                  <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1">
                    <Check className="h-3 w-3" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] p-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                  {img.photographer}
                </div>
              </div>
            ))}
            {!isSearchingImages && images.length === 0 && (
              <div className="col-span-full text-center py-10 text-muted-foreground">
                Görsel bulunamadı veya arama yapılmadı.
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-2 border-t">
            <Button variant="ghost" onClick={() => setIsImageModalOpen(false)}>Vazgeç</Button>
            <Button onClick={() => setIsImageModalOpen(false)} disabled={!selectedImage}>Seçimi Onayla</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
