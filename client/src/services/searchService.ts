import { MenuItem } from '../types/menu';

// Common Indian culinary phonetic & spelling equivalence map
const SPELLING_SYNONYMS: Record<string, string[]> = {
  biryani: ['biriyani', 'biryany', 'briyani', 'biryani', 'bryani'],
  fried: ['frid', 'fry', 'fried', 'fride'],
  noodles: ['noodel', 'noodeles', 'noodle', 'noodles', 'nudles'],
  schezwan: ['sezwan', 'schezuan', 'szechuan', 'sechwan', 'shezwan', 'sezwan'],
  paneer: ['paner', 'paneer', 'panir'],
  mushroom: ['mushrom', 'mashroom', 'mushroom'],
  chicken: ['chiken', 'chikken', 'chk', 'chickn', 'chicken'],
  sauce: ['sause', 'sauce', 'souse'],
  shake: ['shaek', 'shack', 'shake', 'shakes'],
  sandwich: ['sandwhich', 'sandwitch', 'sandwich'],
  burger: ['burgar', 'burgr', 'burger'],
  mojito: ['mojito', 'moctil', 'mocktail', 'mohito', 'mojit'],
  grilled: ['grild', 'grill', 'grilled'],
  tikka: ['tika', 'tikka', 'tikaa'],
  ginger: ['gingeer', 'gingr', 'ginger'],
  pineapple: ['paineapple', 'pinapple', 'pineapple'],
  orange: ['orenge', 'orange'],
  water: ['watter', 'water'],
  lollipop: ['lolipop', 'lollypop', 'lollipop'],
  wings: ['winges', 'wings', 'wing'],
  popcorn: ['popcorns', 'popcorn', 'pop corn'],
  finger: ['finggers', 'fingers', 'finger'],
  manchow: ['mancho', 'manchow'],
  manchurian: ['manchuria', 'manchurian', 'manchorian'],
  garlic: ['garlick', 'garlic'],
  cheese: ['chese', 'cheeze', 'cheese'],
  egg: ['eg', 'egg', 'eggs'],
  fish: ['fsh', 'fish'],
  prawns: ['prawn', 'prawns', 'pranws'],
  lassi: ['lasi', 'lassi'],
  falooda: ['faluda', 'falooda', 'faludaa'],
  fries: ['fry', 'fries', 'frie']
};

// Normalize text for flexible comparison
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Levenshtein distance for fuzzy typo tolerance
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Checks if token matches target word (exact, prefix, synonym, or 1-2 char typo)
function isTokenMatch(token: string, word: string): boolean {
  if (word.startsWith(token) || word.includes(token)) return true;

  // Check synonym map
  for (const [canon, variants] of Object.entries(SPELLING_SYNONYMS)) {
    if (token === canon || variants.includes(token)) {
      if (word === canon || variants.includes(word) || word.includes(canon)) {
        return true;
      }
    }
  }

  // Fuzzy check for words of length >= 4
  if (token.length >= 4 && word.length >= 4) {
    const maxDistance = token.length > 6 ? 2 : 1;
    if (levenshteinDistance(token, word) <= maxDistance) {
      return true;
    }
  }

  return false;
}

export interface ScoredMenuItem {
  item: MenuItem;
  score: number;
}

// Scores an item based on search query matching & spelling relevance
export function scoreItemForSearch(item: MenuItem, rawQuery: string): number {
  const query = normalizeText(rawQuery);
  if (!query) return 1;

  const nameNorm = normalizeText(item.name);
  const catNorm = normalizeText(item.category);
  const subcatNorm = normalizeText(item.subcategory || '');
  const descNorm = normalizeText(item.description || '');

  // 1. Highest priority: Exact match or Name starts with query
  if (nameNorm === query) return 1000;
  if (nameNorm.startsWith(query)) return 800;
  if (nameNorm.includes(query)) return 600;

  const queryTokens = query.split(' ').filter(t => t.length > 0);
  const nameWords = nameNorm.split(' ');
  const allTargetWords = `${nameNorm} ${catNorm} ${subcatNorm} ${descNorm}`.split(' ');

  let matchedTokens = 0;
  let nameTokenMatches = 0;

  for (const token of queryTokens) {
    let tokenFoundInName = false;
    for (const nw of nameWords) {
      if (isTokenMatch(token, nw)) {
        tokenFoundInName = true;
        break;
      }
    }

    if (tokenFoundInName) {
      tokenFoundInName = true;
      matchedTokens++;
      nameTokenMatches++;
    } else {
      let tokenFoundElsewhere = false;
      for (const tw of allTargetWords) {
        if (isTokenMatch(token, tw)) {
          tokenFoundElsewhere = true;
          break;
        }
      }
      if (tokenFoundElsewhere) {
        matchedTokens++;
      }
    }
  }

  // All tokens in query must match something in the item
  if (matchedTokens < queryTokens.length) {
    return 0; // Not a match
  }

  // Score based on token matches in name vs category
  let score = 200 + nameTokenMatches * 100;
  if (catNorm.includes(query)) score += 50;
  if (subcatNorm.includes(query)) score += 30;

  return score;
}

// Filters and sorts items by query relevance
export function searchMenuItems(items: MenuItem[], query: string): MenuItem[] {
  if (!query || query.trim().length === 0) {
    return items;
  }

  const scored: ScoredMenuItem[] = [];

  for (const item of items) {
    const score = scoreItemForSearch(item, query);
    if (score > 0) {
      scored.push({ item, score });
    }
  }

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  return scored.map(s => s.item);
}
