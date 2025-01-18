import { Settings } from '@aiostreams/utils';

export const errorResponse = (
  errorMessage: string,
  origin?: string,
  path?: string,
  externalUrl?: string
) => {
  return {
    streams: [errorStream(errorMessage, origin, path, externalUrl)],
  };
};

export const errorStream = (
  errorMessage: string,
  origin?: string,
  path?: string,
  externalUrl?: string
) => {
  return {
    externalUrl: (origin && path ? origin + path : undefined) || externalUrl,
    name: `[❌] ${Settings.ADDON_NAME}`,
    description: errorMessage,
  };
};
