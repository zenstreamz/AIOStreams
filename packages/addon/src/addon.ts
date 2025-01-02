import {
  BaseWrapper,
  getCometStreams,
  getMediafusionStreams,
  getTorboxStreams,
  getTorrentioStreams,
} from '@aiostreams/wrappers';
import { Stream, ParsedStream, StreamRequest, Config, CollectedParsedStreams } from '@aiostreams/types';
import {
  gdriveFormat,
  torrentioFormat,
  torboxFormat
} from '@aiostreams/formatters';

export class AIOStreams {
  private config: Config;

  constructor(config: any) {
    this.config = config;
  }

  public async getStreams(streamRequest: StreamRequest): Promise<Stream[]> {
    const streams: Stream[] = [];

    const parsedStreams = await this.getParsedStreams(streamRequest);
    console.log(`Got ${parsedStreams.length} streams`);

    const filteredResults = parsedStreams.filter((parsedStream) => {
      const resolutionFilter = this.config.resolutions.find(
        (resolution) => resolution[parsedStream.resolution]
      );
      if (!resolutionFilter) return false;

      const qualityFilter = this.config.qualities.find(
        (quality) => quality[parsedStream.quality]
      );
      if (!qualityFilter) return false;

      const visualTagFilter = parsedStream.visualTags.find(
        (tag) => !this.config.visualTags.some((visualTag) => visualTag[tag])
      );
      if (visualTagFilter) return false;

      const audioTagFilter = parsedStream.audioTags.find(
        (tag) => !this.config.audioTags.some((audioTag) => audioTag[tag])
      );
      if (audioTagFilter) return false;

      if (
        parsedStream.encode &&
        !this.config.encodes.some((encode) => encode[parsedStream.encode])
      )
        return false;

      if (
        this.config.onlyShowCachedStreams &&
        parsedStream.provider &&
        !parsedStream.provider.cached
      )
        return false;

      if (
        this.config.minSize &&
        parsedStream.size &&
        parsedStream.size < this.config.minSize
      )
        return false;

      if (
        this.config.maxSize &&
        parsedStream.size &&
        parsedStream.size > this.config.maxSize
      )
        return false;

      if (
        streamRequest.type === 'movie' &&
        this.config.maxMovieSize &&
        parsedStream.size && 
        parsedStream.size > this.config.maxMovieSize
      )
        return false;

      if (
        streamRequest.type === 'movie' &&
        this.config.minMovieSize &&
        parsedStream.size && 
        parsedStream.size < this.config.minMovieSize
      )
        return false;

      if (
        streamRequest.type === 'series' &&
        this.config.maxEpisodeSize &&
        parsedStream.size && 
        parsedStream.size > this.config.maxEpisodeSize
      )
        return false;
      
      if (
        streamRequest.type === 'series' &&
        this.config.minEpisodeSize &&
        parsedStream.size && 
        parsedStream.size < this.config.minEpisodeSize
      )
        return false;
      

      return true;
    });
    console.log(`Filtered to ${filteredResults.length} streams`);
    // Apply sorting

    // initially sort by filename to ensure consistent results
    filteredResults.sort((a, b) => a.filename && b.filename ? a.filename.localeCompare(b.filename) : 0);

    // then apply our this.config sorting
    filteredResults.sort((a, b) => {
      const languageComparison = this.compareLanguages(a, b);
      if (languageComparison !== 0) return languageComparison;

      for (const sortByField of this.config.sortBy) {
        const field = Object.keys(sortByField)[0];
        const value = sortByField[field];

        if (value) {
          const fieldComparison = this.compareByField(a, b, field);
          if (fieldComparison !== 0) return fieldComparison;
        }
      }

      return 0;
    });

    console.log('Sorted streams');

    // Create stream objects
    filteredResults.map((parsedStream) => {
      streams.push(this.createStreamObject(parsedStream));
    });

    console.log('Created stream objects');
    return streams;
  }

  private createStreamObject(parsedStream: ParsedStream): Stream {
    let name: string = '';
    let description: string = '';
    switch (this.config.formatter) {
      case 'gdrive': {
        const { name: _name, description: _description } =
          gdriveFormat(parsedStream);
        name = _name;
        description = _description;
        break;
      }
      case 'torrentio': {
        const { name: _name, description: _description } =
          torrentioFormat(parsedStream);
        name = _name;
        description = _description;
        break;
      }
      case 'torbox': {
        const { name: _name, description: _description } =
          torboxFormat(parsedStream);
        name = _name;
        description = _description;
        break;
      }
      default: {
        throw new Error('Unsupported formatter');
      }
    }

    const combinedTags = [
      parsedStream.resolution,
      parsedStream.quality,
      parsedStream.encode,
      ...parsedStream.visualTags,
      ...parsedStream.audioTags,
      ...parsedStream.languages,
    ];

    let stream: Stream;

    stream = {
      url: parsedStream.url,
      externalUrl: parsedStream.externalUrl,
      infoHash: parsedStream.torrent?.infoHash,
      fileIdx: parsedStream.torrent?.fileIdx,
      name: name,
      description: description,
      subtitles: parsedStream.stream?.subtitles,
      sources: parsedStream.torrent?.sources,
      behaviorHints: {
        videoSize: Math.floor(parsedStream.size || 0) || undefined,
        filename: parsedStream.filename,
        bingeGroup: `${parsedStream.addon.name}|${combinedTags.join('|')}`,
        proxyHeaders: parsedStream.stream?.behaviorHints?.proxyHeaders,
        notWebReady: parsedStream.stream?.behaviorHints?.notWebReady,
      },
    };

    return stream;
  }

  private compareLanguages(a: ParsedStream, b: ParsedStream) {
    if (this.config.prioritiseLanguage) {
      const aHasPrioritisedLanguage = a.languages.includes(
        this.config.prioritiseLanguage
      );
      const bHasPrioritisedLanguage = b.languages.includes(
        this.config.prioritiseLanguage
      );
      const aHasMultiLanguage = a.languages.includes('Multi');
      const bHasMultiLanguage = b.languages.includes('Multi');

      if (aHasPrioritisedLanguage && !bHasPrioritisedLanguage) return -1;
      if (!aHasPrioritisedLanguage && bHasPrioritisedLanguage) return 1;

      if (aHasMultiLanguage && !bHasMultiLanguage) return -1;
      if (!aHasMultiLanguage && bHasMultiLanguage) return 1;
    }
    return 0;
  }

  private compareByField(a: ParsedStream, b: ParsedStream, field: string) {
    if (field === 'resolution') {
      return (
        this.config.resolutions.findIndex(
          (resolution) => resolution[a.resolution]
        ) -
        this.config.resolutions.findIndex(
          (resolution) => resolution[b.resolution]
        )
      );
    } else if (field === 'cached') {
      let aCanbeCached = a.provider;
      let bCanbeCached = b.provider;
      let aCached = a.provider?.cached;
      let bCached = b.provider?.cached;

      // prioritise non debrid/usenet p2p over uncached
      if (aCanbeCached && !bCanbeCached && !aCached) return 1;
      if (!aCanbeCached && bCanbeCached && !bCached) return -1;
      if (aCanbeCached && bCanbeCached) {
        if (aCached === bCached) return 0;
        // prioritise a false value over undefined
        if (aCached === false && bCached === undefined) return -1;
        if (aCached === undefined && bCached === false) return 1;
        return aCached ? -1 : 1;
      }
    } else if (field === 'hasProvider') {
      // files from a provider should be prioritised and then
      let aHasProvider = a.provider;
      let bHasProvider = b.provider;
      if (aHasProvider && !bHasProvider) return -1;
      if (!aHasProvider && bHasProvider) return 1;
    } else if (field === 'provider') {
      // sort files with providers by name
      let aProvider = a.provider?.name;
      let bProvider = b.provider?.name;

      if (aProvider && bProvider) {
        return aProvider.localeCompare(bProvider);
      }
    } else if (field === 'size') {
      return (b.size || 0) - (a.size || 0);
    } else if (field === 'seeders') {
      if (a.torrent?.seeders && b.torrent?.seeders) {
        return b.torrent.seeders - a.torrent.seeders;
      }
    } else if (field === 'quality') {
      return (
        this.config.qualities.findIndex((quality) => quality[a.quality]) -
        this.config.qualities.findIndex((quality) => quality[b.quality])
      );
    } else if (field === 'visualTag') {
      // Find the highest priority visual tag in each file
      const getIndexOfTag = (tag: string) =>
        tag.startsWith('HDR')
          ? this.config.visualTags.findIndex((t) => t['HDR10+'])
          : this.config.visualTags.findIndex((t) => t[tag]);
      const aVisualTagIndex = a.visualTags.reduce(
        (minIndex, tag) => Math.min(minIndex, getIndexOfTag(tag)),
        this.config.visualTags.length
      );

      const bVisualTagIndex = b.visualTags.reduce(
        (minIndex, tag) => Math.min(minIndex, getIndexOfTag(tag)),
        this.config.visualTags.length
      );
      // Sort by the visual tag index
      return aVisualTagIndex - bVisualTagIndex;
    } else if (field === 'audioTag') {
      // Find the highest priority audio tag in each file
      const getIndexOfTag = (tag: string) =>
        this.config.audioTags.findIndex((t) => t[tag]);
      const aAudioTagIndex = a.audioTags.reduce(
        (minIndex, tag) => Math.min(minIndex, getIndexOfTag(tag)),
        this.config.audioTags.length
      );

      const bAudioTagIndex = b.audioTags.reduce(
        (minIndex, tag) => Math.min(minIndex, getIndexOfTag(tag)),
        this.config.audioTags.length
      );
      // Sort by the audio tag index
      return aAudioTagIndex - bAudioTagIndex;
    } else if (field === 'encode') {
      return (
        this.config.encodes.findIndex((encode) => encode[a.encode]) -
        this.config.encodes.findIndex((encode) => encode[b.encode])
      );
    } else if (field === 'addon') {
      const aAddon = a.addon.id;
      const bAddon = b.addon.id;

      const addonIds = this.config.addons.map((addon) => {
        return `${addon.id}-${JSON.stringify(addon.options)}`;
      });
      return addonIds.indexOf(aAddon) - addonIds.indexOf(bAddon);
    }
    return 0;
  }

  private async getParsedStreams(
    streamRequest: StreamRequest
  ): Promise<ParsedStream[]> {
    const parsedStreams: ParsedStream[] = [];
    for (const addon of this.config.addons) {
      try {
        const addonId = `${addon.id}-${JSON.stringify(addon.options)}`;
        const streams = await this.getStreamsFromAddon(addon, addonId, streamRequest);
        parsedStreams.push(...streams);
      } catch (error) {
        console.error(`Failed to get streams from addon ${addon.id}: ${error}`);
      }
    }
    return parsedStreams;
  }

  private async getStreamsFromAddon(
    addon: Config['addons'][0],
    addonId: string,
    streamRequest: StreamRequest
  ): Promise<ParsedStream[]> {


    switch (addon.id) {
      case 'torbox': {
        return await getTorboxStreams(this.config, addon.options, streamRequest, addonId);
      }
      case 'torrentio': {
        return await getTorrentioStreams(
          this.config,
          addon.options,
          streamRequest,
          addonId
        );
      }
      case 'comet': {
        return await getCometStreams(this.config, addon.options, streamRequest, addonId);
      }
      case 'mediafusion': {
        return await getMediafusionStreams(
          this.config,
          addon.options,
          streamRequest,
          addonId
        );
      }
      case 'gdrive': {
        if (!addon.options.addonUrl) {
          throw new Error('The addon URL was undefined for GDrive');
        }
        const wrapper = new BaseWrapper(
          addon.options.overrideName || 'GDrive',
          addon.options.addonUrl,
          addon.options.indexerTimeout ? parseInt(addon.options.indexerTimeout) : undefined,
          addonId
        );
        return await wrapper.getParsedStreams(streamRequest);
      }
      default: {
        if (!addon.options.url) {
          throw new Error(`The addon URL was undefined for ${addon.options.name}`);
        }
        console.log(
          `Using base wrapper for addon ${addon.options.name} with url ${addon.options.url}`
        );
        const wrapper = new BaseWrapper(addon.options.name || 'Custom', addon.options.url.trim(), addon.options.indexerTimeout ? parseInt(addon.options.indexerTimeout) : undefined, addonId);
        return await wrapper.getParsedStreams(streamRequest);
      }
    }
  }
}
