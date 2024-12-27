export const missingConfig = (origin: string) => {
  return {
    streams: [
      {
        externalUrl: origin + '/configure',
        name: '[⚠️] AIOStreams',
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
        name: '[⚠️] AIOStreams',
        description: errorMessage,
      },
    ],
  };
};
