/* eslint-disable @typescript-eslint/no-empty-function */
'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import { Config } from '@aiostreams/types';
import SortableCardList from '../../components/SortableCardList';
import ServiceInput from '../../components/ServiceInput';

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
const allowedServices = [
  'Real Debrid',
  'Torbox',
  'Debrid Link',
  'All Debrid',
  'Premiumize',
  'Offcloud',
  'put.io',
  'Easynews'
];


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
    putio: { enabled: false, apiKey: '' },
    easynews: { enabled: false, username: '', password: '' }
  });
  const [onlyShowCachedStreams, setOnlyShowCachedStreams] = useState<boolean>(false);
  const [prioritiseLanguage, setPrioritiseLanguage] = useState<string | null>(null);
  const [addons, setAddons] = useState<Config['addons']>([]);
  const [choosableAddons, setChoosableAddons] = useState<string[]>([]);


  const getChoosableAddons = () => {
    // only if torbox service is enabled we can use torbox addon
    const achoosableAddons: string[] = [];
    achoosableAddons.push('torrentio');
    if (services.torbox.enabled) {
      achoosableAddons.push('torbox');
    }
    setChoosableAddons(choosableAddons);
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
                label: 'API Key',
                value: services['putio'].apiKey,
                setValue: (value) => setServices({ ...services, putio: { ...services['putio'], apiKey: value } })
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
          )}
        </div>
        
        
        <details><summary>Config</summary><pre>{JSON.stringify(createConfig(), null, 2)}</pre></details>
      </div>
    </div>
  );
}