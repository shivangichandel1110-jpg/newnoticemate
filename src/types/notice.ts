export interface ExtractedFact {
  id: string;
  category: 'deadline' | 'exam' | 'fee' | 'eligibility' | 'document' | 'general' | string;
  fact: string;
  sourceQuote: string;
  pageOrLocation?: string;
  status: 'confirmed' | 'requires_verification';
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  dueDate: string | null; // ISO YYYY-MM-DD or null
  rawDueDateText?: string;
  sourceQuote: string;
  isAmbiguousDate: boolean;
  ambiguityReason?: string;
  hasPassed?: boolean;
  completed?: boolean;
  syncedToGoogleTasks?: boolean;
  googleTaskId?: string;
}

export interface CalendarEventItem {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm or empty
  endTime?: string;
  isAllDay: boolean;
  sourceQuote: string;
  isAmbiguous: boolean;
  ambiguityReason?: string;
  isPassed?: boolean;
  suggestedReminderMinutes: number; // e.g. 1440 for 1 day before
  selected: boolean;
  status?: 'pending' | 'created' | 'failed' | 'already_exists';
  googleEventId?: string;
  googleEventHtmlLink?: string;
  errorMessage?: string;
}

export interface FeeItem {
  feeType: string;
  amount?: string;
  deadline?: string;
  paymentMethod?: string;
}

export interface NoticeInstruction {
  instruction: string;
  priority?: 'high' | 'medium' | 'normal' | string;
}

export interface EligibilityCondition {
  condition: string;
  sourceQuote?: string;
}

export interface NoticeAnalysis {
  id: string;
  createdAt: string; // ISO string
  title: string;
  issuingOrganization: string;
  announcementDate?: string;
  category: string;
  summaryBullets?: string[];
  summaryEnglish: string;
  summaryHindi: string;
  whatThisMeansEnglish: string;
  whatThisMeansHindi: string;
  warningsAndMissingInfo?: string[];
  importantInstructions: NoticeInstruction[];
  conditionsAndEligibility: EligibilityCondition[];
  requiredDocuments: string[];
  feesAndPayment: FeeItem[];
  extractedFacts: ExtractedFact[];
  actionItems: ActionItem[];
  calendarEvents: CalendarEventItem[];
  extractedRawTextSnippet?: string;
  originalFileName?: string;
  originalText?: string;
  inputMethod?: 'file' | 'text' | 'sample';
}

export type AppLanguage = 'en' | 'hi';
export type TextScale = 'normal' | 'large' | 'xlarge';

export interface AppSettings {
  preferredLanguage: AppLanguage;
  textScale: TextScale;
  defaultReminderMinutes: number; // 1440 = 24h, 2880 = 48h, 60 = 1h
  voiceRate: number; // 0.8 to 1.2
  voicePitch: number; // 0.8 to 1.2
  selectedVoiceURI: string;
  autoReadSummary: boolean;
}
