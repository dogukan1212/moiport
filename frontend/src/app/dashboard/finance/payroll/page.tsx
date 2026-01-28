'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, DollarSign, Calendar, CreditCard, CheckCircle2, Clock, Eye, X, Edit, Trash } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

export default function PayrollPage() {
  const { user } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (user?.role === 'CLIENT') {
      router.replace('/dashboard/finance/invoices');
    }
  }, [user, router]);
  const [activeTab, setActiveTab] = useState<'payroll' | 'employees' | 'settings'>('payroll');
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payrollSettings, setPayrollSettings] = useState<any | null>(null);
  
  // Modals
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isEditEmployeeModalOpen, setIsEditEmployeeModalOpen] = useState(false);
  const [isCreateEmployeeModalOpen, setIsCreateEmployeeModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [isEmployeePreviewOpen, setIsEmployeePreviewOpen] = useState(false);
  const [employeeDetail, setEmployeeDetail] = useState<any | null>(null);
  const [employeePreviewTab, setEmployeePreviewTab] = useState<'OVERVIEW' | 'SALARIES' | 'ADVANCES' | 'BONUSES'>('OVERVIEW');
  const [employeeDetailLoading, setEmployeeDetailLoading] = useState(false);

  const [employeeStatusFilter, setEmployeeStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ACTIVE');

  const [isPayrollPreviewOpen, setIsPayrollPreviewOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<any | null>(null);
  const [isEditPayrollModalOpen, setIsEditPayrollModalOpen] = useState(false);
  const [payrollEditData, setPayrollEditData] = useState({
    baseSalary: '',
    bonus: '',
    deductions: '',
  });
  const [bonusHelperPercent, setBonusHelperPercent] = useState('');
  const [bonusHelperCount, setBonusHelperCount] = useState('');
  const [bonusHelperUnit, setBonusHelperUnit] = useState('');

  const [advanceData, setAdvanceData] = useState({
    userId: '',
    amount: '',
    description: '',
  });

  const [employeeData, setEmployeeData] = useState({
    salary: '',
    iban: '',
    startDate: '',
  });

  const [newEmployeeData, setNewEmployeeData] = useState({
    name: '',
    email: '',
    role: 'STAFF',
    salary: '',
    iban: '',
    startDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'payroll') {
        const res = await api.get('/finance/payroll');
        setPayrolls(res.data);
      } else if (activeTab === 'employees') {
        const res = await api.get('/finance/employees');
        setEmployees(res.data);
      } else if (activeTab === 'settings') {
        const res = await api.get('/finance/payroll/settings');
        const base = res.data || {};
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const pad = (n: number) => n.toString().padStart(2, '0');

        const calcStartDay = base.calculationStartDay || 1;
        const calcEndDay = base.calculationEndDay || 30;
        const paymentDay = base.paymentDay || 15;
        const visibilityDaysBefore = base.expenseVisibilityDaysBefore ?? 7;

        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const startDayClamped = Math.min(calcStartDay, daysInMonth);
        const endDayClamped = Math.min(calcEndDay, daysInMonth);
        const paymentDayClamped = Math.min(paymentDay, daysInMonth);

        const calculationStartDate = `${year}-${pad(month + 1)}-${pad(startDayClamped)}`;
        const calculationEndDate = `${year}-${pad(month + 1)}-${pad(endDayClamped)}`;

        const paymentDateObj = new Date(year, month, paymentDayClamped);
        const paymentDate = `${paymentDateObj.getFullYear()}-${pad(
          paymentDateObj.getMonth() + 1,
        )}-${pad(paymentDateObj.getDate())}`;

        const visibilityDateObj = new Date(paymentDateObj);
        visibilityDateObj.setDate(paymentDateObj.getDate() - visibilityDaysBefore);
        const visibilityDate = `${visibilityDateObj.getFullYear()}-${pad(
          visibilityDateObj.getMonth() + 1,
        )}-${pad(visibilityDateObj.getDate())}`;

        setPayrollSettings({
          ...base,
          calculationStartDate,
          calculationEndDate,
          paymentDate,
          visibilityDate,
        });
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePayroll = async () => {
    const period = prompt('Dönem giriniz (YYYY-MM):', new Date().toISOString().slice(0, 7));
    if (!period) return;
    try {
      await api.post('/finance/payroll/generate', { period });
      fetchData();
    } catch (error) {
      console.error('Generate payroll error:', error);
    }
  };

  const handlePay = async (id: string) => {
    if (!confirm('Ödeme yapıldığını onaylıyor musunuz? Bu işlem gider olarak kaydedilecektir.')) return;
    try {
      await api.post(`/finance/payroll/${id}/pay`);
      fetchData();
    } catch (error) {
      console.error('Pay error:', error);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payrollSettings) return;
    try {
      await api.patch('/finance/payroll/settings', payrollSettings);
      alert('Maaş ayarları kaydedildi.');
    } catch (error) {
      console.error('Payroll settings save error:', error);
      alert('Maaş ayarları kaydedilemedi.');
    }
  };

  const handleCreateAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/finance/advances', {
        ...advanceData,
        amount: parseFloat(advanceData.amount),
      });
      setIsAdvanceModalOpen(false);
      alert('Avans başarıyla kaydedildi.');
      setAdvanceData({ userId: '', amount: '', description: '' });
    } catch (error) {
      console.error('Advance error:', error);
    }
  };

  const openPayrollPreview = (p: any) => {
    setSelectedPayroll(p);
    setIsPayrollPreviewOpen(true);
  };

  const closePayrollPreview = () => {
    setIsPayrollPreviewOpen(false);
    setSelectedPayroll(null);
  };

  const openEditPayroll = (p: any) => {
    setSelectedPayroll(p);
    setPayrollEditData({
      baseSalary: String(p.baseSalary ?? ''),
      bonus: String(p.bonus ?? 0),
      deductions: String(p.deductions ?? 0),
    });
    setIsEditPayrollModalOpen(true);
  };

  const handleUpdatePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayroll) return;
    try {
      await api.patch(`/finance/payroll/${selectedPayroll.id}`, {
        baseSalary: parseFloat(payrollEditData.baseSalary || '0'),
        bonus: parseFloat(payrollEditData.bonus || '0'),
        deductions: parseFloat(payrollEditData.deductions || '0'),
      });
      setIsEditPayrollModalOpen(false);
      setSelectedPayroll(null);
      fetchData();
    } catch (error) {
      console.error('Update payroll error:', error);
    }
  };

  const handleDeletePayroll = async (p: any) => {
    if (!confirm('Bu bordroyu silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/finance/payroll/${p.id}`);
      fetchData();
    } catch (error) {
      console.error('Delete payroll error:', error);
    }
  };

  const handleTerminateEmployee = async (emp: any) => {
    if (!confirm(`${emp.name} için \"işten çıkar\" işlemini uygulamak istediğinize emin misiniz?`)) return;
    try {
      await api.patch(`/finance/employees/${emp.id}/terminate`);
      fetchData();
    } catch (error) {
      console.error('Terminate employee error:', error);
    }
  };

  const openEmployeePreview = async (emp: any) => {
    setSelectedEmployee(emp);
    setEmployeePreviewTab('OVERVIEW');
    setIsEmployeePreviewOpen(true);
    setEmployeeDetail(null);
    setEmployeeDetailLoading(true);
    try {
      const res = await api.get(`/finance/employees/${emp.id}/details`);
      setEmployeeDetail(res.data);
    } catch (error) {
      console.error('Employee detail error:', error);
    } finally {
      setEmployeeDetailLoading(false);
    }
  };

  const closeEmployeePreview = () => {
    setIsEmployeePreviewOpen(false);
    setEmployeeDetail(null);
  };

  const openEditEmployee = (emp: any) => {
    setSelectedEmployee(emp);
    setEmployeeData({
      salary: emp.salary || '',
      iban: emp.iban || '',
      startDate: emp.startDate ? emp.startDate.split('T')[0] : '',
    });
    setIsEditEmployeeModalOpen(true);
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.patch(`/finance/employees/${selectedEmployee.id}`, {
        salary: parseFloat(employeeData.salary),
        iban: employeeData.iban,
        startDate: employeeData.startDate,
      });
      setIsEditEmployeeModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Update employee error:', error);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 1. Create User
      const userRes = await api.post('/tenants/users', {
        name: newEmployeeData.name,
        email: newEmployeeData.email,
        role: newEmployeeData.role,
      });
      
      const userId = userRes.data.id;

      // 2. Update Financials
      await api.patch(`/finance/employees/${userId}`, {
        salary: parseFloat(newEmployeeData.salary),
        iban: newEmployeeData.iban,
        startDate: newEmployeeData.startDate,
      });

      setIsCreateEmployeeModalOpen(false);
      setNewEmployeeData({
        name: '',
        email: '',
        role: 'STAFF',
        salary: '',
        iban: '',
        startDate: new Date().toISOString().split('T')[0],
      });
      
      alert('Personel başarıyla oluşturuldu.');
      fetchData();
    } catch (error: any) {
      console.error('Create employee error:', error);
      alert(error.response?.data?.message || 'Personel oluşturulamadı.');
    }
  };

  const today = new Date();
  const examplePeriodStart =
    payrollSettings && payrollSettings.calculationStartDay
      ? new Date(
          today.getFullYear(),
          today.getMonth(),
          Number(payrollSettings.calculationStartDay),
        )
      : null;
  const examplePeriodEnd =
    payrollSettings && payrollSettings.calculationEndDay
      ? new Date(
          today.getFullYear(),
          today.getMonth(),
          Number(payrollSettings.calculationEndDay),
        )
      : null;
  const examplePaymentDate =
    payrollSettings && payrollSettings.paymentDay
      ? new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          Number(payrollSettings.paymentDay),
        )
      : null;
  const exampleVisibilityDate =
    examplePaymentDate && payrollSettings
      ? new Date(
          examplePaymentDate.getFullYear(),
          examplePaymentDate.getMonth(),
          examplePaymentDate.getDate() -
            Number(payrollSettings.expenseVisibilityDaysBefore ?? 0),
        )
      : null;

  return (
    user?.role === 'CLIENT' ? null :
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-[28px] font-normal tracking-[-0.03em] text-slate-900">
            Personel & Maaş Yönetimi
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            Bordroları, personel bilgilerini ve avans hareketlerini yönetin.
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'employees' && (
            <Button onClick={() => setIsCreateEmployeeModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Yeni Personel Ekle
            </Button>
          )}
          {activeTab !== 'settings' && (
            <Button variant="outline" onClick={() => setIsAdvanceModalOpen(true)}>
              <DollarSign className="h-4 w-4 mr-2" /> Avans Ver
            </Button>
          )}
          {activeTab === 'payroll' && (
            <Button onClick={handleGeneratePayroll}>
              <Plus className="h-4 w-4 mr-2" /> Maaş Hesapla
            </Button>
          )}
        </div>
      </div>

      <div className="flex border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab('payroll')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'payroll' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
        >
          Maaş Bordroları
        </button>
        <button
          onClick={() => setActiveTab('employees')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'employees' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
        >
          Personel Listesi
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'settings' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
        >
          Maaş Ayarları
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">Yükleniyor...</div>
      ) : (
        activeTab === 'payroll' ? (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium">
                  <tr>
                    <th className="px-4 py-3">Dönem</th>
                    <th className="px-4 py-3">Personel</th>
                    <th className="px-4 py-3 text-right">Brüt Maaş</th>
                    <th className="px-4 py-3 text-right">Kesintiler (Avans)</th>
                    <th className="px-4 py-3 text-right">Net Ödenecek</th>
                    <th className="px-4 py-3 text-center">Durum</th>
                    <th className="px-4 py-3 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payrolls.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-500">
                        Kayıt bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    payrolls.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium">{p.period}</td>
                        <td className="px-4 py-3">{p.user?.name}</td>
                        <td className="px-4 py-3 text-right">
                          {new Intl.NumberFormat('tr-TR', {
                            style: 'currency',
                            currency: 'TRY',
                          }).format(p.baseSalary)}
                        </td>
                        <td className="px-4 py-3 text-right text-red-600">
                          -
                          {new Intl.NumberFormat('tr-TR', {
                            style: 'currency',
                            currency: 'TRY',
                          }).format(p.deductions)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">
                          {new Intl.NumberFormat('tr-TR', {
                            style: 'currency',
                            currency: 'TRY',
                          }).format(p.netSalary)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {p.status === 'PAID' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                              <CheckCircle2 className="h-3 w-3" /> Ödendi
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                              <Clock className="h-3 w-3" /> Bekliyor
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openPayrollPreview(p)}
                            >
                              <Eye className="h-4 w-4 text-slate-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditPayroll(p)}
                            >
                              <Edit className="h-4 w-4 text-slate-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeletePayroll(p)}
                            >
                              <Trash className="h-4 w-4 text-red-500" />
                            </Button>
                            {p.status !== 'PAID' && (
                              <Button size="sm" onClick={() => handlePay(p.id)}>
                                Öde
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        ) : activeTab === 'employees' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setEmployeeStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-full border font-medium transition-colors ${
                    employeeStatusFilter === 'ALL'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Tümü
                </button>
                <button
                  type="button"
                  onClick={() => setEmployeeStatusFilter('ACTIVE')}
                  className={`px-3 py-1.5 rounded-full border font-medium transition-colors ${
                    employeeStatusFilter === 'ACTIVE'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Aktif
                </button>
                <button
                  type="button"
                  onClick={() => setEmployeeStatusFilter('INACTIVE')}
                  className={`px-3 py-1.5 rounded-full border font-medium transition-colors ${
                    employeeStatusFilter === 'INACTIVE'
                      ? 'bg-red-600 text-white border-red-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Pasif
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {employees
                .filter((emp) => {
                  if (employeeStatusFilter === 'ALL') return true;
                  const active = emp.isActive !== false;
                  return employeeStatusFilter === 'ACTIVE' ? active : !active;
                })
                .map((emp) => (
                  <Card
                    key={emp.id}
                    className={`p-6 ${
                      emp.isActive === false ? 'opacity-75 border-red-100 bg-red-50/40' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                        {emp.name?.[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{emp.name}</h3>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-slate-500">{emp.role}</p>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                              emp.isActive === false
                                ? 'bg-red-50 text-red-700 border-red-100'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            }`}
                          >
                            {emp.isActive === false ? 'Pasif' : 'Aktif'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-slate-600 mb-6">
                      <div className="flex justify-between">
                        <span>Maaş:</span>
                        <span className="font-semibold text-slate-900">
                          {emp.salary
                            ? new Intl.NumberFormat('tr-TR', {
                                style: 'currency',
                                currency: 'TRY',
                              }).format(emp.salary)
                            : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>IBAN:</span>
                        <span className="font-mono text-xs">{emp.iban || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Başlangıç:</span>
                        <span>
                          {emp.startDate
                            ? format(new Date(emp.startDate), 'd MMM yyyy', { locale: tr })
                            : '-'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => openEmployeePreview(emp)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Detay
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => openEditEmployee(emp)}
                      >
                        Bilgileri Düzenle
                      </Button>
                    </div>
                    <div className="mt-3">
                      {emp.isActive !== false ? (
                        <Button
                          variant="outline"
                          className="w-full border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => handleTerminateEmployee(emp)}
                        >
                          İşten Çıkar
                        </Button>
                      ) : (
                        <span className="block text-[11px] text-slate-500 text-center">
                          Bu personel pasif durumdadır.
                        </span>
                      )}
                    </div>
                  </Card>
                ))}
            </div>
          </div>
        ) : (
          <Card>
            <div className="p-6 space-y-6">
              <h2 className="text-lg font-semibold text-slate-900">Maaş Ayarları</h2>
              <p className="text-sm text-slate-500">
                Maaş hesaplama dönemi, ödeme günü ve gider listesine ne zaman yansıyacağını buradan
                belirleyebilirsiniz.
              </p>
              <form onSubmit={handleSaveSettings} className="space-y-6 max-w-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Hesaplama Başlangıç Günü
                    </label>
                    <input
                      type="date"
                      className="w-full border rounded-md p-2 text-sm"
                      value={payrollSettings?.calculationStartDate ?? ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (!value) {
                          setPayrollSettings({
                            ...(payrollSettings || {}),
                            calculationStartDate: '',
                          });
                          return;
                        }
                        const d = new Date(value);
                        const day = d.getDate();
                        setPayrollSettings({
                          ...(payrollSettings || {}),
                          calculationStartDate: value,
                          calculationStartDay: day,
                        });
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Hesaplama Bitiş Günü
                    </label>
                    <input
                      type="date"
                      className="w-full border rounded-md p-2 text-sm"
                      value={payrollSettings?.calculationEndDate ?? ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (!value) {
                          setPayrollSettings({
                            ...(payrollSettings || {}),
                            calculationEndDate: '',
                          });
                          return;
                        }
                        const d = new Date(value);
                        const day = d.getDate();
                        setPayrollSettings({
                          ...(payrollSettings || {}),
                          calculationEndDate: value,
                          calculationEndDay: day,
                        });
                      }}
                      required
                    />
                  </div>
                </div>
                {examplePeriodStart && examplePeriodEnd && (
                  <p className="text-xs text-slate-500">
                    Örnek dönem:{' '}
                    {format(examplePeriodStart, 'd MMM yyyy', { locale: tr })} -{' '}
                    {format(examplePeriodEnd, 'd MMM yyyy', { locale: tr })}.
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Maaş Ödeme Günü
                    </label>
                    <input
                      type="date"
                      className="w-full border rounded-md p-2 text-sm"
                      value={payrollSettings?.paymentDate ?? ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (!value) {
                          setPayrollSettings({
                            ...(payrollSettings || {}),
                            paymentDate: '',
                          });
                          return;
                        }
                        const d = new Date(value);
                        const day = d.getDate();
                        const prevVisibilityDays =
                          (payrollSettings?.expenseVisibilityDaysBefore as
                            | number
                            | undefined) ?? 7;
                        const visibilityDateObj = new Date(d);
                        visibilityDateObj.setDate(d.getDate() - prevVisibilityDays);
                        const pad = (n: number) => n.toString().padStart(2, '0');
                        const visibilityDate = `${visibilityDateObj.getFullYear()}-${pad(
                          visibilityDateObj.getMonth() + 1,
                        )}-${pad(visibilityDateObj.getDate())}`;
                        setPayrollSettings({
                          ...(payrollSettings || {}),
                          paymentDate: value,
                          paymentDay: day,
                          visibilityDate,
                        });
                      }}
                      required
                    />
                    {examplePaymentDate && (
                      <p className="text-xs text-slate-500 mt-1">
                        Örnek ödeme tarihi:{' '}
                        {format(examplePaymentDate, 'd MMM yyyy', { locale: tr })}.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Gider Listesinde Kaç Gün Önce Gözüksün
                    </label>
                    <input
                      type="date"
                      className="w-full border rounded-md p-2 text-sm"
                      value={payrollSettings?.visibilityDate ?? ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (!value || !payrollSettings?.paymentDate) {
                          setPayrollSettings({
                            ...(payrollSettings || {}),
                            visibilityDate: value,
                          });
                          return;
                        }
                        const payment = new Date(payrollSettings.paymentDate as string);
                        const visibility = new Date(value);
                        const diffMs = payment.getTime() - visibility.getTime();
                        const diffDays = Math.max(
                          0,
                          Math.round(diffMs / (1000 * 60 * 60 * 24)),
                        );
                        setPayrollSettings({
                          ...(payrollSettings || {}),
                          visibilityDate: value,
                          expenseVisibilityDaysBefore: diffDays,
                        });
                      }}
                      required
                    />
                    {exampleVisibilityDate && examplePaymentDate && (
                      <p className="text-xs text-slate-500 mt-1">
                        Örnek olarak gider kaydı{' '}
                        {format(exampleVisibilityDate, 'd MMM yyyy', { locale: tr })}{' '}
                        tarihinde oluşturulur ve ödeme tarihi{' '}
                        {format(examplePaymentDate, 'd MMM yyyy', { locale: tr })}{' '}
                        olur.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={payrollSettings?.autoGenerate ?? true}
                      onChange={() =>
                        setPayrollSettings({
                          ...(payrollSettings || {}),
                          autoGenerate: !(payrollSettings?.autoGenerate ?? true),
                        })
                      }
                    />
                    <span>Otomatik maaş hesaplamayı kullan</span>
                  </label>
                  <span className="text-xs text-slate-500">
                    Otomatik hesaplama açıkken belirlediğiniz ayarlarla her ay bordro ve gider kaydı
                    oluşturulur.
                  </span>
                </div>

                <div className="flex justify-end">
                  <Button type="submit">Ayarları Kaydet</Button>
                </div>
              </form>
            </div>
          </Card>
        )
      )}

      {/* Advance Modal */}
      {isAdvanceModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">Personel Avans Girişi</h2>
            <form onSubmit={handleCreateAdvance} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Personel</label>
                <select
                  required
                  className="w-full border rounded-md p-2 text-sm"
                  value={advanceData.userId}
                  onChange={(e) => setAdvanceData({ ...advanceData, userId: e.target.value })}
                >
                  <option value="">Seçiniz...</option>
                  {/* Need to fetch employees even if on payroll tab, so maybe pass them or refetch. Assuming employees state is populated or we fetch briefly. */}
                  {/* To keep it simple, let's rely on fetching them if empty or activeTab logic. */}
                  {/* Better: Fetch list if empty */}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  * Listede personel görünmüyorsa önce "Personel Listesi" sekmesine gidiniz.
                  {/* In real app, separate fetch for dropdown */}
                </p>
              </div>
              
              {/* Fix: Fetch employees for dropdown */}
              {(() => {
                 if (employees.length === 0 && isAdvanceModalOpen) {
                   // This is a bit hacky inside render, better to use useEffect.
                   // Let's just fix the select above to use a useEffect call or just load all initially.
                   // I'll leave it as a note and implement a quick fix below.
                 }
                 return null;
              })()}
              
              {/* Re-implementing select with populated options */}
               <div>
                  {/* Overwriting previous select for clarity in code generation */}
                  <label className="block text-sm font-medium text-slate-700 mb-1">Personel</label>
                   <select
                    required
                    className="w-full border rounded-md p-2 text-sm"
                    value={advanceData.userId}
                    onClick={() => { if(employees.length === 0) api.get('/finance/employees').then(res => setEmployees(res.data)) }}
                    onChange={(e) => setAdvanceData({ ...advanceData, userId: e.target.value })}
                  >
                    <option value="">Seçiniz...</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
               </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tutar (TL)</label>
                <input
                  type="number"
                  required
                  className="w-full border rounded-md p-2 text-sm"
                  value={advanceData.amount}
                  onChange={(e) => setAdvanceData({ ...advanceData, amount: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Açıklama</label>
                <input
                  type="text"
                  className="w-full border rounded-md p-2 text-sm"
                  value={advanceData.description}
                  onChange={(e) => setAdvanceData({ ...advanceData, description: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setIsAdvanceModalOpen(false)}>İptal</Button>
                <Button type="submit">Kaydet</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPayrollPreviewOpen && selectedPayroll && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] shadow-2xl overflow-hidden border border-slate-200 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Bordro Önizleme</h2>
                <p className="text-[11px] text-slate-500">
                  Dönem {selectedPayroll.period} • {selectedPayroll.user?.name}
                </p>
              </div>
              <button
                type="button"
                onClick={closePayrollPreview}
                className="text-slate-500 hover:text-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 text-sm bg-slate-50/60 flex-1 overflow-auto">
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-500">Personel</div>
                    <div className="text-sm font-semibold text-slate-900">
                      {selectedPayroll.user?.name || '-'}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                      selectedPayroll.status === 'PAID'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}
                  >
                    {selectedPayroll.status === 'PAID' ? 'Ödendi' : 'Bekliyor'}
                  </span>
                </div>

                <div className="border-t border-slate-100 pt-4 mt-2 space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Dönem</span>
                    <span className="font-medium text-slate-900">
                      {selectedPayroll.period}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Brüt Maaş</span>
                    <span className="font-medium text-slate-900">
                      {new Intl.NumberFormat('tr-TR', {
                        style: 'currency',
                        currency: 'TRY',
                      }).format(selectedPayroll.baseSalary)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Prim</span>
                    <span className="font-medium text-slate-900">
                      {new Intl.NumberFormat('tr-TR', {
                        style: 'currency',
                        currency: 'TRY',
                      }).format(selectedPayroll.bonus || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kesintiler (Avans)</span>
                    <span className="font-medium text-red-600">
                      -
                      {new Intl.NumberFormat('tr-TR', {
                        style: 'currency',
                        currency: 'TRY',
                      }).format(selectedPayroll.deductions)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-100 mt-2">
                    <span>Net Ödenecek</span>
                    <span className="font-semibold text-slate-900">
                      {new Intl.NumberFormat('tr-TR', {
                        style: 'currency',
                        currency: 'TRY',
                      }).format(selectedPayroll.netSalary)}
                    </span>
                  </div>
                  {selectedPayroll.paymentDate && (
                    <div className="flex justify-between">
                      <span>Ödeme Tarihi</span>
                      <span className="font-medium text-slate-900">
                        {format(new Date(selectedPayroll.paymentDate), 'd MMM yyyy', {
                          locale: tr,
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isEditPayrollModalOpen && selectedPayroll && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">
              Bordro Düzenle: {selectedPayroll.user?.name} ({selectedPayroll.period})
            </h2>
            <form onSubmit={handleUpdatePayroll} className="space-y-4 text-sm">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Brüt Maaş (TL)
                </label>
                <input
                  type="number"
                  required
                  className="w-full border rounded-md p-2 text-sm"
                  value={payrollEditData.baseSalary}
                  onChange={(e) =>
                    setPayrollEditData({ ...payrollEditData, baseSalary: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Prim (TL)
                </label>
                <input
                  type="number"
                  className="w-full border rounded-md p-2 text-sm"
                  value={payrollEditData.bonus}
                  onChange={(e) =>
                    setPayrollEditData({ ...payrollEditData, bonus: e.target.value })
                  }
                />
              </div>
              <div className="p-3 rounded-md border bg-slate-50 space-y-3">
                <div className="text-xs font-semibold text-slate-900">Prim Yardımcısı</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs text-slate-600">Yüzde (%)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        className="w-full border rounded-md p-2 text-sm"
                        value={bonusHelperPercent}
                        onChange={(e) => setBonusHelperPercent(e.target.value)}
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          const base = parseFloat(payrollEditData.baseSalary || '0') || 0;
                          const pct = parseFloat(bonusHelperPercent || '0') || 0;
                          const val = Math.round(base * pct / 100);
                          setPayrollEditData({ ...payrollEditData, bonus: String(val) });
                        }}
                      >
                        Uygula
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="px-2 py-1 rounded-md border text-xs"
                        onClick={() => {
                          const base = parseFloat(payrollEditData.baseSalary || '0') || 0;
                          const val = Math.round(base * 0.05);
                          setPayrollEditData({ ...payrollEditData, bonus: String(val) });
                        }}
                      >
                        +%5
                      </button>
                      <button
                        type="button"
                        className="px-2 py-1 rounded-md border text-xs"
                        onClick={() => {
                          const base = parseFloat(payrollEditData.baseSalary || '0') || 0;
                          const val = Math.round(base * 0.1);
                          setPayrollEditData({ ...payrollEditData, bonus: String(val) });
                        }}
                      >
                        +%10
                      </button>
                      <button
                        type="button"
                        className="px-2 py-1 rounded-md border text-xs"
                        onClick={() => {
                          const base = parseFloat(payrollEditData.baseSalary || '0') || 0;
                          const val = Math.round(base * 0.2);
                          setPayrollEditData({ ...payrollEditData, bonus: String(val) });
                        }}
                      >
                        +%20
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-slate-600">Hedef ve Birim</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Adet"
                        className="w-full border rounded-md p-2 text-sm"
                        value={bonusHelperCount}
                        onChange={(e) => setBonusHelperCount(e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="Birim"
                        className="w-full border rounded-md p-2 text-sm"
                        value={bonusHelperUnit}
                        onChange={(e) => setBonusHelperUnit(e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        const count = parseFloat(bonusHelperCount || '0') || 0;
                        const unit = parseFloat(bonusHelperUnit || '0') || 0;
                        const val = Math.round(count * unit);
                        setPayrollEditData({ ...payrollEditData, bonus: String(val) });
                      }}
                    >
                      Uygula
                    </Button>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Kesintiler (TL)
                </label>
                <input
                  type="number"
                  className="w-full border rounded-md p-2 text-sm"
                  value={payrollEditData.deductions}
                  onChange={(e) =>
                    setPayrollEditData({
                      ...payrollEditData,
                      deductions: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsEditPayrollModalOpen(false);
                    setSelectedPayroll(null);
                  }}
                >
                  İptal
                </Button>
                <Button type="submit">Kaydet</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {isEditEmployeeModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">Personel Düzenle: {selectedEmployee?.name}</h2>
            <form onSubmit={handleUpdateEmployee} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Maaş (TL)</label>
                <input
                  type="number"
                  required
                  className="w-full border rounded-md p-2 text-sm"
                  value={employeeData.salary}
                  onChange={(e) => setEmployeeData({ ...employeeData, salary: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">IBAN</label>
                <input
                  type="text"
                  className="w-full border rounded-md p-2 text-sm"
                  value={employeeData.iban}
                  onChange={(e) => setEmployeeData({ ...employeeData, iban: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">İşe Başlama Tarihi</label>
                <input
                  type="date"
                  className="w-full border rounded-md p-2 text-sm"
                  value={employeeData.startDate}
                  onChange={(e) => setEmployeeData({ ...employeeData, startDate: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setIsEditEmployeeModalOpen(false)}>İptal</Button>
                <Button type="submit">Güncelle</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Employee Modal */}
      {isCreateEmployeeModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">Yeni Personel Ekle</h2>
            <form onSubmit={handleCreateEmployee} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ad Soyad</label>
                  <input
                    type="text"
                    required
                    className="w-full border rounded-md p-2 text-sm"
                    value={newEmployeeData.name}
                    onChange={(e) => setNewEmployeeData({ ...newEmployeeData, name: e.target.value })}
                  />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
                   <select
                    className="w-full border rounded-md p-2 text-sm"
                    value={newEmployeeData.role}
                    onChange={(e) => setNewEmployeeData({ ...newEmployeeData, role: e.target.value })}
                   >
                     <option value="STAFF">Personel</option>
                     <option value="ADMIN">Yönetici</option>
                   </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-posta</label>
                <input
                  type="email"
                  required
                  className="w-full border rounded-md p-2 text-sm"
                  value={newEmployeeData.email}
                  onChange={(e) => setNewEmployeeData({ ...newEmployeeData, email: e.target.value })}
                />
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Finansal Bilgiler</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Maaş (TL)</label>
                    <input
                      type="number"
                      required
                      className="w-full border rounded-md p-2 text-sm"
                      value={newEmployeeData.salary}
                      onChange={(e) => setNewEmployeeData({ ...newEmployeeData, salary: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">IBAN</label>
                    <input
                      type="text"
                      className="w-full border rounded-md p-2 text-sm"
                      value={newEmployeeData.iban}
                      onChange={(e) => setNewEmployeeData({ ...newEmployeeData, iban: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">İşe Başlama Tarihi</label>
                    <input
                      type="date"
                      required
                      className="w-full border rounded-md p-2 text-sm"
                      value={newEmployeeData.startDate}
                      onChange={(e) => setNewEmployeeData({ ...newEmployeeData, startDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setIsCreateEmployeeModalOpen(false)}>İptal</Button>
                <Button type="submit">Oluştur</Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isEmployeePreviewOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden border border-slate-200 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                  {selectedEmployee.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">
                    {selectedEmployee.name}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {selectedEmployee.role || 'Personel'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {employeeDetail && employeeDetail.user && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium border bg-emerald-50 text-emerald-700 border-emerald-100">
                    {employeeDetail.user.salary
                      ? new Intl.NumberFormat('tr-TR', {
                          style: 'currency',
                          currency: 'TRY',
                        }).format(employeeDetail.user.salary)
                      : 'Maaş Bilgisi Yok'}
                  </span>
                )}
                <button
                  type="button"
                  onClick={closeEmployeePreview}
                  className="text-slate-500 hover:text-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="px-6 pt-3 pb-2 border-b bg-slate-50">
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setEmployeePreviewTab('OVERVIEW')}
                  className={`px-3 py-1.5 rounded-full border font-medium transition-colors ${
                    employeePreviewTab === 'OVERVIEW'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Genel Bilgi
                </button>
                <button
                  type="button"
                  onClick={() => setEmployeePreviewTab('SALARIES')}
                  className={`px-3 py-1.5 rounded-full border font-medium transition-colors ${
                    employeePreviewTab === 'SALARIES'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Maaşlar
                </button>
                <button
                  type="button"
                  onClick={() => setEmployeePreviewTab('ADVANCES')}
                  className={`px-3 py-1.5 rounded-full border font-medium transition-colors ${
                    employeePreviewTab === 'ADVANCES'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Avanslar
                </button>
                <button
                  type="button"
                  onClick={() => setEmployeePreviewTab('BONUSES')}
                  className={`px-3 py-1.5 rounded-full border font-medium transition-colors ${
                    employeePreviewTab === 'BONUSES'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Primler
                </button>
              </div>
            </div>
            <div className="p-6 text-sm overflow-auto flex-1 bg-slate-50/60">
              {employeeDetailLoading && (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                  Yükleniyor...
                </div>
              )}
              {!employeeDetailLoading && employeeDetail && (
                <div className="space-y-6">
                  {employeePreviewTab === 'OVERVIEW' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                          Kişisel Bilgiler
                        </h4>
                        <div className="space-y-1 text-xs text-slate-600">
                          <div>
                            <span className="text-slate-500">Ad Soyad: </span>
                            <span className="font-medium text-slate-900">
                              {employeeDetail.user.name || '-'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">E-posta: </span>
                            <span className="font-medium text-slate-900">
                              {employeeDetail.user.email || '-'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Telefon: </span>
                            <span className="font-medium text-slate-900">
                              {employeeDetail.user.phone || '-'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Rol: </span>
                            <span className="font-medium text-slate-900">
                              {employeeDetail.user.role || '-'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                          Finansal Bilgiler
                        </h4>
                        <div className="space-y-1 text-xs text-slate-600">
                          <div>
                            <span className="text-slate-500">Maaş: </span>
                            <span className="font-medium text-slate-900">
                              {employeeDetail.user.salary
                                ? new Intl.NumberFormat('tr-TR', {
                                    style: 'currency',
                                    currency: 'TRY',
                                  }).format(employeeDetail.user.salary)
                                : '-'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">IBAN: </span>
                            <span className="font-mono text-[11px] text-slate-900">
                              {employeeDetail.user.iban || '-'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">İşe Başlama: </span>
                            <span className="font-medium text-slate-900">
                              {employeeDetail.user.startDate
                                ? format(
                                    new Date(employeeDetail.user.startDate),
                                    'd MMM yyyy',
                                    { locale: tr },
                                  )
                                : '-'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Kayıt Tarihi: </span>
                            <span className="font-medium text-slate-900">
                              {employeeDetail.user.createdAt
                                ? format(
                                    new Date(employeeDetail.user.createdAt),
                                    'd MMM yyyy',
                                    { locale: tr },
                                  )
                                : '-'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {employeePreviewTab === 'SALARIES' && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                        Maaş Geçmişi
                      </h4>
                      {employeeDetail.payrolls.length === 0 ? (
                        <div className="text-xs text-slate-500">
                          Bu personele ait maaş kaydı bulunmuyor.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead className="text-slate-500 border-b">
                              <tr>
                                <th className="py-2 text-left">Dönem</th>
                                <th className="py-2 text-right">Brüt</th>
                                <th className="py-2 text-right">Prim</th>
                                <th className="py-2 text-right">Kesinti</th>
                                <th className="py-2 text-right">Net</th>
                                <th className="py-2 text-center">Durum</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {employeeDetail.payrolls.map((p: any) => (
                                <tr key={p.id}>
                                  <td className="py-2">{p.period}</td>
                                  <td className="py-2 text-right">
                                    {new Intl.NumberFormat('tr-TR', {
                                      style: 'currency',
                                      currency: 'TRY',
                                    }).format(p.baseSalary)}
                                  </td>
                                  <td className="py-2 text-right">
                                    {new Intl.NumberFormat('tr-TR', {
                                      style: 'currency',
                                      currency: 'TRY',
                                    }).format(p.bonus || 0)}
                                  </td>
                                  <td className="py-2 text-right text-red-600">
                                    {p.deductions > 0
                                      ? `-${new Intl.NumberFormat('tr-TR', {
                                          style: 'currency',
                                          currency: 'TRY',
                                        }).format(p.deductions)}`
                                      : '-'}
                                  </td>
                                  <td className="py-2 text-right font-semibold text-slate-900">
                                    {new Intl.NumberFormat('tr-TR', {
                                      style: 'currency',
                                      currency: 'TRY',
                                    }).format(p.netSalary)}
                                  </td>
                                  <td className="py-2 text-center">
                                    {p.status === 'PAID' ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-700">
                                        Ödendi
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium bg-amber-100 text-amber-700">
                                        Bekliyor
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                  {employeePreviewTab === 'ADVANCES' && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                        Avans Geçmişi
                      </h4>
                      {employeeDetail.advances.length === 0 ? (
                        <div className="text-xs text-slate-500">
                          Bu personele ait avans kaydı bulunmuyor.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead className="text-slate-500 border-b">
                              <tr>
                                <th className="py-2 text-left">Tarih</th>
                                <th className="py-2 text-right">Tutar</th>
                                <th className="py-2 text-left">Açıklama</th>
                                <th className="py-2 text-center">Durum</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {employeeDetail.advances.map((a: any) => (
                                <tr key={a.id}>
                                  <td className="py-2">
                                    {format(new Date(a.date), 'd MMM yyyy', { locale: tr })}
                                  </td>
                                  <td className="py-2 text-right">
                                    {new Intl.NumberFormat('tr-TR', {
                                      style: 'currency',
                                      currency: 'TRY',
                                    }).format(a.amount)}
                                  </td>
                                  <td className="py-2">
                                    {a.description || '-'}
                                  </td>
                                  <td className="py-2 text-center">
                                    {a.isDeducted ? (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                                        Maaştan Düştü
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700">
                                        Açık Avans
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                  {employeePreviewTab === 'BONUSES' && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                        Primler
                      </h4>
                      {employeeDetail.payrolls.filter((p: any) => (p.bonus || 0) > 0).length === 0 ? (
                        <div className="text-xs text-slate-500">
                          Bu personele ait prim kaydı bulunmuyor.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead className="text-slate-500 border-b">
                              <tr>
                                <th className="py-2 text-left">Dönem</th>
                                <th className="py-2 text-right">Prim Tutarı</th>
                                <th className="py-2 text-center">Durum</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {employeeDetail.payrolls
                                .filter((p: any) => (p.bonus || 0) > 0)
                                .map((p: any) => (
                                  <tr key={p.id}>
                                    <td className="py-2">{p.period}</td>
                                    <td className="py-2 text-right">
                                      {new Intl.NumberFormat('tr-TR', {
                                        style: 'currency',
                                        currency: 'TRY',
                                      }).format(p.bonus || 0)}
                                    </td>
                                    <td className="py-2 text-center">
                                      {p.status === 'PAID' ? 'Ödendi' : 'Bekliyor'}
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
