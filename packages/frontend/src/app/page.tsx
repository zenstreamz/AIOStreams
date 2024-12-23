'use client';

import { useState } from 'react';
import styles from './page.module.css';

const predefinedResolutions = ['2160p', '1080p', '720p', '480p', 'Unknown'];
const predefinedQualities = [
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
const predefinedVisualTags = ['HDR10+', 'HDR10', 'HDR', 'DV', 'IMAX', 'AI'];
const predefinedSortBy = [
  'resolution',
  'visualTag',
  'size',
  'quality',
  'seeders',
  'cached',
];
const predefinedFormatters = ['gdrive', 'torrentio'];
const debridServices = [
  'RealDebrid',
  'Torbox',
  'DebridLink',
  'AllDebrid',
  'Premiumize',
  'Offcloud',
  'PutIo',
];

export default function Configure() {
  interface Config {
    resolutions: string[];
    qualities: string[];
    visualTags: string[];
    sortBy: string[];
    onlyShowCachedStreams: boolean;
    prioritiseLanguage: string | null;
    addons: string[];
    formatter: string;
    apiKeys: { [key: string]: string };
  }

  const [config, setConfig] = useState<Config>({
    resolutions: predefinedResolutions,
    qualities: predefinedQualities,
    visualTags: predefinedVisualTags,
    sortBy: predefinedSortBy,
    onlyShowCachedStreams: false,
    prioritiseLanguage: null,
    addons: [],
    formatter: predefinedFormatters[0],
    apiKeys: {},
  });

  const [selectedDebridService, setSelectedDebridService] = useState('');

  const handleSubmit = (e: any) => {
    e.preventDefault();
    const filteredConfig = {
      ...config,
      apiKeys: Object.fromEntries(
        Object.entries(config.apiKeys).filter(([_, value]) => value)
      ),
    };
    const encodedConfig = btoa(JSON.stringify(filteredConfig));
    window.location.href = `/${encodedConfig}/manifest.json`;
  };

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('apiKeys.')) {
      const key = name.split('.')[1];
      setConfig((prevConfig) => ({
        ...prevConfig,
        apiKeys: {
          ...prevConfig.apiKeys,
          [key]: value,
        },
      }));
    } else {
      setConfig((prevConfig) => ({
        ...prevConfig,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleArrayChange = (e: any, arrayName: string) => {
    const { value } = e.target;
    setConfig((prevConfig) => ({
      ...prevConfig,
      [arrayName]: value.split(','),
    }));
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Configure AIOStreams</h1>
        <form onSubmit={handleSubmit} className={styles.configForm}>
          <label className={styles.configLabel}>
            Resolutions:
            <input
              type="text"
              name="resolutions"
              value={config.resolutions.join(',')}
              onChange={(e) => handleArrayChange(e, 'resolutions')}
              className={styles.configInput}
            />
          </label>
          <label className={styles.configLabel}>
            Qualities:
            <input
              type="text"
              name="qualities"
              value={config.qualities.join(',')}
              onChange={(e) => handleArrayChange(e, 'qualities')}
              className={styles.configInput}
            />
          </label>
          <label className={styles.configLabel}>
            Visual Tags:
            <input
              type="text"
              name="visualTags"
              value={config.visualTags.join(',')}
              onChange={(e) => handleArrayChange(e, 'visualTags')}
              className={styles.configInput}
            />
          </label>
          <label className={styles.configLabel}>
            Sort By:
            <input
              type="text"
              name="sortBy"
              value={config.sortBy.join(',')}
              onChange={(e) => handleArrayChange(e, 'sortBy')}
              className={styles.configInput}
            />
          </label>
          <label className={styles.configLabel}>
            Prioritise Language:
            <input
              type="text"
              name="prioritiseLanguage"
              value={config.prioritiseLanguage || ''}
              onChange={handleChange}
              className={styles.configInput}
            />
          </label>
          <label className={styles.configLabel}>
            Addons:
            <input
              type="text"
              name="addons"
              value={config.addons.join(',')}
              onChange={(e) => handleArrayChange(e, 'addons')}
              className={styles.configInput}
            />
          </label>
          <label className={styles.configLabel}>
            Formatter:
            <select
              name="formatter"
              value={config.formatter}
              onChange={handleChange}
              className={styles.configSelect}
            >
              {predefinedFormatters.map((formatter) => (
                <option key={formatter} value={formatter}>
                  {formatter}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.configLabel}>
            Debrid Service:
            <select
              value={selectedDebridService}
              onChange={(e) => setSelectedDebridService(e.target.value)}
              className={styles.configSelect}
            >
              <option value="">Select a service</option>
              {debridServices.map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </select>
          </label>
          {selectedDebridService && (
            <>
              <label className={styles.configLabel}>
                {selectedDebridService} API Key:
                <input
                  type="text"
                  name={`apiKeys.${selectedDebridService.toLowerCase()}`}
                  value={
                    config.apiKeys[selectedDebridService.toLowerCase()] || ''
                  }
                  onChange={handleChange}
                  className={styles.configInput}
                />
              </label>
              <label className={styles.configLabel}>
                Only Show Cached Streams:
                <input
                  type="checkbox"
                  name="onlyShowCachedStreams"
                  checked={config.onlyShowCachedStreams}
                  onChange={handleChange}
                  className={styles.configInput}
                />
              </label>
            </>
          )}
          <button type="submit">Submit</button>
        </form>
      </main>
    </div>
  );
}
