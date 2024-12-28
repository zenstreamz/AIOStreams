import { ParsedNameData } from '@aiostreams/types';
import { PARSE_REGEX } from './regex';

const DEFAULT_RESOLUTION = 'Unknown';
const DEFAULT_QUALITY = 'Unknown';

function matchPattern(
  filename: string,
  patterns: Record<string, RegExp>
): string {
  return (
    Object.entries(patterns).find(([_, pattern]) =>
      pattern.test(filename)
    )?.[0] ?? 'Unknown'
  );
}

function matchMultiplePatterns(
  filename: string,
  patterns: Record<string, RegExp>
): string[] {
  return Object.entries(patterns)
    .filter(([_, pattern]) => pattern.test(filename))
    .map(([tag]) => tag);
}

export function parseFilename(filename: string): ParsedNameData {
  const resolution =
    matchPattern(filename, PARSE_REGEX.resolutions) || DEFAULT_RESOLUTION;
  const quality =
    matchPattern(filename, PARSE_REGEX.qualities) || DEFAULT_QUALITY;
  const visualTags = matchMultiplePatterns(filename, PARSE_REGEX.visualTags);
  const audioTags = matchMultiplePatterns(filename, PARSE_REGEX.audioTags);
  const encode = matchPattern(filename, PARSE_REGEX.encodes);
  const languages = matchMultiplePatterns(filename, PARSE_REGEX.languages);

  return {
    resolution,
    quality,
    languages,
    encode,
    audioTags,
    visualTags,
  };
}
