import { Approach, Problem } from './parser';
import { OverviewDraftData } from './draftStorage';

export function confirmDiscard(
  message = 'You have unsaved changes. Discard them and leave?'
): boolean {
  return window.confirm(message);
}

function normalizeTags(tags: string[]): string {
  return tags.join(', ');
}

function approachesEqual(a: Approach[], b: Approach[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((item, i) => {
    const other = b[i];
    return (
      item.title === other.title &&
      (item.timeComplexity || '') === (other.timeComplexity || '') &&
      (item.spaceComplexity || '') === (other.spaceComplexity || '') &&
      item.content === other.content
    );
  });
}

export function hasCreateModeChanges(
  overview: OverviewDraftData | null,
  approaches: Approach[] | null,
  learning: string | null,
  mistakes: string | null,
  code: string | null
): boolean {
  if (!overview || approaches === null || learning === null || mistakes === null || code === null) {
    return false;
  }

  const hasApproachContent = approaches.some(
    (a) =>
      a.content.trim() ||
      a.timeComplexity?.trim() ||
      a.spaceComplexity?.trim() ||
      (a.title.trim() && a.title.trim() !== 'Approach 1')
  );

  return !!(
    overview.title.trim() ||
    overview.statement.trim() ||
    overview.tagsInput.trim() ||
    overview.platform.trim() ||
    learning.trim() ||
    mistakes.trim() ||
    code.trim() ||
    hasApproachContent
  );
}

export function hasTabEditChanges(
  tab: 'overview' | 'approach' | 'learning' | 'mistakes' | 'code',
  problem: Problem,
  overview: OverviewDraftData | null,
  approaches: Approach[] | null,
  learning: string | null,
  mistakes: string | null,
  code: string | null
): boolean {
  switch (tab) {
    case 'overview':
      if (!overview) return false;
      return (
        overview.title !== (problem.title || '') ||
        overview.statement !== (problem.statement || '') ||
        overview.tagsInput !== normalizeTags(problem.tags) ||
        overview.difficulty !== (problem.difficulty || 'Easy') ||
        overview.platform !== (problem.platform || '') ||
        overview.date !== (problem.date || '')
      );
    case 'approach':
      if (!approaches) return false;
      return !approachesEqual(approaches, problem.approaches);
    case 'learning':
      return learning !== null && learning !== (problem.learning || '');
    case 'mistakes':
      return mistakes !== null && mistakes !== (problem.mistakes || '');
    case 'code':
      return code !== null && code !== (problem.code || '');
    default:
      return false;
  }
}

export function hasUnsavedWork(params: {
  createMode: boolean;
  editingTab: 'overview' | 'approach' | 'learning' | 'mistakes' | 'code' | null;
  problem: Problem;
  overviewDraft: OverviewDraftData | null;
  approachesDraft: Approach[] | null;
  learningDraft: string | null;
  mistakesDraft: string | null;
  codeDraft: string | null;
}): boolean {
  const {
    createMode,
    editingTab,
    problem,
    overviewDraft,
    approachesDraft,
    learningDraft,
    mistakesDraft,
    codeDraft,
  } = params;

  if (createMode) {
    return hasCreateModeChanges(
      overviewDraft,
      approachesDraft,
      learningDraft,
      mistakesDraft,
      codeDraft
    );
  }

  if (!editingTab) return false;

  return hasTabEditChanges(
    editingTab,
    problem,
    overviewDraft,
    approachesDraft,
    learningDraft,
    mistakesDraft,
    codeDraft
  );
}
