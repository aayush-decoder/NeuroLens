// Framework-free adaptation engine
import { TextAdaptation } from '@/types/reader.types';

// Simple vocabulary database for demo
const COMPLEX_WORDS: Record<string, { synonym: string; definition: string; cognate?: string }> = {
  'ubiquitous': { synonym: 'widespread', definition: 'found everywhere', cognate: 'ubicuo (ES)' },
  'paradigm': { synonym: 'model', definition: 'a typical example or pattern', cognate: 'paradigma (ES)' },
  'ephemeral': { synonym: 'short-lived', definition: 'lasting for a very short time', cognate: 'efímero (ES)' },
  'algorithm': { synonym: 'procedure', definition: 'a step-by-step process', cognate: 'algoritmo (ES)' },
  'concatenate': { synonym: 'join', definition: 'link things together in a chain', cognate: 'concatenar (ES)' },
  'abstraction': { synonym: 'simplification', definition: 'a general concept apart from specific instances', cognate: 'abstracción (ES)' },
  'inherently': { synonym: 'naturally', definition: 'in a permanent, essential way' },
  'proliferation': { synonym: 'spread', definition: 'rapid increase in numbers', cognate: 'proliferación (ES)' },
  'infrastructure': { synonym: 'foundation', definition: 'the basic systems that support something', cognate: 'infraestructura (ES)' },
  'methodology': { synonym: 'approach', definition: 'a system of methods', cognate: 'metodología (ES)' },
  'comprehensive': { synonym: 'thorough', definition: 'complete and including everything', cognate: 'comprensivo (ES)' },
  'subsequently': { synonym: 'afterwards', definition: 'after that', cognate: 'subsecuentemente (ES)' },
  'nevertheless': { synonym: 'however', definition: 'in spite of that' },
  'sophisticated': { synonym: 'advanced', definition: 'highly developed and complex', cognate: 'sofisticado (ES)' },
  'implementation': { synonym: 'execution', definition: 'the process of putting something into effect', cognate: 'implementación (ES)' },
  'fundamental': { synonym: 'basic', definition: 'forming a necessary base or core', cognate: 'fundamental (ES)' },
  'predominantly': { synonym: 'mostly', definition: 'mainly; for the most part' },
  'simultaneously': { synonym: 'at the same time', definition: 'occurring at the same time', cognate: 'simultáneamente (ES)' },
  'consequently': { synonym: 'therefore', definition: 'as a result' },
  'preliminary': { synonym: 'initial', definition: 'coming before the main part', cognate: 'preliminar (ES)' },
};

const ACRONYMS: Record<string, string> = {
  'API': 'Application Programming Interface',
  'CPU': 'Central Processing Unit',
  'GPU': 'Graphics Processing Unit',
  'RAM': 'Random Access Memory',
  'HTTP': 'HyperText Transfer Protocol',
  'SQL': 'Structured Query Language',
  'CSS': 'Cascading Style Sheets',
  'HTML': 'HyperText Markup Language',
  'URL': 'Uniform Resource Locator',
  'JSON': 'JavaScript Object Notation',
  'REST': 'Representational State Transfer',
  'SDK': 'Software Development Kit',
  'IDE': 'Integrated Development Environment',
  'SaaS': 'Software as a Service',
  'ML': 'Machine Learning',
  'AI': 'Artificial Intelligence',
  'NLP': 'Natural Language Processing',
  'IoT': 'Internet of Things',
  'UI': 'User Interface',
  'UX': 'User Experience',
};

export function getAdaptationsForText(text: string, frictionScore: number): TextAdaptation[] {
  if (frictionScore < 0.4) return [];
  
  const adaptations: TextAdaptation[] = [];
  const words = text.split(/\s+/);

  words.forEach(rawWord => {
    const word = rawWord.replace(/[.,;:!?'"()]/g, '').toLowerCase();
    const upperWord = rawWord.replace(/[.,;:!?'"()]/g, '');

    // Check acronyms
    if (ACRONYMS[upperWord]) {
      adaptations.push({
        original: upperWord,
        adapted: `${upperWord} (${ACRONYMS[upperWord]})`,
        type: 'acronym',
      });
    }

    // Check complex words
    if (COMPLEX_WORDS[word] && frictionScore > 0.5) {
      const entry = COMPLEX_WORDS[word];
      adaptations.push({
        original: word,
        adapted: entry.synonym,
        type: 'synonym',
      });
    }
  });

  return adaptations;
}

export function getDefinition(word: string): string | null {
  const lower = word.toLowerCase();
  return COMPLEX_WORDS[lower]?.definition || null;
}

export function getSynonym(word: string): string | null {
  const lower = word.toLowerCase();
  return COMPLEX_WORDS[lower]?.synonym || null;
}

export function getCognate(word: string): string | null {
  const lower = word.toLowerCase();
  return COMPLEX_WORDS[lower]?.cognate || null;
}

export function isComplexWord(word: string): boolean {
  return word.toLowerCase() in COMPLEX_WORDS;
}

export function expandAcronym(word: string): string | null {
  return ACRONYMS[word] || null;
}
