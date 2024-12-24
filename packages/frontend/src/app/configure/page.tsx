/* eslint-disable @typescript-eslint/no-empty-function */
'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import { Config } from '@aiostreams/types';
import SortableCardList from '../../components/SortableCardList';
import ServiceInput from '../../components/ServiceInput';
import AddonsList from '../../components/AddonsList';
import { Slide, ToastContainer, toast } from 'react-toastify';

const allowedResolutions = ['2160p', '1080p', '720p', '480p', 'Unknown'];
const allowedQualities = [
  'BluRay REMUX',
  'BluRay',
  'WEB-DL',
  'WEBRip',
  'HDRip',
  'HC HD-Rip',
  'DVDRip',
  'HDTV',
  'CAM',
  'TS',
  'TC',
  'SCR',
  'Unknown',
];
const allowedVisualTags = ['HDR10+', 'HDR10', 'HDR', 'DV', 'IMAX', 'AI'];
const allowedSortCriteria = [
  'resolution',
  'visualTag',
  'size',
  'quality',
  'seeders',
  'cached',
];
const allowedFormatters = ['gdrive', 'torrentio'];

interface AddonOption {
  required: boolean;
  key: string;
  label: string;
  description?: string;
  type: 'text' | 'checkbox';
}

const addonOptions: { [key: string]: AddonOption[] } = {
  torrentio: [
    {
      required: false, 
      key: 'overrideUrl',
      label: 'Override URL',
      description: 'Override the URL used to fetch streams from the torrentio addon',
      type: 'text',
    },
    {
      required: false,
      key: 'useMultipleInstances',
      label: 'Use Multiple Instances',
      description: 'Use multiple instances of the torrentio addon to fetch streams when using multiple services',
      type: 'checkbox',
    }
  ],
  torbox: [],
  gdrive: [
    {
      required: true,
      key: 'addonUrl',
      label: 'Addon URL',
      type: 'text',
    }
  ],
  custom: [
    {
      required: true,
      key: 'url',
      label: 'URL',
      type: 'text',
    }
  ]
}


/*
interface Config {
  resolutions: string[];
  qualities: string[];
  visualTags: string[];
  sortBy: string[];
  onlyShowCachedStreams: boolean;
  prioritiseLanguage: string | null;
  formatter: string;
  addons: {
    id: string;
    options: { [key: string]: string };
  }[];
  services: {
    realdebrid: {
      enabled: boolean;
      apiKey: string;
    },
    alldebrid: {
      enabled: boolean;
      apiKey: string;
    },
    premiumize: {
      enabled: boolean;
      apiKey: string;
    },
    debridlink: {
      enabled: boolean;
      apiKey: string;
    }
    torbox: {
      enabled: boolean;
      apiKey: string;
    },
    offcloud: {
      enabled: boolean;
      apiKey: string;
    },
    putio: {
      enabled: boolean;
      apiKey: string;
    },
    easynews: {
      enabled: boolean;
      username: string;
      password: string;
    }

  }
  
}
  */


const allowedLanguages = ['English', 'Spanish', 'French', 'German', 'Chinese'];


function showToast(message: string, type: 'success' | 'error' | 'info' | 'warning') {
  toast[type](message, {
    autoClose: 5000,
    hideProgressBar: true,
    closeOnClick: false,
    pauseOnHover: true,
    draggable: 'touch',
    style: {
      borderRadius: '8px',
      backgroundColor: '#0b0b0b',
      color: 'white',
    }
  });
}

export default function Configure() {
  const [resolutions, setResolutions] = useState<string[]>(allowedResolutions);
  const [qualities, setQualities] = useState<string[]>(allowedQualities);
  const [visualTags, setVisualTags] = useState<string[]>(allowedVisualTags);
  const [sortCriteria, setSortCriteria] = useState<string[]>(allowedSortCriteria);
  const [formatter, setFormatter] = useState<string>();
  const [services, setServices] = useState<Config['services']>({
    realdebrid: { enabled: false, apiKey: '' },
    alldebrid: { enabled: false, apiKey: '' },
    premiumize: { enabled: false, apiKey: '' },
    debridlink: { enabled: false, apiKey: '' },
    torbox: { enabled: false, apiKey: '' },
    offcloud: { enabled: false, apiKey: '' },
    putio: { enabled: false, clientId: '', token: '' },
    easynews: { enabled: false, username: '', password: '' }
  });
  const [onlyShowCachedStreams, setOnlyShowCachedStreams] = useState<boolean>(false);
  const [prioritiseLanguage, setPrioritiseLanguage] = useState<string | null>(null);
  const [addons, setAddons] = useState<Config['addons']>([]);


  const getChoosableAddons = () => {
    // only if torbox service is enabled we can use torbox addon
    const choosableAddons: string[] = [];
    choosableAddons.push('torrentio');
    choosableAddons.push('gdrive');
    choosableAddons.push('custom');
    if (services.torbox.enabled) {
      choosableAddons.push('torbox');
    }
    return choosableAddons;
  }
    

  const createConfig = () => {
    return {
      resolutions,
      qualities,
      visualTags,
      sortBy: sortCriteria,
      onlyShowCachedStreams,
      prioritiseLanguage,
      formatter: formatter || 'gdrive',
      addons,
      services,
    };
  }

  const getManifestUrl = () => {
    const config = createConfig();
    const encodedConfig = btoa(JSON.stringify(config));
    const protocol = window.location.protocol;
    const root = window.location.host;
    return `${protocol}//${root}/${encodedConfig}/manifest.json`;
  }

  const validateConfig = () => {
    const config = createConfig();
    const addonIds = config.addons.map(addon => addon.id);
    const duplicateAddons = addonIds.filter((id, index) => addonIds.indexOf(id) !== index);
    if (duplicateAddons.length > 0) {
      showToast(`Duplicate addons found: ${duplicateAddons.join(', ')}`, 'error');
      return false;
    }

    for (const addon of config.addons) {
      // if torbox addon is enabled, torbox service must be enabled and torbox api key must be set
      if (addon.id === 'torbox' && (!services.torbox.enabled || !services.torbox.apiKey)) {
        showToast('Torbox addon requires Torbox service to be enabled and API key to be set', 'error');
        return false;
      }
      const options = addonOptions[addon.id];
      for (const option of options) {
        if (option.required && !addon.options[option.key]) {
          showToast(`Required option "${option.label}" is missing for addon "${addon.id}"`, 'error');
          return false;
        }
      }
    }

    if (services.putio.enabled && (!services.putio.clientId || !services.putio.token)) {
      showToast('Put.io service requires client ID and token to be set', 'error');
      return false;
    }

    if (services.easynews.enabled && (!services.easynews.username || !services.easynews.password)) {
      showToast('Easynews service requires username and password to be set', 'error');
      return false;
    }

    if (services.realdebrid.enabled && !services.realdebrid.apiKey) {
      showToast('Real Debrid service requires API key to be set', 'error');
      return false;
    }

    if (services.alldebrid.enabled && !services.alldebrid.apiKey) {
      showToast('All Debrid service requires API key to be set', 'error');
      return false;
    }

    if (services.premiumize.enabled && !services.premiumize.apiKey) {
      showToast('Premiumize service requires API key to be set', 'error');
      return false;
    }

    if (services.debridlink.enabled && !services.debridlink.apiKey) {
      showToast('Debrid Link service requires API key to be set', 'error');
      return false;
    }

    if (services.torbox.enabled && !services.torbox.apiKey) {
      showToast('Torbox service requires API key to be set', 'error');
      return false;
    }

    if (services.offcloud.enabled && !services.offcloud.apiKey) {
      showToast('Offcloud service requires API key to be set', 'error');
      return false;
    }

    // need at least one visual tag, resolution, quality 
    if (config.visualTags.length === 0) {
      showToast('At least one visual tag must be selected', 'error');
      return false;
    }

    if (config.resolutions.length === 0) {
      showToast('At least one resolution must be selected', 'error');
      return false;
    }

    if (config.qualities.length === 0) {
      showToast('At least one quality must be selected', 'error');
      return false;
    }




    return true;
  }

  const handleInstall = () => {
    if (validateConfig()) {
      const manifestUrl = getManifestUrl();
      const stremioUrl = manifestUrl.replace(/^https?/, 'stremio');
      window.location.href = stremioUrl;
    }
  }

  const handleInstallToWeb = () => {
    if (validateConfig()) {
      const manifestUrl = getManifestUrl();
      const encodedManifestUrl = encodeURIComponent(manifestUrl);
      window.location.href = `https://web.stremio.com/#/addons?addon=${encodedManifestUrl}`;
    }
  }

  const handleCopyLink = () => {
    if (validateConfig()) {
      const manifestUrl = getManifestUrl();
      navigator.clipboard.writeText(manifestUrl).then(() => {
        showToast('Manifest URL copied to clipboard', 'success');
      });
    }
  }

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
        
      }
    } catch (error) {
      console.error('Failed to load config', error);
    }
  }, []);


  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 style={{"textAlign": "center"}}>AIOStreams</h1>
        <div className={styles.section}>
          <h2 style={{"padding": "5px"}}>Resolutions</h2>
          <p style={{"padding": "5px"}}>Choose which resolutions you want to see and reorder their priority if needed.</p>
          <SortableCardList
            items={allowedResolutions}
            selectedItems={resolutions}
            onUpdate={setResolutions}
          />
        </div>

        <div className={styles.section}>
          <h2 style={{"padding": "5px"}}>Qualities</h2>
          <p style={{"padding": "5px"}}>Choose which qualities you want to see and reorder their priority if needed.</p>
          <SortableCardList
            items={allowedQualities}
            selectedItems={qualities}
            onUpdate={setQualities}
          />
        </div>


        <div className={styles.section}>
          <h2 style={{"padding": "5px"}}>Visual Tags</h2>
          <p style={{"padding": "5px"}}>Choose which visual tags you want to see and reorder their priority if needed.</p>
          <SortableCardList
            items={allowedVisualTags}
            selectedItems={visualTags}
            onUpdate={setVisualTags}
          />
        </div>

        <div className={styles.section}>
          <h2 style={{"padding": "5px"}}>Sort By</h2>
          <p style={{"padding": "5px"}}>Choose the criteria by which to sort streams.</p>
          <SortableCardList
            items={allowedSortCriteria}
            selectedItems={sortCriteria}
            onUpdate={setSortCriteria}
          />
        </div>

        <div className={styles.section}>
          <div className={styles.setting}>
            <div className={styles.settingDescription}>
              <h2 style={{"padding": "5px"}}>Prioritise Language</h2>
              <p style={{"padding": "5px"}}>Choose a language to prioritise when selecting streams.</p>
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
              <h2 style={{"padding": "5px"}}>Formatter</h2>
              <p style={{"padding": "5px"}}>Choose the formatter to use for streaming.</p>
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
          <h2 style={{"padding": "5px"}}>Services</h2>
          <ServiceInput
            serviceName="Real Debrid"
            enabled={services.realdebrid.enabled}
            setEnabled={(enabled) => setServices({ ...services, realdebrid: { ...services.realdebrid, enabled } })}
            fields={[
              {
                label: 'API Key',
                value: services.realdebrid.apiKey,
                setValue: (value) => setServices({ ...services, realdebrid: { ...services.realdebrid, apiKey: value } })
              }
            ]}
          />
          <ServiceInput
            serviceName="All Debrid"
            enabled={services.alldebrid.enabled}
            setEnabled={(enabled) => setServices({ ...services, alldebrid: { ...services.alldebrid, enabled } })}
            fields={[
              {
                label: 'API Key',
                value: services.alldebrid.apiKey,
                setValue: (value) => setServices({ ...services, alldebrid: { ...services.alldebrid, apiKey: value } })
              }
            ]}
          />
          <ServiceInput
            serviceName="Premiumize"
            enabled={services.premiumize.enabled}
            setEnabled={(enabled) => setServices({ ...services, premiumize: { ...services.premiumize, enabled } })}
            fields={[
              {
                label: 'API Key',
                value: services.premiumize.apiKey,
                setValue: (value) => setServices({ ...services, premiumize: { ...services.premiumize, apiKey: value } })
              }
            ]}
          />

          <ServiceInput
            serviceName="Debrid Link"
            enabled={services.debridlink.enabled}
            setEnabled={(enabled) => setServices({ ...services, debridlink: { ...services.debridlink, enabled } })}
            fields={[
              {
                label: 'API Key',
                value: services.debridlink.apiKey,
                setValue: (value) => setServices({ ...services, debridlink: { ...services.debridlink, apiKey: value } })
              }
            ]}
          />

          <ServiceInput
            serviceName="Torbox"
            enabled={services.torbox.enabled}
            setEnabled={(enabled) => setServices({ ...services, torbox: { ...services.torbox, enabled } })}
            fields={[
              {
                label: 'API Key',
                value: services.torbox.apiKey,
                setValue: (value) => setServices({ ...services, torbox: { ...services.torbox, apiKey: value } })
              }
            ]}
          />

          <ServiceInput
            serviceName="Offcloud"
            enabled={services.offcloud.enabled}
            setEnabled={(enabled) => setServices({ ...services, offcloud: { ...services.offcloud, enabled } })}
            fields={[
              {
                label: 'API Key',
                value: services.offcloud.apiKey,
                setValue: (value) => setServices({ ...services, offcloud: { ...services.offcloud, apiKey: value } })
              }
            ]}
          />

          <ServiceInput
            serviceName="put.io"
            enabled={services['putio'].enabled}
            setEnabled={(enabled) => setServices({ ...services, putio: { ...services['putio'], enabled } })}
            fields={[
              {
                label: 'Client ID',
                value: services['putio'].clientId,
                setValue: (value) => setServices({ ...services, putio: { ...services['putio'], clientId: value } })
              },
              {
                label: 'Token',
                value: services['putio'].token,
                setValue: (value) => setServices({ ...services, putio: { ...services['putio'], token: value } })
              }
            ]}
          />

          <ServiceInput
            serviceName="Easynews"
            enabled={services.easynews.enabled}
            setEnabled={(enabled) => setServices({ ...services, easynews: { ...services.easynews, enabled } })}
            fields={[
              {
                label: 'Username',
                value: services.easynews.username,
                setValue: (value) => setServices({ ...services, easynews: { ...services.easynews, username: value } })
              },
              {
                label: 'Password',
                value: services.easynews.password,
                setValue: (value) => setServices({ ...services, easynews: { ...services.easynews, password: value } })
              }
            ]}
          />

          {Object.values(services).some(service => service.enabled) && (
            <div className={styles.section}>
            <div className={styles.setting}>
            <div className={styles.settingDescription}>
              <h2 style={{ padding: '5px' }}>Only Show Cached Streams</h2>
              <p style={{ padding: '5px' }}>Enable this option to only show cached streams and not show download to service links. Depending on your addons, you may still get P2P links</p>
            </div>
            <div className={styles.settingInput}>
              <input
                type="checkbox"
                checked={onlyShowCachedStreams}
                onChange={(e) => setOnlyShowCachedStreams(e.target.checked)}
              />
            </div>
            </div>
            </div>
          )}
        </div>

        <div className={styles.section}>
          <h2 style={{"padding": "5px"}}>Addons</h2>
          <AddonsList
            choosableAddons={getChoosableAddons()}
            addonOptions={addonOptions}
            addons={addons}
            setAddons={setAddons} 
          />
        </div>
        
        <button onClick={handleInstall} className={styles.installButton}>Install</button>
        <button onClick={handleInstallToWeb} className={styles.installButton}>Install to Stremio Web</button>
        <button onClick={handleCopyLink} className={styles.installButton}>Copy Link</button>
      </div>
      <ToastContainer 
      stacked
      position='top-center'
      transition={Slide}
      draggablePercent={30}
      />
    </div>
  );
}