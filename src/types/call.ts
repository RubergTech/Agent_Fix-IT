export type Language = 'en-GB' | 'fr' | 'es' | 'de' | 'it' | 'pt' | 'nl';

export interface CallData {
  tenantName: string;
  email: string;
  room: string;
  faultDescription: string;
  faultDate: string;
  urgency: 'low' | 'medium' | 'high';
  language: Language;
}

export interface CallSummary {
  callData: CallData;
  timestamp: string;
  callDuration: number;
} 