import { Config, ParsedStream } from '@aiostreams/types';
import { formatSize } from './utils';
import { serviceDetails } from '@aiostreams/wrappers';
import { languageToEmoji } from './utils';

/*
{
    splitter: string; // e.g. ' - ', ' | ' etc. the string used to split the tags
    // we need to have a key for where the value has to be determined from the stream data.
    // examples of this is provider and seedersOrAge. provider.cached has different states and seedersOrAge has different states
    
    // available values:
    // {resolution}, {quality}, {streamType} {encode}, {visualTags}, {audioTags}, {languages}, {provider}, {seedersOrAge}, {filename}, {size}, {addonName}, {seedersOrAge}
    languages: {
      useEmojis: boolean; // e.g. 🇬🇧
    }
    hideIfUnknown: boolean; // if true, the tag will not be shown if the value is unknown
    provider: {
      trueCacheStatus: string; // e.g. ⚡️
      falseCacheStatus: string; // e.g. ⏳
      undefinedCacheStatus: string; // e.g. ❓
      finalString: string; // e.g. [{providerShortName}{cacheStatus}]  ->  [TB⚡️] or this could be left empty
    }
    streamType: {
      torrent: string; // e.g. 🧲
      usenet: string; // e.g. 📡
      direct: string; // e.g. 📥
      unknown: string; // e.g. ❓
      finalString: string; // e.g. {streamType}  ->  🧲
    }
    seedersOrAge: {
      whenSeeders: string; // e.g. 👤 
      whenAge: string; // e.g. 📅 
      finalString: string; // e.g. {seedersOrAge} {seedersOrAgeValue}
    }
    name: string; 
    description: string;
  }
*/

export function customFormat(stream: ParsedStream, customFormatter: Config['customFormatter']): {
  name: string;
  description: string;
} {

    if (!customFormatter) {
        throw new Error('Custom formatter not provided');
    }
    let name: string = customFormatter.name;
    let description: string = customFormatter.description;



    if (stream.provider) {
        const cacheStatus = stream.provider.cached
          ? customFormatter.provider.trueCacheStatus
          : stream.provider.cached === undefined
          ? customFormatter.provider.undefinedCacheStatus
          : customFormatter.provider.falseCacheStatus;

        name = name.replace('{provider}', customFormatter.provider.finalString.replace('{cacheStatus}', cacheStatus).replace('{providerShortName}', stream.provider.name));
        description = description.replace('{provider}', customFormatter.provider.finalString.replace('{cacheStatus}', cacheStatus).replace('{providerShortName}', stream.provider.name));
    }

    if (stream.torrent?.infoHash) {
        name = name.replace('{streamType}', customFormatter.streamType.torrent);
        description = description.replace('{streamType}', customFormatter.streamType.torrent);
    }

    if (stream.usenet) {
        name = name.replace('{streamType}', customFormatter.streamType.usenet);
        description = description.replace('{streamType}', customFormatter.streamType.usenet);
    }

    if (stream.url) {
        name = name.replace('{streamType}', customFormatter.streamType.direct);
        description = description.replace('{streamType}', customFormatter.streamType.direct);
    }

    if (!stream.torrent && !stream.usenet && !stream.url) {
        name = name.replace('{streamType}', customFormatter.streamType.unknown);
        description = description.replace('{streamType}', customFormatter.streamType.unknown);
    }

    name = name.replace('{addonName}', stream.addonName);
    name = name.replace('{resolution}', stream.resolution);
    name = name.replace('{quality}', stream.quality);
    name = name.replace('{encode}', stream.encode);
    name = name.replace('{visualTags}', stream.visualTags.join(customFormatter.splitter));
    name = name.replace('{audioTags}', stream.audioTags.join(customFormatter.splitter));
    name = name.replace('{filename}', stream.filename || 'Unknown Name');
    name = name.replace('{size}', formatSize(stream.size || 0));
    name = name.replace(/\\n/g, '\n');

    description = description.replace('{addonName}', stream.addonName);
    description = description.replace('{resolution}', stream.resolution);
    description = description.replace('{quality}', stream.quality);
    description = description.replace('{encode}', stream.encode);
    description = description.replace('{visualTags}', stream.visualTags.join(customFormatter.splitter));
    description = description.replace('{audioTags}', stream.audioTags.join(customFormatter.splitter));
    description = description.replace('{filename}', stream.filename || 'Unknown Name');
    description = description.replace('{size}', formatSize(stream.size || 0));
    description = description.replace(/\\n/g, '\n');

    if (stream.torrent?.seeders) {
        const seedersStr = customFormatter.seedersOrAge.finalString.replace('{seedersOrAge}', customFormatter.seedersOrAge.whenSeeders).replace('{seedersOrAgeValue}', stream.torrent.seeders.toString());
        name = name.replace('{seedersOrAge}', seedersStr);
        description = description.replace('{seedersOrAge}', seedersStr);
    } else {
        name = name.replace('{seedersOrAge}', '');
        description = description.replace('{seedersOrAge}', '');
    }

    if (stream.usenet?.age) {
        const ageStr = customFormatter.seedersOrAge.finalString.replace('{seedersOrAge}', customFormatter.seedersOrAge.whenAge).replace('{seedersOrAgeValue}', stream.usenet.age);
        name = name.replace('{seedersOrAge}', ageStr);
        description = description.replace('{seedersOrAge}', ageStr);
    } else {
        name = name.replace('{seedersOrAge}', '');
        description = description.replace('{seedersOrAge}', '');
    }


    if (customFormatter.languages.useEmojis) {
        description = description.replace('{languages}', stream.languages.map((lang) => {
            const emoji = languageToEmoji(lang);
            return emoji ? emoji : lang;
        }).join(customFormatter.splitter));
        name = name.replace('{languages}', stream.languages.map((lang) => {
            const emoji = languageToEmoji(lang);
            return emoji ? emoji : lang;
        }).join(customFormatter.splitter));
    } else {
        description = description.replace('{languages}', stream.languages.join(customFormatter.splitter));
        name = name.replace('{languages}', stream.languages.join(customFormatter.splitter));
    }

    return {name, description}
}