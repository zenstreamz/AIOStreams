// the data that is parsed from a filename
export interface ParsedNameData {
  resolution: string;
  quality: string;
  encode: string;
  visualTags: string[];
  audioTags: string[];
  languages: string[];
}

// the parsed stream data which is to be used to create the final stream object
export interface ParsedStream extends ParsedNameData {
  addonName: string;
  filename: string;
  size?: number;
  provider?: {
    name: string;
    cached: boolean;
  };
  torrent?: {
    infoHash?: string;
    fileIdx?: number;
    seeders?: number;
    sources?: string[];
  };
  usenet?: {
    age?: number;
  };
  url?: string;
  externalUrl?: string;
  indexers?: string;
  stream?: {
    subtitles?: Subtitle[];
    behaviorHints?: {
      countryWhitelist?: string[];
      notWebReady?: boolean;
      proxyHeaders?: {
        request?: { [key: string]: string };
        response?: { [key: string]: string };
      };
      videoHash?: string;
    };
  };
}

export interface Stream {
  url?: string;
  externalUrl?: string;
  infoHash?: string;
  fileIdx?: number;
  name?: string;
  title?: string;
  description?: string;
  subtitles?: Subtitle[];
  sources?: string[];
  behaviorHints?: {
    countryWhitelist?: string[];
    notWebReady?: boolean;
    bingeGroup?: string;
    proxyHeaders?: {
      request?: { [key: string]: string };
      response?: { [key: string]: string };
    };
    videoHash?: string;
    videoSize?: number;
    filename?: string;
  };
}

export interface Subtitle {
  id: string;
  url: string;
  lang: string;
}

interface MovieRequest {
  id: string;
  type: 'movie';
}

interface SeriesRequest {
  id: string;
  type: 'series';
  season: string;
  episode: string;
}

export type StreamRequest = MovieRequest | SeriesRequest;

export type Resolution = { [key: string]: boolean };
export type Quality = { [key: string]: boolean };
export type VisualTag = { [key: string]: boolean };
export type SortBy = { [key: string]: boolean };

export interface Config {
  resolutions: Resolution[];
  qualities: Quality[];
  visualTags: VisualTag[];
  sortBy: SortBy[];
  onlyShowCachedStreams: boolean;
  prioritiseLanguage: string | null;
  formatter: string;
  maxSize: number | null;
  minSize: number | null;
  addons: {
    id: string;
    options: { [key: string]: string };
  }[];
  services: {
    name: string;
    id: string;
    enabled: boolean;
    credentials: { [key: string]: string };
  }[];
}

export interface AddonDetail {
  name: string;
  id: string;
  options?: {
    id: string;
    required?: boolean;
    label: string;
    description?: string;
    type: 'text' | 'checkbox';
  }[];
}

