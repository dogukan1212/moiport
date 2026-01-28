'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
  Settings,
  Building2,
  Users,
  Plus,
  Edit2,
  Trash2,
  Save,
  Loader2,
  Mail,
  User,
  Shield,
  Image as ImageIcon,
  Facebook,
  Instagram,
  Link2,
  CheckCircle2,
  CheckCheck,
  XCircle,
  MessageCircle,
  Phone,
  Globe,
  CreditCard,
  LayoutGrid,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { toast } from 'sonner';

export default function SettingsPage() {
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || "agency");
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const isClient = (user?.role || '').includes('CLIENT');

  // Agency Settings State
  const [agencyName, setAgencyName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [address, setAddress] = useState('');
  const [title, setTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  
  // WordPress Module State
  const [wordpressModuleEnabled, setWordpressModuleEnabled] = useState(false);

  // Team Management State
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'STAFF' });
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editUserForm, setEditUserForm] = useState({
    name: '',
    email: '',
    role: 'STAFF',
    newPassword: '',
  });
  const [editUserSaving, setEditUserSaving] = useState(false);

  // Facebook Config State
  const [fbConfig, setFbConfig] = useState<any>(null);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [mappings, setMappings] = useState<any[]>([]);
  const [fbPages, setFbPages] = useState<any[]>([]);
  const [fbForms, setFbForms] = useState<any[]>([]);
  const [selectedPage, setSelectedPage] = useState<string>('');
  const [mappingLoading, setMappingLoading] = useState(false);
  const [fbTestStatus, setFbTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [fbTestResult, setFbTestResult] = useState<any>(null);
  const [fbPreviewData, setFbPreviewData] = useState<any[]>([]);
  const [fbSyncLoading, setFbSyncLoading] = useState(false);

  // WhatsApp Config State
  const [waConfig, setWaConfig] = useState<any>(null);
  const [waProvider, setWaProvider] = useState<string>('twilio');
  const [waPhoneNumberId, setWaPhoneNumberId] = useState('');
  const [waAccessToken, setWaAccessToken] = useState('');
  const [waApiVersion, setWaApiVersion] = useState('v21.0');
  const [waTwilioAccountSid, setWaTwilioAccountSid] = useState('');
  const [waIsActive, setWaIsActive] = useState(false);
  const [waTestNumber, setWaTestNumber] = useState('');
  const [waTestMessage, setWaTestMessage] = useState('Merhaba, bu bir test WhatsApp mesajıdır.');
  const [waTesting, setWaTesting] = useState(false);
  const [waAiEnabled, setWaAiEnabled] = useState(false);
  const [waAutoReplyEnabled, setWaAutoReplyEnabled] = useState(false);
  const [waAutoReplyTemplates, setWaAutoReplyTemplates] = useState('');
  const [parasutConfig, setParasutConfig] = useState<any>(null);
  const [parasutCompanyId, setParasutCompanyId] = useState('');
  const [parasutIsActive, setParasutIsActive] = useState(false);
  const [parasutTestStatus, setParasutTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [parasutTestResult, setParasutTestResult] = useState<any>(null);
  const [parasutTesting, setParasutTesting] = useState(false);
  const [smsConfig, setSmsConfig] = useState<any>(null);
  const [smsApiId, setSmsApiId] = useState('');
  const [smsApiKey, setSmsApiKey] = useState('');
  const [smsSender, setSmsSender] = useState('');
  const [smsMessageType, setSmsMessageType] = useState('normal');
  const [smsMessageContentType, setSmsMessageContentType] = useState('bilgi');
  const [smsIsActive, setSmsIsActive] = useState(false);
  const [smsTestNumber, setSmsTestNumber] = useState('');
  const [smsTestMessage, setSmsTestMessage] = useState(
    'Merhaba, bu bir test SMS mesajıdır.',
  );
  const [smsTesting, setSmsTesting] = useState(false);
  const [netgsmConfig, setNetgsmConfig] = useState<any>(null);
  const [netgsmUsercode, setNetgsmUsercode] = useState('');
  const [netgsmPassword, setNetgsmPassword] = useState('');
  const [netgsmMsgheader, setNetgsmMsgheader] = useState('');
  const [netgsmIsActive, setNetgsmIsActive] = useState(false);
  const [netgsmTestNumber, setNetgsmTestNumber] = useState('');
  const [netgsmTestMessage, setNetgsmTestMessage] = useState(
    'Merhaba, bu bir test SMS mesajıdır.',
  );
  const [netgsmTesting, setNetgsmTesting] = useState(false);
  const [paytrConfig, setPaytrConfig] = useState<any>(null);
  const [paytrMerchantId, setPaytrMerchantId] = useState('');
  const [paytrMerchantKey, setPaytrMerchantKey] = useState('');
  const [paytrMerchantSalt, setPaytrMerchantSalt] = useState('');
  const [paytrIsActive, setPaytrIsActive] = useState(false);
  const [trelloConfig, setTrelloConfig] = useState<any>(null);
  const [trelloApiKey, setTrelloApiKey] = useState('');
  const [trelloToken, setTrelloToken] = useState('');
  const [trelloIsActive, setTrelloIsActive] = useState(false);
  const [trelloBoards, setTrelloBoards] = useState<any[]>([]);
  const [trelloBoardId, setTrelloBoardId] = useState('');
  const [trelloLists, setTrelloLists] = useState<any[]>([]);
  const [trelloListStatusMap, setTrelloListStatusMap] = useState<Record<string, string>>({});
  const [taskStatusColumns, setTaskStatusColumns] = useState<Array<{ id: string; title: string; archived?: boolean }>>([]);
  const [trelloCustomers, setTrelloCustomers] = useState<any[]>([]);
  const [trelloCustomerId, setTrelloCustomerId] = useState('');
  const [trelloProjectName, setTrelloProjectName] = useState('');
  const [trelloLoadingBoards, setTrelloLoadingBoards] = useState(false);
  const [trelloLoadingLists, setTrelloLoadingLists] = useState(false);
  const [trelloImporting, setTrelloImporting] = useState(false);
  const [smsModuleSettings, setSmsModuleSettings] = useState<any>(null);
  const [smsModuleProvider, setSmsModuleProvider] = useState<'VATANSMS' | 'NETGSM'>('VATANSMS');
  const [smsModuleIsActive, setSmsModuleIsActive] = useState(false);
  const [smsModuleSaving, setSmsModuleSaving] = useState(false);
  const [smsTriggers, setSmsTriggers] = useState<any[]>([]);
  const [smsTriggersLoading, setSmsTriggersLoading] = useState(false);
  const [smsTemplates, setSmsTemplates] = useState<any[]>([]);
  const [smsTemplatesLoading, setSmsTemplatesLoading] = useState(false);
  const [smsSelectedTemplateId, setSmsSelectedTemplateId] = useState<string>('');
  const [smsTemplateEditKey, setSmsTemplateEditKey] = useState('');
  const [smsTemplateEditTitle, setSmsTemplateEditTitle] = useState('');
  const [smsTemplateEditContent, setSmsTemplateEditContent] = useState('');
  const [smsTemplateEditActive, setSmsTemplateEditActive] = useState(true);
  const [smsTemplateSaving, setSmsTemplateSaving] = useState(false);
  const [smsNewTemplateKey, setSmsNewTemplateKey] = useState('');
  const [smsNewTemplateTitle, setSmsNewTemplateTitle] = useState('');
  const [smsNewTemplateContent, setSmsNewTemplateContent] = useState('');
  const [smsNewTemplateSaving, setSmsNewTemplateSaving] = useState(false);
  const [googleCalendarConfig, setGoogleCalendarConfig] = useState<any>(null);
  const [googleCalendarPrimary, setGoogleCalendarPrimary] = useState('');
  const [googleCalendarTesting, setGoogleCalendarTesting] = useState(false);
  const [googleCalendarCreatingEvent, setGoogleCalendarCreatingEvent] =
    useState(false);

  const stringifyMaybeObject = (value: any) => {
    if (typeof value === 'string') return value;
    if (value === null || value === undefined) return '';
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  };

  useEffect(() => {
    // Get user from local storage or API
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    if (!isClient) {
      fetchTenant();
    }
    fetchFacebookConfig();
    fetchPipelines();
    fetchWhatsappConfig();
    fetchParasutConfig();
    if (!isClient) {
      fetchVatansmsConfig();
      fetchNetgsmConfig();
      fetchPaytrConfig();
      fetchGoogleCalendarConfig();
      fetchTrelloConfig();
      fetchTrelloCustomers();
      fetchSmsModuleSettings();
      fetchSmsTriggers();
      fetchSmsTemplates();
    }
  }, [isClient]);

  useEffect(() => {
    if (isClient && activeTab === 'agency') {
      setActiveTab('facebook');
    }
  }, [isClient, activeTab]);

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const tab = searchParams.get('tab');

    if (success === 'true') {
      if (tab === 'parasut') {
        toast.success('Paraşüt hesabı başarıyla bağlandı.');
        router.replace('/dashboard/settings?tab=parasut');
        fetchParasutConfig();
      } else if (tab === 'google-calendar') {
        toast.success('Google Calendar hesabı başarıyla bağlandı.');
        // URL'i temizle ama tab'da kal
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('success');
        window.history.replaceState({}, '', newUrl.toString());
        
        // Config'i hemen çek
        fetchGoogleCalendarConfig();
      } else {
        toast.success('Facebook hesabı başarıyla bağlandı.');
        router.replace('/dashboard/settings?tab=facebook');
        fetchFacebookConfig();
      }
    } else if (error === 'auth_failed') {
      if (tab === 'parasut') {
        toast.error('Paraşüt bağlantısı başarısız oldu.');
        router.replace('/dashboard/settings?tab=parasut');
      } else if (tab === 'google-calendar') {
        toast.error('Google Calendar bağlantısı başarısız oldu.');
        router.replace('/dashboard/settings?tab=google-calendar');
      } else {
        toast.error('Facebook bağlantısı başarısız oldu.');
        router.replace('/dashboard/settings?tab=facebook');
      }
    }
  }, [searchParams]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('taskColumns');
      const parsed = raw ? JSON.parse(raw) : null;
      const list = Array.isArray(parsed) ? parsed : [];
      const normalized = list
        .map((c: any) => ({
          id: String(c?.id || '').trim(),
          title: String(c?.title || '').trim(),
          archived: !!c?.archived,
        }))
        .filter((c: any) => c.id && c.title && c.id.toUpperCase() !== 'ARCHIVED');

      if (normalized.length > 0) {
        setTaskStatusColumns(normalized);
        return;
      }
    } catch {}
    setTaskStatusColumns([
      { id: 'BRANDS', title: 'Markalar', archived: false },
      { id: 'TODO', title: 'Yapılacaklar', archived: false },
      { id: 'IN_PROGRESS', title: 'Devam Edenler', archived: false },
      { id: 'REVIEW', title: 'İncelemede', archived: false },
      { id: 'DONE', title: 'Tamamlandı', archived: false },
    ]);
  }, []);

  useEffect(() => {
    if (fbConfig?.userAccessToken) {
      fetchFbPages(fbConfig.userAccessToken);
    } else if (fbConfig?.accessToken) {
      // Fallback: Eskiden accessToken'da tutuluyordu
      fetchFbPages(fbConfig.accessToken);
    }
  }, [fbConfig?.userAccessToken, fbConfig?.accessToken]);

  const resolvePageAccessToken = (pageId?: string) => {
    if (!pageId) return undefined;
    const page = fbPages.find((p) => p.id === pageId);
    return page?.access_token;
  };

  const fetchFbPages = async (token: string) => {
    try {
      const response = await api.post('/integrations/facebook/pages', { accessToken: token });
      setFbPages(response.data);
      return response.data;
    } catch (error) {
      console.error('Facebook sayfaları yüklenemedi:', error);
    }
  };

  const fetchFbForms = async (pageId: string, customToken?: string) => {
    try {
      const tokenFromPage = resolvePageAccessToken(pageId);
      let token = customToken || fbConfig?.accessToken || tokenFromPage;
      if (!token && fbConfig?.userAccessToken) {
        const pages = await fetchFbPages(fbConfig.userAccessToken);
        const pageToken = pages?.find((p: any) => p.id === pageId)?.access_token;
        token = pageToken;
      }
      if (!token) return;
      
      const response = await api.post(`/integrations/facebook/forms/${pageId}`, { accessToken: token });
      setFbForms(response.data);
    } catch (error) {
      console.error('Facebook formları yüklenemedi:', error);
    }
  };

  const handleFacebookLogin = async () => {
    try {
      setSaving(true);
      const response = await api.get('/integrations/facebook/auth-url');
      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        toast.error('Facebook giriş adresi alınamadı.');
      }
    } catch (error) {
      toast.error('Facebook bağlantısı başlatılamadı.');
    } finally {
      setSaving(false);
    }
  };

  const handlePageChange = async (pageId: string) => {
    setSelectedPage(pageId);
    const page = fbPages.find(p => p.id === pageId);
    if (page) {
      const pageToken = page.access_token;
      const igUserId = page.instagram_business_account?.id;
      
      await api.post('/integrations/facebook/config', { 
        pageId: page.id,
        pageName: page.name,
        accessToken: pageToken,
        instagramBusinessAccountId: igUserId
      });
      await fetchFacebookConfig();
      fetchFbForms(page.id, pageToken);
    }
  };

  const fetchTenant = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tenants/me');
      setTenant(response.data);
      setAgencyName(response.data.name);
      setLogoUrl(response.data.logoUrl || '');
      setAddress(response.data.address || '');
      setTitle(response.data.title || '');
      setPhone(response.data.phone || '');
      setEmail(response.data.email || '');
      setWordpressModuleEnabled(response.data.wordpressModuleEnabled || false);
    } catch (error) {
      console.error('Tenant bilgileri yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFacebookConfig = async () => {
    try {
      const response = await api.get('/integrations/facebook/config');
      setFbConfig(response.data);
      setMappings(response.data?.mappings || []);
      const tokenForForms = response.data?.accessToken || response.data?.userAccessToken;
      if (response.data?.pageId && tokenForForms) {
        setSelectedPage(response.data.pageId);
        fetchFbForms(response.data.pageId, tokenForForms);
      }      
    } catch (error) {
      console.error('Facebook config yüklenemedi:', error);
    }
  };

  const handleTestConnection = async () => {
    setFbTestStatus('loading');
    setFbTestResult(null);
    try {
      const res = await api.post('/integrations/facebook/test-connection');
      setFbTestStatus('success');
      setFbTestResult(res.data.data);
      toast.success('Bağlantı başarılı!');
    } catch (error: any) {
      setFbTestStatus('error');
      setFbTestResult(error.response?.data?.message || 'Bağlantı hatası');
      toast.error('Bağlantı testi başarısız.');
    }
  };

  const handlePreviewSync = async () => {
    setFbSyncLoading(true);
    try {
      const res = await api.get('/integrations/facebook/preview-sync');
      setFbPreviewData(res.data || []);
    } catch (error) {
      toast.error('Önizleme verileri alınamadı.');
    } finally {
      setFbSyncLoading(false);
    }
  };

  const handleConfirmSync = async () => {
    setFbSyncLoading(true);
    try {
      const res = await api.post('/integrations/facebook/confirm-sync');
      toast.success(`${res.data.importedCount} mesaj başarıyla içe aktarıldı.`);
      setFbPreviewData([]); // Clear preview after sync
    } catch (error) {
      toast.error('Senkronizasyon başarısız.');
    } finally {
      setFbSyncLoading(false);
    }
  };

  const fetchWhatsappConfig = async () => {
    try {
      const response = await api.get('/integrations/whatsapp/config');
      setWaConfig(response.data);
      setWaProvider(response.data?.provider || 'meta');
      setWaPhoneNumberId(response.data?.phoneNumberId || '');
      setWaAccessToken(response.data?.accessToken || '');
      setWaApiVersion(response.data?.apiVersion || 'v21.0');
      setWaTwilioAccountSid(response.data?.twilioAccountSid || '');
      setWaIsActive(!!response.data?.isActive);
      setWaAiEnabled(!!response.data?.aiEnabled);
      setWaAutoReplyEnabled(!!response.data?.autoReplyEnabled);
      const rawTemplates = response.data?.autoReplyTemplates || '';
      try {
        const arr = rawTemplates ? JSON.parse(rawTemplates) : [];
        if (Array.isArray(arr)) {
          setWaAutoReplyTemplates(arr.join('\n'));
        } else {
          setWaAutoReplyTemplates('');
        }
      } catch {
        setWaAutoReplyTemplates('');
      }
    } catch (error) {
      console.error('WhatsApp config yüklenemedi:', error);
    }
  };

  const handleSaveWhatsappConfig = async () => {
    try {
      setSaving(true);
      const templatesArray = waAutoReplyTemplates
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      await api.post('/integrations/whatsapp/config', {
        provider: waProvider,
        phoneNumberId: waPhoneNumberId || null,
        accessToken: waAccessToken || null,
        apiVersion: waApiVersion || null,
        twilioAccountSid: waTwilioAccountSid || null,
        isActive: waIsActive,
        aiEnabled: waAiEnabled,
        autoReplyEnabled: waAutoReplyEnabled,
        autoReplyTemplates: templatesArray.length > 0 ? JSON.stringify(templatesArray) : null,
      });
      await fetchWhatsappConfig();
      toast.success('WhatsApp ayarları kaydedildi.');
    } catch (error) {
      toast.error('WhatsApp ayarları kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendWhatsappTest = async () => {
    if (!waIsActive) {
      toast.error('Lütfen önce WhatsApp entegrasyonunu aktif edip kaydedin.');
      return;
    }

    const to = waTestNumber.trim();
    const message =
      (waTestMessage && waTestMessage.trim()) ||
      'Merhaba, bu bir test WhatsApp mesajıdır.';

    if (!to) {
      toast.error('Lütfen test mesajı için bir WhatsApp numarası girin.');
      return;
    }

    setWaTesting(true);
    try {
      await api.post('/integrations/whatsapp/send', {
        to,
        message,
      });
      toast.success(
        'Test mesajı gönderildi. Birkaç saniye içinde WhatsApp uygulamanızı kontrol edin.',
      );
    } catch (error: any) {
      const messageText =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'Test mesajı gönderilemedi.';
      toast.error(messageText);
    } finally {
      setWaTesting(false);
    }
  };

  const fetchParasutConfig = async () => {
    try {
      const response = await api.get('/integrations/parasut/config');
      setParasutConfig(response.data);
      setParasutCompanyId(response.data?.companyId || '');
      setParasutIsActive(!!response.data?.isActive);
    } catch (error) {
      console.error('Paraşüt config yüklenemedi:', error);
    }
  };

  const handleParasutConnect = async () => {
    try {
      setSaving(true);
      const response = await api.get('/integrations/parasut/auth-url');
      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        toast.error('Paraşüt giriş adresi alınamadı.');
      }
    } catch (error) {
      toast.error('Paraşüt bağlantısı başlatılamadı.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveParasutConfig = async () => {
    try {
      setSaving(true);
      await api.post('/integrations/parasut/config', {
        companyId: parasutCompanyId || null,
        isActive: parasutIsActive,
      });
      await fetchParasutConfig();
      toast.success('Paraşüt ayarları kaydedildi.');
    } catch (error) {
      toast.error('Paraşüt ayarları kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnectParasut = async () => {
    try {
      setSaving(true);
      await api.post('/integrations/parasut/disconnect');
      setParasutConfig(null);
      setParasutCompanyId('');
      setParasutIsActive(false);
      setParasutTestStatus('idle');
      setParasutTestResult(null);
      toast.success('Paraşüt bağlantısı kesildi.');
    } catch (error) {
      toast.error('Paraşüt bağlantısı kesilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const handleParasutTest = async () => {
    if (!parasutIsActive) {
      toast.error('Lütfen önce Paraşüt entegrasyonunu aktif edip kaydedin.');
      return;
    }

    setParasutTesting(true);
    setParasutTestStatus('loading');
    setParasutTestResult(null);
    try {
      const res = await api.get('/integrations/parasut/me');
      setParasutTestStatus('success');
      setParasutTestResult(res.data);
      toast.success('Paraşüt bağlantısı başarılı.');
    } catch (error: any) {
      setParasutTestStatus('error');
      setParasutTestResult(error?.response?.data?.message || 'Bağlantı başarısız.');
      toast.error('Paraşüt bağlantı testi başarısız.');
    } finally {
      setParasutTesting(false);
    }
  };

  const fetchGoogleCalendarConfig = async () => {
    try {
      const response = await api.get('/integrations/google-calendar/config');
      console.log('Google Calendar Config:', response.data);
      setGoogleCalendarConfig(response.data);
      setGoogleCalendarPrimary(response.data?.primaryCalendar || '');
    } catch (error) {
      console.error('Google Calendar config yüklenemedi:', error);
    }
  };

  const handleGoogleCalendarConnect = async () => {
    try {
      setSaving(true);
      const response = await api.get('/integrations/google-calendar/auth-url');
      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        toast.error('Google Calendar bağlantı adresi alınamadı.');
      }
    } catch (error) {
      toast.error('Google Calendar bağlantısı başlatılamadı.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGoogleCalendarConfig = async () => {
    try {
      setSaving(true);
      await api.post('/integrations/google-calendar/config', {
        primaryCalendar: googleCalendarPrimary || null,
        isActive: googleCalendarConfig?.isActive ?? false,
      });
      await fetchGoogleCalendarConfig();
      toast.success('Google Calendar ayarları kaydedildi.');
    } catch (error: any) {
      const messageText =
        error?.response?.data?.message ||
        'Google Calendar ayarları kaydedilemedi.';
      toast.error(stringifyMaybeObject(messageText));
    } finally {
      setSaving(false);
    }
  };

  const handleTestGoogleCalendar = async () => {
    setGoogleCalendarTesting(true);
    try {
      const res = await api.get('/integrations/google-calendar/test');
      const email = res.data?.email;
      const calendarCount = res.data?.calendarCount;
      let description = '';
      if (email) description += `Hesap: ${email}`;
      if (typeof calendarCount === 'number') {
        description += description
          ? ` • Takvim sayısı: ${calendarCount}`
          : `Takvim sayısı: ${calendarCount}`;
      }
      toast.success('Google Calendar bağlantısı başarılı.', {
        description: description || undefined,
      });
    } catch (error: any) {
      const messageText =
        error?.response?.data?.message ||
        'Google Calendar bağlantısı doğrulanamadı.';
      toast.error(stringifyMaybeObject(messageText));
    } finally {
      setGoogleCalendarTesting(false);
    }
  };

  const handleCreateGoogleTestEvent = async () => {
    if (!googleCalendarConfig?.isActive) {
      toast.error(
        'Lütfen önce Google Calendar entegrasyonunu aktif edip kaydedin.',
      );
      return;
    }
    setGoogleCalendarCreatingEvent(true);
    try {
      const now = Date.now();
      const start = new Date(now + 5 * 60 * 1000).toISOString();
      const end = new Date(now + 35 * 60 * 1000).toISOString();
      const res = await api.post('/integrations/google-calendar/events', {
        summary: 'MoiPort Test Toplantısı',
        description:
          'Bu toplantı MoiPort Google Calendar entegrasyon testidir.',
        start,
        end,
        timeZone: 'Europe/Istanbul',
      });
      const link = res.data?.hangoutLink || res.data?.htmlLink || '';
      toast.success('Test toplantı oluşturuldu.', {
        description: link || undefined,
      });
    } catch (error: any) {
      const messageText =
        error?.response?.data?.message ||
        'Google Calendar test toplantısı oluşturulamadı.';
      toast.error(stringifyMaybeObject(messageText));
    } finally {
      setGoogleCalendarCreatingEvent(false);
    }
  };

  const fetchVatansmsConfig = async () => {
    try {
      const response = await api.get('/integrations/vatansms/config');
      setSmsConfig(response.data);
      setSmsApiId(response.data?.apiId || '');
      setSmsApiKey(response.data?.apiKey || '');
      setSmsSender(response.data?.sender || '');
      setSmsMessageType(response.data?.messageType || 'normal');
      setSmsMessageContentType(response.data?.messageContentType || 'bilgi');
      setSmsIsActive(!!response.data?.isActive);
    } catch (error) {
      console.error('VatanSMS config yüklenemedi:', error);
    }
  };

  const fetchNetgsmConfig = async () => {
    try {
      const response = await api.get('/integrations/netgsm/config');
      setNetgsmConfig(response.data);
      setNetgsmUsercode(response.data?.usercode || '');
      setNetgsmPassword(response.data?.password || '');
      setNetgsmMsgheader(response.data?.msgheader || '');
      setNetgsmIsActive(!!response.data?.isActive);
    } catch (error) {
      console.error('NetGSM config yüklenemedi:', error);
    }
  };

  const fetchPaytrConfig = async () => {
    try {
      const response = await api.get('/integrations/paytr/config');
      setPaytrConfig(response.data);
      setPaytrMerchantId(response.data?.merchantId || '');
      setPaytrMerchantKey(response.data?.merchantKey || '');
      setPaytrMerchantSalt(response.data?.merchantSalt || '');
      setPaytrIsActive(!!response.data?.isActive);
    } catch (error) {
      console.error('PayTR config yüklenemedi:', error);
    }
  };

  const fetchTrelloConfig = async () => {
    try {
      const response = await api.get('/integrations/trello/config');
      setTrelloConfig(response.data);
      setTrelloApiKey(response.data?.apiKey || '');
      setTrelloToken(response.data?.token || '');
      setTrelloIsActive(!!response.data?.isActive);
    } catch (error) {
      console.error('Trello config yüklenemedi:', error);
    }
  };

  const fetchTrelloCustomers = async () => {
    try {
      const response = await api.get('/customers');
      const list = Array.isArray(response.data) ? response.data : [];
      setTrelloCustomers(list);
      if (!trelloCustomerId && list[0]?.id) {
        setTrelloCustomerId(list[0].id);
      }
    } catch (error) {
      console.error('Müşteriler yüklenemedi:', error);
    }
  };

  const handleSaveTrelloConfig = async () => {
    try {
      setSaving(true);
      await api.post('/integrations/trello/config', {
        apiKey: trelloApiKey || null,
        token: trelloToken || null,
        isActive: trelloIsActive,
      });
      await fetchTrelloConfig();
      toast.success('Trello ayarları kaydedildi.');
    } catch (error: any) {
      const messageText =
        error?.response?.data?.message || 'Trello ayarları kaydedilemedi.';
      toast.error(stringifyMaybeObject(messageText));
    } finally {
      setSaving(false);
    }
  };

  const handleLoadTrelloBoards = async () => {
    setTrelloLoadingBoards(true);
    toast('Trello boardları yükleniyor...');
    try {
      const response = await api.get('/integrations/trello/boards');
      const boards = Array.isArray(response.data) ? response.data : [];
      setTrelloBoards(boards);
      if (boards.length === 0) {
        toast.info('Trello board bulunamadı.');
      } else {
        toast.success(`${boards.length} board yüklendi.`);
        if (boards.length === 1 && boards[0]?.id) {
          await handleSelectTrelloBoard(String(boards[0].id));
        }
      }
    } catch (error: any) {
      const messageText =
        error?.response?.data?.message || 'Trello boardları yüklenemedi.';
      toast.error(stringifyMaybeObject(messageText));
    } finally {
      setTrelloLoadingBoards(false);
    }
  };

  const handleTestTrelloAuth = async () => {
    setTrelloLoadingBoards(true);
    try {
      const res = await api.get('/integrations/trello/test');
      const fullName = res?.data?.member?.fullName;
      const username = res?.data?.member?.username;
      toast.success(
        `Trello bağlantısı başarılı${fullName || username ? `: ${fullName || username}` : ''}`,
      );
    } catch (error: any) {
      const messageText =
        error?.response?.data?.message || 'Trello bağlantısı doğrulanamadı.';
      toast.error(stringifyMaybeObject(messageText));
    } finally {
      setTrelloLoadingBoards(false);
    }
  };

  const guessStatus = (listName: string) => {
    const name = String(listName || '').toLowerCase();
    const activeCols = (taskStatusColumns || []).filter((c) => !c?.archived);
    const pickByTitle = (pred: (title: string) => boolean) => {
      const found = activeCols.find((c) => pred(String(c?.title || '').toLowerCase()));
      return found?.id;
    };

    if (
      name.includes('done') ||
      name.includes('tamam') ||
      name.includes('bitti') ||
      name.includes('completed')
    )
      return pickByTitle((t) => t.includes('tamam') || t.includes('done')) || 'DONE';
    if (name.includes('review') || name.includes('incele') || name.includes('kontrol'))
      return pickByTitle((t) => t.includes('incele') || t.includes('review')) || 'REVIEW';
    if (
      name.includes('progress') ||
      name.includes('doing') ||
      name.includes('devam') ||
      name.includes('yapılıyor')
    )
      return (
        pickByTitle((t) => t.includes('devam') || t.includes('progress') || t.includes('doing')) ||
        'IN_PROGRESS'
      );
    if (name.includes('brand') || name.includes('marka'))
      return pickByTitle((t) => t.includes('marka') || t.includes('brand')) || 'BRANDS';
    return activeCols.find((c) => c.id === 'TODO')?.id || 'TODO';
  };

  const handleSelectTrelloBoard = async (boardId: string) => {
    setTrelloBoardId(boardId);
    setTrelloLists([]);
    setTrelloListStatusMap({});
    if (!boardId) return;
    setTrelloLoadingLists(true);
    try {
      const response = await api.get(`/integrations/trello/boards/${boardId}/lists`);
      const lists = Array.isArray(response.data) ? response.data : [];
      const openLists = lists.filter((l: any) => !l?.closed);
      setTrelloLists(openLists);
      const nextMap: Record<string, string> = {};
      for (const l of openLists) {
        if (l?.id) nextMap[l.id] = guessStatus(l?.name);
      }
      setTrelloListStatusMap(nextMap);
    } catch (error: any) {
      const messageText =
        error?.response?.data?.message || 'Trello listeleri yüklenemedi.';
      toast.error(stringifyMaybeObject(messageText));
    } finally {
      setTrelloLoadingLists(false);
    }
  };

  const handleImportTrelloBoard = async () => {
    if (!trelloBoardId) {
      toast.error('Lütfen bir Trello board seçin.');
      return;
    }
    setTrelloImporting(true);
    try {
      const res = await api.post('/integrations/trello/import/board', {
        boardId: trelloBoardId,
        customerId: trelloCustomerId || null,
        projectName: trelloProjectName || null,
        listStatusMap: trelloListStatusMap || {},
      });
      const createdTaskCount = Number(res.data?.createdTaskCount || 0);
      const projectId = res.data?.projectId ? String(res.data.projectId) : '';
      toast('Import tamamlandı', {
        description: `${createdTaskCount} görev eklendi.`,
        action: projectId
          ? {
              label: 'Projeye Git',
              onClick: () => router.push(`/dashboard/projects/${projectId}`),
            }
          : undefined,
      });
    } catch (error: any) {
      const messageText =
        error?.response?.data?.message || 'Trello import başarısız.';
      toast.error(stringifyMaybeObject(messageText));
    } finally {
      setTrelloImporting(false);
    }
  };

  const handleSaveNetgsmConfig = async () => {
    try {
      setSaving(true);
      await api.post('/integrations/netgsm/config', {
        usercode: netgsmUsercode || null,
        password: netgsmPassword || null,
        msgheader: netgsmMsgheader || null,
        isActive: netgsmIsActive,
      });
      await fetchNetgsmConfig();
      toast.success('NetGSM ayarları kaydedildi.');
    } catch (error: any) {
      const messageText =
        error?.response?.data?.message || 'NetGSM ayarları kaydedilemedi.';
      toast.error(messageText);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePaytrConfig = async () => {
    try {
      setSaving(true);
      await api.post('/integrations/paytr/config', {
        merchantId: paytrMerchantId || null,
        merchantKey: paytrMerchantKey || null,
        merchantSalt: paytrMerchantSalt || null,
        isActive: paytrIsActive,
      });
      await fetchPaytrConfig();
      toast.success('PayTR ayarları kaydedildi.');
    } catch (error: any) {
      const messageText =
        error?.response?.data?.message || 'PayTR ayarları kaydedilemedi.';
      toast.error(messageText);
    } finally {
      setSaving(false);
    }
  };

  const handleSendNetgsmTest = async () => {
    if (!netgsmIsActive) {
      toast.error('Lütfen önce NetGSM entegrasyonunu aktif edip kaydedin.');
      return;
    }

    const to = netgsmTestNumber.trim();
    const message =
      (netgsmTestMessage && netgsmTestMessage.trim()) ||
      'Merhaba, bu bir test SMS mesajıdır.';

    if (!to) {
      toast.error('Lütfen test SMS için bir telefon numarası girin.');
      return;
    }

    setNetgsmTesting(true);
    try {
      await api.post('/integrations/netgsm/send', {
        to,
        message,
      });
      toast.success('Test SMS gönderildi.');
    } catch (error: any) {
      const messageText =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'Test SMS gönderilemedi.';
      toast.error(stringifyMaybeObject(messageText));
    } finally {
      setNetgsmTesting(false);
    }
  };

  const fetchSmsModuleSettings = async () => {
    try {
      const response = await api.get('/sms/settings');
      setSmsModuleSettings(response.data);
      setSmsModuleProvider(response.data?.provider || 'VATANSMS');
      setSmsModuleIsActive(!!response.data?.isActive);
    } catch (error) {
      console.error('SMS ayarları yüklenemedi:', error);
    }
  };

  const handleSaveSmsModuleSettings = async () => {
    try {
      setSmsModuleSaving(true);
      await api.post('/sms/settings', {
        provider: smsModuleProvider,
        isActive: smsModuleIsActive,
      });
      await fetchSmsModuleSettings();
      toast.success('SMS modülü ayarları kaydedildi.');
    } catch (error: any) {
      const messageText =
        error?.response?.data?.message || 'SMS modülü ayarları kaydedilemedi.';
      toast.error(messageText);
    } finally {
      setSmsModuleSaving(false);
    }
  };

  const fetchSmsTriggers = async () => {
    try {
      setSmsTriggersLoading(true);
      const response = await api.get('/sms/triggers');
      setSmsTriggers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('SMS tetikleyiciler yüklenemedi:', error);
    } finally {
      setSmsTriggersLoading(false);
    }
  };

  const updateSmsTrigger = async (
    id: string,
    patch: { enabled?: boolean; recipientType?: string; templateKey?: string },
  ) => {
    try {
      const response = await api.patch(`/sms/triggers/${id}`, patch);
      setSmsTriggers((prev) => prev.map((t) => (t.id === id ? response.data : t)));
      toast.success('SMS tetikleyici güncellendi.');
    } catch (error: any) {
      const messageText =
        error?.response?.data?.message || 'SMS tetikleyici güncellenemedi.';
      toast.error(messageText);
    }
  };

  const fetchSmsTemplates = async () => {
    try {
      setSmsTemplatesLoading(true);
      const response = await api.get('/sms/templates');
      const list = Array.isArray(response.data) ? response.data : [];
      setSmsTemplates(list);
      if (!smsSelectedTemplateId && list.length > 0) {
        const first = list[0];
        setSmsSelectedTemplateId(first.id);
        setSmsTemplateEditKey(first.key || '');
        setSmsTemplateEditTitle(first.title || '');
        setSmsTemplateEditContent(first.content || '');
        setSmsTemplateEditActive(!!first.isActive);
      }
    } catch (error) {
      console.error('SMS şablonları yüklenemedi:', error);
    } finally {
      setSmsTemplatesLoading(false);
    }
  };

  const handleSelectSmsTemplate = (id: string) => {
    setSmsSelectedTemplateId(id);
    const tpl = smsTemplates.find((t) => t.id === id);
    if (!tpl) return;
    setSmsTemplateEditKey(tpl.key || '');
    setSmsTemplateEditTitle(tpl.title || '');
    setSmsTemplateEditContent(tpl.content || '');
    setSmsTemplateEditActive(!!tpl.isActive);
  };

  const handleSaveSmsTemplate = async () => {
    if (!smsSelectedTemplateId) return;
    try {
      setSmsTemplateSaving(true);
      await api.patch(`/sms/templates/${smsSelectedTemplateId}`, {
        key: smsTemplateEditKey,
        title: smsTemplateEditTitle,
        content: smsTemplateEditContent,
        isActive: smsTemplateEditActive,
      });
      await fetchSmsTemplates();
      toast.success('SMS şablonu kaydedildi.');
    } catch (error: any) {
      const messageText =
        error?.response?.data?.message || 'SMS şablonu kaydedilemedi.';
      toast.error(messageText);
    } finally {
      setSmsTemplateSaving(false);
    }
  };

  const handleCreateSmsTemplate = async () => {
    try {
      setSmsNewTemplateSaving(true);
      await api.post('/sms/templates', {
        key: smsNewTemplateKey,
        title: smsNewTemplateTitle,
        content: smsNewTemplateContent,
        isActive: true,
      });
      setSmsNewTemplateKey('');
      setSmsNewTemplateTitle('');
      setSmsNewTemplateContent('');
      await fetchSmsTemplates();
      toast.success('SMS şablonu oluşturuldu.');
    } catch (error: any) {
      const messageText =
        error?.response?.data?.message || 'SMS şablonu oluşturulamadı.';
      toast.error(messageText);
    } finally {
      setSmsNewTemplateSaving(false);
    }
  };

  const handleSaveVatansmsConfig = async () => {
    try {
      setSaving(true);
      await api.post('/integrations/vatansms/config', {
        apiId: smsApiId || null,
        apiKey: smsApiKey || null,
        sender: smsSender || null,
        messageType: smsMessageType || null,
        messageContentType: smsMessageContentType || null,
        isActive: smsIsActive,
      });
      await fetchVatansmsConfig();
      toast.success('VatanSMS ayarları kaydedildi.');
    } catch (error: any) {
      const messageText =
        error?.response?.data?.message || 'VatanSMS ayarları kaydedilemedi.';
      toast.error(messageText);
    } finally {
      setSaving(false);
    }
  };

  const handleSendVatansmsTest = async () => {
    if (!smsIsActive) {
      toast.error('Lütfen önce VatanSMS entegrasyonunu aktif edip kaydedin.');
      return;
    }

    const to = smsTestNumber.trim();
    const message =
      (smsTestMessage && smsTestMessage.trim()) || 'Merhaba, bu bir test SMS mesajıdır.';

    if (!to) {
      toast.error('Lütfen test SMS için bir telefon numarası girin.');
      return;
    }

    setSmsTesting(true);
    try {
      await api.post('/integrations/vatansms/send', {
        to,
        message,
      });
      toast.success('Test SMS gönderildi.');
    } catch (error: any) {
      const messageText =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'Test SMS gönderilemedi.';
      toast.error(stringifyMaybeObject(messageText));
    } finally {
      setSmsTesting(false);
    }
  };

  const fetchPipelines = async () => {
    try {
      const response = await api.get('/crm/pipelines');
      setPipelines(response.data);
    } catch (error) {
      console.error('Pipelines yüklenemedi:', error);
    }
  };

  const handleUpdateAgency = async () => {
    try {
      setSaving(true);
      await api.patch('/tenants/me', { 
        name: agencyName, 
        logoUrl,
        address,
        title,
        phone,
        email,
        wordpressModuleEnabled,
      });
      await fetchTenant();
      toast.success('Ajans bilgileri güncellendi.');
    } catch (error) {
      console.error('Güncelleme hatası:', error);
      toast.error('Güncelleme başarısız oldu.');
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnectFacebook = async () => {
    try {
      setSaving(true);
      await api.post('/integrations/facebook/config', {
        accessToken: null,
        userAccessToken: null,
        pageId: null,
        pageName: null,
        isActive: false,
      });
      setFbConfig(null);
      setFbPages([]);
      setFbForms([]);
      setMappings([]);
      setSelectedPage('');
      toast.success('Facebook bağlantısı kesildi.');
    } catch (error) {
      toast.error('Facebook bağlantısı kesilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email) return;
    try {
      setSaving(true);
      await api.post('/tenants/users', newUser);
      await fetchTenant();
      setNewUser({ name: '', email: '', role: 'STAFF' });
      setIsAddingUser(false);
      toast.success('Kullanıcı başarıyla eklendi. Geçici şifre: ajans123');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Kullanıcı eklenemedi.');
    } finally {
      setSaving(false);
    }
  };

  const openEditUser = (u: any) => {
    setEditingUser(u);
    setEditUserForm({
      name: String(u?.name || ''),
      email: String(u?.email || ''),
      role: String(u?.role || 'STAFF'),
      newPassword: '',
    });
  };

  const handleUpdateUser = async () => {
    if (!editingUser?.id) return;
    try {
      setEditUserSaving(true);
      await api.patch(`/tenants/users/${editingUser.id}`, {
        name: editUserForm.name,
        email: editUserForm.email,
        role: editUserForm.role,
        newPassword: editUserForm.newPassword,
      });
      await fetchTenant();
      setEditingUser(null);
      toast.success('Kullanıcı güncellendi.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Kullanıcı güncellenemedi.');
    } finally {
      setEditUserSaving(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/tenants/users/${userId}`);
      await fetchTenant();
      toast.success('Kullanıcı başarıyla silindi.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Kullanıcı silinemedi.');
    }
  };

  const handleAddMapping = async () => {
    try {
      const newMapping = {
        facebookFormId: '',
        facebookFormName: '',
        pipelineId: pipelines[0]?.id || '',
        stageId: pipelines[0]?.stages[0]?.id || '',
      };
      const response = await api.post('/integrations/facebook/mappings', newMapping);
      setMappings([...mappings, response.data]);
    } catch (error) {
      console.error('Mapping eklenemedi:', error);
    }
  };

  const handleImportLeadsForMapping = async (mappingId: string) => {
    try {
      setMappingLoading(true);
      await api.post(`/integrations/facebook/import-leads/${mappingId}`);
      toast.success('Facebook leadleri başarıyla içe aktarıldı.');
    } catch (error) {
      console.error('Facebook leadleri içe aktarılamadı:', error);
      toast.error('Leadler içe aktarılırken bir hata oluştu.');
    } finally {
      setMappingLoading(false);
    }
  };

  const handleClearFacebookLeads = async () => {
    if (!confirm('Facebook kaynaklı tüm geçmiş leadler silinecek. Emin misiniz?')) return;
    try {
      setMappingLoading(true);
      const response = await api.post('/integrations/facebook/clear-leads');
      toast.success(`Silinen lead sayısı: ${response.data?.deletedCount ?? 0}`);
    } catch (error) {
      toast.error('Facebook leadleri silinemedi.');
    } finally {
      setMappingLoading(false);
    }
  };

  const handleUpdateMapping = async (id: string, data: any) => {
    try {
      await api.patch(`/integrations/facebook/mappings/${id}`, data);
      setMappings(mappings.map(m => m.id === id ? { ...m, ...data } : m));
    } catch (error) {
      console.error('Mapping güncellenemedi:', error);
    }
  };

  const handleDeleteMapping = async (id: string) => {
    try {
      await api.delete(`/integrations/facebook/mappings/${id}`);
      setMappings(mappings.filter(m => m.id !== id));
    } catch (error) {
      console.error('Mapping silinemedi:', error);
    }
  };

  const parasutConnected = !!parasutConfig?.accessToken;
  const paytrOrigin =
    typeof window !== 'undefined' ? window.location.origin || '' : '';
  const paytrCallbackUrl = `${paytrOrigin}/api/webhooks/paytr`;
  const paytrSuccessUrl = `${paytrOrigin}/paytr/success`;
  const paytrFailUrl = `${paytrOrigin}/paytr/fail`;
  const smsEventLabels: Record<string, string> = {
    TASK_COMPLETED: 'Görev tamamlandı',
    INVOICE_CREATED: 'Fatura oluşturuldu',
    INVOICE_REMINDER: 'Fatura hatırlatması',
    INVOICE_OVERDUE: 'Fatura gecikti',
    PROPOSAL_CREATED: 'Teklif oluşturuldu',
    PROPOSAL_UPDATED: 'Teklif güncellendi',
  };
  const smsRecipientLabels: Record<string, string> = {
    TASK_ASSIGNEE: 'Görev sorumlusu',
    TASK_WATCHERS: 'Görev takipçileri',
    CUSTOMER_PHONE: 'Müşteri telefonu',
    CUSTOMER_USERS: 'Müşteri kullanıcıları',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-900 dark:text-slate-100" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-[28px] font-normal tracking-[-0.03em] text-slate-900 dark:text-slate-50 flex items-center gap-2">
          <Settings className="h-6 w-6 text-slate-900 dark:text-slate-50" />
          <span>Ayarlar</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-300 text-sm mt-2">
          Ajans bilgilerinizi ve entegrasyonlarınızı yönetin.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-8">
          {!isClient && (
            <TabsTrigger value="agency" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Ajans & Ekip
            </TabsTrigger>
          )}
          <TabsTrigger value="facebook" className="flex items-center gap-2">
            <Facebook className="h-4 w-4" />
            Facebook Leads
          </TabsTrigger>
          <TabsTrigger value="instagram" className="flex items-center gap-2">
            <Instagram className="h-4 w-4" />
            Instagram
          </TabsTrigger>
          <TabsTrigger value="parasut" className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Paraşüt
          </TabsTrigger>
          {!isClient && (
            <TabsTrigger value="google-calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Google Calendar
            </TabsTrigger>
          )}
          {!isClient && (
            <TabsTrigger value="paytr" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              PayTR
            </TabsTrigger>
          )}
          {!isClient && (
            <TabsTrigger value="trello" className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              Trello
            </TabsTrigger>
          )}
          <TabsTrigger value="whatsapp" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </TabsTrigger>
          {!isClient && (
            <TabsTrigger value="sms" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              SMS
            </TabsTrigger>
          )}
        </TabsList>

        {!isClient && (
        <TabsContent value="agency">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
            {/* Agency Settings */}
            <Card className="p-6 space-y-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-50">
                <Building2 className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                Ajans Bilgileri
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Ajans Adı</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                      value={agencyName}
                      onChange={(e) => setAgencyName(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Logo URL</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                    <input
                      type="text"
                      placeholder="https://..."
                      className="w-full pl-10 pr-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                    Boş bırakılırsa varsayılan logo kullanılır.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Ünvan</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Telefon</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Adres</label>
                    <textarea
                      className="w-full px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                      rows={3}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">E-posta</label>
                    <input
                      type="email"
                      className="w-full px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 p-4 border rounded-lg bg-slate-50 dark:bg-slate-900 dark:border-slate-800">
                  <div className="flex items-center h-5">
                    <input
                      id="wordpressModuleEnabled"
                      type="checkbox"
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-600"
                      checked={wordpressModuleEnabled}
                      onChange={(e) => setWordpressModuleEnabled(e.target.checked)}
                    />
                  </div>
                  <div className="ml-2 text-sm">
                    <label htmlFor="wordpressModuleEnabled" className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Globe className="h-4 w-4 text-blue-500" />
                      WordPress Modülünü Etkinleştir
                    </label>
                    <p className="text-slate-500 dark:text-slate-400">
                      Aktif edildiğinde sol menüde "Web Siteleri" bölümü açılır.
                    </p>
                  </div>
                </div>

                {logoUrl && (
                  <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-900 dark:border-slate-800 flex items-center justify-center">
                    <img src={logoUrl} alt="Logo Preview" className="max-h-12 object-contain" />
                  </div>
                )}

                <Button 
                  className="w-full bg-black text-white hover:bg-neutral-900" 
                  onClick={handleUpdateAgency} 
                  disabled={saving}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Bilgileri Kaydet
                </Button>
              </div>
            </Card>

            {/* Team Management */}
            <Card className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-50">
                  <Users className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                  Ekip Yönetimi
                </h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsAddingUser(!isAddingUser)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Üye Ekle
                </Button>
              </div>

              {isAddingUser && (
                <div className="p-4 border rounded-lg bg-indigo-50/50 dark:bg-slate-900 dark:border-slate-800 space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Ad Soyad</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                        <input
                          type="text"
                          className="w-full pl-10 pr-4 py-2 border rounded-md text-sm bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                          value={newUser.name}
                          onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">E-posta</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                        <input
                          type="email"
                          className="w-full pl-10 pr-4 py-2 border rounded-md text-sm bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                          value={newUser.email}
                          onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Rol</label>
                    <select
                      className="w-full px-4 py-2 border rounded-md text-sm bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    >
                      <option value="STAFF">Personel</option>
                      <option value="ADMIN">Yönetici</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={handleAddUser} disabled={saving}>
                      Davet Gönder
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={() => setIsAddingUser(false)}>
                      İptal
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {(tenant?.users ?? []).map((user: any) => (
                  <div 
                    key={user.id} 
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center dark:bg-indigo-500/20 dark:text-indigo-300">
                        {(user.name?.[0] || user.email?.[0] || '?').toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{user.name || 'İsimsiz'}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-medium",
                        user.role === 'ADMIN'
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                      )}>
                        {user.role === 'ADMIN' ? 'Yönetici' : 'Personel'}
                      </span>
                      <button
                        onClick={() => openEditUser(user)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleRemoveUser(user.id)}
                        disabled={user.role === 'ADMIN' && tenant.users.filter((u: any) => u.role === 'ADMIN').length <= 1}
                        className="p-1.5 text-slate-400 hover:text-red-500 disabled:opacity-30 disabled:hover:text-slate-400 dark:text-slate-500 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                  <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 dark:bg-slate-900 dark:border dark:border-slate-800">
                    <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Kullanıcı Düzenle</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{editingUser.email}</p>
                      </div>
                      <button
                        onClick={() => setEditingUser(null)}
                        className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Ad Soyad</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-sm bg-white text-slate-900 placeholder:text-slate-400 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder:text-slate-500 dark:focus:ring-slate-100/10"
                          value={editUserForm.name}
                          onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">E-posta</label>
                        <input
                          type="email"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-sm bg-white text-slate-900 placeholder:text-slate-400 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder:text-slate-500 dark:focus:ring-slate-100/10"
                          value={editUserForm.email}
                          onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Rol</label>
                        <select
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-sm bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:focus:ring-slate-100/10"
                          value={editUserForm.role}
                          onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value })}
                        >
                          <option value="STAFF">Personel</option>
                          <option value="ADMIN">Yönetici</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Yeni Şifre</label>
                        <input
                          type="password"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-sm bg-white text-slate-900 placeholder:text-slate-400 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder:text-slate-500 dark:focus:ring-slate-100/10"
                          value={editUserForm.newPassword}
                          onChange={(e) => setEditUserForm({ ...editUserForm, newPassword: e.target.value })}
                          placeholder="••••••••"
                        />
                      </div>

                      <div className="pt-2 flex gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          onClick={() => setEditingUser(null)}
                          disabled={editUserSaving}
                        >
                          İptal
                        </Button>
                        <Button
                          type="button"
                          className="flex-1 bg-slate-900 text-white hover:bg-slate-800"
                          onClick={handleUpdateUser}
                          disabled={editUserSaving}
                        >
                          {editUserSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Kaydet
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>
        )}

        <TabsContent value="facebook">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
            {/* Facebook Connection */}
            <Card className="p-6 space-y-6 lg:col-span-1 h-fit">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-50">
                <Facebook className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Facebook Bağlantısı
              </h3>
              
              {!(fbConfig?.userAccessToken || fbConfig?.accessToken) ? (
                <div className="space-y-4">
                  <p className="text-sm text-slate-500 dark:text-slate-300">
                    Facebook Leads entegrasyonunu kullanmak için Facebook hesabınızı bağlayın.
                  </p>
                  <Button onClick={handleFacebookLogin} className="w-full bg-black text-white hover:bg-neutral-900">
                    <Facebook className="h-4 w-4 mr-2" />
                    Facebook ile Giriş Yap
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-100 dark:bg-green-500/10 dark:text-green-300 dark:border-green-500/40">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Bağlantı Aktif
                    </div>
                    <Button variant="ghost" size="sm" className="text-red-500 h-7 px-2" onClick={handleDisconnectFacebook}>
                      Kes
                    </Button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Sayfa Seçimi</label>
                    <select
                      className="w-full px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                      value={selectedPage}
                      onChange={(e) => handlePageChange(e.target.value)}
                    >
                      <option value="">Sayfa Seçiniz...</option>
                      {fbPages.map(page => (
                        <option key={page.id} value={page.id}>{page.name}</option>
                      ))}
                    </select>
                  </div>

                  {fbConfig.pageName && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Şu an bağlı sayfa: <strong>{fbConfig.pageName}</strong>
                    </p>
                  )}
                </div>
              )}
            </Card>

            {/* Lead Mappings */}
            <Card className="p-6 space-y-6 lg:col-span-2">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-50">
                  <Link2 className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                  Form Eşleştirmeleri
                </h3>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleClearFacebookLeads}
                    disabled={mappingLoading}
                  >
                    Geçmiş Leadleri Sil
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleAddMapping}
                    disabled={!fbConfig?.pageId}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Yeni Eşleştirme
                  </Button>
                </div>
              </div>

              {!fbConfig?.pageId ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg bg-slate-50 dark:bg-slate-900 dark:border-slate-800">
                  <Facebook className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Eşleştirme yapmak için önce bir sayfa seçmelisiniz.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {mappings.map((mapping) => (
                    <div key={mapping.id} className="p-5 border rounded-xl space-y-4 bg-white shadow-sm border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Facebook Formu</label>
                            <select
                              className="w-full px-3 py-1.5 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                              value={mapping.facebookFormId || ''}
                              onChange={(e) => {
                                const form = fbForms.find(f => f.id === e.target.value);
                                handleUpdateMapping(mapping.id, { 
                                  facebookFormId: e.target.value,
                                  facebookFormName: form?.name || ''
                                });
                              }}
                            >
                              <option value="">Form Seçiniz...</option>
                              {fbForms.map(form => (
                                <option key={form.id} value={form.id}>{form.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Hedef Pipeline & Aşama</label>
                            <div className="flex gap-2">
                              <select
                                className="flex-1 px-3 py-1.5 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                                value={mapping.pipelineId}
                                onChange={(e) => {
                                  const p = pipelines.find(pl => pl.id === e.target.value);
                                  handleUpdateMapping(mapping.id, { 
                                    pipelineId: e.target.value,
                                    stageId: p?.stages[0]?.id || ''
                                  });
                                }}
                              >
                                {pipelines.map(p => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                              </select>
                              <select
                                className="flex-1 px-3 py-1.5 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                                value={mapping.stageId}
                                onChange={(e) => handleUpdateMapping(mapping.id, { stageId: e.target.value })}
                              >
                                {pipelines.find(p => p.id === mapping.pipelineId)?.stages.map((s: any) => (
                                  <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Varsayılan Atanan (Otomatik)</label>
                            <select
                              className="w-full px-3 py-1.5 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                              value={mapping.defaultAssigneeId || ''}
                              onChange={(e) => handleUpdateMapping(mapping.id, { defaultAssigneeId: e.target.value || null })}
                            >
                              <option value="">Atama Yapma</option>
                              {tenant.users.map((u: any) => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!mapping.facebookFormId || mappingLoading}
                            onClick={() => handleImportLeadsForMapping(mapping.id)}
                          >
                            Leadleri Çek
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400"
                            onClick={() => handleDeleteMapping(mapping.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Personnel Rule Section */}
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-50 mb-3 flex items-center gap-1">
                          <Users className="h-3 w-3 text-indigo-500 dark:text-indigo-400" />
                          Personel Yetkilendirme (Bu formun leadlerini kimler görebilir?)
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {tenant.users.map((user: any) => {
                            const assignedIds = mapping.assignedUserIds ? JSON.parse(mapping.assignedUserIds) : [];
                            const isAssigned = assignedIds.includes(user.id);
                            return (
                              <button
                                key={user.id}
                                onClick={() => {
                                  const newIds = isAssigned
                                    ? assignedIds.filter((id: string) => id !== user.id)
                                    : [...assignedIds, user.id];
                                  handleUpdateMapping(mapping.id, { assignedUserIds: JSON.stringify(newIds) });
                                }}
                                className={cn(
                                  "px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
                                  isAssigned
                                    ? "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/40"
                                    : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700"
                                )}
                              >
                                {user.name}
                              </button>
                            );
                          })}
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 w-full mt-1">
                            * Hiç kimse seçilmezse leadler tüm personeller tarafından görülebilir.
                          </p>
                        </div>
                      </div>

                    </div>
                  ))}
                  
                  {mappings.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg bg-slate-50 dark:bg-slate-900 dark:border-slate-800">
                      <p className="text-slate-500 dark:text-slate-400 text-sm">Henüz bir eşleştirme yapılmamış.</p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="instagram">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
            <Card className="p-6 space-y-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-50">
                <Instagram className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                Instagram Bağlantısı
              </h3>
              
              <div className="space-y-4">
                <p className="text-sm text-slate-500 dark:text-slate-300">
                  Instagram DM ve Yorumlarını yönetmek için Instagram hesabınızı bağlayın.
                  Instagram bağlantısı, Facebook Sayfanız üzerinden yapılır.
                </p>

                {!(fbConfig?.userAccessToken || fbConfig?.accessToken) ? (
                  <Button onClick={handleFacebookLogin} className="w-full bg-pink-600 text-white hover:bg-pink-700">
                    <Facebook className="h-4 w-4 mr-2" />
                    Facebook ile Instagram'ı Bağla
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center gap-2 text-sm border border-green-100 dark:bg-green-500/10 dark:text-green-300 dark:border-green-500/40">
                      <CheckCheck className="h-4 w-4" />
                      Facebook hesabınız bağlı.
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-slate-900 dark:text-slate-50">Bağlı Instagram Hesapları</h4>
                      {fbPages.filter(p => p.instagram_business_account).length > 0 ? (
                        <div className="space-y-2">
                          {fbPages.filter(p => p.instagram_business_account).map(page => (
                             <div key={page.id} className="flex items-center justify-between p-3 border rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-pink-600 flex items-center justify-center text-white font-bold text-xs">
                                     IG
                                   </div>
                                   <div>
                                     <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{page.name}</p>
                                     <p className="text-xs text-slate-500 dark:text-slate-400">Bağlı Sayfa: {page.name}</p>
                                   </div>
                                </div>
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium dark:bg-green-500/10 dark:text-green-300">Aktif</span>
                             </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center p-4 border rounded-lg bg-slate-50 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800">
                           <p>Facebook hesabınıza bağlı Instagram işletme hesabı bulunamadı.</p>
                           <p className="text-xs mt-1">Lütfen Facebook Sayfanızın ayarlarına giderek Instagram hesabınızı bağladığınızdan emin olun.</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="pt-4 border-t">
                         <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
                            Instagram hesabınız görünmüyor mu? İzinleri yenilemek için tekrar giriş yapın.
                         </p>
                         <div className="flex gap-2">
                             <Button onClick={handleFacebookLogin} variant="outline" size="sm" className="flex-1">
                                <Facebook className="h-3 w-3 mr-2" />
                                İzinleri Yenile
                             </Button>
                             <Button 
                                onClick={handleTestConnection} 
                                variant="outline" 
                                size="sm" 
                                className="flex-1"
                                disabled={fbTestStatus === 'loading'}
                             >
                                {fbTestStatus === 'loading' ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <CheckCircle2 className="h-3 w-3 mr-2" />}
                                Bağlantıyı Test Et
                             </Button>
                         </div>

                        {fbTestStatus === 'success' && (
                             <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-100 animate-in fade-in slide-in-from-top-2 dark:bg-green-500/10 dark:border-green-500/40">
                                 <div className="flex items-start gap-3">
                                     <div className="w-10 h-10 rounded-full bg-white border border-green-200 p-0.5 shrink-0 overflow-hidden dark:bg-slate-900 dark:border-green-500/40">
                                         {fbTestResult?.profile_picture_url ? (
                                             <img src={fbTestResult.profile_picture_url} className="w-full h-full rounded-full object-cover" />
                                         ) : (
                                             <div className="w-full h-full bg-green-100 flex items-center justify-center text-green-700 font-bold">IG</div>
                                         )}
                                     </div>
                                     <div className="flex-1 min-w-0">
                                         <p className="text-sm font-bold text-slate-900 dark:text-slate-50">{fbTestResult?.name}</p>
                                         <p className="text-xs text-slate-500 dark:text-slate-400">@{fbTestResult?.username}</p>
                                         <div className="mt-2 flex gap-2">
                                             <Button 
                                                size="sm" 
                                                className="h-7 text-xs bg-slate-900 text-white hover:bg-slate-800"
                                                onClick={handlePreviewSync}
                                                disabled={fbSyncLoading}
                                             >
                                                {fbSyncLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <MessageCircle className="h-3 w-3 mr-1" />}
                                                Son Mesajları Çek (Önizleme)
                                             </Button>
                                         </div>
                                     </div>
                                 </div>

                                 {/* Preview Area */}
                                         {fbPreviewData.length > 0 && (
                                     <div className="mt-4 border-t border-green-200 pt-3 dark:border-green-500/40">
                                         <h5 className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">Bulunan Son Konuşmalar</h5>
                                         <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                                             {fbPreviewData.map((conv: any) => (
                                                 <div key={conv.conversationId} className="bg-white p-2 rounded border border-green-100 text-xs dark:bg-slate-900 dark:border-green-500/40">
                                                     <div className="flex justify-between mb-1">
                                                         <span className="font-bold text-slate-800 dark:text-slate-100">@{conv.participant.username}</span>
                                                         <span className="text-slate-400 dark:text-slate-500">{new Date(conv.updatedAt).toLocaleDateString()}</span>
                                                     </div>
                                                     <p className="text-slate-500 dark:text-slate-400 truncate">{conv.lastMessage.content}</p>
                                                 </div>
                                             ))}
                                         </div>
                                         <Button 
                                            size="sm" 
                                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                                            onClick={handleConfirmSync}
                                            disabled={fbSyncLoading}
                                         >
                                            {fbSyncLoading ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Save className="h-3 w-3 mr-2" />}
                                            Seçili Mesajları Sisteme Kaydet
                                         </Button>
                                     </div>
                                 )}
                             </div>
                         )}

                         {fbTestStatus === 'error' && (
                             <div className="mt-4 p-3 bg-red-50 text-red-700 text-xs rounded border border-red-100 flex gap-2 items-start dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/40">
                                 <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                 <div>
                                     <p className="font-bold">Bağlantı Hatası</p>
                                     <p>{typeof fbTestResult === 'string' ? fbTestResult : 'Bilinmeyen hata'}</p>
                                 </div>
                             </div>
                         )}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6 space-y-6">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-50">
                    <Shield className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                    İzinler ve Gizlilik
                </h3>
                <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
                    <p>
                        Instagram entegrasyonu için aşağıdaki izinler gereklidir:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li><strong>Mesajları Yönetme:</strong> DM kutunuzu görüntülemek ve yanıtlamak için.</li>
                        <li><strong>Yorumları Yönetme:</strong> Gönderilerinize gelen yorumları görmek ve yanıtlamak için.</li>
                        <li><strong>İçerik Görüntüleme:</strong> Profil bilgilerinizi ve gönderilerinizi görüntülemek için.</li>
                    </ul>
                    <p className="text-xs text-slate-500 dark:text-slate-400 pt-2">
                        Verileriniz şifreli olarak saklanır ve sadece sizin yetki verdiğiniz personel tarafından görüntülenebilir.
                    </p>
                </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="parasut">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
            <Card className="p-6 space-y-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-50">
                <Link2 className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                Paraşüt Bağlantısı
              </h3>

              {!parasutConnected ? (
                <div className="space-y-4">
                  <p className="text-sm text-slate-500 dark:text-slate-300">
                    Paraşüt hesabınızı bağlayarak müşterilerinizin fatura ve cari
                    verilerini senkronlayabilirsiniz.
                  </p>
                  <Button
                    onClick={handleParasutConnect}
                    className="w-full bg-black text-white hover:bg-neutral-900"
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Link2 className="h-4 w-4 mr-2" />
                    )}
                    Paraşüt ile Bağlan
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/40">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Bağlantı Aktif
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 h-7 px-2"
                      onClick={handleDisconnectParasut}
                      disabled={saving}
                    >
                      Kes
                    </Button>
                  </div>
                  {parasutConfig?.updatedAt && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Son güncelleme:{' '}
                      {new Date(parasutConfig.updatedAt).toLocaleString('tr-TR')}
                    </span>
                  )}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Paraşüt Şirket ID
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                    placeholder="Örn. 12345"
                    value={parasutCompanyId}
                    onChange={(e) => setParasutCompanyId(e.target.value)}
                  />
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                    Paraşüt panelinde şirket detaylarında yer alan ID bilgisini girin.
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 dark:border-slate-600"
                      checked={parasutIsActive}
                      onChange={(e) => setParasutIsActive(e.target.checked)}
                    />
                    Paraşüt entegrasyonunu aktif et
                  </label>
                </div>

                <Button
                  className="w-full bg-black text-white hover:bg-neutral-900"
                  onClick={handleSaveParasutConfig}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Paraşüt Ayarlarını Kaydet
                </Button>
              </div>
            </Card>

            <Card className="p-6 space-y-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-50">
                <Shield className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                Bağlantı Testi
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-300">
                Mevcut bağlantının çalıştığını doğrulamak için Paraşüt hesabınıza
                istek gönderilir.
              </p>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs">
                    {parasutIsActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/40">
                        <CheckCircle2 className="h-3 w-3" />
                        Entegrasyon aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/40">
                        <XCircle className="h-3 w-3" />
                        Entegrasyon pasif
                      </span>
                    )}
                  </span>
                  {parasutConnected && (
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Bağlı hesap mevcut
                    </span>
                  )}
                </div>

                <Button
                  className="w-full bg-black text-white hover:bg-neutral-900"
                  onClick={handleParasutTest}
                  disabled={parasutTesting}
                >
                  {parasutTesting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Shield className="h-4 w-4 mr-2" />
                  )}
                  Bağlantıyı Test Et
                </Button>

                {parasutTestStatus === 'success' && (
                  <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded border border-emerald-100 flex gap-2 items-start dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/40">
                    <CheckCheck className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Bağlantı başarılı</p>
                      <p>
                        {typeof parasutTestResult === 'string'
                          ? parasutTestResult
                          : 'Paraşüt hesabına erişim doğrulandı.'}
                      </p>
                    </div>
                  </div>
                )}

                {parasutTestStatus === 'error' && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-100 flex gap-2 items-start dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/40">
                    <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Bağlantı başarısız</p>
                      <p>
                        {typeof parasutTestResult === 'string'
                          ? parasutTestResult
                          : 'Bağlantı doğrulanamadı.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>

        {!isClient && (
          <TabsContent value="paytr">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
              <Card className="p-6 space-y-6">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-50">
                  <CreditCard className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                  PayTR Mağaza Ayarları
                </h3>

                <p className="text-sm text-slate-500 dark:text-slate-300">
                  PayTR tarafında kendi mağazanızı açıp buradaki bilgileri girin. Bu entegrasyonda tahsilatlar PayTR
                  üzerinden ve sizin PayTR hesabınıza gerçekleşir.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                      Merchant ID
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                      value={paytrMerchantId}
                      onChange={(e) => setPaytrMerchantId(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                      Merchant Key
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                      value={paytrMerchantKey}
                      onChange={(e) => setPaytrMerchantKey(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                      Merchant Salt
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                      value={paytrMerchantSalt}
                      onChange={(e) => setPaytrMerchantSalt(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 dark:border-slate-600"
                        checked={paytrIsActive}
                        onChange={(e) => setPaytrIsActive(e.target.checked)}
                      />
                      PayTR entegrasyonunu aktif et
                    </label>
                  </div>

                  <Button
                    className="w-full bg-black text-white hover:bg-neutral-900"
                    onClick={handleSavePaytrConfig}
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    PayTR Ayarlarını Kaydet
                  </Button>

                  {paytrConfig?.updatedAt && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Son güncelleme: {new Date(paytrConfig.updatedAt).toLocaleString('tr-TR')}
                    </span>
                  )}
                </div>
              </Card>

              <Card className="p-6 space-y-6">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-50">
                  <Globe className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                  Başvuru Bilgileri
                </h3>

                <div className="space-y-4">
                  <p className="text-sm text-slate-500 dark:text-slate-300">
                    PayTR mağaza başvurusu / panel ayarlarında aşağıdaki URL alanlarını bu şekilde girin. Ödeme iste
                    akışını devreye aldığımızda bu URL’ler kullanılarak durumlar otomatik güncellenir.
                  </p>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                      Bildirim (Callback) URL
                    </label>
                    <input
                      type="text"
                      readOnly
                      className="w-full px-4 py-2 border rounded-md text-sm bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 dark:border-slate-800"
                      value={paytrCallbackUrl}
                    />
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                      Ödeme sonucu PayTR tarafından bu adrese bildirilir (ödeme iste akışı devredeyken).
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                      Başarılı URL
                    </label>
                    <input
                      type="text"
                      readOnly
                      className="w-full px-4 py-2 border rounded-md text-sm bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 dark:border-slate-800"
                      value={paytrSuccessUrl}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                      Başarısız URL
                    </label>
                    <input
                      type="text"
                      readOnly
                      className="w-full px-4 py-2 border rounded-md text-sm bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 dark:border-slate-800"
                      value={paytrFailUrl}
                    />
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        )}

        {!isClient && (
          <TabsContent value="google-calendar">
            <div className="space-y-8 pb-12">
              <Card className="p-6 space-y-6">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-50">
                  <Calendar className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                  Google Calendar & Meet
                </h3>

                <p className="text-sm text-slate-500 dark:text-slate-300">
                  Google Calendar&apos;ı ajansınız için bağlayarak toplantıları otomatik oluşturabilir,
                  Google Meet linklerini tek tıkla üretebilirsiniz.
                </p>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-700 dark:text-slate-200">
                      <div className="font-medium">
                        {googleCalendarConfig?.email
                          ? googleCalendarConfig.email
                          : 'Herhangi bir Google hesabı bağlı değil'}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        En iyi deneyim için ajansınızın ortak takvimini veya sahibinin hesabını bağlayabilirsiniz.
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleGoogleCalendarConnect}
                      disabled={saving}
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Calendar className="h-4 w-4 mr-2" />
                      )}
                      Google ile Bağlan
                    </Button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                      Varsayılan Takvim ID
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                      placeholder="Boş bırakılırsa Google hesabının ana takvimi (primary) kullanılır"
                      value={googleCalendarPrimary}
                      onChange={(e) => setGoogleCalendarPrimary(e.target.value)}
                    />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Gelişmiş kullanımda belirli bir takvime (örneğin ekip takvimi) yazmak için
                      o takvimin ID değerini buraya girebilirsiniz.
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 dark:border-slate-600"
                        checked={!!googleCalendarConfig?.isActive}
                        onChange={(e) =>
                          setGoogleCalendarConfig((prev: any) => ({
                            ...(prev || {}),
                            isActive: e.target.checked,
                          }))
                        }
                      />
                      Google Calendar entegrasyonunu aktif et
                    </label>
                  </div>

                  <Button
                    className="w-full bg-black text-white hover:bg-neutral-900"
                    onClick={handleSaveGoogleCalendarConfig}
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Google Calendar Ayarlarını Kaydet
                  </Button>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleTestGoogleCalendar}
                      disabled={googleCalendarTesting}
                    >
                      {googleCalendarTesting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      )}
                      Bağlantıyı Test Et
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleCreateGoogleTestEvent}
                      disabled={googleCalendarCreatingEvent}
                    >
                      {googleCalendarCreatingEvent ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Calendar className="h-4 w-4 mr-2" />
                      )}
                      Test Toplantısı Oluştur
                    </Button>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 space-y-1 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700">
                    <p className="font-semibold">Nasıl çalışır?</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>
                        &quot;Google ile Bağlan&quot; ile Google hesabınıza izin verirsiniz. Uygulama sadece
                        takvim ve profil bilgilerinize erişir.
                      </li>
                      <li>
                        &quot;Test Toplantısı Oluştur&quot; ile Google Calendar&apos;da 30 dakikalık bir
                        toplantı oluşturulur ve Google Meet linki üretilir.
                      </li>
                      <li>
                        İleride görev, teklif, proje vb. ekranlardan otomatik toplantı oluşturma için bu
                        entegrasyon kullanılacaktır.
                      </li>
                    </ul>
                  </div>
                  
                  {/* DEBUG INFO - Bunu canlıda görüp görmediğimizi kontrol edeceğiz */}
                  <div className="p-2 bg-red-100 text-red-600 text-xs rounded border border-red-200 mt-4">
                    DEBUG: v2.1 - AutoActive:ON - EnvPriority:ON
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        )}

        {!isClient && (
          <TabsContent value="trello">
            <div className="space-y-8 pb-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="p-6 space-y-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-50">
                    <LayoutGrid className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                    Trello Bağlantısı
                  </h3>

                  <p className="text-sm text-slate-500 dark:text-slate-300">
                    Trello API Key ve Token bilgilerinizi girin. Bu bilgilerle board, liste ve kartlarınızı içe aktarabilirsiniz.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                        API Key
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                        value={trelloApiKey}
                        onChange={(e) => setTrelloApiKey(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                        Token
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                        value={trelloToken}
                        onChange={(e) => setTrelloToken(e.target.value)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 dark:border-slate-600"
                          checked={trelloIsActive}
                          onChange={(e) => setTrelloIsActive(e.target.checked)}
                        />
                        Trello entegrasyonunu aktif et
                      </label>
                      {trelloConfig?.updatedAt && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Son güncelleme:{' '}
                          {new Date(trelloConfig.updatedAt).toLocaleString('tr-TR')}
                        </span>
                      )}
                    </div>

                    <Button
                      className="w-full bg-black text-white hover:bg-neutral-900"
                      onClick={handleSaveTrelloConfig}
                      disabled={saving}
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Trello Ayarlarını Kaydet
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleLoadTrelloBoards}
                      disabled={trelloLoadingBoards}
                    >
                      {trelloLoadingBoards ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <LayoutGrid className="h-4 w-4 mr-2" />
                      )}
                      Boardları Yükle
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleTestTrelloAuth}
                      disabled={trelloLoadingBoards}
                    >
                      {trelloLoadingBoards ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      )}
                      Bağlantıyı Test Et
                    </Button>
                  </div>
                </Card>

                <Card className="p-6 space-y-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-50">
                    <LayoutGrid className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                    Trello Import
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                        Müşteri (opsiyonel)
                      </label>
                      <select
                        className="w-full px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                        value={trelloCustomerId}
                        onChange={(e) => setTrelloCustomerId(e.target.value)}
                      >
                        {trelloCustomers.map((c: any) => (
                          <option key={c.id} value={c.id}>
                            {c.name || c.email || c.id}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Boş bırakılırsa görevler herhangi bir markaya/projeye bağlanmadan içe aktarılır.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                        Proje Adı (opsiyonel)
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                        value={trelloProjectName}
                        onChange={(e) => setTrelloProjectName(e.target.value)}
                        placeholder="Boş bırakılırsa Trello board adı kullanılır"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                        Board
                      </label>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                        Yüklü board: {trelloBoards.length}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                        Board seçince listeler gelir, sonra Import Et ile görevler içeri aktarılır.
                      </div>
                      <select
                        className="w-full px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                        value={trelloBoardId}
                        onChange={(e) => handleSelectTrelloBoard(e.target.value)}
                      >
                        <option value="">Seçiniz</option>
                        {trelloBoards.map((b: any) => (
                          <option key={b.id} value={b.id}>
                            {b.name || b.id}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 space-y-2 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Liste → Kolon Eşleştirme</span>
                        {trelloLoadingLists && (
                          <span className="inline-flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Yükleniyor
                          </span>
                        )}
                      </div>
                      {trelloLists.length === 0 ? (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Bir board seçince listeler ve eşleştirme seçenekleri burada görünür.
                        </span>
                      ) : (
                        <div className="space-y-2">
                          {trelloLists.map((l: any) => (
                            <div key={l.id} className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
                              <div className="text-sm text-slate-700 dark:text-slate-200">
                                {l.name}
                              </div>
                              <select
                                className="w-full px-3 py-2 border rounded-md text-sm bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 dark:border-slate-800"
                                value={trelloListStatusMap[l.id] || (taskStatusColumns.find((c) => c.id === 'TODO')?.id || 'TODO')}
                                onChange={(e) =>
                                  setTrelloListStatusMap((prev) => ({
                                    ...prev,
                                    [l.id]: e.target.value,
                                  }))
                                }
                              >
                                <optgroup label="Durum">
                                  {taskStatusColumns
                                    .filter((c) => !c?.archived)
                                    .map((c) => (
                                      <option key={c.id} value={c.id}>
                                        {c.title}
                                      </option>
                                    ))}
                                </optgroup>
                                <optgroup label="Personel">
                                  <option value="assignee:unassigned">Atanmamış</option>
                                  {(tenant?.users ?? []).map((u: any) => (
                                    <option key={u.id} value={`assignee:${u.id}`}>
                                      {u.name || u.email || u.id}
                                    </option>
                                  ))}
                                </optgroup>
                              </select>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button
                      className="w-full bg-black text-white hover:bg-neutral-900"
                      onClick={handleImportTrelloBoard}
                      disabled={trelloImporting}
                    >
                      {trelloImporting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <LayoutGrid className="h-4 w-4 mr-2" />
                      )}
                      Import Et
                    </Button>
                  </div>
                </Card>
              </div>
              <Card className="p-6 space-y-6">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-50">
                  <LayoutGrid className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                  Trello API Anahtarı ve Token Nasıl Alınır?
                </h3>
                <div className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
                  <p>Kurulum adımları:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Trello hesabınızla giriş yapın.</li>
                    <li><a href="https://trello.com/app-key" target="_blank" rel="noreferrer" className="underline">trello.com/app-key</a> adresine gidin.</li>
                    <li>Sayfada görünen API Key değerini kopyalayın ve bu sayfadaki Trello ayarlarına yapıştırın.</li>
                    <li>Token almak için şu yetkilendirme adresini açın: <a href="https://trello.com/1/authorize?expiration=never&scope=read,write,account&response_type=token&name=MoiPort&key=190351a2a051a34bd29e2096d91e7dbc" target="_blank" rel="noreferrer" className="underline">Trello Token oluştur</a>.</li>
                    <li>Açılan sayfada gerekli okuma/yazma ve hesap izinlerini onaylayın; ardından ekranda gösterilen veya URL&apos;deki Token değerini kopyalayın.</li>
                    <li>Bu Token&apos;ı bu sayfadaki Trello ayarlarına yapıştırın ve “Trello Ayarlarını Kaydet” düğmesine basın.</li>
                    <li>“Bağlantıyı Test Et” ile doğrulayın; ardından “Boardları Yükle” ile board’larınızı getirip “Import Et” ile görevleri içe aktarın.</li>
                  </ol>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700">
                    <p className="font-semibold">Notlar</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Trello entegrasyonunu etkinleştirmek için API Key ve Token zorunludur.</li>
                      <li>Token yetkileri yetersizse bağlantı testi başarısız olabilir; yeniden oluşturun.</li>
                      <li>Import sırasında “Müşteri” boş bırakılırsa görevler projesiz olarak eklenir.</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        )}

        <TabsContent value="whatsapp">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
            <Card className="p-6 space-y-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-50">
                <MessageCircle className="h-5 w-5 text-emerald-500" />
                WhatsApp API Ayarları
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Sağlayıcı</label>
                  <select
                    className="w-full px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-emerald-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                    value={waProvider}
                    onChange={(e) => setWaProvider(e.target.value)}
                  >
                    <option value="meta">Resmi WhatsApp Cloud API (Meta)</option>
                    <option value="wasender">WasenderAPI (Web tabanlı)</option>
                    <option value="infobip">Infobip (Resmi BSP)</option>
                  </select>
                </div>
              </div>

              {waProvider === 'wasender' ? (
                <>
                  <p className="text-sm text-slate-500 dark:text-slate-300">
                    Bu bölümde WasenderAPI üzerinden WhatsApp mesajlaşmasını yapılandırabilirsiniz.
                    WasenderAPI resmi Meta WhatsApp Business API değildir. Uzun vadeli ve yüksek
                    hacimli kullanımlarda WhatsApp hesabınızın kısıtlanma riski bulunduğunu unutmayın.
                  </p>

                  <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 space-y-1 dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-500/40">
                    <p className="font-semibold">Önemli Uyarı</p>
                    <p>
                      WasenderAPI, WhatsApp Web oturumu üzerinden çalışan üçüncü parti bir entegrasyondur.
                      Toplu veya spam amaçlı kullanım WhatsApp hesabınızın askıya alınmasına neden olabilir.
                      Bu entegrasyonu kullanmak tamamen kendi sorumluluğunuzdadır.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">WasenderAPI Endpoint</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border rounded-md text-sm bg-slate-50 text-slate-500 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700"
                        value="https://www.wasenderapi.com/api/send-message"
                        readOnly
                      />
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                        Mesajlar bu endpoint'e WasenderAPI dokümantasyonuna uygun formatta gönderilir.
                        Bu adres sabittir ve değiştirilmesi önerilmez.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">WasenderAPI API Key</label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-emerald-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                        placeholder="WasenderAPI panelinden aldığınız API anahtarını girin"
                        value={waAccessToken}
                        onChange={(e) => setWaAccessToken(e.target.value)}
                      />
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                        WasenderAPI hesabınızda oturum oluşturup QR kod ile WhatsApp hesabınızı bağladıktan sonra
                        oluşturulan API anahtarını buraya yapıştırın.
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 space-y-1 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700">
                      <p className="font-semibold">Kurulum Adımları (Özet)</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>wasenderapi.com adresine kayıt olun ve giriş yapın.</li>
                        <li>Dashboard üzerinde Sessions bölümünden yeni bir oturum oluşturun.</li>
                        <li>
                          Oluşan QR kodu telefonunuzdaki WhatsApp uygulamasından &quot;Bağlı Cihazlar&quot; menüsünden
                          tarayarak hesabınızı bağlayın.
                        </li>
                        <li>Oturum aktif olduktan sonra ilgili API Key değerini kopyalayın.</li>
                        <li>Bu sayfadaki WasenderAPI API Key alanına yapıştırıp ayarları kaydedin.</li>
                      </ol>
                    </div>
                  </div>
                </>
              ) : waProvider === 'meta' ? (
                <>
                  <p className="text-sm text-slate-500 dark:text-slate-300">
                    Resmi WhatsApp Cloud API (Meta) ile doğrudan entegrasyon yapabilirsiniz. Sabit sağlayıcı ücreti yoktur;
                    ücretlendirme konuşma başına yapılır ve düşük hacimde genellikle daha uygundur.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Phone Number ID</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-emerald-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                        placeholder="Meta Cloud API telefon numarası ID"
                        value={waPhoneNumberId}
                        onChange={(e) => setWaPhoneNumberId(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Access Token</label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-emerald-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                        placeholder="Meta uygulama access token"
                        value={waAccessToken}
                        onChange={(e) => setWaAccessToken(e.target.value)}
                      />
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                        Facebook Business doğrulaması, WhatsApp Business hesabı ve numara kaydı tamamlandıktan sonra
                        Cloud API üzerinden token oluşturabilirsiniz.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">API Versiyon</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-emerald-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                        placeholder="Örn. v21.0"
                        value={waApiVersion}
                        onChange={(e) => setWaApiVersion(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-500 dark:text-slate-300">
                    Infobip resmi WhatsApp BSP’dir. API anahtarı ve gönderici numara ile çalışır.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Gönderen Numara (WhatsApp)</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-emerald-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                        placeholder="Örn. 447000000000 (E.164 biçimi)"
                        value={waPhoneNumberId}
                        onChange={(e) => setWaPhoneNumberId(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">API Key</label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-emerald-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                        placeholder="Infobip API Key"
                        value={waAccessToken}
                        onChange={(e) => setWaAccessToken(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-4">
                  <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 dark:border-slate-600"
                      checked={waIsActive}
                      onChange={(e) => setWaIsActive(e.target.checked)}
                    />
                    WhatsApp entegrasyonunu aktif et
                  </label>
                  {waConfig?.updatedAt && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Son güncelleme:{' '}
                      {new Date(waConfig.updatedAt).toLocaleString('tr-TR')}
                    </span>
                  )}
                </div>
                <Button
                  className="px-6 bg-black text-white hover:bg-neutral-900"
                  onClick={handleSaveWhatsappConfig}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  WhatsApp Ayarlarını Kaydet
                </Button>
              </div>
              <div className="mt-6 space-y-4">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50">AI Yanıt Ayarları</h4>
                <div className="flex items-center gap-6">
                  <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 dark:border-slate-600"
                      checked={waAiEnabled}
                      onChange={(e) => setWaAiEnabled(e.target.checked)}
                    />
                    AI önerilerini etkinleştir
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300"
                      checked={waAutoReplyEnabled}
                      onChange={(e) => setWaAutoReplyEnabled(e.target.checked)}
                    />
                    Otomatik yanıtı etkinleştir
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                    Otomatik mesajlar (her satır bir şablon)
                  </label>
                  <textarea
                    className="w-full px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-emerald-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                    rows={4}
                    placeholder="Örn.\nMerhaba, nasıl yardımcı olabilirim?\nMesajınızı aldık, kısa süre içinde döneceğiz."
                    value={waAutoReplyTemplates}
                    onChange={(e) => setWaAutoReplyTemplates(e.target.value)}
                  />
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                    Tek satırda bir mesaj şablonu yazın. Boş satırlar kaydedilmez.
                  </p>
                </div>
                <Button
                  className="px-6 bg-black text-white hover:bg-neutral-900"
                  onClick={handleSaveWhatsappConfig}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  AI Yanıt Ayarlarını Kaydet
                </Button>
              </div>
            </Card>
            <Card className="p-6 space-y-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-50">
                <MessageCircle className="h-5 w-5 text-emerald-500" />
                WhatsApp API Testi
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-300">
                Aşağıdan kendi numaranıza test mesajı göndererek entegrasyonun düzgün
                çalıştığını doğrulayabilirsiniz. Mesaj doğrudan seçili sağlayıcı üzerinden
                gönderilir.
              </p>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs">
                    {waIsActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/40">
                        <CheckCircle2 className="h-3 w-3" />
                        Entegrasyon aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/40">
                        <XCircle className="h-3 w-3" />
                        Entegrasyon pasif
                      </span>
                    )}
                  </span>
                  {waConfig?.provider && (
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Aktif sağlayıcı: <strong>{waConfig.provider}</strong>
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                    Test WhatsApp numarası
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-emerald-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                    placeholder="Örn. 905xxxxxxxxx veya +905xxxxxxxxx"
                    value={waTestNumber}
                    onChange={(e) => setWaTestNumber(e.target.value)}
                  />
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                    Numarayı ülke kodu ile birlikte girin. Örneğin Türkiye için 9053xxxxxxx.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                    Mesaj içeriği
                  </label>
                  <textarea
                    className="w-full px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-emerald-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                    rows={3}
                    value={waTestMessage}
                    onChange={(e) => setWaTestMessage(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full bg-black text-white hover:bg-neutral-900"
                  onClick={handleSendWhatsappTest}
                  disabled={waTesting}
                >
                  {waTesting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <MessageCircle className="h-4 w-4 mr-2" />
                  )}
                  Test WhatsApp mesajı gönder
                </Button>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Mesajı birkaç saniye içinde WhatsApp uygulamanızda görmüyorsanız, sağlayıcı
                  ayarlarını ve numara formatını tekrar kontrol edin.
                </p>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sms">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
            {smsModuleProvider === 'VATANSMS' && (
              <>
                <Card className="p-6 space-y-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-50">
                    <Phone className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                    VatanSMS Ayarları
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                        API ID
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                        value={smsApiId}
                        onChange={(e) => setSmsApiId(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                        API Key
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                        value={smsApiKey}
                        onChange={(e) => setSmsApiKey(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                        Sender (Başlık)
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                        value={smsSender}
                        onChange={(e) => setSmsSender(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                          Mesaj Tipi
                        </label>
                        <select
                          className="w-full px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                          value={smsMessageType}
                          onChange={(e) => setSmsMessageType(e.target.value)}
                        >
                          <option value="normal">Normal</option>
                          <option value="turkce">Türkçe</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                          İçerik Tipi
                        </label>
                        <select
                          className="w-full px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                          value={smsMessageContentType}
                          onChange={(e) => setSmsMessageContentType(e.target.value)}
                        >
                          <option value="bilgi">Bilgi</option>
                          <option value="ticari">Ticari</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-4">
                      <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 dark:border-slate-600"
                          checked={smsIsActive}
                          onChange={(e) => setSmsIsActive(e.target.checked)}
                        />
                        VatanSMS entegrasyonunu aktif et
                      </label>
                      {smsConfig?.updatedAt && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Son güncelleme:{' '}
                          {new Date(smsConfig.updatedAt).toLocaleString('tr-TR')}
                        </span>
                      )}
                    </div>
                    <Button
                      className="px-6 bg-black text-white hover:bg-neutral-900"
                      onClick={handleSaveVatansmsConfig}
                      disabled={saving}
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      SMS Ayarlarını Kaydet
                    </Button>
                  </div>
                </Card>

                <Card className="p-6 space-y-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-50">
                    <Phone className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                    SMS Testi
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-300">
                    Aşağıdan kendi numaranıza test SMS göndererek entegrasyonun düzgün
                    çalıştığını doğrulayabilirsiniz.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                        Test telefon numarası
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                        placeholder="Örn. 5xxxxxxxxx veya 05xxxxxxxxx"
                        value={smsTestNumber}
                        onChange={(e) => setSmsTestNumber(e.target.value)}
                      />
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                        Türkiye için 5XXXXXXXXX veya 05XXXXXXXXX formatı önerilir.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                        Mesaj içeriği
                      </label>
                      <textarea
                        className="w-full px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                        rows={3}
                        value={smsTestMessage}
                        onChange={(e) => setSmsTestMessage(e.target.value)}
                      />
                    </div>
                    <Button
                      className="w-full bg-black text-white hover:bg-neutral-900"
                      onClick={handleSendVatansmsTest}
                      disabled={smsTesting}
                    >
                      {smsTesting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Phone className="h-4 w-4 mr-2" />
                      )}
                      Test SMS gönder
                    </Button>
                  </div>
                </Card>
              </>
            )}

            {smsModuleProvider === 'NETGSM' && (
              <>
                <Card className="p-6 space-y-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-50">
                    <Phone className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                    NetGSM Ayarları
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                        Usercode
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                        value={netgsmUsercode}
                        onChange={(e) => {
                          const v = e.target.value;
                          setNetgsmUsercode(v);
                          if (!netgsmMsgheader.trim() && v.trim()) {
                            setNetgsmMsgheader(v.trim());
                          }
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                        value={netgsmPassword}
                        onChange={(e) => setNetgsmPassword(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                        Msgheader (Başlık)
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                        value={netgsmMsgheader}
                        onChange={(e) => setNetgsmMsgheader(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-4">
                      <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 dark:border-slate-600"
                          checked={netgsmIsActive}
                          onChange={(e) => setNetgsmIsActive(e.target.checked)}
                        />
                        NetGSM entegrasyonunu aktif et
                      </label>
                      {netgsmConfig?.updatedAt && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Son güncelleme:{' '}
                          {new Date(netgsmConfig.updatedAt).toLocaleString('tr-TR')}
                        </span>
                      )}
                    </div>
                    <Button
                      className="px-6 bg-black text-white hover:bg-neutral-900"
                      onClick={handleSaveNetgsmConfig}
                      disabled={saving}
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      SMS Ayarlarını Kaydet
                    </Button>
                  </div>
                </Card>

                <Card className="p-6 space-y-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-50">
                    <Phone className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                    SMS Testi
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-300">
                    Aşağıdan kendi numaranıza test SMS göndererek entegrasyonun düzgün
                    çalıştığını doğrulayabilirsiniz.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                        Test telefon numarası
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                        placeholder="Örn. 5xxxxxxxxx veya 05xxxxxxxxx"
                        value={netgsmTestNumber}
                        onChange={(e) => setNetgsmTestNumber(e.target.value)}
                      />
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                        Türkiye için 5XXXXXXXXX veya 05XXXXXXXXX formatı önerilir.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                        Mesaj içeriği
                      </label>
                      <textarea
                        className="w-full px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                        rows={3}
                        value={netgsmTestMessage}
                        onChange={(e) => setNetgsmTestMessage(e.target.value)}
                      />
                    </div>
                    <Button
                      className="w-full bg-black text-white hover:bg-neutral-900"
                      onClick={handleSendNetgsmTest}
                      disabled={netgsmTesting}
                    >
                      {netgsmTesting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Phone className="h-4 w-4 mr-2" />
                      )}
                      Test SMS gönder
                    </Button>
                  </div>
                </Card>
              </>
            )}

            <Card className="p-6 space-y-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-50">
                <Phone className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                SMS Modülü
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                    Sağlayıcı
                  </label>
                  <select
                    className="w-full px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                    value={smsModuleProvider}
                    onChange={(e) =>
                      setSmsModuleProvider(e.target.value as 'VATANSMS' | 'NETGSM')
                    }
                  >
                    <option value="VATANSMS">VatanSMS</option>
                    <option value="NETGSM">NetGSM</option>
                  </select>
                </div>

                <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-600"
                    checked={smsModuleIsActive}
                    onChange={(e) => setSmsModuleIsActive(e.target.checked)}
                  />
                  SMS modülünü aktif et
                </label>

                <div className="flex items-center justify-between">
                  {smsModuleSettings?.updatedAt && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Son güncelleme:{' '}
                      {new Date(smsModuleSettings.updatedAt).toLocaleString('tr-TR')}
                    </span>
                  )}
                  <Button
                    className="px-6 bg-black text-white hover:bg-neutral-900"
                    onClick={handleSaveSmsModuleSettings}
                    disabled={smsModuleSaving}
                  >
                    {smsModuleSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Kaydet
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-6 space-y-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-50">
                <Phone className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                SMS Tetikleyiciler
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    className="text-sm"
                    onClick={() => {
                      fetchSmsTriggers();
                      fetchSmsTemplates();
                    }}
                    disabled={smsTriggersLoading || smsTemplatesLoading}
                  >
                    Yenile
                  </Button>
                </div>

                {smsTriggersLoading ? (
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Yükleniyor...
                  </div>
                ) : smsTriggers.length === 0 ? (
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Tetikleyici bulunamadı.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {smsTriggers.map((tr) => {
                      const isTaskEvent = String(tr.event || '').startsWith('TASK_');
                      const recipientOptions = isTaskEvent
                        ? ['TASK_ASSIGNEE', 'TASK_WATCHERS', 'CUSTOMER_PHONE', 'CUSTOMER_USERS']
                        : ['CUSTOMER_PHONE', 'CUSTOMER_USERS'];
                      return (
                        <div
                          key={tr.id}
                          className="rounded-md border border-slate-200 dark:border-slate-700 p-4 space-y-3"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="text-sm font-medium text-slate-900 dark:text-slate-50">
                              {smsEventLabels[tr.event] || tr.event}
                            </div>
                            <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-slate-300 dark:border-slate-600"
                                checked={!!tr.enabled}
                                onChange={(e) =>
                                  updateSmsTrigger(tr.id, { enabled: e.target.checked })
                                }
                              />
                              Aktif
                            </label>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                                Alıcı
                              </label>
                              <select
                                className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                                value={tr.recipientType || 'CUSTOMER_PHONE'}
                                onChange={(e) =>
                                  updateSmsTrigger(tr.id, {
                                    recipientType: e.target.value,
                                  })
                                }
                              >
                                {recipientOptions.map((k) => (
                                  <option key={k} value={k}>
                                    {smsRecipientLabels[k] || k}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                                Şablon
                              </label>
                              <select
                                className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                                value={tr.templateKey || ''}
                                onChange={(e) =>
                                  updateSmsTrigger(tr.id, { templateKey: e.target.value })
                                }
                              >
                                {smsTemplates.map((t) => (
                                  <option key={t.id} value={t.key}>
                                    {t.title} ({t.key})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6 space-y-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-50">
                <Phone className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                SMS Şablonları
              </h3>

              <div className="space-y-4">
                {smsTemplatesLoading ? (
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Yükleniyor...
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                        Şablon seç
                      </label>
                      <select
                        className="w-full px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                        value={smsSelectedTemplateId}
                        onChange={(e) => handleSelectSmsTemplate(e.target.value)}
                      >
                        {smsTemplates.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title} ({t.key})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                          Key
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                          value={smsTemplateEditKey}
                          onChange={(e) => setSmsTemplateEditKey(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                          Başlık
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                          value={smsTemplateEditTitle}
                          onChange={(e) => setSmsTemplateEditTitle(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                        İçerik
                      </label>
                      <textarea
                        className="w-full px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                        rows={4}
                        value={smsTemplateEditContent}
                        onChange={(e) => setSmsTemplateEditContent(e.target.value)}
                      />
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                        Örnek değişkenler: {'{taskTitle}'} {'{invoiceNumber}'} {'{dueDate}'} {'{totalAmount}'} {'{currency}'} {'{proposalTitle}'} {'{status}'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 dark:border-slate-600"
                          checked={smsTemplateEditActive}
                          onChange={(e) => setSmsTemplateEditActive(e.target.checked)}
                        />
                        Şablon aktif
                      </label>
                      <Button
                        className="px-6 bg-black text-white hover:bg-neutral-900"
                        onClick={handleSaveSmsTemplate}
                        disabled={smsTemplateSaving || !smsSelectedTemplateId}
                      >
                        {smsTemplateSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Şablonu Kaydet
                      </Button>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-3">
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-50">
                        Yeni Şablon
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                            Key
                          </label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                            value={smsNewTemplateKey}
                            onChange={(e) => setSmsNewTemplateKey(e.target.value)}
                            placeholder="Örn. CUSTOM_TEMPLATE_1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                            Başlık
                          </label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                            value={smsNewTemplateTitle}
                            onChange={(e) => setSmsNewTemplateTitle(e.target.value)}
                            placeholder="Örn. Özel bildirim"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                          İçerik
                        </label>
                        <textarea
                          className="w-full px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                          rows={3}
                          value={smsNewTemplateContent}
                          onChange={(e) => setSmsNewTemplateContent(e.target.value)}
                        />
                      </div>
                      <Button
                        className="w-full bg-black text-white hover:bg-neutral-900"
                        onClick={handleCreateSmsTemplate}
                        disabled={
                          smsNewTemplateSaving ||
                          !smsNewTemplateKey.trim() ||
                          !smsNewTemplateTitle.trim() ||
                          !smsNewTemplateContent.trim()
                        }
                      >
                        {smsNewTemplateSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Plus className="h-4 w-4 mr-2" />
                        )}
                        Yeni Şablon Oluştur
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
