import { version, description } from '../package.json';

export const manifest = {
  name: 'AIOStreams',
  id: 'viren070.aiostreams.com',
  version: version,
  description: description,
  catalogs: [],
  resources: ['stream'],
  background:
    'https://raw.githubusercontent.com/Viren070/AIOStreams/refs/heads/main/packages/frontend/public/assets/background.png',
  logo: 'https://raw.githubusercontent.com/Viren070/AIOStreams/refs/heads/main/packages/frontend/public/assets/logo.png',
  types: ['movie', 'series'],
  behaviorHints: {
    configurable: true,
    configurationRequired: true,
  },
};

export const getManifest = (configured: boolean): typeof manifest => {
  return {
    ...manifest,
    behaviorHints: {
      ...manifest.behaviorHints,
      configurationRequired: !configured,
    },
  };
};
