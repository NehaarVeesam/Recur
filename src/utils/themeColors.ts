import { cn } from './cn';

/** Reserved exclusively for Easy / Medium / Hard difficulty. */
export const DIFFICULTY_COLORS = {
  Easy: {
    text: 'text-emerald-400',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    borderTop: 'border-t-emerald-500',
    bar: 'bg-emerald-500',
  },
  Medium: {
    text: 'text-amber-400',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    borderTop: 'border-t-amber-500',
    bar: 'bg-amber-500',
  },
  Hard: {
    text: 'text-rose-500',
    badge: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    borderTop: 'border-t-rose-500',
    bar: 'bg-rose-500',
  },
} as const;

/** Revision status — uses violet / blue / cyan so difficulty colors stay distinct. */
export const STATUS_COLORS = {
  'Need Revision': {
    text: 'text-violet-400',
    button: 'border-violet-500/30 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20',
    bar: 'bg-violet-500',
  },
  Revised: {
    text: 'text-blue-400',
    button: 'border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20',
    bar: 'bg-blue-500',
  },
  Mastered: {
    text: 'text-cyan-400',
    button: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20',
    bar: 'bg-cyan-500',
  },
} as const;

export type Difficulty = keyof typeof DIFFICULTY_COLORS;
export type RevisionStatus = keyof typeof STATUS_COLORS;

export function getDifficultyTextClass(difficulty: string): string {
  return DIFFICULTY_COLORS[difficulty as Difficulty]?.text ?? 'text-slate-500';
}

export function getDifficultyBadgeClass(difficulty: string): string {
  return DIFFICULTY_COLORS[difficulty as Difficulty]?.badge ?? 'bg-white/5 text-slate-400 border-white/10';
}

export function getStatusTextClass(status: string): string {
  return STATUS_COLORS[status as RevisionStatus]?.text ?? 'text-slate-400';
}

export function getStatusButtonClass(status: RevisionStatus): string {
  return cn(
    'px-4 py-2 text-sm rounded-lg border transition-colors',
    STATUS_COLORS[status].button
  );
}

/** Tag count badges — excludes emerald, amber, and rose (reserved for difficulty). */
export const TAG_COUNT_PALETTE = [
  'text-indigo-300 bg-indigo-500/15 border-indigo-500/35',
  'text-violet-300 bg-violet-500/15 border-violet-500/35',
  'text-cyan-300 bg-cyan-500/15 border-cyan-500/35',
  'text-sky-300 bg-sky-500/15 border-sky-500/35',
  'text-fuchsia-300 bg-fuchsia-500/15 border-fuchsia-500/35',
  'text-teal-300 bg-teal-500/15 border-teal-500/35',
  'text-purple-300 bg-purple-500/15 border-purple-500/35',
  'text-pink-300 bg-pink-500/15 border-pink-500/35',
] as const;

export function tagCountColorClass(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = ((hash << 5) - hash) + tag.charCodeAt(i);
    hash |= 0;
  }
  return TAG_COUNT_PALETTE[Math.abs(hash) % TAG_COUNT_PALETTE.length];
}
