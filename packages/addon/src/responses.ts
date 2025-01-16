import { Settings } from '@aiostreams/utils';

export const missingConfig = (origin: string) => {
  return {
    streams: [
      {
        externalUrl: origin + '/configure',
        name: `[⚠️] ${Settings.ADDON_NAME}`,
        description: 'You must configure this addon to use it',
      },
    ],
  };
};

export const invalidConfig = (origin: string, errorMessage: string) => {
  return {
    streams: [
      {
        externalUrl: origin + '/configure',
        name: `[⚠️] ${Settings.ADDON_NAME}`,
        description: errorMessage,
      },
    ],
  };
};
