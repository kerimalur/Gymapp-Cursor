const GERMAN_CHARACTER_MAP: Array<[RegExp, string]> = [
  [/\u00c4/g, 'Ae'],
  [/\u00d6/g, 'Oe'],
  [/\u00dc/g, 'Ue'],
  [/\u00e4/g, 'ae'],
  [/\u00f6/g, 'oe'],
  [/\u00fc/g, 'ue'],
  [/\u00df/g, 'ss'],
];

export function transliterateGermanText(input: string): string {
  return GERMAN_CHARACTER_MAP.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    input
  );
}

export function normalizeSearchText(input: string): string {
  return transliterateGermanText(input)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function formatCountLabel(
  count: number,
  singular: string,
  plural: string = `${singular}e`
): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
