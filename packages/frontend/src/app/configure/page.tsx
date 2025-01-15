/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import Select, { StylesConfig } from 'react-select';
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
  ServiceDetail,
  ServiceCredential,
} from '@aiostreams/types';
import SortableCardList from '../../components/SortableCardList';
import ServiceInput from '../../components/ServiceInput';
import AddonsList from '../../components/AddonsList';
import { Slide, ToastContainer, ToastOptions, toast } from 'react-toastify';
import addonPackage from '../../../package.json';
import { formatSize } from '@aiostreams/formatters';
import {
  allowedFormatters,
  allowedLanguages,
  validateConfig,
} from '@aiostreams/config';
import { addonDetails, serviceDetails, Settings } from '@aiostreams/utils';

import Slider from '@/components/Slider';
import CredentialInput from '@/components/CredentialInput';

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
  { "HDR+DV": true },
  { 'HDR10+': true },
  { HDR10: true },
  { HDR: true },
  { DV: true },
  { "3D": true },
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
  { HEVC: true },
  { AVC: true },
  { 'H-OU': true },
  { 'H-SBS': true },
  { Unknown: true },
];

const defaultSortCriteria: SortBy[] = [
  { cached: true, direction: 'desc' },
  { resolution: true },
  { language: true},
  { size: true, direction: 'desc' },
  { visualTag: false },
  { service: false, },
  { audioTag: false },
  { encode: false },
  { quality: false },
  { seeders: false, direction: 'desc' },
  { addon: false },
];

const toastOptions: ToastOptions = {
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
};

function showToast(
  message: string,
  type: 'success' | 'error' | 'info' | 'warning',
  id?: string
) {
  toast[type](message, {
    ...toastOptions,
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


const defaultServices = serviceDetails.map((service) => ({
  name: service.name,
  id: service.id,
  enabled: false,
  credentials: {},
}));

const selectStyles: StylesConfig = {
  control: (baseStyles: any, state: { isFocused: boolean; }) => ({
    ...baseStyles,
    borderWidth: '0px',
    backgroundColor: 'white',
    borderRadius: 'var(--borderRadius)',
    borderColor: 'gray',
    outline: '0',
    color: 'black',
    margin: '10px 0 0 -0px',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow: state.isFocused ? '0 0 0 3px rgb(112, 112, 112)' : 'none',
    "&:hover": {
      borderColor: '#5c5c5c',
      boxShadow: state.isFocused ? '0 0 0 3px rgb(128, 128, 128)' : '0 0 0 2px rgb(161, 161, 161)',
    }
  }),
  input: (baseStyles: any) => ({
    ...baseStyles,
    color: 'var(--ifm-color-primary-lightest)',
  }),
  multiValue: (baseStyles: any) => ({
    ...baseStyles,
    backgroundColor: 'rgb(26, 26, 26)',
    borderRadius: 'var(--borderRadius)',
    height: '25px',
    display: 'flex',
    alignItems: 'center',
    padding: '3px',
  }),
  multiValueLabel: (baseStyles: any) => ({
    ...baseStyles,
    color: 'white',
    fontSize: '0.8rem',
  }),
  multiValueRemove: (baseStyles: any) => ({
    ...baseStyles,
    color: 'white',
    transition: 'color 0.2s',
    "&:hover": {
      backgroundColor: 'transparent',
      color: 'rgb(141, 141, 141)',
      cursor: 'pointer',
    },
  }),
  menu: (baseStyles: any) => ({
    ...baseStyles,
    color: 'white',
    backgroundColor: 'white',
    margin: '5px',
    borderRadius: 'var(--borderRadius)',
  }),
  valueContainer: (baseStyles: any) => ({
    ...baseStyles,
  }),
  option: (baseStyles: any, state: { isFocused: any; }) => ({
    ...baseStyles,
    color: state.isFocused ? 'white' : 'black',
    backgroundColor: state.isFocused ? 'rgb(68, 68, 68)' : 'white',
    "&:hover": {
      backgroundColor: 'rgb(68, 68, 68)', //'#9c9c9c',
    },
    "&:active": {
        transition: 'background-color 0.4s, color 0.1s',
        backgroundColor: 'rgb(26, 26, 26)',
        color: 'white',
    },
  }),
};

export default function Configure() {
  const [isClient, setIsClient] = useState(false);
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
  const [prioritisedLanguages, setPrioritisedLanguages] = useState<string[] | null>(null);
  const [excludedLanguages, setExcludedLanguages] = useState<string[] | null>(null);
  const [addons, setAddons] = useState<Config['addons']>([]);
  /*
  const [maxSize, setMaxSize] = useState<number | null>(null);
  const [minSize, setMinSize] = useState<number | null>(null);
  */
  const [maxMovieSize, setMaxMovieSize] = useState<number | null>(null);
  const [minMovieSize, setMinMovieSize] = useState<number | null>(null);
  const [maxEpisodeSize, setMaxEpisodeSize] = useState<number | null>(null);
  const [minEpisodeSize, setMinEpisodeSize] = useState<number | null>(null);
  const [addonNameInDescription, setAddonNameInDescription] = useState<boolean>(false);
  const [cleanResults, setCleanResults] = useState<boolean>(false);
  const [maxResultsPerResolution, setMaxResultsPerResolution] = useState<number | null>(null);
  const [mediaFlowEnabled, setMediaFlowEnabled] = useState<boolean>(false);
  const [mediaFlowProxyUrl, setmediaFlowProxyUrl] = useState<string>('');
  const [mediaFlowApiPassword, setmediaFlowApiPassword] = useState<string>('');
  const [mediaFlowPublicIp, setMediaFlowPublicIp] = useState<string>('');
  const [disableButtons, setDisableButtons] = useState<boolean>(false);
  const [manualManifestUrl, setManualManifestUrl] = useState<string | null>(null);

  const getChoosableAddons = () => {
    // only if torbox service is enabled we can use torbox addon
    const choosableAddons: string[] = [];
    for (const addon of addonDetails) {
      if (addon.requiresService) {
        // look through services and see if the ID of any service is in addon.supportedServices
        if (
          services.some(
            (service) =>
              addon.supportedServices.includes(service.id) &&
              service.enabled &&
              Object.keys(service.credentials).length > 0
          )
        ) {
          choosableAddons.push(addon.id);
        }
      } else {
        choosableAddons.push(addon.id);
      }
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
      prioritisedLanguages,
      excludedLanguages,
      maxMovieSize,
      minMovieSize,
      maxEpisodeSize,
      minEpisodeSize,
      addonNameInDescription,
      cleanResults,
      maxResultsPerResolution,
      formatter: formatter || 'gdrive',
      mediaFlowConfig: {
        mediaFlowEnabled,
        proxyUrl: mediaFlowProxyUrl,
        apiPassword: mediaFlowApiPassword,
        publicIp: mediaFlowPublicIp
      },
      addons,
      services,
    };
  };

  const fetchWithTimeout = async (url: string, options: RequestInit | undefined, timeoutMs = 5000) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      console.log('Fetching', url, `with data: ${options?.body}`);
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);
      return res;
    } catch {
      console.log('Clearing timeout');
      return clearTimeout(timeout);
    }
  };

  const getManifestUrl = async (protocol = window.location.protocol, root = window.location.host) => {
    const config = createConfig();
    console.log('Config', config);
    setDisableButtons(true);
    
  
    try {
        const encryptPath = `/encrypt-user-data`;
        const response = await fetchWithTimeout(encryptPath, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: JSON.stringify(config) }),
        });
        if (!response) {
            throw new Error('encrypt-user-data failed: no response within timeout');
        }
        if (!response.ok) {
            throw new Error(`encrypt-user-data failed with status ${response.status}`);
        }

        const data = await response.json();
        if (!data.success) throw new Error(`Encryption service failed, ${data.message}`);

        const encryptedConfig = data.data;
        return { success: true, manifest: `${protocol}//${root}/${encryptedConfig}/manifest.json` };
    } catch (error: any) {
        console.error('Error during encryption:', error.message, '\nFalling back to base64 encoding');
        try {
            const base64Config = btoa(JSON.stringify(config));
            return { success: true, manifest: `${protocol}//${root}/${base64Config}/manifest.json` };
        } catch (base64Error: any) {
            console.error('Error during base64 encoding:', base64Error.message);
            return { success: false, manifest: null, message: 'Failed to encode config' };
        }
    }
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

  const handleInstall = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (createAndValidateConfig()) {
      const id = toast.loading('Generating manifest URL...', {
        ...toastOptions,
        toastId: 'generatingManifestUrl',
      });
      const manifestUrl = await getManifestUrl();
      if (!manifestUrl.success || !manifestUrl.manifest) {
        setDisableButtons(false);
        toast.update(id, {
          render: 'Failed to generate manifest URL',
          type: 'error',
          autoClose: 5000,
          isLoading: false,
        });
        return;
      }

      const stremioUrl = manifestUrl.manifest.replace(/^https?/, 'stremio');

      try {
        const wp = window.open(stremioUrl, '_blank');
        if (!wp) {
          throw new Error('Failed to open window');
        }
        toast.update(id, {
          render: 'Successfully generated manifest URL',
          type: 'success',
          autoClose: 5000,
          isLoading: false,
        });
        setManualManifestUrl(null);
      } catch (error) {
        console.error('Failed to open Stremio', error);
        toast.update(id, {
          render: 'Failed to open Stremio with manifest URL',
          type: 'error',
          autoClose: 5000,
          isLoading: false,
        });
        setManualManifestUrl(stremioUrl);
      }
      setDisableButtons(false);
    }
  };

  const handleInstallToWeb = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (createAndValidateConfig()) {
      const id = toast.loading('Generating manifest URL...', toastOptions);
      const manifestUrl = await getManifestUrl();
      if (!manifestUrl.success || !manifestUrl.manifest) {
        toast.update(id, {
          render: 'Failed to generate manifest URL',
          type: 'error',
          autoClose: 5000,
          isLoading: false,
        });
        setDisableButtons(false);
        return;
      }

      const encodedManifestUrl = encodeURIComponent(manifestUrl.manifest);

      try {
        const wp = window.open(
          `https://web.stremio.com/#/addons?addon=${encodedManifestUrl}`,
          '_blank'
        );
        if (!wp) {
          throw new Error('Failed to open window');
        }
        toast.update(id, {
          render: 'Successfully generated manifest URL and opened Stremio web',
          type: 'success',
          autoClose: 5000,
          isLoading: false,
        });
        setManualManifestUrl(null);
      } catch (error) {
        console.error('Failed to open Stremio web', error);
        toast.update(id, {
          render: 'Failed to open Stremio web with manifest URL',
          type: 'error',
          autoClose: 5000,
          isLoading: false,
        });
        setManualManifestUrl(`https://web.stremio.com/#/addons?addon=${encodedManifestUrl}`);
      }
      setDisableButtons(false);
    }
  };

  const handleCopyLink = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (createAndValidateConfig()) {
      const id = toast.loading('Generating manifest URL...', toastOptions);
      const manifestUrl = await getManifestUrl();
      if (!manifestUrl.success || !manifestUrl.manifest) {
        toast.update(id, {
          render: 'Failed to generate manifest URL',
          type: 'error',
          autoClose: 5000,
          isLoading: false,
        });
        setDisableButtons(false);
        return;
      }
      navigator.clipboard.writeText(manifestUrl.manifest).then(() => {
        toast.update(id, {
          render: 'Manifest URL copied to clipboard',
          type: 'success',
          autoClose: 5000,
          toastId: 'copiedManifestUrl',
          isLoading: false,
        });
        setManualManifestUrl(null);
      }).catch((err: any) => {
          console.error('Failed to copy manifest URL to clipboard', err);
          toast.update(id, {
            render: 'Failed to copy manifest URL to clipboard.',
            type: 'error',
            autoClose: 3000,
            isLoading: false,
          });
          setManualManifestUrl(manifestUrl.manifest);
      });
      setDisableButtons(false);
    }
  };

  const loadValidValuesFromObject = (
    object: { [key: string]: boolean }[],
    validValues: { [key: string]: boolean }[]
  ) => {
    if (!object) {
      return validValues;
    }
    return validValues.map((validValue) => {
      const value = object.find(
        (v) => Object.keys(v)[0] === Object.keys(validValue)[0]
      );
      return value || validValue;
    });
  };

  const loadValidSortCriteria = (sortCriteria: Config['sortBy']) => {
    if (!sortCriteria) {
      return defaultSortCriteria;
    }
    return defaultSortCriteria.map((defaultSort) => {
      // we find the one with the same key in the first index. 
      // and we only load direction if it exists in the defaultSort
      const sort = sortCriteria.find((s) => Object.keys(s)[0] === Object.keys(defaultSort)[0]);
      if (sort && defaultSort.direction) {
        return { ...sort, direction: sort.direction || defaultSort.direction };
      }
      return sort || defaultSort;
    });
  };

  const validateValue = (value: string | null, validValues: string[]) => {
    if (!value) {
      return null;
    }
    return validValues.includes(value) ? value : null;
  };

  const loadValidServices = (services: Config['services']) => {
    if (!services) {
      return defaultServices;
    }
    return services.filter((service) =>
      serviceDetails.some((detail) => detail.id === service.id)
    );
    /*
    return defaultServices.map((defaultService) => {
      const service = services.find((s) => s.id === defaultService.id);
      return service || defaultService;
    });
    */
  };

  const loadValidAddons = (addons: Config['addons']) => {
    if (!addons) {
      return [];
    }
    return addons.filter((addon) =>
      addonDetails.some((detail) => detail.id === addon.id)
    );
  };

  // Load config from the window path if it exists
   useEffect(()  => {
    setIsClient(true);
    async function decodeConfig(config: string) {
      let decodedConfig: Config;
      if (config.startsWith('E-')) {
        throw new Error('Encrypted Config Not Supported');
      } else {
        decodedConfig = JSON.parse(atob(config));
      }
      return decodedConfig;
    }

    function loadFromConfig(decodedConfig: Config) {
      console.log('Loaded config', decodedConfig);
      setResolutions(
        loadValidValuesFromObject(
          decodedConfig.resolutions,
          defaultResolutions
        )
      );
      setQualities(
        loadValidValuesFromObject(decodedConfig.qualities, defaultQualities)
      );
      setVisualTags(
        loadValidValuesFromObject(decodedConfig.visualTags, defaultVisualTags)
      );
      setAudioTags(
        loadValidValuesFromObject(decodedConfig.audioTags, defaultAudioTags)
      );
      setEncodes(
        loadValidValuesFromObject(decodedConfig.encodes, defaultEncodes)
      );
      setSortCriteria(
        loadValidSortCriteria(decodedConfig.sortBy)
      );
      setOnlyShowCachedStreams(decodedConfig.onlyShowCachedStreams || false);
      // create an array for prioritised languages. if the old prioritiseLanguage is set, add it to the array
      const finalPrioritisedLanguages = decodedConfig.prioritisedLanguages || [];
      if (decodedConfig.prioritiseLanguage) {
        finalPrioritisedLanguages.push(decodedConfig.prioritiseLanguage);
      }
      setPrioritisedLanguages(
        finalPrioritisedLanguages.filter((lang) =>
          allowedLanguages.includes(lang)
        ) || null
      );
      setExcludedLanguages(
        decodedConfig.excludedLanguages?.filter((lang) =>
          allowedLanguages.includes(lang)
        ) || null
      );
      setFormatter(
        validateValue(decodedConfig.formatter, allowedFormatters) || 'gdrive'
      );
      setServices(loadValidServices(decodedConfig.services));
      setMaxMovieSize(
        decodedConfig.maxMovieSize || decodedConfig.maxSize || null
      );
      setMinMovieSize(
        decodedConfig.minMovieSize || decodedConfig.minSize || null
      );
      setMaxEpisodeSize(
        decodedConfig.maxEpisodeSize || decodedConfig.maxSize || null
      );
      setMinEpisodeSize(
        decodedConfig.minEpisodeSize || decodedConfig.minSize || null
      );
      setAddons(loadValidAddons(decodedConfig.addons));
      setAddonNameInDescription(decodedConfig.addonNameInDescription || false);
      setCleanResults(decodedConfig.cleanResults || false);
      setMaxResultsPerResolution(decodedConfig.maxResultsPerResolution || null);
      setMediaFlowEnabled(decodedConfig.mediaFlowConfig?.mediaFlowEnabled || false);
      setmediaFlowProxyUrl(decodedConfig.mediaFlowConfig?.proxyUrl || '');
      setmediaFlowApiPassword(decodedConfig.mediaFlowConfig?.apiPassword || '');
    }

    const path = window.location.pathname;
    try {
      const configMatch = path.match(/\/([^/]+)\/configure/);

      if (configMatch) {
        const config = configMatch[1];
        decodeConfig(config).then(loadFromConfig);
      }
    } catch (error) {
      console.error('Failed to load config', error);
    }
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <Image
            src="/assets/logo.png"
            alt="AIOStreams Logo"
            width={200}
            height={200}
            style={{ display: 'block', margin: '0 auto' }}
          />
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <h1 style={{ textAlign: 'center' }}>AIOStreams</h1>
            <span className={styles.version}>v{version}</span>
          </div>
          {process.env.NEXT_PUBLIC_BRANDING && <div className={styles.branding} dangerouslySetInnerHTML={{ __html: process.env.NEXT_PUBLIC_BRANDING || '' }} />}
          <p style={{ textAlign: 'center', padding: '15px' }}>
            AIOStreams, the all-in-one streaming addon for Stremio. Combine your
            streams from all your addons into one and filter them by resolution,
            quality, visual tags and more.
            <br /><br/>
            This addon will return any result from the addons you enable. These can be P2P results, direct links, or anything else.
            Results that are P2P are marked as P2P, however. 
            <br /><br/>
            This addon also has no persistence. Nothing you enter here is stored. They are encrypted within the manifest URL and are only used to retrieve streams from any addons you enable.
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
          <h2 style={{ padding: '5px' }}>Services</h2>
          <p style={{ padding: '5px' }}>
            Enable the services you have accounts with and enter your
            credentials.
          </p>
          {services.map((service, index) => (
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
                serviceDetails
                  .find((detail: ServiceDetail) => detail.id === service.id)
                  ?.credentials.map((credential: ServiceCredential) => ({
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
              moveService={(direction) => {
                const newServices = [...services];
                const serviceIndex = newServices.findIndex(
                  (s) => s.id === service.id
                );
                const [movedService] = newServices.splice(serviceIndex, 1);
                if (direction === 'up' && serviceIndex > 0) {
                  newServices.splice(serviceIndex - 1, 0, movedService);
                } else if (direction === 'down' && serviceIndex < newServices.length) {
                  newServices.splice(serviceIndex + 1, 0, movedService);
                }
                setServices(newServices);
              }}
              canMoveUp={index > 0}
              canMoveDown={index < services.length - 1}
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
          <h2
          style={{ padding: '5px', margin: '0px '}}
          >Languages
          </h2>
          <p style={{margin: '5px 0 12px 5px' }}>
            Choose which languages you want to prioritise and exclude from the results
          </p>
          <div className={styles.section}>
            <div>
              <h3 style={{ margin: '2px 0 2px 0'}}>Prioritise Languages</h3>
              <p style={{ margin: '10px 0 10px 0'}}>
                Any results that are detected to have one of the prioritised languages will be sorted according to your sort criteria. 
                You must have the <code>Langage</code> sort criteria enabled for this to work.
                If there are multiple results with a different prioritised language, the order is determined by the order of the prioritised languages.
              </p>
            </div>
            <div>
              {isClient ? ( // https://github.com/JedWatson/react-select/issues/5859
              <Select 
                isMulti
                closeMenuOnSelect={false}
                options={allowedLanguages.sort((a,b) => a.localeCompare(b)).map((language) => ({ value: language, label: language }))}
                value={prioritisedLanguages?.map((language) => ({ value: language, label: language })) || []}
                onChange={(selectedOptions: any) => {
                  const selectedLanguages = selectedOptions.map((option: any) => option.value);
                  setPrioritisedLanguages(selectedLanguages || null);
                }}
                styles={selectStyles}
              />
              ) :
              // render a fake select box until the actual one is rendered
              <div style={{ height: '42px', margin: '0', backgroundColor: 'white', borderRadius: 'var(--borderRadius)', display: 'flex', alignItems: 'center'}}><p style={{margin: '10px', color: '#808090'}}>Select...</p></div>
            }
              
             
            </div>
          </div>
          <div style={{marginBottom: '0px'}} className={styles.section} >
            <div>
              <h3
                style={{ margin: '2px 0 2px 0'}}
              >Exclude Languages</h3>
              <p style={{ margin: '10px 0 10px 0'}}>
                Any results that are detected to have an excluded language will
                be removed from the results. A result will only be excluded if 
                it only has one of or more of the excluded languages. If it contains a 
                language that is not excluded, it will still be included.
              </p>
            </div>
            <div>
              {isClient ? (
              <Select 
                isMulti
                closeMenuOnSelect={false}
                options={allowedLanguages.sort((a,b) => a.localeCompare(b)).map((language) => ({ value: language, label: language }))}
                value={excludedLanguages?.map((language) => ({ value: language, label: language })) || []}
                onChange={(selectedOptions: any) => {
                  const selectedLanguages = selectedOptions.map((option: any) => option.value);
                  setExcludedLanguages(selectedLanguages || null);
                }}
                styles={selectStyles}
              />
              ) :
              // render a fake select box until the actual one is rendered
              <div style={{ height: '42px', margin: '0', backgroundColor: 'white', borderRadius: 'var(--borderRadius)', display: 'flex', alignItems: 'center'}}><p style={{margin: '10px', color: '#808090'}}>Select...</p></div>
              }
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.slidersSetting}>
            <div>
              <h2 style={{ padding: '5px' }}>Size Filter</h2>
              <p style={{ padding: '5px' }}>
                Filter streams by size. Leave the maximum and minimum size sliders at opposite ends to disable the filter.
              </p>
            </div>
            <div className={styles.slidersContainer}>
              <Slider
                maxValue={Settings.MAX_MOVIE_SIZE}
                value={minMovieSize || 0}
                setValue={setMinMovieSize}
                defaultValue="min"
                id="minMovieSizeSlider"
              />
              <div className={styles.sliderValue}>
                Minimum movie size: {formatSize(minMovieSize || 0)}
              </div>
              <Slider
                maxValue={Settings.MAX_MOVIE_SIZE}
                value={maxMovieSize === null ? Settings.MAX_MOVIE_SIZE : maxMovieSize}
                setValue={setMaxMovieSize}
                defaultValue="max"
                id="maxMovieSizeSlider"
              />
              <div className={styles.sliderValue}>
                Maximum movie size:{' '}
                {maxMovieSize === null ? 'Unlimited' : formatSize(maxMovieSize)}
              </div>
              <Slider
                maxValue={Settings.MAX_EPISODE_SIZE}
                value={minEpisodeSize || 0}
                setValue={setMinEpisodeSize}
                defaultValue="min"
                id="minEpisodeSizeSlider"
              />
              <div className={styles.sliderValue}>
                Minimum episode size: {formatSize(minEpisodeSize || 0)}
              </div>
              <Slider
                maxValue={Settings.MAX_EPISODE_SIZE}
                value={
                  maxEpisodeSize === null ? Settings.MAX_EPISODE_SIZE : maxEpisodeSize
                }
                setValue={setMaxEpisodeSize}
                defaultValue="max"
                id="maxEpisodeSizeSlider"
              />
              <div className={styles.sliderValue}>
                Maximum episode size:{' '}
                {maxEpisodeSize === null
                  ? 'Unlimited'
                  : formatSize(maxEpisodeSize)}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.setting}>
            <div className={styles.settingDescription}>
              <h2 style={{ padding: '5px' }}>Limit results per resolution</h2>
              <p style={{ padding: '5px' }}>
                Limit the number of results per resolution. Leave empty to show all results.
              </p>
                
            </div>
            <div className={styles.settingInput}>
              <input
                type="number"
                value={maxResultsPerResolution || ''}
                onChange={(e) => setMaxResultsPerResolution(e.target.value ? parseInt(e.target.value) : null)}
                style={{
                  marginLeft: 'auto',
                  marginRight: '20px',
                  width: '100px',
                  height: '30px',
                }}
              />
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
              <h2 style={{ padding: '5px' }}>Move Addon Name to Description</h2>
              <p style={{ padding: '5px' }}>
                Move the addon name to the description of the stream. This will show <code>AIOStreams</code> as the stream title,
                but move the name of the addon that the stream is from to the description. This is useful for Vidi users. 
              </p>
            </div>
            <div className={styles.settingInput}>
              <input
                type="checkbox"
                checked={addonNameInDescription}
                onChange={(e) => setAddonNameInDescription(e.target.checked)}
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

        <div className={styles.section}>
          <div className={styles.setting}>
            <div className={styles.settingDescription}>
              <h2 style={{ padding: '5px' }}>Clean Results</h2>
              <p style={{ padding: '5px' }}>
                Attempt to remove duplicate results. For a given file with duplicate streams: one uncached stream from all uncached streams is selected per provider. One cached stream from only one provider is selected. For duplicates without a provider, one stream is selected at random.
              </p>
            </div>
            <div className={styles.settingInput}>
              <input
                type="checkbox"
                checked={cleanResults}
                onChange={(e) => setCleanResults(e.target.checked)}
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

        <div className={styles.section}>
          <div className={styles.setting}>
            <div className={styles.settingDescription}>
              <h2 style={{ padding: '5px' }}>MediaFlow</h2>
              <p style={{ padding: '5px' }}>
                Use MediaFlow to proxy your streams
              </p>
            </div>
            <div className={styles.settingInput}>
              <input
                type="checkbox"
                checked={mediaFlowEnabled}
                onChange={(e) => {
                  setMediaFlowEnabled(e.target.checked);
                }}
                style={{
                  marginLeft: 'auto',
                  marginRight: '20px',
                  width: '25px',
                  height: '25px',
                }}
              />
            </div>
          </div>
          {(
            <div className={`${styles.mediaFlowConfig} ${mediaFlowEnabled ? '' : styles.hidden}`}>
            <div>
              <div>
                <h3 style={{ padding: '5px' }}>Proxy URL</h3>
                <p style={{ padding: '5px' }}>
                  The URL of the MediaFlow proxy server
                </p>
              </div>
              <div>
                <CredentialInput
                  credential={mediaFlowProxyUrl}
                  setCredential={setmediaFlowProxyUrl}
                  inputProps={
                    {
                      'placeholder': 'Enter your MediaFlow proxy URL',
                      'disabled': !mediaFlowEnabled
                    }
                  }
                />
              </div>
            </div>
            <div>
              <div>
                <h3 style={{ padding: '5px' }}>API Password</h3>
                <p style={{ padding: '5px' }}>
                  Your MediaFlow&apos;s API password
                </p>
              </div>
              <div>
                <CredentialInput
                  credential={mediaFlowApiPassword}
                  setCredential={setmediaFlowApiPassword}
                  inputProps={
                    {
                      'placeholder': 'Enter your MediaFlow API password',
                      'disabled': !mediaFlowEnabled
                    }
                  }
                />
              </div>
            </div>
            <div>
              <div>
                <h3 style={{ padding: '5px' }}>Public IP (Optional)</h3>
                <p style={{ padding: '5px' }}>
                Configure this only when running MediaFlow locally with a proxy service. Leave empty if MediaFlow is configured locally without a proxy server or if it&apos;s hosted on a remote server.
                </p>
              </div>
              <div>
                <CredentialInput
                  credential={mediaFlowPublicIp}
                  setCredential={setMediaFlowPublicIp}
                  inputProps={
                    {
                      'placeholder': 'Enter your MediaFlow public IP',
                      'disabled': !mediaFlowEnabled
                    }
                  }
                />
              </div>
            </div>
          </div>
          )}
        </div>

        <div className={styles.installButtons}>
          <button
            onClick={handleInstall}
            className={styles.installButton}
            disabled={disableButtons}
          >
            Install
          </button>
          <button
            onClick={handleInstallToWeb}
            className={styles.installButton}
            disabled={disableButtons}
          >
            Install to Stremio Web
          </button>
          <button
            onClick={handleCopyLink}
            className={styles.installButton}
            disabled={disableButtons}
          >
            Copy Link
          </button>
          {manualManifestUrl && (
            <>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <p style={{ padding: '5px' }}>
              If the above buttons do not work, you can use the following manifest URL to install the addon.
            </p>
            <input
              type="text"
              value={manualManifestUrl}
              readOnly
              style={{ width: '100%', padding: '5px', margin: '5px' }}
            />
            </div>
            </>
          )}
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
