
export type PatientStage =
  | "ADAY"
  | "ONAYLANDI"
  | "OPERASYON_BEKLIYOR"
  | "TABURCU"
  | "KAYBEDILDI";

export type TreatmentCategory = "DIS" | "SAC_EKIMI" | "ESTETIK";
export type DepositStatus = "PAID" | "PENDING" | "NONE";
export type HeatStatus = "SICAK_LEAD" | "UCUS_BEKLIYOR" | "OPERASYON_GUNU";

export type Patient = {
  id: string;
  name: string;
  passportName: string;
  passportNumber?: string;
  country: string;
  city: string;
  nationality: string;
  language: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  refSource: string;
  treatmentCategory: TreatmentCategory;
  treatment: string;
  package: string;
  chronicDiseases?: string;
  allergies?: string;
  doctorNotes?: string;
  budget: number;
  currency: string;
  stage: PatientStage;
  heatStatus?: HeatStatus;
  offerPackage: string;
  agreedAmount: number;
  agreedCurrency: string;
  depositStatus: DepositStatus;
  contracts: string[];
  arrivalMonth: string;
  salesOwner: string;
  source: string;
  channel: string;
  lastContact: string;
  hotel?: string;
  hotelRoomNumber?: string;
  notes?: string;
  flightArrivalTime?: string;
  flightCode?: string;
  // Transfer Details
  companionCount?: number;
  airport?: "IST" | "SAW";
  arrivalTerminal?: string;
  welcomeSignText?: string;
  transferNotes?: string;
  driverNotified?: boolean;
  transferDriverName?: string;
  transferDriverPhone?: string;
  pipelineProbability: number;
  revenuePotential: number;
  tags: string[];
  createdAt: string;
};

export const patients: Patient[] = [];

export const stageConfig: Record<
  PatientStage,
  { label: string; color: string; subtle: string }
> = {
  ADAY: {
    label: "Aday",
    color: "bg-sky-100 text-sky-800",
    subtle: "bg-sky-50",
  },
  ONAYLANDI: {
    label: "Onaylandı",
    color: "bg-amber-100 text-amber-800",
    subtle: "bg-amber-50",
  },
  OPERASYON_BEKLIYOR: {
    label: "Operasyon Bekliyor",
    color: "bg-blue-100 text-blue-800",
    subtle: "bg-blue-50",
  },
  TABURCU: {
    label: "Taburcu Edildi",
    color: "bg-emerald-100 text-emerald-800",
    subtle: "bg-emerald-50",
  },
  KAYBEDILDI: {
    label: "Kaybedildi",
    color: "bg-red-100 text-red-800",
    subtle: "bg-red-50",
  },
};

export const heatConfig: Record<
  HeatStatus,
  { label: string; color: string; icon: string }
> = {
  SICAK_LEAD: {
    label: "Sıcak Lead",
    color: "text-orange-500 bg-orange-50",
    icon: "🔥",
  },
  UCUS_BEKLIYOR: {
    label: "Uçuş Bekliyor",
    color: "text-blue-500 bg-blue-50",
    icon: "✈️",
  },
  OPERASYON_GUNU: {
    label: "Operasyon Günü",
    color: "text-red-500 bg-red-50",
    icon: "🏥",
  },
};

export const doctors = [];

export type TreatmentStage = {
    id: string;
    name: string;
    description: string;
    date?: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
    notes?: string;
};

export type MedicalMaterial = {
    id: string;
    name: string;
    brand: string;
    quantity: number;
    unit: string;
    serialNumber?: string; // Critical for warranty
};

export type Medication = {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
};

export type TreatmentPlan = {
    id: string;
    patientId: string;
    doctorId: string;
    appointmentId?: string;
    title: string;
    description: string;
    stages: TreatmentStage[];
    materials: MedicalMaterial[];
    medications: Medication[];
    postOpInstructions: string[];
    status: "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED";
    createdAt: string;
    updatedAt: string;
};

export const treatmentPlans: TreatmentPlan[] = [];

export type ContractType = "KVKK" | "ONAM" | "HIZMET" | "DIGER";

export type ContractTemplate = {
    id: string;
    title: string;
    type: ContractType;
    language: "TR" | "EN" | "DE" | "AR" | "FR";
    content: string; // Contains placeholders like {{hasta_adi}}
    version: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

export type ContractStatus = "PENDING" | "APPROVED" | "REJECTED";

export type PatientContract = {
    id: string;
    patientId: string;
    templateId: string;
    status: ContractStatus;
    approvedAt?: string;
    approvedByIp?: string;
    approvedByDevice?: string;
    generatedContent?: string;
    createdAt: string;
};

export const contractTemplates: ContractTemplate[] = [
    {
        id: "T-001",
        title: "KVKK Aydınlatma Metni",
        type: "KVKK",
        language: "TR",
        content: `Sayın {{hasta_adi}},

6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca, kişisel verileriniz; veri sorumlusu olarak Kliniğimiz tarafından aşağıda açıklanan kapsamda işlenebilecektir.

1. Kişisel Verilerin Hangi Amaçla İşleneceği
Kişisel verileriniz, {{tedavi_adi}} sürecinin yürütülmesi, randevu oluşturulması ve yasal yükümlülüklerin yerine getirilmesi amacıyla işlenmektedir.

2. İşlenen Kişisel Veriler
Kimlik Bilgileri: {{pasaport_no}}
İletişim Bilgileri: {{telefon}}

Tarih: {{tarih}}
`,
        version: "1.0",
        isActive: true,
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01"
    },
    {
        id: "T-002",
        title: "Saç Ekimi Onam Formu",
        type: "ONAM",
        language: "TR",
        content: `SAÇ EKİMİ OPERASYONU BİLGİLENDİRİLMİŞ ONAM FORMU

Hasta Adı: {{hasta_adi}}
Pasaport No: {{pasaport_no}}
Operasyon Tarihi: {{tedavi_tarihi}}

Ben {{hasta_adi}}, tarafıma uygulanacak olan saç ekimi işlemi hakkında doktorum tarafından detaylıca bilgilendirildim.
Operasyonun risklerini, başarı oranını ve sonrası süreci anladım.

Toplam Tutar: {{toplam_tutar}} {{para_birimi}}

Kabul Ediyorum.`,
        version: "2.1",
        isActive: true,
        createdAt: "2024-02-15",
        updatedAt: "2024-03-10"
    },
    {
        id: "T-003",
        title: "Hair Transplant Consent Form",
        type: "ONAM",
        language: "EN",
        content: `HAIR TRANSPLANT OPERATION INFORMED CONSENT FORM

Patient Name: {{hasta_adi}}
Passport No: {{pasaport_no}}
Operation Date: {{tedavi_tarihi}}

I, {{hasta_adi}}, have been informed in detail by my doctor about the hair transplant procedure to be applied to me.
I understand the risks of the operation, the success rate, and the post-operative process.

Total Amount: {{toplam_tutar}} {{para_birimi}}

I Accept.`,
        version: "1.0",
        isActive: true,
        createdAt: "2024-03-15",
        updatedAt: "2024-03-15"
    }
];

export const patientContracts: PatientContract[] = [];

export type AppointmentStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NOSHOW";

export type Doctor = {
    id: string;
    name: string;
    specialty: string;
};

export type Room = {
    id: string;
    name: string;
    type: "OPERATING" | "CONSULTATION";
};

export type Appointment = {
    id: string;
    patientId: string;
    doctorId: string;
    roomId: string;
    startTime: string; // ISO string
    endTime: string; // ISO string
    type: string;
    status: AppointmentStatus;
    notes?: string;
};

export const rooms: Room[] = [];

export const initialAppointments: Appointment[] = [];

export type AccommodationStatus = "BOOKED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED" | "CHECK_IN_PENDING";

export type Hotel = {
    id: string;
    name: string;
    location: string;
    stars: number;
    amenities: string[];
};

export type Accommodation = {
    id: string;
    patientId: string;
    hotelId: string;
    checkInDate: string; // ISO string
    checkOutDate: string; // ISO string
    roomType: string;
    status: AccommodationStatus;
    notes?: string;
    confirmationCode?: string;
};

export const hotels: Hotel[] = [];

export const initialAccommodations: Accommodation[] = [];

export const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount);
};
