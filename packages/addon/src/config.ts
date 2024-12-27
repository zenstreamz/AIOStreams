import { Config } from '@aiostreams/types';
import { AddonDetail } from '@aiostreams/types';

export const allowedFormatters = ['gdrive', 'torrentio', 'torbox'];

export const MAX_ADDONS = 10;
export const MAX_SIZE = 150000000000; // 1500GB

export const addonDetails: AddonDetail[] = [
  {
    name: 'Torrentio',
    id: 'torrentio',
    options: [
      {
        id: 'overrideUrl',
        required: false,
        label: 'Override URL',
        description:
          'Override the URL used to fetch streams from the torrentio addon',
        type: 'text',
      },
      {
        id: 'useMultipleInstances',
        required: false,
        label: 'Use Multiple Instances',
        description:
          'Use multiple instances of the torrentio addon to fetch streams when using multiple services',
        type: 'checkbox',
      },
      {
        id: 'indexerTimeout',
        required: false,
        label: 'Override Indexer Timeout',
        description: 'The timeout for fetching streams from the Torrentio addon',
        type: 'number',
        constraints: {
          min: 1000,
          max: 20000
        }
      }
    ],
  },
  {
    name: 'Torbox',
    id: 'torbox',
    options: [
      {
        id: 'indexerTimeout',
        required: false,
        label: 'Override Indexer Timeout',
        description: 'The timeout for fetching streams from the Torbox addon in milliseconds',
        type: 'number',
        constraints: {
          min: 1000,
          max: 20000
        }
      }
    ],
  },
  {
    name: 'Google Drive (Viren070)',
    id: 'gdrive',
    options: [
      {
        id: 'addonUrl',
        required: true,
        label: 'Addon URL',
        description: 'The URL of the Google Drive addon',
        type: 'text',
      },
      {
        id: 'indexerTimeout',
        required: false,
        label: 'Override Indexer Timeout',
        description: 'The timeout for fetching streams from the Google Drive addon in milliseconds',
        type: 'number',
        constraints: {
          min: 1000,
          max: 20000
        }
      }
    ],
  },
  {
    name: 'Custom',
    id: 'custom',
    options: [
      {
        id: 'url',
        required: true,
        description: 'The URL of the custom addon',
        label: 'URL',
        type: 'text',
      },
      {
        id: 'name',
        required: true,
        description: 'The name of the custom addon',
        label: 'Name',
        type: 'text',
      },
      {
        id: 'indexerTimeout',
        required: false,
        label: 'Override Indexer Timeout',
        description: 'The timeout for fetching streams from the custom addon in milliseconds',
        type: 'number',
        constraints: {
          min: 1000,
          max: 20000
        }
      }
    ],
  },
];

export const allowedLanguages = [
  'English',
  'Spanish',
  'French',
  'German',
  'Chinese',
];

export const serviceCredentials = [
  {
    name: 'Real Debrid',
    id: 'realdebrid',
    credentials: [
      {
        label: 'API Key',
        id: 'apiKey',
        link: 'https://real-debrid.com/apitoken',
      },
    ],
  },
  {
    name: 'All Debrid',
    id: 'alldebrid',
    credentials: [
      {
        label: 'API Key',
        id: 'apiKey',
        link: 'https://alldebrid.com/apikeys',
      },
    ],
  },
  {
    name: 'Premiumize',
    id: 'premiumize',
    credentials: [
      {
        label: 'API Key',
        id: 'apiKey',
        link: 'https://www.premiumize.me/account',
      },
    ],
  },
  {
    name: 'Debrid Link',
    id: 'debridlink',
    credentials: [
      {
        label: 'API Key',
        id: 'apiKey',
        link: 'https://debrid-link.com/webapp/apikey',
      },
    ],
  },
  {
    name: 'Torbox',
    id: 'torbox',
    credentials: [
      {
        label: 'API Key',
        id: 'apiKey',
        link: 'https://torbox.app/settings',
      },
    ],
  },
  {
    name: 'Offcloud',
    id: 'offcloud',
    credentials: [
      {
        label: 'API Key',
        id: 'apiKey',
        link: 'https://offcloud.com/#/account',
      },
    ],
  },
  {
    name: 'put.io',
    id: 'putio',
    credentials: [
      {
        label: 'Client ID',
        id: 'clientId',
        link: 'https://put.io/oauth',
      },
      {
        label: 'Token',
        id: 'token',
        link: 'https://put.io/oauth',
      },
    ],
  },
  {
    name: 'Easynews',
    id: 'easynews',
    credentials: [
      {
        label: 'Username',
        id: 'username',
        link: 'https://www.easynews.com/',
      },
      {
        label: 'Password',
        id: 'password',
        link: 'https://www.easynews.com/',
      },
    ],
  },
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
    const details = addonDetails.find((detail) => detail.id === addon.id);
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
          addon.options[option.id]
        ) {
          console.log('checking url', addon.options[option.id]);
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
          if (typeof addon.options[option.id] !== 'number') {
            return createResponse(
              false,
              'invalidNumber',
              `${option.label} must be a number`
            );
          }

          if (option.constraints) {
            if (
              option.constraints.min !== undefined &&
              addon.options[option.id] as number < option.constraints.min
            ) {
              return createResponse(
                false,
                'invalidNumber',
                `${option.label} must be greater than or equal to ${option.constraints.min}`
              );
            }
            if (
              option.constraints.max !== undefined &&
              addon.options[option.id] as number > option.constraints.max
            ) {
              return createResponse(
                false,
                'invalidNumber',
                `${option.label} must be less than or equal to ${option.constraints.max}`
              );
            }
          }
        }
      }
    }
  }

  if (!allowedFormatters.includes(config.formatter)) {
    return createResponse(
      false,
      'invalidFormatter',
      `Invalid formatter: ${config.formatter}`
    );
  }

  for (const service of config.services) {
    if (service.enabled) {
      const serviceDetail = serviceCredentials.find(
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

  if (config.minSize && config.maxSize) {
    if (config.minSize >= config.maxSize) {
      return createResponse(
        false,
        'invalidSizeRange',
        "Your minimum size limit can't be greater than or equal to your maximum size limit"
      );
    }
  }

  if (config.addons.length < 1) {
    return createResponse(
      false,
      'noAddons',
      'At least one addon must be selected'
    );
  }

  if (config.addons.length > MAX_ADDONS) {
    return createResponse(
      false,
      'tooManyAddons',
      `You can only select a maximum of ${MAX_ADDONS} addons`
    );
  }

  return createResponse(true, null, null);
}
