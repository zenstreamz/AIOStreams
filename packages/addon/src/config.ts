import { AddonDetail, Config } from '@aiostreams/types';
import { addonDetails, serviceDetails, Settings } from '@aiostreams/utils';

export const allowedFormatters = ['gdrive', 'torrentio', 'torbox'];

export const allowedLanguages = [
  'Multi',
  'English',
  'Japanese',
  'Chinese',
  'Russian',
  'Arabic',
  'Portuguese',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Korean',
  'Hindi',
  'Bengali',
  'Punjabi',
  'Marathi',
  'Gujarati',
  'Tamil',
  'Telugu',
  'Kannada',
  'Malayalam',
  'Thai',
  'Vietnamese',
  'Indonesian',
  'Turkish',
  'Hebrew',
  'Persian',
  'Ukrainian',
  'Greek',
  'Lithuanian',
  'Latvian',
  'Estonian',
  'Polish',
  'Czech',
  'Slovak',
  'Hungarian',
  'Romanian',
  'Bulgarian',
  'Serbian',
  'Croatian',
  'Slovenian',
  'Dutch',
  'Danish',
  'Finnish',
  'Swedish',
  'Norwegian',
  'Malay',
  'Latino',
];

export function validateConfig(config: Config): {
  valid: boolean;
  errorCode: string | null;
  errorMessage: string | null;
} {
  const createResponse = (
    valid: boolean,
    errorCode: string | null,
    errorMessage: string | null
  ) => {
    return { valid, errorCode, errorMessage };
  };

  // check for any duplicate addons where both the ID and options are the same
  const duplicateAddons = config.addons.filter(
    (addon, index) =>
      config.addons.findIndex(
        (a) =>
          a.id === addon.id &&
          JSON.stringify(a.options) === JSON.stringify(addon.options)
      ) !== index
  );

  if (duplicateAddons.length > 0) {
    return createResponse(
      false,
      'duplicateAddons',
      'Duplicate addons found. Please remove any duplicates'
    );
  }

  for (const addon of config.addons) {
    // if torbox addon is enabled, torbox service must be enabled and torbox api key must be set
    if (addon.id === 'torbox') {
      const torboxService = config.services.find(
        (service) => service.id === 'torbox'
      );
      if (!torboxService || !torboxService.enabled) {
        return createResponse(
          false,
          'torboxServiceNotEnabled',
          'Torbox service must be enabled to use the Torbox addon'
        );
      }
      if (!torboxService.credentials.apiKey) {
        return createResponse(
          false,
          'torboxApiKeyNotSet',
          'Torbox API Key must be set to use the Torbox addon'
        );
      }
    }
    const details = addonDetails.find(
      (detail: AddonDetail) => detail.id === addon.id
    );
    if (!details) {
      return createResponse(
        false,
        'invalidAddon',
        `Invalid addon: ${addon.id}`
      );
    }
    if (details.options) {
      for (const option of details.options) {
        if (option.required && !addon.options[option.id]) {
          return createResponse(
            false,
            'missingRequiredOption',
            `Option ${option.label} is required for addon ${addon.id}`
          );
        }

        if (
          option.id.toLowerCase().includes('url') &&
          addon.options[option.id] &&
          addon.options[option.id]?.match(/^E-[0-9a-fA-F]{32}-[0-9a-fA-F]+$/) === null
        ) {
          try {
            new URL(addon.options[option.id] as string);
          } catch (_) {
            return createResponse(
              false,
              'invalidUrl',
              `Invalid URL for ${option.label}`
            );
          }
        }

        if (option.type === 'number' && addon.options[option.id]) {
          const input = addon.options[option.id];
          if (input !== undefined && !parseInt(input)) {
            return createResponse(
              false,
              'invalidNumber',
              `${option.label} must be a number`
            );
          } else if (input !== undefined) {
            const value = parseInt(input);
            const { min, max } = option.constraints || {};
            if (
              (min !== undefined && value < min) ||
              (max !== undefined && value > max)
            ) {
              return createResponse(
                false,
                'invalidNumber',
                `${option.label} must be between ${min} and ${max}`
              );
            }
          }
        }
      }
    }
  }

  if (!allowedFormatters.includes(config.formatter)) {
    if (config.formatter === 'custom') {
      if (!config.customFormatter) {
        return createResponse(
          false,
          'missingCustomFormatter',
          'Custom formatter is required if custom formatter is selected'
        );
      }
    } else {
      return createResponse(
        false,
        'invalidFormatter',
        `Invalid formatter: ${config.formatter}`
      );
    }
  }
  for (const service of config.services) {
    if (service.enabled) {
      const serviceDetail = serviceDetails.find(
        (detail) => detail.id === service.id
      );
      if (!serviceDetail) {
        return createResponse(
          false,
          'invalidService',
          `Invalid service: ${service.id}`
        );
      }
      for (const credential of serviceDetail.credentials) {
        if (!service.credentials[credential.id]) {
          return createResponse(
            false,
            'missingCredential',
            `${credential.label} is required for ${service.name}`
          );
        }
      }
    }
  }

  // need at least one visual tag, resolution, quality

  if (
    !config.visualTags.some((tag) => Object.values(tag)[0]) ||
    !config.resolutions.some((resolution) => Object.values(resolution)[0]) ||
    !config.qualities.some((quality) => Object.values(quality)[0])
  ) {
    return createResponse(
      false,
      'noFilters',
      'At least one visual tag, resolution, and quality must be selected'
    );
  }

  for (const [min, max] of [
    [config.minMovieSize, config.maxMovieSize],
    [config.minEpisodeSize, config.maxEpisodeSize],
    [config.minSize, config.maxSize],
  ]) {
    if (min && max) {
      if (min >= max) {
        return createResponse(
          false,
          'invalidSizeRange',
          "Your minimum size limit can't be greater than or equal to your maximum size limit"
        );
      }
    }
  }

  if (config.addons.length < 1) {
    return createResponse(
      false,
      'noAddons',
      'At least one addon must be selected'
    );
  }

  if (config.addons.length > Settings.MAX_ADDONS) {
    return createResponse(
      false,
      'tooManyAddons',
      `You can only select a maximum of ${Settings.MAX_ADDONS} addons`
    );
  }

  if (config.maxResultsPerResolution && config.maxResultsPerResolution < 1) {
    return createResponse(
      false,
      'invalidMaxResultsPerResolution',
      'Max results per resolution must be greater than 0'
    );
  }

  return createResponse(true, null, null);
}
