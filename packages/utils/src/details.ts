import { AddonDetail } from '@aiostreams/types';
import {Settings} from './settings';


export const addonDetails: AddonDetail[] = [
  {
    name: 'Torrentio',
    id: 'torrentio',
    requiresService: false,
    supportedServices: [
      'realdebrid',
      'alldebrid',
      'premiumize',
      'debridlink',
      'torbox',
      'offcloud',
      'putio',
    ],
    options: [
      {
        id: 'overrideName',
        required: false,
        label: 'Override Addon Name',
        description:
          'Override the name of the Torrentio addon that shows up in the results',
        type: 'text',
      },
      {
        id: 'overrideUrl',
        required: false,
        label: 'Override URL',
        description:
          'Override the URL used to fetch streams from the torrentio addon. This option is incompatible with the useMultipleInstances option. By default, the URL is generated based on the selected services and their credentials. Use this option to override the URL with a custom URL.',
        type: 'text',
      },
      {
        id: 'useMultipleInstances',
        required: false,
        label: 'Use Multiple Instances',
        description:
          'Use multiple instances of the torrentio addon to fetch streams when using multiple services. With this option enabled, when you use multiple services, a separate request is made for each service. I recommend leaving this disabled, unless you want duplicate streams but with different services.',
        type: 'checkbox',
      },
      {
        id: 'indexerTimeout',
        required: false,
        label: 'Override Indexer Timeout',
        description:
          'The timeout for fetching streams from the Torrentio addon. This is the time in milliseconds that the addon will wait for a response before timing out. Leave it empty to use the recommended timeout.',
        type: 'number',
        constraints: {
          min: Settings.MIN_TIMEOUT,
          max: Settings.MAX_TIMEOUT,
        },
      },
    ],
  },
  {
    name: 'Comet',
    id: 'comet',
    requiresService: true,
    supportedServices: [
      'realdebrid',
      'alldebrid',
      'premiumize',
      'debridlink',
      'torbox',
    ],
    options: [
      {
        id: 'prioritiseDebrid',
        required: false,
        label: 'Prioritise Debrid Service',
        description:
          'Prioritise a specific debrid service when fetching streams. This option is useful when you want to use a specific debrid service for fetching streams. By default, the addon will make a separate request for each debrid service. I highly recommend provding a value for this option as it will speed up the fetching process and remove redundant results.',
        type: 'select',
        options: [
          { value: 'realdebrid', label: 'Real Debrid' },
          { value: 'alldebrid', label: 'All Debrid' },
          { value: 'premiumize', label: 'Premiumize' },
          { value: 'debridlink', label: 'Debrid Link' },
          { value: 'torbox', label: 'Torbox' },
        ],
      },
      {
        id: 'overrideName',
        required: false,
        label: 'Override Addon Name',
        description:
          'Override the name of the Comet addon that shows up in the results',
        type: 'text',
      },
      {
        id: 'overrideUrl',
        required: false,
        label: 'Override URL',
        description:
          'Override the URL used to fetch streams from the Comet addon. This option is incompatible with the prioritiseDebrid option. By default, the URL is generated based on the selected services and their credentials. Use this option to override the URL with a custom URL.',
        type: 'text',
      },
      {
        id: 'indexerTimeout',
        required: false,
        label: 'Override Indexer Timeout',
        description:
          'The timeout for fetching streams from the Comet addon. This is the time in milliseconds that the addon will wait for a response before timing out. Leave it empty to use the recommended timeout.',
        type: 'number',
        constraints: {
          min: Settings.MIN_TIMEOUT,
          max: Settings.MAX_TIMEOUT,
        },
      },
    ],
  },
  {
    name: 'MediaFusion',
    id: 'mediafusion',
    requiresService: false,
    supportedServices: [
      'realdebrid',
      'alldebrid',
      'premiumize',
      'debridlink',
      'torbox',
      'offcloud',
      'easydebrid',
      'pikpak',
      'seedr',
    ],
    options: [
      {
        id: 'prioritiseDebrid',
        required: false,
        label: 'Prioritise Debrid Service',
        description:
          'Prioritise a specific debrid service when fetching streams. This option is useful when you want to use a specific debrid service for fetching streams. By default, the addon will make a separate request for each debrid service. I highly recommend provding a value for this option as it will speed up the fetching process and remove redundant results.',
        type: 'select',
        options: [
          { value: 'realdebrid', label: 'Real Debrid' },
          { value: 'alldebrid', label: 'All Debrid' },
          { value: 'premiumize', label: 'Premiumize' },
          { value: 'debridlink', label: 'Debrid Link' },
          { value: 'torbox', label: 'Torbox' },
          { value: 'offcloud', label: 'Offcloud' },
          { value: 'easydebrid', label: 'EasyDebrid' },
        ],
      },
      {
        id: 'overrideName',
        required: false,
        label: 'Override Addon Name',
        description:
          'Override the name of the Media Fusion addon that shows up in the results',
        type: 'text',
      },
      {
        id: 'overrideUrl',
        required: false,
        label: 'Override URL',
        description:
          'Override the URL used to fetch streams from the Media Fusion addon. This option is incompatible with the prioritiseDebrid option. By default, the URL is generated based on the selected services and their credentials. Use this option to override the URL with a custom URL.',
        type: 'text',
      },
      {
        id: 'indexerTimeout',
        required: false,
        label: 'Override Indexer Timeout',
        description:
          'The timeout for fetching streams from the Media Fusion addon. This is the time in milliseconds that the addon will wait for a response before timing out. Leave it empty to use the recommended timeout.',
        type: 'number',
        constraints: {
          min: Settings.MIN_TIMEOUT,
          max: Settings.MAX_TIMEOUT,
        },
      },
    ],
  },
  {
    name: 'Torbox',
    id: 'torbox',
    requiresService: true,
    supportedServices: ['torbox'],
    options: [
      {
        id: 'indexerTimeout',
        required: false,
        label: 'Override Indexer Timeout',
        description:
          'The timeout for fetching streams from the Torbox addon. This is the time in milliseconds that the addon will wait for a response from Torbox before timing out. Leave it empty to use the recommended timeout.',
        type: 'number',
        constraints: {
          min: Settings.MIN_TIMEOUT,
          max: Settings.MAX_TIMEOUT,
        },
      },
      {
        id: 'overrideName',
        required: false,
        label: 'Override Addon Name',
        description:
          "Override the name of the addon that shows up in the results. Leave it empty to use the default name of 'Torbox'.",
        type: 'text',
      },
    ],
  },
  {
    name: 'Easynews',
    id: 'easynews',
    requiresService: true,
    supportedServices: ['easynews'],
    options: [
      {
        id: 'overrideName',
        required: false,
        label: 'Override Addon Name',
        description:
          "Override the name of the addon that shows up in the results. Leave it empty to use the default name of 'Easynews'.",
        type: 'text',
      },
      {
        id: 'overrideUrl',
        required: false,
        label: 'Override URL',
        description:
          'Override the URL used to fetch streams from the Easynews addon. By default, the URL is generated based on the username and password provided for the Easynews service. Use this option to override the URL with a custom URL.',
        type: 'text',
      },
      {
        id: 'indexerTimeout',
        required: false,
        label: 'Override Indexer Timeout',
        description:
          'The timeout for fetching streams from the Easynews addon in milliseconds. This is the time in milliseconds that the addon will wait for a response from Easynews before timing out. Leave it empty to use the recommended timeout.',
        type: 'number',
        constraints: {
          min: Settings.MIN_TIMEOUT,
          max: Settings.MAX_TIMEOUT,
        },
      }
    ]
  },
  {
    name: 'Easynews Plus',
    id: 'easynewsplus',
    requiresService: true,
    supportedServices: ['easynews'],
    options: [
      {
        id: 'overrideName',
        required: false,
        label: 'Override Addon Name',
        description:
          "Override the name of the addon that shows up in the results. Leave it empty to use the default name of 'Easynews Plus'.",
        type: 'text',
      },
      {
        id: 'overrideUrl',
        required: false,
        label: 'Override URL',
        description:
          'Override the URL used to fetch streams from the Easynews Plus addon. By default, the URL is generated based on the username and password provided for the Easynews service. Use this option to override the URL with a custom URL.',
        type: 'text',
      },
      {
        id: 'indexerTimeout',
        required: false,
        label: 'Override Indexer Timeout',
        description:
          'The timeout for fetching streams from the Easynews Plus addon in milliseconds. This is the time in milliseconds that the addon will wait for a response from Easynews Plus before timing out. Leave it empty to use the recommended timeout.',
        type: 'number',
        constraints: {
          min: Settings.MIN_TIMEOUT,
          max: Settings.MAX_TIMEOUT,
        },
      }
    ]
  },
  {
    name: 'Stremio GDrive',
    id: 'gdrive',
    requiresService: false,
    supportedServices: [],
    options: [
      {
        id: 'addonUrl',
        required: true,
        label: 'Addon URL',
        description:
          'The URL to the manifest.json file for your Google Drive addon. This would be the URL of your Cloudflare Worker which looks something like https://your-worker-name.your-subdomain.workers.dev/manifest.json',
        type: 'text',
      },
      {
        id: 'overrideName',
        required: false,
        label: 'Override Addon Name',
        description:
          "Override the name of the addon that shows up in the results. Leave it empty to use the default name of 'GDrive'.",
        type: 'text',
      },
      {
        id: 'indexerTimeout',
        required: false,
        label: 'Override Indexer Timeout',
        description:
          'The timeout for fetching streams from the Google Drive addon in milliseconds. This is the time in milliseconds that the addon will wait for a response from your Cloudflare Worker before timing out. Leave it empty to use the recommended timeout.',
        type: 'number',
        constraints: {
          min: Settings.MIN_TIMEOUT,
          max: Settings.MAX_TIMEOUT,
        },
      },
    ],
  },
  {
    name: 'Custom',
    id: 'custom',
    requiresService: false,
    supportedServices: [],
    options: [
      {
        id: 'name',
        required: true,
        description:
          'The name of the custom addon. This is the name that will show up in the results',
        label: 'Name',
        type: 'text',
      },
      {
        id: 'url',
        required: true,
        description:
          'The URL of the custom addon. This is the URL that will be used to fetch streams from the custom addon. The URL should point to the manifest.json file of the custom addon',
        label: 'URL',
        type: 'text',
      },
      {
        id: 'indexerTimeout',
        required: false,
        label: 'Override Indexer Timeout',
        description:
          'The timeout for fetching streams from the custom addon in milliseconds',
        type: 'number',
        constraints: {
          min: Settings.MIN_TIMEOUT,
          max: Settings.MAX_TIMEOUT,
        },
      },
    ],
  },
];

export const serviceDetails = [
  {
    name: 'Real Debrid',
    shortName: 'RD',
    knownNames: ['RD', 'Real Debrid'],
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
    shortName: 'AD',
    knownNames: ['AD', 'All Debrid', 'AllDebrid', 'All-Debrid'],
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
    shortName: 'PM',
    knownNames: ['PM', 'Premiumize'],
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
    shortName: 'DL',
    knownNames: ['DL', 'Debrid Link', 'DebridLink', 'Debrid-Link'],
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
    shortName: 'TB',
    knownNames: ['TB', 'TRB', 'Torbox'],
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
    shortName: 'OC',
    knownNames: ['OC', 'Offcloud'],
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
    shortName: 'P.IO',
    knownNames: ['PO', 'put.io', 'putio'],
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
    shortName: 'EN',
    knownNames: ['EN', 'Easynews'],
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
  {
    name: 'EasyDebrid',
    id: 'easydebrid',
    shortName: 'ED',
    knownNames: ['ED', 'EasyDebrid'],
    credentials: [
      {
        label: 'API Key',
        id: 'apiKey',
        link: 'https://paradise-cloud.com/products/easydebrid',
      },
    ],
  },
  {
    name: 'PikPak',
    id: 'pikpak',
    shortName: 'PKP',
    knownNames: ['PP', 'PikPak', 'PKP'],
    credentials: [
      {
        label: 'Email',
        id: 'email',
      },
      {
        label: 'Password',
        id: 'password',
      },
    ],
  },
  {
    name: 'Seedr',
    id: 'seedr',
    shortName: 'SDR',
    knownNames: ['SR', 'Seedr', 'SDR'],
    credentials: [
      {
        label: 'Encoded Token. Please authorise at MediaFusion and copy the token into here.',
        id: 'apiKey',
      },
    ],
  },
];
