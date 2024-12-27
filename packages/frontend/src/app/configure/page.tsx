'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './page.module.css';
import {
  Config,
  Resolution,
  SortBy,
  Quality,
  VisualTag,
  AudioTag,
  Encode,
} from '@aiostreams/types';
import SortableCardList from '../../components/SortableCardList';
import ServiceInput from '../../components/ServiceInput';
import AddonsList from '../../components/AddonsList';
import { Slide, ToastContainer, toast } from 'react-toastify';
import addonPackage from '../../../package.json';
import { formatSize } from '@aiostreams/formatters';
import {
  allowedFormatters,
  allowedLanguages,
  addonDetails,
  validateConfig,
  serviceCredentials,
  MAX_SIZE,
} from '@aiostreams/config';

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

const defaultAudioTags: AudioTag[] = [
  { Atmos: true },
  { 'DD+': true },
  { DD: true },
  { 'DTS-HD MA': true },
  { 'DTS-HD': true },
  { DTS: true },
  { TrueHD: true },
  { '5.1': true },
  { '7.1': true },
  { AC3: true },
  { AAC: true },
];

const defaultEncodes: Encode[] = [
  { x265: true },
  { HEVC: true },
  { x264: true },
  { AVC: true },
];

const defaultSortCriteria: SortBy[] = [
  { cached: true },
  { resolution: true },
  { size: true },
  { visualTag: false },
  { audioTag: false },
  { encode: false },
  { quality: false },
  { seeders: false },
];

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
    credentials: {},
  },
  {
    name: 'All Debrid',
    id: 'alldebrid',
    enabled: false,
    credentials: {},
  },
  {
    name: 'Premiumize',
    id: 'premiumize',
    enabled: false,
    credentials: {},
  },
  {
    name: 'Debrid Link',
    id: 'debridlink',
    enabled: false,
    credentials: {},
  },
  {
    name: 'Torbox',
    id: 'torbox',
    enabled: false,
    credentials: {},
  },
  {
    name: 'Offcloud',
    id: 'offcloud',
    enabled: false,
    credentials: {},
  },
  {
    name: 'put.io',
    id: 'putio',
    enabled: false,
    credentials: {},
  },
  {
    name: 'Easynews',
    id: 'easynews',
    enabled: false,
    credentials: {},
  },
];

export default function Configure() {
  const [resolutions, setResolutions] =
    useState<Resolution[]>(defaultResolutions);
  const [qualities, setQualities] = useState<Quality[]>(defaultQualities);
  const [visualTags, setVisualTags] = useState<VisualTag[]>(defaultVisualTags);
  const [audioTags, setAudioTags] = useState<AudioTag[]>(defaultAudioTags);
  const [encodes, setEncodes] = useState<Encode[]>(defaultEncodes);
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

  const createConfig = (): Config => {
    return {
      resolutions,
      qualities,
      visualTags,
      audioTags,
      encodes,
      sortBy: sortCriteria,
      onlyShowCachedStreams,
      prioritiseLanguage,
      maxSize: maxSize,
      minSize: minSize,
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

  const createAndValidateConfig = () => {
    const config = createConfig();

    const { valid, errorCode, errorMessage } = validateConfig(config);
    if (!valid) {
      showToast(
        errorMessage || 'Invalid config',
        'error',
        errorCode || 'error'
      );
      return false;
    }
    return true;
  };

  const handleInstall = () => {
    if (createAndValidateConfig()) {
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
    if (createAndValidateConfig()) {
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
    if (createAndValidateConfig()) {
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
        setAudioTags(decodedConfig.audioTags);
        setEncodes(decodedConfig.encodes);
        setSortCriteria(decodedConfig.sortBy);
        setOnlyShowCachedStreams(decodedConfig.onlyShowCachedStreams);
        setPrioritiseLanguage(decodedConfig.prioritiseLanguage);
        setFormatter(decodedConfig.formatter);
        setAddons(decodedConfig.addons);
        setServices(decodedConfig.services);
        setMaxSize(decodedConfig.maxSize);
        setMinSize(decodedConfig.minSize);
      }
    } catch (error) {
      console.error('Failed to load config', error);
    }
  }, []);

  useEffect(() => {
    const slider = document.querySelector(
      `.${styles.sliderMin}`
    ) as HTMLElement;
    if (slider) {
      slider.style.setProperty(
        '--minValue',
        `${((minSize || 0) / MAX_SIZE) * 100}%`
      );
    }
  }, [minSize]);

  useEffect(() => {
    const slider = document.querySelector(
      `.${styles.sliderMax}`
    ) as HTMLElement;
    if (slider) {
      slider.style.setProperty(
        '--maxValue',
        `${((maxSize || 0) / MAX_SIZE) * 100}%`
      );
    }
  }, [maxSize]);

  return (
    <div className={styles.container}>
      
      <div className={styles.content}>
      <div className={styles.header}>
        <Image
          src="/assets/logo.png"
          alt="AIOStreams Logo"
          width={200}
          height={200}
          style={{ alignSelf: 'center', justifyContent: 'center' }}
        />
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
            GitHub
          </a>
        </p>
      </div>
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
          <h2 style={{ padding: '5px' }}>Audio Tags</h2>
          <p style={{ padding: '5px' }}>
            Choose which audio tags you want to see and reorder their priority
            if needed.
          </p>
          <SortableCardList items={audioTags} setItems={setAudioTags} />
        </div>

        <div className={styles.section}>
          <h2 style={{ padding: '5px' }}>Encodes</h2>
          <p style={{ padding: '5px' }}>
            Choose which encodes you want to see and reorder their priority if
            needed.
          </p>
          <SortableCardList items={encodes} setItems={setEncodes} />
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
          <div className={styles.slidersSetting}>
            <div>
              <h2 style={{ padding: '5px' }}>Size Filter</h2>
              <p style={{ padding: '5px' }}>
                Filter streams by size. Leave both sliders at 0 to disable the
                filter.
              </p>
            </div>
            <div className={styles.slidersContainer}>
              <input
                type="range"
                min="0"
                max={MAX_SIZE}
                step={MAX_SIZE / 10000}
                value={minSize || 0}
                onChange={(e) =>
                  setMinSize(
                    e.target.value === '0' ? null : parseInt(e.target.value)
                  )
                }
                className={styles.slider + ' ' + styles.sliderMin}
              />
              <div className={styles.sliderValue}>
                Minimum size: {formatSize(minSize || 0)}
              </div>
              <input
                type="range"
                min="0"
                max={MAX_SIZE}
                step={MAX_SIZE / 10000}
                value={maxSize || 0}
                onChange={(e) =>
                  setMaxSize(
                    e.target.value === '0' ? null : parseInt(e.target.value)
                  )
                }
                className={styles.slider + ' ' + styles.sliderMax}
              />
              <div className={styles.sliderValue}>
                Maximum size: {maxSize ? formatSize(maxSize) : '∞'}
              </div>
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
              fields={
                serviceCredentials
                  .find((detail) => detail.id === service.id)
                  ?.credentials.map((credential) => ({
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

          <div
            className={styles.section}
            style={{ marginTop: '20px', marginBottom: '0px' }}
          >
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
                  style={{
                    marginLeft: 'auto',
                    marginRight: '20px',
                    width: '25px',
                    height: '25px',
                  }}
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
