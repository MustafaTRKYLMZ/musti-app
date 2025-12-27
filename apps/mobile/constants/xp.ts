// Linear XP progression formula: 50 + (level - 1) * 60
// This creates a steady, predictable XP curve where each level requires
// 60 more XP than the previous one. For example:
// Level 1→2: 50 XP, Level 2→3: 110 XP, Level 3→4: 170 XP
export const xpForNextLevel = (level: number) => 50 + (level - 1) * 60;
