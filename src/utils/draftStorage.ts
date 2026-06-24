import { Approach } from './parser';

const STORAGE_KEY = 'recur:unsaved-draft';

export type DraftTabId = 'overview' | 'approach' | 'learning' | 'mistakes' | 'code' | 'revision';
export type DraftEditableTab = Exclude<DraftTabId, 'revision'>;

export interface OverviewDraftData {
  title: string;
  statement: string;
  tagsInput: string;
  difficulty: string;
  platform: string;
  date: string;
}

export interface StoredDraft {
  problemFilename: string;
  problemContent: string;
  createMode: boolean;
  activeTab: DraftTabId;
  editingTab: DraftEditableTab | null;
  overviewDraft: OverviewDraftData | null;
  approachesDraft: Approach[] | null;
  learningDraft: string | null;
  mistakesDraft: string | null;
  codeDraft: string | null;
  savedAt: number;
}

export function loadStoredDraft(): StoredDraft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredDraft;
    if (!parsed?.problemFilename) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveStoredDraft(draft: StoredDraft): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...draft, savedAt: Date.now() }));
  } catch {
    // storage full or unavailable
  }
}

export function clearStoredDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
