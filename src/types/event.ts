export interface CalendarEvent {
  id: string;
  project: string;
  title: string;
  start: string;
  end?: string | null;
  location?: string | null;
  memo?: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventFormData {
  project: string;
  title: string;
  start: string;
  end?: string;
  location?: string;
  memo?: string;
}

export const PROJECTS = [
  { name: 'SEVENDAO', color: '#3B82F6' },
  { name: '赤犬赤猫', color: '#EF4444' },
  { name: 'REDSPORTSSOLUTION', color: '#F97316' },
  { name: 'RED° TOKYO PREMIUM', color: '#8B5CF6' },
  { name: 'ScentJapanDAO', color: '#22C55E' },
  { name: 'CNPRED゜', color: '#EC4899' },
] as const;

export const LOCATIONS = [
  { value: '', label: '場所を選択してください' },
  { value: 'Xスペース', label: 'Xスペース' },
  { value: 'ディスコード', label: 'ディスコード' },
  { value: 'Tokyo Office', label: 'Tokyo Office' },
  { value: 'Shibuya Studio', label: 'Shibuya Studio' },
  { value: 'Roppongi Hills', label: 'Roppongi Hills' },
  { value: 'R&D Lab', label: 'R&D Lab' },
  { value: 'Virtual Space', label: 'Virtual Space' },
  { value: 'Online', label: 'Online' },
  { value: 'その他', label: 'その他' },
] as const;

export type ProjectName = typeof PROJECTS[number]['name'];
export type LocationValue = typeof LOCATIONS[number]['value'];