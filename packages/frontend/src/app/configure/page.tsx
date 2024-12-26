'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import {
  Config,
  Resolution,
  SortBy,
  Quality,
  VisualTag,
} from '@aiostreams/types';
import SortableCardList from '../../components/SortableCardList';
import ServiceInput from '../../components/ServiceInput';
import AddonsList from '../../components/AddonsList';
import { Slide, ToastContainer, toast } from 'react-toastify';
import addonPackage from '../../../package.json';

const version = addonPackage.version;

const defaultQualities: Quality[] = [
  { 'BluRay REMUX': true },
  { BluRay: true },
  { 'WEB-DL': true },
  { WEBRip: true },
  { HDRip: true },
  { 'HC HD-Rip': true },
  { DVDRip: true },
  { HDTV: true },
  { CAM: true },
  { TS: true },
  { TC: true },
  { SCR: true },
  { Unknown: true },
];

const defaultVisualTags: VisualTag[] = [
  { 'HDR10+': true },
  { HDR10: true },
  { HDR: true },
  { DV: true },
  { IMAX: true },
  { AI: true },
];

const defaultSortCriteria: SortBy[] = [
  { cached: true },
  { resolution: true },
  { visualTag: true },
  { size: true },
  { quality: false },
  { seeders: false },
];

const allowedFormatters = ['gdrive', 'torrentio', 'torbox'];

interface AddonDetail {
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

const addonDetails: AddonDetail[] = [
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
    ],
  },
  {
    name: 'Torbox',
    id: 'torbox',
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
      }
    ],
  },
];

const allowedLanguages = ['English', 'Spanish', 'French', 'German', 'Chinese'];

function showToast(
  message: string,
  type: 'success' | 'error' | 'info' | 'warning',
  id?: string
) {
  toast[type](message, {
    autoClose: 5000,
    hideProgressBar: true,
    closeOnClick: false,
    pauseOnHover: true,
    draggable: 'touch',
    style: {
      borderRadius: '8px',
      backgroundColor: '#ededed',
      color: 'black',
    },
    toastId: id,
  });
}

const defaultResolutions: Resolution[] = [
  { '2160p': true },
  { '1080p': true },
  { '720p': true },
  { '480p': true },
  { Unknown: true },
];

const defaultServices = [
  {
    name: 'Real Debrid',
    id: 'realdebrid',
    enabled: false,
    credentials: {
    },
  },
  {
    name: 'All Debrid',
    id: 'alldebrid',
    enabled: false,
    credentials: {
    },
  },
  {
    name: 'Premiumize',
    id: 'premiumize',
    enabled: false,
    credentials: {
    },
  },
  {
    name: 'Debrid Link',
    id: 'debridlink',
    enabled: false,
    credentials: {
    },
  },
  {
    name: 'Torbox',
    id: 'torbox',
    enabled: false,
    credentials: {
    },
  },
  {
    name: 'Offcloud',
    id: 'offcloud',
    enabled: false,
    credentials: {
    },
  },
  {
    name: 'put.io',
    id: 'putio',
    enabled: false,
    credentials: {
    },
  },
  {
    name: 'Easynews',
    id: 'easynews',
    enabled: false,
    credentials: {
    },
  },
];


const serviceCredentials = [
  {
    name: 'Real Debrid',
    id: 'realdebrid',
    credentials: [
      {
        label: 'API Key',
        id: 'apiKey',
        link: 'https://real-debrid.com/apitoken',
      }
    ]
  },
  {
    name: 'All Debrid',
    id: 'alldebrid',
    credentials: [
      {
        label: 'API Key',
        id: 'apiKey',
        link: 'https://alldebrid.com/api',
      }
    ]
  },
  {
    name: 'Premiumize',
    id: 'premiumize',
    credentials: [
      {
        label: 'API Key',
        id: 'apiKey',
        link: 'https://www.premiumize.me/account',
      }
    ]
  },
  {
    name: 'Debrid Link',
    id: 'debridlink',
    credentials: [
      {
        label: 'API Key',
        id: 'apiKey',
        link: 'https://debrid-link.com/webapp/apikey',
      }
    ]
  },
  {
    name: 'Torbox',
    id: 'torbox',
    credentials: [
      {
        label: 'API Key',
        id: 'apiKey',
        link: 'https://torbox.app/settings',
      }
    ]
  },
  {
    name: 'Offcloud',
    id: 'offcloud',
    credentials: [
      {
        label: 'API Key',
        id: 'apiKey',
        link: 'https://offcloud.com/#/account',
      }
    ]
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
      }
    ]
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
      }
    ]
  },
]

export default function Configure() {
  const [resolutions, setResolutions] =
    useState<Resolution[]>(defaultResolutions);
  const [qualities, setQualities] = useState<Quality[]>(defaultQualities);
  const [visualTags, setVisualTags] = useState<VisualTag[]>(defaultVisualTags);
  const [sortCriteria, setSortCriteria] =
    useState<SortBy[]>(defaultSortCriteria);
  const [formatter, setFormatter] = useState<string>();
  const [services, setServices] = useState<Config['services']>(defaultServices);
  const [onlyShowCachedStreams, setOnlyShowCachedStreams] =
    useState<boolean>(false);
  const [prioritiseLanguage, setPrioritiseLanguage] = useState<string | null>(
    null
  );
  const [addons, setAddons] = useState<Config['addons']>([]);
  const [maxSize, setMaxSize] = useState<number | null>(null);
  const [minSize, setMinSize] = useState<number | null>(null);
  const [sizeUnit, setSizeUnit] = useState<'MB' | 'GB'>('GB');

  const getChoosableAddons = () => {
    // only if torbox service is enabled we can use torbox addon
    const choosableAddons: string[] = ['torrentio', 'gdrive', 'custom'];
    if (
      services.some((service) => service.enabled && service.id === 'torbox')
    ) {
      choosableAddons.push('torbox');
    }
    return choosableAddons;
  };

  const convertToBytes = (
    size: number | null,
    unit: 'MB' | 'GB'
  ): number | null => {
    if (size === null) return null;
    return unit === 'GB' ? size * 1000 * 1000 * 1000 : size * 1000 * 1000;
  };

  const createConfig = (): Config => {
    return {
      resolutions,
      qualities,
      visualTags,
      sortBy: sortCriteria,
      onlyShowCachedStreams,
      prioritiseLanguage,
      maxSize: convertToBytes(maxSize, sizeUnit),
      minSize: convertToBytes(minSize, sizeUnit),
      formatter: formatter || 'gdrive',
      addons,
      services,
    };
  };

  const getManifestUrl = () => {
    const config = createConfig();
    const encodedConfig = btoa(JSON.stringify(config));
    const protocol = window.location.protocol;
    const root = window.location.host;
    return `${protocol}//${root}/${encodedConfig}/manifest.json`;
  };

  const validateConfig = () => {
    const config = createConfig();

    for (const addon of config.addons) {
      // if torbox addon is enabled, torbox service must be enabled and torbox api key must be set
      if (addon.id === 'torbox') {
        const torboxService = config.services.find(
          (service) => service.id === 'torbox'
        );
        if (!torboxService) {
          showToast(
            'Torbox service must be enabled to use the Torbox addon',
            'error',
            'torboxServiceNotEnabled'
          );
          return false;
        }
        if (!torboxService.credentials.apiKey) {
          showToast(
            'Torbox API Key must be set to use the Torbox addon',
            'error',
            'torboxApiKeyNotSet'
          );
          return false;
        }
      }
      const details = addonDetails.find((detail) => detail.id === addon.id);
      if (!details) {
        showToast(`Invalid addon: ${addon.id}`, 'error', 'invalidAddon');
        return false;
      }
      if (details.options) {
        for (const option of details.options) {
          if (option.required && !addon.options[option.id]) {
            showToast(
              `Option ${option.label} is required for addon ${addon.id}`,
              'error',
              'missingRequiredOption'
            );
            return false;
          }
        }
      }
    }

    if (!allowedFormatters.includes(config.formatter)) {
      showToast(
        `Invalid formatter: ${config.formatter}`,
        'error',
        'invalidFormatter'
      );
      return false;
    }

    for (const service of config.services) {
      if (service.enabled) {
        const serviceDetail = serviceCredentials.find(
          (detail) => detail.id === service.id
        );
        if (!serviceDetail) {
          showToast(`Invalid service: ${service.id}`, 'error', 'invalidService');
          return false;
        }
        for (const credential of serviceDetail.credentials) {
          if (!service.credentials[credential.id]) {
            showToast(
              `${credential.label} is required for ${service.name}`,
              'error',
              `missing${service.id}${credential.id}`
            );
            return false;
          }
        }
      }
    }

    // need at least one visual tag, resolution, quality
    if (config.visualTags.length === 0) {
      showToast(
        'At least one visual tag must be selected',
        'error',
        'noVisualTags'
      );
      return false;
    }

    if (config.resolutions.length === 0) {
      showToast(
        'At least one resolution must be selected',
        'error',
        'noResolutions'
      );
      return false;
    }

    if (config.qualities.length === 0) {
      showToast(
        'At least one quality must be selected',
        'error',
        'noQualities'
      );
      return false;
    }

    if (config.minSize && config.maxSize) {
      if (config.minSize > config.maxSize) {
        showToast(
          "Your minimum size limit can't be greater than your maximum size limit",
          'error',
          'invalidSizeRange'
        );
        return false;
      } else if (config.minSize === config.maxSize) {
        setTimeout(() => {
          showToast(
            'Your minimum and maximum size are the same, this will result in no streams being shown',
            'warning',
            'sameSize'
          );
        }, 500);
      }
    }

    if (config.addons.length < 1) {
      showToast('At least one addon must be selected', 'error', 'noAddons');
      return false;
    }

    return true;
  };

  const handleInstall = () => {
    if (validateConfig()) {
      const manifestUrl = getManifestUrl();
      const stremioUrl = manifestUrl.replace(/^https?/, 'stremio');
      showToast(
        'Sending addon to Stremio. You need Stremio installed for this to work.',
        'info',
        'sendingToStremio'
      );
      // timeout to allow the toast to show
      setTimeout(() => {
        window.open(stremioUrl, '_blank');
      }, 1000);
    }
  };

  const handleInstallToWeb = () => {
    if (validateConfig()) {
      const manifestUrl = getManifestUrl();
      const encodedManifestUrl = encodeURIComponent(manifestUrl);
      showToast(
        'Opening Stremio Web with your addon',
        'info',
        'openingStremioWeb'
      );
      // timeout to allow the toast to show
      setTimeout(() => {
        window.open(
          `https://web.stremio.com/#/addons?addon=${encodedManifestUrl}`,
          '_blank'
        );
      }, 1000);
    }
  };

  const handleCopyLink = () => {
    if (validateConfig()) {
      const manifestUrl = getManifestUrl();
      navigator.clipboard.writeText(manifestUrl).then(() => {
        showToast(
          'Manifest URL copied to clipboard',
          'success',
          'copiedManifestUrl'
        );
      });
    }
  };

  // Load config from the window path if it exists
  useEffect(() => {
    const path = window.location.pathname;
    try {
      const configMatch = path.match(/\/([^/]+)\/configure/);

      if (configMatch) {
        const decodedConfig = JSON.parse(atob(configMatch[1]));
        setResolutions(decodedConfig.resolutions);
        setQualities(decodedConfig.qualities);
        setVisualTags(decodedConfig.visualTags);
        setSortCriteria(decodedConfig.sortBy);
        setOnlyShowCachedStreams(decodedConfig.onlyShowCachedStreams);
        setPrioritiseLanguage(decodedConfig.prioritiseLanguage);
        setFormatter(decodedConfig.formatter);
        setAddons(decodedConfig.addons);
        setServices(decodedConfig.services);
        if (decodedConfig.maxSize) {
          const unit = decodedConfig.maxSize > 1000 * 1000 * 1000 ? 'GB' : 'MB';
          setSizeUnit(unit);
          setMaxSize(
            unit === 'GB'
              ? decodedConfig.maxSize / 1000 / 1000 / 1000
              : decodedConfig.maxSize / 1000 / 1000
          );
        }
        if (decodedConfig.minSize) {
          const unit = decodedConfig.minSize > 1000 * 1000 * 1000 ? 'GB' : 'MB';
          setSizeUnit(unit);
          setMinSize(
            unit === 'GB'
              ? decodedConfig.minSize / 1000 / 1000 / 1000
              : decodedConfig.minSize / 1000 / 1000
          );
        }
      }
    } catch (error) {
      console.error('Failed to load config', error);
    }
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 style={{ textAlign: 'center' }}>AIOStreams v{version}</h1>
        <p style={{ textAlign: 'center', padding: '15px' }}>
          AIOStreams, the all-in-one streaming addon for Stremio. Combine your
          streams from all your addons into one and filter them by resolution,
          quality, visual tags and more.
        </p>
        <p style={{ textAlign: 'center', padding: '15px' }}>
          Made by Viren070. Source code on{' '}
          <a
            href="https://github.com/Viren070/AIOStreams"
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: 'underline' }}
          >
            Github
          </a>
        </p>

        <div className={styles.section}>
          <h2 style={{ padding: '5px' }}>Resolutions</h2>
          <p style={{ padding: '5px' }}>
            Choose which resolutions you want to see and reorder their priority
            if needed.
          </p>
          <SortableCardList items={resolutions} setItems={setResolutions} />
        </div>

        <div className={styles.section}>
          <h2 style={{ padding: '5px' }}>Qualities</h2>
          <p style={{ padding: '5px' }}>
            Choose which qualities you want to see and reorder their priority if
            needed.
          </p>
          <SortableCardList items={qualities} setItems={setQualities} />
        </div>

        <div className={styles.section}>
          <h2 style={{ padding: '5px' }}>Visual Tags</h2>
          <p style={{ padding: '5px' }}>
            Choose which visual tags you want to see and reorder their priority
            if needed.
          </p>
          <SortableCardList items={visualTags} setItems={setVisualTags} />
        </div>

        <div className={styles.section}>
          <h2 style={{ padding: '5px' }}>Sort By</h2>
          <p style={{ padding: '5px' }}>
            Choose the criteria by which to sort streams.
          </p>
          <SortableCardList items={sortCriteria} setItems={setSortCriteria} />
        </div>

        <div className={styles.section}>
          <div className={styles.setting}>
            <div className={styles.settingDescription}>
              <h2 style={{ padding: '5px' }}>Prioritise Language</h2>
              <p style={{ padding: '5px' }}>
                Any results that are detected to have the prioritised language
                will be moved to the top, ignoring all other sort criteria
              </p>
            </div>
            <div className={styles.settingInput}>
              <select
                value={prioritiseLanguage || ''}
                onChange={(e) => setPrioritiseLanguage(e.target.value || null)}
              >
                <option value="">None</option>
                {allowedLanguages.map((language) => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.setting}>
            <div className={styles.settingDescription}>
              <h2 style={{ padding: '5px' }}>Formatter</h2>
              <p style={{ padding: '5px' }}>
                Change how your stream results are formatted.
              </p>
            </div>
            <div className={styles.settingInput}>
              <select
                value={formatter}
                onChange={(e) => setFormatter(e.target.value)}
              >
                {allowedFormatters.map((formatter) => (
                  <option key={formatter} value={formatter}>
                    {formatter}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.setting}>
            <div className={styles.settingDescription}>
              <h2 style={{ padding: '5px' }}>Size Filter</h2>
              <p style={{ padding: '5px' }}>
                Filter streams by size. Leave empty to disable.
              </p>
            </div>
            <div className={styles.settingInput}>
              <input
                type="number"
                placeholder="Min size"
                value={minSize || ''}
                onChange={(e) => {
                  const value = e.target.value
                    ? parseInt(e.target.value)
                    : null;
                  if (value && value <= 0) {
                    setMinSize(null);
                    return;
                  }
                  setMinSize(value);
                }}
              />
              <input
                type="number"
                placeholder="Max size"
                value={maxSize || ''}
                onChange={(e) => {
                  const value = e.target.value
                    ? parseInt(e.target.value)
                    : null;
                  if (value && value <= 0) {
                    setMaxSize(null);
                    return;
                  }
                  setMaxSize(value);
                }}
              />
              <select
                value={sizeUnit}
                onChange={(e) => setSizeUnit(e.target.value as 'MB' | 'GB')}
              >
                <option value="MB">MB</option>
                <option value="GB">GB</option>
              </select>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2 style={{ padding: '5px' }}>Services</h2>
          <p style={{ padding: '5px' }}>
            Enable the services you have accounts with and enter your
            credentials.
          </p>
          {services.map((service) => (
            <ServiceInput
              key={service.id}
              serviceName={service.name}
              enabled={service.enabled}
              setEnabled={(enabled) => {
                const newServices = [...services];
                const serviceIndex = newServices.findIndex(
                  (s) => s.id === service.id
                );
                newServices[serviceIndex] = { ...service, enabled };
                setServices(newServices);
              }}
              fields={serviceCredentials.find(
                (detail) => detail.id === service.id
              )?.credentials.map((credential) => ({
                label: credential.label,
                link: credential.link,
                value: service.credentials[credential.id] || '',
                setValue: (value) => {
                  const newServices = [...services];
                  const serviceIndex = newServices.findIndex(
                    (s) => s.id === service.id
                  );
                  newServices[serviceIndex] = {
                    ...service,
                    credentials: {
                      ...service.credentials,
                      [credential.id]: value,
                    },
                  };
                  setServices(newServices);
                },
              })) || []
              }
            />
          ))}

          <div className={styles.section} style={{ marginTop: '20px', marginBottom: '0px' }}>
          <div className={styles.setting}>
            <div className={styles.settingDescription}>
              <h2 style={{ padding: '5px' }}>Only Show Cached Streams</h2>
              <p style={{ padding: '5px' }}>
                Only show streams that are cached by the enabled services.
              </p>
            </div>
            <div className={styles.settingInput}>
              <input
                type="checkbox"
                checked={onlyShowCachedStreams}
                onChange={(e) => setOnlyShowCachedStreams(e.target.checked)}
                // move to the right
                style={{ marginLeft: 'auto', marginRight: '20px', width: '25px', height: '25px' }}
              />
            </div>
          </div>
        </div>
        </div>

        <div className={styles.section}>
          <h2 style={{ padding: '5px' }}>Addons</h2>
          <AddonsList
            choosableAddons={getChoosableAddons()}
            addonDetails={addonDetails}
            addons={addons}
            setAddons={setAddons}
          />
        </div>

        <details>
          <summary>Config</summary>
          <pre>{JSON.stringify(createConfig(), null, 2)}</pre>
        </details>

        <div className={styles.installButtons}>
          <button onClick={handleInstall} className={styles.installButton}>
            Install
          </button>
          <button onClick={handleInstallToWeb} className={styles.installButton}>
            Install to Stremio Web
          </button>
          <button onClick={handleCopyLink} className={styles.installButton}>
            Copy Link
          </button>
        </div>
      </div>
      <ToastContainer
        stacked
        position="top-center"
        transition={Slide}
        draggablePercent={30}
      />
    </div>
  );
}
