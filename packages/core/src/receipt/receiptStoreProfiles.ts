export type ReceiptStoreProfileId =
  | "guven_positional"
  | "ah_scattered"
  | "jumbo_table"
  | "migros_standard"
  | "plus_lidl_table"
  | "action_table"
  | "kruidvat_table"
  | "etos_table"
  | "tesco_table"
  | "carrefour_standard"
  | "turkish_market"
  | "fuel_station"
  | "generic";

export type ReceiptStoreProfile = {
  id: ReceiptStoreProfileId;
  /** Lower runs first when multiple profiles match. */
  priority: number;
  patterns: RegExp[];
  preferPositionalBlock: boolean;
  preferScattered: boolean;
  preferDutchTable: boolean;
};

const RECEIPT_STORE_PROFILES: ReceiptStoreProfile[] = [
  {
    id: "guven_positional",
    priority: 10,
    patterns: [/guven/i, /supermarkt\s*v\b/i, /kassabon/i],
    preferPositionalBlock: true,
    preferScattered: false,
    preferDutchTable: false,
  },
  {
    id: "fuel_station",
    priority: 12,
    patterns: [
      /\bshell\b/i,
      /\bbp\b/i,
      /\btinq\b/i,
      /\btamoil\b/i,
      /\btexaco\b/i,
      /\bomv\b/i,
      /\bq8\b/i,
      /\bavia\b/i,
      /\besso\b/i,
      /\btotal\s*energies?\b/i,
      /\bpetrol\s*ofisi\b/i,
      /\btankstation\b/i,
      /\bpomp\b/i,
      /\bpump\b/i,
      /\blitre\b/i,
      /\bliter\b/i,
    ],
    preferPositionalBlock: false,
    preferScattered: false,
    preferDutchTable: false,
  },
  {
    id: "ah_scattered",
    priority: 20,
    patterns: [/albert\s*hei/i, /\bah\s+diverse/i, /\bah\s+bonus/i],
    preferPositionalBlock: false,
    preferScattered: true,
    preferDutchTable: false,
  },
  {
    id: "jumbo_table",
    priority: 30,
    patterns: [/\bjumbo\b/i],
    preferPositionalBlock: false,
    preferScattered: false,
    preferDutchTable: true,
  },
  {
    id: "migros_standard",
    priority: 30,
    patterns: [/\bmigros\b/i, /\bm\s*jet\b/i],
    preferPositionalBlock: true,
    preferScattered: false,
    preferDutchTable: false,
  },
  {
    id: "turkish_market",
    priority: 32,
    patterns: [
      /\bbim\b/i,
      /\ba101\b/i,
      /\bşok\b/i,
      /\bsok\b/i,
      /\bhakmar\b/i,
      /\bfile\b/i,
      /\bmacro\s*center\b/i,
      /\breal\b/i,
      /\bteb\b/i,
      /\bgenel\s*toplam\b/i,
      /\btarih\b/i,
    ],
    preferPositionalBlock: true,
    preferScattered: false,
    preferDutchTable: false,
  },
  {
    id: "carrefour_standard",
    priority: 25,
    patterns: [/\bcarrefour\b/i, /\bcarrefoursa\b/i],
    preferPositionalBlock: true,
    preferScattered: false,
    preferDutchTable: false,
  },
  {
    id: "tesco_table",
    priority: 35,
    patterns: [/\btesco\b/i, /\bsainsbury/i],
    preferPositionalBlock: false,
    preferScattered: false,
    preferDutchTable: true,
  },
  {
    id: "action_table",
    priority: 38,
    patterns: [/\baction\b/i],
    preferPositionalBlock: false,
    preferScattered: false,
    preferDutchTable: true,
  },
  {
    id: "kruidvat_table",
    priority: 38,
    patterns: [/\bkruidvat\b/i],
    preferPositionalBlock: false,
    preferScattered: false,
    preferDutchTable: true,
  },
  {
    id: "etos_table",
    priority: 38,
    patterns: [/\betos\b/i],
    preferPositionalBlock: false,
    preferScattered: false,
    preferDutchTable: true,
  },
  {
    id: "plus_lidl_table",
    priority: 40,
    patterns: [/\bplus\b/i, /\blidl\b/i, /\baldi\b/i, /\bdirk\b/i, /\bspar\b/i],
    preferPositionalBlock: false,
    preferScattered: false,
    preferDutchTable: true,
  },
];

export function resolveReceiptStoreProfile(
  storeName: string,
  text: string
): ReceiptStoreProfile | null {
  const haystack = `${storeName}\n${text}`.toLowerCase();
  const matches = RECEIPT_STORE_PROFILES.filter((profile) =>
    profile.patterns.some((pattern) => pattern.test(haystack))
  );

  if (matches.length === 0) return null;
  return matches.sort((a, b) => a.priority - b.priority)[0];
}
