import { version, description } from '../package.json';

export const manifest = {
  name: 'AIOStreams',
  id: 'viren070.aiostreams.com',
  version: version,
  description: description,
  catalogs: [],
  resources: ['stream'],
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
      configurationRequired: configured,
    },
  };
}