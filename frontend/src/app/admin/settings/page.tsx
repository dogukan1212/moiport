"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save, Facebook, Key, CreditCard, MessageSquareText, Mail, Send, Calendar, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import api from "@/lib/api";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [testMailLoading, setTestMailLoading] = useState(false);
  const [testGoogleLoading, setTestGoogleLoading] = useState(false);
  const [testMailTo, setTestMailTo] = useState("");
  const [config, setConfig] = useState({
    facebookAppId: "",
    facebookAppSecret: "",
    facebookVerifyToken: "ajans_verify_token",
    paytrMerchantId: "",
    paytrMerchantKey: "",
    paytrMerchantSalt: "",
    paytrIsActive: false,
    paytrTestMode: true,
    netgsmUsercode: "",
    netgsmPassword: "",
    netgsmMsgheader: "",
    netgsmIsActive: false,
    registrationSmsVerificationEnabled: false,
    smtp2goUsername: "",
    smtp2goPassword: "",
    smtp2goFromEmail: "",
    smtp2goFromName: "",
    smtp2goIsActive: false,
    googleOAuthClientId: "",
    googleOAuthClientSecret: "",
    googleOAuthRedirectUri: "",
    googleCalendarIsActive: false,
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const [facebookRes, paytrRes, netgsmRes, smtp2goRes, googleRes] = await Promise.all([
        api.get("/integrations/facebook/system-config"),
        api.get("/integrations/paytr/system-config"),
        api.get("/integrations/netgsm/system-config"),
        api.get("/integrations/smtp2go/system-config"),
        api.get("/integrations/google-calendar/system-config"),
      ]);

      const facebookData = facebookRes.data || {};
      const paytrData = paytrRes.data || {};
      const netgsmData = netgsmRes.data || {};
      const smtp2goData = smtp2goRes.data || {};
      const googleData = googleRes.data || {};

      setConfig((prev) => ({
        ...prev,
        facebookAppId: facebookData.facebookAppId || "",
        facebookAppSecret: facebookData.facebookAppSecret || "",
        facebookVerifyToken: facebookData.facebookVerifyToken || "ajans_verify_token",
        paytrMerchantId: paytrData.paytrMerchantId || "",
        paytrMerchantKey: paytrData.paytrMerchantKey || "",
        paytrMerchantSalt: paytrData.paytrMerchantSalt || "",
        paytrIsActive: Boolean(paytrData.paytrIsActive),
        paytrTestMode: typeof paytrData.paytrTestMode === "boolean" ? paytrData.paytrTestMode : true,
        netgsmUsercode: netgsmData.netgsmUsercode || "",
        netgsmPassword: netgsmData.netgsmPassword || "",
        netgsmMsgheader: netgsmData.netgsmMsgheader || "",
        netgsmIsActive: Boolean(netgsmData.netgsmIsActive),
        registrationSmsVerificationEnabled: Boolean(netgsmData.registrationSmsVerificationEnabled),
        smtp2goUsername: smtp2goData.smtp2goUsername || "",
        smtp2goPassword: smtp2goData.smtp2goPassword || "",
        smtp2goFromEmail: smtp2goData.smtp2goFromEmail || "",
        smtp2goFromName: smtp2goData.smtp2goFromName || "",
        smtp2goIsActive: Boolean(smtp2goData.smtp2goIsActive),
        googleOAuthClientId: googleData.googleOAuthClientId || "",
        googleOAuthClientSecret: googleData.googleOAuthClientSecret || "",
        googleOAuthRedirectUri: googleData.googleOAuthRedirectUri || "https://api.kolayentegrasyon.com/integrations/google-calendar/callback",
        googleCalendarIsActive: Boolean(googleData.googleCalendarIsActive),
      }));
    } catch (error) {
      console.error("Error fetching system config:", error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await Promise.all([
        api.post("/integrations/facebook/system-config", {
          facebookAppId: config.facebookAppId,
          facebookAppSecret: config.facebookAppSecret,
          facebookVerifyToken: config.facebookVerifyToken,
        }),
        api.post("/integrations/paytr/system-config", {
          paytrMerchantId: config.paytrMerchantId,
          paytrMerchantKey: config.paytrMerchantKey,
          paytrMerchantSalt: config.paytrMerchantSalt,
          paytrIsActive: config.paytrIsActive,
          paytrTestMode: config.paytrTestMode,
        }),
        api.post("/integrations/netgsm/system-config", {
          netgsmUsercode: config.netgsmUsercode,
          netgsmPassword: config.netgsmPassword,
          netgsmMsgheader: config.netgsmMsgheader,
          netgsmIsActive: config.netgsmIsActive,
          registrationSmsVerificationEnabled: config.registrationSmsVerificationEnabled,
        }),
        api.post("/integrations/smtp2go/system-config", {
          smtp2goUsername: config.smtp2goUsername,
          smtp2goPassword: config.smtp2goPassword,
          smtp2goFromEmail: config.smtp2goFromEmail,
          smtp2goFromName: config.smtp2goFromName,
          smtp2goIsActive: config.smtp2goIsActive,
        }),
        api.post("/integrations/google-calendar/system-config", {
          googleOAuthClientId: config.googleOAuthClientId,
          googleOAuthClientSecret: config.googleOAuthClientSecret,
          googleOAuthRedirectUri: config.googleOAuthRedirectUri,
          googleCalendarIsActive: config.googleCalendarIsActive,
        }),
      ]);
      toast.success("Sistem ayarları kaydedildi.");
    } catch (error) {
      toast.error("Ayarlar kaydedilirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestMail = async () => {
    setTestMailLoading(true);
    try {
      await api.post("/integrations/smtp2go/test-email", {
        to: testMailTo,
      });
      toast.success("Test e-postası gönderildi.");
    } catch (error: any) {
      const msg = error?.response?.data?.message;
      const text =
        (Array.isArray(msg) ? msg.join(", ") : msg) ||
        "Test e-postası gönderilemedi.";
      toast.error(text);
    } finally {
      setTestMailLoading(false);
    }
  };

  const handleTestGoogleConfig = async () => {
    setTestGoogleLoading(true);
    try {
      const res = await api.get("/integrations/google-calendar/system-test");
      const data = res.data || {};
      const descriptionParts: string[] = [];
      if (data.redirectUri) {
        descriptionParts.push(`Redirect URI: ${data.redirectUri}`);
      }
      if (data.googleCalendarIsActive) {
        descriptionParts.push("Entegrasyon aktif");
      }
      toast.success("Google Calendar geliştirici ayarları geçerli görünüyor.", {
        description: descriptionParts.join(" • ") || undefined,
      });
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        "Google Calendar geliştirici ayarları doğrulanamadı.";
      toast.error(msg);
    } finally {
      setTestGoogleLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Sistem Ayarları</h1>
        <p className="text-slate-500 mt-2">SaaS platformunuzun genel yapılandırmasını buradan yönetin.</p>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Facebook className="w-5 h-5 text-blue-600" />
            <CardTitle>Meta (Facebook & Instagram) Geliştirici Ayarları</CardTitle>
          </div>
          <CardDescription>
            Facebook Leads ve Instagram DM/Yorum entegrasyonları için global uygulama bilgilerini girin. 
            Tek bir Meta Uygulaması hem Facebook hem Instagram için kullanılır.
            <br className="mb-2"/>
            Webhook URL: <code className="bg-slate-100 px-1 rounded">https://api.kolayentegrasyon.com/webhooks/meta</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Meta App ID (Facebook App ID)</Label>
            <Input 
              value={config.facebookAppId}
              onChange={(e) => setConfig({ ...config, facebookAppId: e.target.value })}
              placeholder="Uygulama Kimliği" 
            />
          </div>
          <div className="grid gap-2">
            <Label>Meta App Secret</Label>
            <Input 
              type="password"
              value={config.facebookAppSecret}
              onChange={(e) => setConfig({ ...config, facebookAppSecret: e.target.value })}
              placeholder="Uygulama Gizli Anahtarı" 
            />
          </div>
          <div className="grid gap-2">
            <Label>Webhook Verify Token</Label>
            <div className="flex gap-2">
              <Input 
                value={config.facebookVerifyToken}
                onChange={(e) => setConfig({ ...config, facebookVerifyToken: e.target.value })}
                placeholder="Doğrulama Jetonu" 
              />
              <Button variant="outline" size="icon" onClick={() => setConfig({ ...config, facebookVerifyToken: Math.random().toString(36).substring(2, 15) })}>
                <Key className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-red-600" />
            <CardTitle>Google Calendar Geliştirici Ayarları</CardTitle>
          </div>
          <CardDescription>
            Google Calendar ve Meet entegrasyonları için global OAuth istemci bilgilerini girin.
            <br className="mb-2" />
            Önerilen Redirect URI:
            <code className="bg-slate-100 px-1 rounded ml-1">
              https://api.kolayentegrasyon.com/integrations/google-calendar/callback
            </code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
            <div className="space-y-0.5">
              <div className="text-sm font-medium text-slate-900">Google Calendar Entegrasyonu Aktif</div>
              <div className="text-sm text-slate-500">
                Aktif olduğunda ajanslar Google Calendar üzerinden toplantı oluşturabilir.
              </div>
            </div>
            <Switch
              checked={config.googleCalendarIsActive}
              onCheckedChange={(checked) =>
                setConfig({ ...config, googleCalendarIsActive: checked })
              }
            />
          </div>

          <div className="grid gap-2">
            <Label>Google OAuth Client ID</Label>
            <Input
              value={config.googleOAuthClientId}
              onChange={(e) =>
                setConfig({ ...config, googleOAuthClientId: e.target.value })
              }
              placeholder="Google Cloud Console > OAuth 2.0 Client ID"
            />
          </div>

          <div className="grid gap-2">
            <Label>Google OAuth Client Secret</Label>
            <Input
              type="password"
              value={config.googleOAuthClientSecret}
              onChange={(e) =>
                setConfig({ ...config, googleOAuthClientSecret: e.target.value })
              }
              placeholder="Client Secret"
            />
          </div>

          <div className="grid gap-2">
            <Label>Redirect URI</Label>
            <Input
              value={config.googleOAuthRedirectUri}
              onChange={(e) =>
                setConfig({ ...config, googleOAuthRedirectUri: e.target.value })
              }
              placeholder="https://api.kolayentegrasyon.com/integrations/google-calendar/callback"
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleTestGoogleConfig}
              disabled={testGoogleLoading}
            >
              {testGoogleLoading && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Google Ayarlarını Test Et
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            <CardTitle>PayTR Abonelik Ödeme Ayarları</CardTitle>
          </div>
          <CardDescription>Platform abonelik ödemeleri için PayTR merchant bilgileri.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
            <div className="space-y-0.5">
              <div className="text-sm font-medium text-slate-900">PayTR Aktif</div>
              <div className="text-sm text-slate-500">Abonelik satın alımında PayTR kullanımını aç/kapat.</div>
            </div>
            <Switch
              checked={config.paytrIsActive}
              onCheckedChange={(checked) => setConfig({ ...config, paytrIsActive: checked })}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
            <div className="space-y-0.5">
              <div className="text-sm font-medium text-slate-900">Test Modu</div>
              <div className="text-sm text-slate-500">PayTR test modunu aç/kapat.</div>
            </div>
            <Switch
              checked={config.paytrTestMode}
              onCheckedChange={(checked) => setConfig({ ...config, paytrTestMode: checked })}
            />
          </div>

          <div className="grid gap-2">
            <Label>Merchant ID</Label>
            <Input
              value={config.paytrMerchantId}
              onChange={(e) => setConfig({ ...config, paytrMerchantId: e.target.value })}
              placeholder="Merchant ID"
            />
          </div>
          <div className="grid gap-2">
            <Label>Merchant Key</Label>
            <Input
              type="password"
              value={config.paytrMerchantKey}
              onChange={(e) => setConfig({ ...config, paytrMerchantKey: e.target.value })}
              placeholder="Merchant Key"
            />
          </div>
          <div className="grid gap-2">
            <Label>Merchant Salt</Label>
            <Input
              type="password"
              value={config.paytrMerchantSalt}
              onChange={(e) => setConfig({ ...config, paytrMerchantSalt: e.target.value })}
              placeholder="Merchant Salt"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquareText className="w-5 h-5 text-emerald-600" />
            <CardTitle>NetGSM SMS Ayarları</CardTitle>
          </div>
          <CardDescription>Kayıt doğrulama ve 2FA için sistem SMS sağlayıcısı.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
            <div className="space-y-0.5">
              <div className="text-sm font-medium text-slate-900">NetGSM Aktif</div>
              <div className="text-sm text-slate-500">Sistem SMS gönderiminde NetGSM kullanımını aç/kapat.</div>
            </div>
            <Switch
              checked={config.netgsmIsActive}
              onCheckedChange={(checked) => setConfig({ ...config, netgsmIsActive: checked })}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
            <div className="space-y-0.5">
              <div className="text-sm font-medium text-slate-900">Kayıtta SMS Doğrulama</div>
              <div className="text-sm text-slate-500">Yeni kullanıcı kayıtlarında SMS doğrulamayı zorunlu kıl.</div>
            </div>
            <Switch
              checked={config.registrationSmsVerificationEnabled}
              onCheckedChange={(checked) =>
                setConfig({ ...config, registrationSmsVerificationEnabled: checked })
              }
            />
          </div>

          <div className="grid gap-2">
            <Label>Usercode</Label>
            <Input
              value={config.netgsmUsercode}
              onChange={(e) => setConfig({ ...config, netgsmUsercode: e.target.value })}
              placeholder="NetGSM usercode"
            />
          </div>
          <div className="grid gap-2">
            <Label>Password</Label>
            <Input
              type="password"
              value={config.netgsmPassword}
              onChange={(e) => setConfig({ ...config, netgsmPassword: e.target.value })}
              placeholder="NetGSM password"
            />
          </div>
          <div className="grid gap-2">
            <Label>Msgheader</Label>
            <Input
              value={config.netgsmMsgheader}
              onChange={(e) => setConfig({ ...config, netgsmMsgheader: e.target.value })}
              placeholder="Mesaj Başlığı"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-sky-600" />
            <CardTitle>SMTP2GO E-posta Ayarları</CardTitle>
          </div>
          <CardDescription>Sistem e-posta gönderimi için SMTP2GO bilgileri.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
            <div className="space-y-0.5">
              <div className="text-sm font-medium text-slate-900">SMTP2GO Aktif</div>
              <div className="text-sm text-slate-500">Sistem e-posta gönderiminde SMTP2GO kullanımını aç/kapat.</div>
            </div>
            <Switch
              checked={config.smtp2goIsActive}
              onCheckedChange={(checked) => setConfig({ ...config, smtp2goIsActive: checked })}
            />
          </div>

          <div className="grid gap-2">
            <Label>Username</Label>
            <Input
              value={config.smtp2goUsername}
              onChange={(e) => setConfig({ ...config, smtp2goUsername: e.target.value })}
              placeholder="SMTP2GO username"
            />
          </div>
          <div className="grid gap-2">
            <Label>Password</Label>
            <Input
              type="password"
              value={config.smtp2goPassword}
              onChange={(e) => setConfig({ ...config, smtp2goPassword: e.target.value })}
              placeholder="SMTP2GO password"
            />
          </div>
          <div className="grid gap-2">
            <Label>Gönderici E-posta</Label>
            <Input
              type="email"
              value={config.smtp2goFromEmail}
              onChange={(e) => setConfig({ ...config, smtp2goFromEmail: e.target.value })}
              placeholder="noreply@domain.com"
            />
          </div>
          <div className="grid gap-2">
            <Label>Gönderici Adı</Label>
            <Input
              value={config.smtp2goFromName}
              onChange={(e) => setConfig({ ...config, smtp2goFromName: e.target.value })}
              placeholder="Ajans"
            />
          </div>

          <div className="rounded-lg border border-slate-200 p-4 space-y-3">
            <div className="text-sm font-medium text-slate-900">Test E-posta</div>
            <div className="text-sm text-slate-500">
              Önce ayarları kaydedin, sonra buradan test e-postası gönderin.
            </div>
            <div className="flex gap-2">
              <Input
                type="email"
                value={testMailTo}
                onChange={(e) => setTestMailTo(e.target.value)}
                placeholder="test@domain.com"
              />
              <Button
                className="bg-sky-600 hover:bg-sky-700"
                onClick={handleSendTestMail}
                disabled={testMailLoading || !testMailTo.trim()}
              >
                <Send className="w-4 h-4 mr-2" />
                {testMailLoading ? "Gönderiliyor..." : "Test Mail Gönder"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Genel Platform Bilgileri</CardTitle>
          <CardDescription>Sitenizin başlığı, logosu ve iletişim bilgileri.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Platform Adı</Label>
            <Input defaultValue="Ajans Yönetim Sistemi" />
          </div>
          <div className="grid gap-2">
            <Label>Destek E-postası</Label>
            <Input defaultValue="support@ajans.com" />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          className="bg-indigo-600 hover:bg-indigo-700"
          onClick={handleSave}
          disabled={loading}
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? "Kaydediliyor..." : "Ayarları Kaydet"}
        </Button>
      </div>
    </div>
  );
}
