import { BaseWrapper, Torbox, Torrentio } from '@aiostreams/wrappers';
import { Stream, ParsedStream, StreamRequest, Config } from '@aiostreams/types';
import { gdriveFormat, torrentioFormat } from '@aiostreams/formatters';

export class AIOStreams {
  private config: Config;

  constructor(config: any) {
    this.config = config;
    this.configValidator();
  }

  private configValidator() {
    if (!this.config) {
      throw new Error('No config provided');
    }
    if (!this.config.resolutions) {
      throw new Error('No resolutions provided');
    }
    if (!this.config.qualities) {
      throw new Error('No qualities provided');
    }
    if (!this.config.visualTags) {
      throw new Error('No visualTags provided');
    }
  }

  public async getStreams(streamRequest: StreamRequest): Promise<Stream[]> {
    const streams: Stream[] = [];

    const parsedStreams = await this.getParsedStreams(streamRequest);
    console.log(`Got ${parsedStreams.length} streams`);

    const filteredResults = parsedStreams.filter(
      (parsedStream) => {
        const resolutionFilter = this.config.resolutions.find(
          (resolution) => resolution[parsedStream.resolution]
        );
        if (!resolutionFilter) return false;

        const qualityFilter = this.config.qualities.find(
          (quality) => quality[parsedStream.quality]
        );
        if (!qualityFilter) return false;

        const visualTagFilter = parsedStream.visualTags.some(
          (tag) => !this.config.visualTags.find((t) => t[tag])
        );
        if (visualTagFilter) return false;

        if (
          this.config.onlyShowCachedStreams &&
          parsedStream.provider &&
          !parsedStream.provider.cached
        )
          return false;

        if (this.config.minSize && parsedStream.size && parsedStream.size < this.config.minSize)
          return false;

        if (this.config.maxSize && parsedStream.size && parsedStream.size > this.config.maxSize)
          return false;


        return true;
      }
    );
    console.log(`Filtered to ${filteredResults.length} streams`);
    // Apply sorting

    // initially sort by filename
    filteredResults.sort((a, b) => a.filename.localeCompare(b.filename));

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
        videoSize: Math.floor(parsedStream.size || 0),
        filename: parsedStream.filename,
        bingeGroup: `${parsedStream.addonName}|${combinedTags.join('|')}`,
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
    }
    return 0;
  }

  private async getParsedStreams(
    streamRequest: StreamRequest
  ): Promise<ParsedStream[]> {
    const parsedStreams: ParsedStream[] = [];
    for (const addon of this.config.addons) {
      switch (addon.id) {
        case 'gdrive': {
          break;
        }
        case 'torbox': {
          try {
            const torboxService = this.config.services.find( service => service.id === 'torbox');
           
            if (!torboxService) {
              console.error('No torbox service found');
              break;
            }
            const torboxApiKey = torboxService.credentials.find(cred => cred.id === 'apiKey')?.value;
            if (!torboxApiKey) {
              console.error('No torbox api key found');
              break;
            }
            const wrapper = new Torbox(torboxApiKey);
            const streams = await wrapper.getParsedStreams(streamRequest);
            console.log(`Got streams from ${addon.id}: ${streams.length}`);
            parsedStreams.push(...streams);
          } catch (e) {
            console.error(`Error getting streams from ${addon.id}: ${e}`);
          }
          break;
        }
        case 'torrentio': {
          try {
            if (addon.options.useMultipleInstances) {
              for (const service of this.config.services) {
                if (!service.enabled) {
                  continue;
                }
                const wrapper = new Torrentio([service]);
                const streams = await wrapper.getParsedStreams(streamRequest);
                console.log(`Got streams from ${addon.id}: ${streams.length}`);
                parsedStreams.push(...streams);
              }
            } else {
              const wrapper = new Torrentio(this.config.services, addon.options.overrideUrl);
              const streams = await wrapper.getParsedStreams(streamRequest);
              console.log(`Got streams from ${addon.id}: ${streams.length}`);
              parsedStreams.push(...streams);
            }
          } catch (e) {
            console.error(`Error getting streams from ${addon.id}: ${e}`);
          }
          break;
        }

        default: {
          try {
            const wrapper = new BaseWrapper('unknown', addon.options.addonUrl);
            const streams = await wrapper.getParsedStreams(streamRequest);
            console.log(`Got streams from ${addon.id}: ${streams.length}`);

            parsedStreams.push(...streams);
          } catch (e) {
            console.error(`Error getting streams from ${addon.id}: ${e}`);
          }
        }
      }
    }
    return parsedStreams;
  }

}
