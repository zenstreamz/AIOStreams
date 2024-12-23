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

export interface Config {
  resolutions: string[];
  qualities: string[];
  visualTags: string[];
  sortBy: string[];
  onlyShowCachedStreams: boolean;
  prioritiseLanguage: string | null;
  addons: string[];
  formatter: string;
  apiKeys: {
    realDebrid?: string;
    torbox?: string;
    debridLink?: string;
    allDebrid?: string;
    premiumize?: string;
    offcloud?: string;
    putIo?: string;
  };
}
