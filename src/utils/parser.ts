export interface Approach {
  title: string;
  timeComplexity?: string;
  spaceComplexity?: string;
  content: string;
}

export interface Problem {
  filename: string;
  title: string;
  date: string;
  time: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | string;
  tags: string[];
  statement?: string;
  approaches: Approach[];
  learning: string;
  mistakes: string;
  code: string;
  platform?: string;
  favorite?: boolean;
  status: 'Need Revision' | 'Revised' | 'Mastered' | string;
  lastRevised?: string;
  raw: string;
}

export function parseProblem(filename: string, content: string): Problem {
  const lines = content.split('\n');
  const problem: Partial<Problem> = {
    filename,
    title: '',
    date: '',
    time: '',
    difficulty: 'Easy',
    tags: [],
    statement: '',
    approaches: [],
    learning: '',
    mistakes: '',
    code: '',
    favorite: false,
    status: 'Need Revision',
    raw: content,
  };

  let currentSection = 'meta';
  let sectionContent: string[] = [];
  let currentApproach: Approach | null = null;

  const storeSection = (section: string, lines: string[]) => {
    const text = lines.join('\n').trim();
    if (section === 'statement') problem.statement = text;
    else if (section === 'approach' && currentApproach) currentApproach.content = text;
    else if (section === 'learning') problem.learning = text;
    else if (section === 'mistakes') problem.mistakes = text;
    else if (section === 'code') problem.code = text;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.startsWith('Statement:')) {
      storeSection(currentSection, sectionContent);
      currentSection = 'statement';
      sectionContent = [];
      continue;
    } else if (line.match(/^Approach/i)) {
      storeSection(currentSection, sectionContent);
      currentSection = 'approach';
      const title = line.replace(/^Approach:?\s*/i, '').trim() || `Approach ${(problem.approaches?.length || 0) + 1}`;
      currentApproach = { title, timeComplexity: '', spaceComplexity: '', content: '' };
      problem.approaches!.push(currentApproach);
      sectionContent = [];
      continue;
    } else if (line.startsWith('Learning:')) {
      storeSection(currentSection, sectionContent);
      currentSection = 'learning';
      sectionContent = [];
      continue;
    } else if (line.startsWith('Mistakes:')) {
      storeSection(currentSection, sectionContent);
      currentSection = 'mistakes';
      sectionContent = [];
      continue;
    } else if (line.startsWith('Code:')) {
      storeSection(currentSection, sectionContent);
      currentSection = 'code';
      sectionContent = [];
      continue;
    }

    if (currentSection === 'meta') {
      const match = line.match(/^([a-zA-Z\s]+):\s*(.*)$/);
      if (match) {
        const key = match[1].trim().toLowerCase();
        const value = match[2].trim();
        
        switch (key) {
          case 'title': problem.title = value; break;
          case 'date': problem.date = value; break;
          case 'time': problem.time = value; break;
          case 'difficulty': problem.difficulty = value; break;
          case 'tags': problem.tags = value.split(',').map(t => t.trim()).filter(Boolean); break;
          case 'platform': problem.platform = value; break;
          case 'favorite': problem.favorite = value.toLowerCase() === 'true'; break;
          case 'status': problem.status = value; break;
          case 'last revised': problem.lastRevised = value; break;
        }
      }
    } else if (currentSection === 'approach' && currentApproach) {
      const tcMatch = line.match(/^Time Complexity:\s*(.*)$/i);
      const scMatch = line.match(/^Space Complexity:\s*(.*)$/i);
      if (tcMatch) {
         currentApproach.timeComplexity = tcMatch[1].trim();
      } else if (scMatch) {
         currentApproach.spaceComplexity = scMatch[1].trim();
      } else {
         sectionContent.push(line);
      }
    } else {
      sectionContent.push(line);
    }
  }
  
  storeSection(currentSection, sectionContent);

  return problem as Problem;
}

export function generateProblemText(problem: Partial<Problem>): string {
  let text = '';
  if (problem.title) text += `Title: ${problem.title}\n`;
  if (problem.date) text += `Date: ${problem.date}\n`;
  if (problem.time) text += `Time: ${problem.time}\n`;
  if (problem.difficulty) text += `Difficulty: ${problem.difficulty}\n`;
  if (problem.tags && problem.tags.length > 0) text += `Tags: ${problem.tags.join(', ')}\n`;
  if (problem.platform) text += `Platform: ${problem.platform}\n`;
  if (problem.favorite !== undefined) text += `Favorite: ${String(problem.favorite)}\n`;
  if (problem.status) text += `Status: ${problem.status}\n`;
  if (problem.lastRevised) text += `Last Revised: ${problem.lastRevised}\n`;
  
  text += '\nStatement:\n';
  text += (problem.statement || '') + '\n';

  if (problem.approaches && problem.approaches.length > 0) {
    problem.approaches.forEach(app => {
      text += `\nApproach: ${app.title}\n`;
      if (app.timeComplexity) text += `Time Complexity: ${app.timeComplexity}\n`;
      if (app.spaceComplexity) text += `Space Complexity: ${app.spaceComplexity}\n`;
      text += (app.content || '') + '\n';
    });
  }
  
  text += '\nLearning:\n';
  text += (problem.learning || '') + '\n\n';

  text += 'Mistakes:\n';
  text += (problem.mistakes || '') + '\n\n';
  
  text += 'Code:\n';
  text += (problem.code || '') + '\n';
  
  return text;
}
