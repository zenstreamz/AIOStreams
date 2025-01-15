import express, { Request, Response } from 'express';

import path from 'path';
import { AIOStreams } from './addon';
import { Config, StreamRequest } from '@aiostreams/types';
import { validateConfig } from './config';
import manifest from './manifest';
import { invalidConfig, missingConfig } from './responses';
import {Settings, compressAndEncrypt, decryptAndDecompress, parseAndDecryptString} from '@aiostreams/utils';

const app = express();
console.log(`|INF| server > init: Starting server and loading settings...`);
(Object.keys(Settings) as Array<keyof typeof Settings>).forEach((key) => {
  if (key === 'SECRET_KEY' || key === 'BRANDING') {
    if (Settings[key]) {
      console.log(`|INF| server > init: ${key} = ${Settings[key].replace(/./g, '*').slice(0, 32)}`)
    }
    if (key === 'SECRET_KEY' && !Settings[key]) {
      console.warn(`|WRN| server > init: ${key} = ${Settings[key]}`);
    }
    return;
  }
  console.log(`|INF| server > init: ${key} = ${Settings[key]}`);
})
if (!Settings.SECRET_KEY) {
  console.warn(`|WRN| server > init: SECRET_KEY is not set, data encryption is disabled! `);
}

const rootUrl = (req: Request) =>
  `${req.protocol}://${req.hostname}${req.hostname === 'localhost' ? `:${Settings.PORT}` : ''}`;

// Built-in middleware for parsing JSON
app.use(express.json());
// Built-in middleware for parsing URL-encoded data
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.append('Access-Control-Allow-Origin', '*');
  res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  console.log(`|DBG| server > ${req.method} ${req.path.replace(/\/eyJ[\w\=]+/g, '/*******').replace(/\/E-[\w-]+/g, '/*******')}`);
  next();
});

app.get('/', (req, res) => {
  res.redirect('/configure');
});

app.get(['/_next/*', '/assets/*', '/icon.ico', '/configure.txt', ], (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/out', req.path));
});

app.get('/configure', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/out/configure.html'));
});

app.get('/:config/configure', (req, res) => {
  const config = req.params.config;
  if (config.startsWith("E-")) {
    if (!Settings.SECRET_KEY) {
      res.status(302).redirect('/configure');
      console.log(`|INF| server > Received encrypted config but no secret key set, redirecting to /configure`);
      return;
    }
    const encryptedConfig = config.replace('E-', '');
    const [ivHex, encryptedHex] = encryptedConfig.split('-');
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decryptedData = decryptAndDecompress(encrypted, iv);
    const configJson = JSON.parse(decryptedData);
    if (configJson.services) {
      configJson.services.forEach((service: any) => {
        if (service.credentials) {
          // go through each key in the credentials object
          // encrypt the value and replace the value with the encrypted value
          Object.keys(service.credentials).forEach((key) => {
            const value = service.credentials[key];
            if (value && value.match(/^E-[0-9a-fA-F]{32}-[0-9a-fA-F]+$/) === null) {
              // if the value is not already encrypted, encrypt it
              try {
                service.credentials[key] = compressAndEncrypt(value);
              } catch (error: any) {
                console.error(`Failed to encrypt ${key} for service ${service.id}`);
                service.credentials[key] = '';
              }
            }
          });
        }
      });
    }
    // also encrypt the apiPassword, proxyUrl, and publicIp if they are not already encrypted
    if (configJson.mediaFlowConfig?.apiPassword && configJson.mediaFlowConfig.apiPassword.match(/^E-[0-9a-fA-F]{32}-[0-9a-fA-F]+$/) === null) {
      try {
        configJson.mediaFlowConfig.apiPassword = compressAndEncrypt(configJson.mediaFlowConfig.apiPassword);
      } catch (error: any) {
        console.error(`Failed to encrypt apiPassword for MediaFlow`);
        configJson.mediaFlowConfig.apiPassword = '';
      }
    }
    if (configJson.mediaFlowConfig?.proxyUrl && configJson.mediaFlowConfig.proxyUrl.match(/^E-[0-9a-fA-F]{32}-[0-9a-fA-F]+$/) === null) {
      try {
        configJson.mediaFlowConfig.proxyUrl = compressAndEncrypt(configJson.mediaFlowConfig.proxyUrl);
      } catch (error: any) {
        console.error(`Failed to encrypt proxyUrl for MediaFlow`);
        configJson.mediaFlowConfig.proxyUrl = '';
      }
    }
    if (configJson.mediaFlowConfig?.publicIp && configJson.mediaFlowConfig.publicIp.match(/^E-[0-9a-fA-F]{32}-[0-9a-fA-F]+$/) === null) {
      try {
        configJson.mediaFlowConfig.publicIp = compressAndEncrypt(configJson.mediaFlowConfig.publicIp);
      } catch (error: any) {
        console.error(`Failed to encrypt publicIp for MediaFlow`);
        configJson.mediaFlowConfig.publicIp = '';
      }
    }
    // encrypt the urls in the addons options if they are not already encrypted
    // this will be any option that matches the key pattern /^url\d+$/
    if (configJson.addons) {
      configJson.addons.forEach((addon: any) => {
        if (addon.options) {
          Object.keys(addon.options).forEach((key) => {
            const value = addon.options[key];
            console.log(`|DBG| server > ${key} = ${value}`);
            if (value && value.match(/^E-[0-9a-fA-F]{32}-[0-9a-fA-F]+$/) === null && key.match(/url/i)) {
              console.log(`|DBG| server > Encrypting ${key} for addon ${addon.id}`);
              try {
                addon.options[key] = compressAndEncrypt(value);
              } catch (error: any) {
                console.error(`Failed to encrypt ${key} for addon ${addon.id}`);
                addon.options[key] = '';
              }
            }
          });
        }
      });
    }
    const base64Config = Buffer.from(JSON.stringify(configJson)).toString('base64');
    res.redirect(`/${base64Config}/configure`);
    return;
  }
  res.sendFile(path.join(__dirname, '../../frontend/out/configure.html'));  
});

app.get('/manifest.json', (req, res) => {
  res.status(200).json(manifest(false));
});

app.get('/:config/manifest.json', (req, res) => {
  res.status(200).json(manifest(true));
});

// Route for /stream
app.get('/stream/:type/:id', (req: Request, res: Response) => {
  res.status(200).json(missingConfig(rootUrl(req)));
});

app.get('/:config/stream/:type/:id.json', (req, res: Response): void => {
  const config = req.params.config;

  // if config starts with E- then it is encrypted, decrypt it
  let configJson: Config;
  if (config.startsWith('E-')) {
    if (!Settings.SECRET_KEY) {
      console.error(`|ERR| server > Secret key not set, cannot decrypt encrypted config`);
      res.status(200).json(invalidConfig(rootUrl(req), 'Secret key not set'));
      return;
    }
    try {
      const decryptedConfig = parseAndDecryptString(config);
      if (!decryptedConfig) {
        throw new Error('Failed to decrypt config');
      }
      configJson = JSON.parse(decryptedConfig);
    } catch (error: any) {
      res.status(200).json(invalidConfig(rootUrl(req), 'Unable to decrypt config'));
      return;
    }
  } else {
    // Decode Base64 encoded JSON config
    const decodedConfig = Buffer.from(config, 'base64').toString('utf-8');
    try {
      configJson = JSON.parse((decodedConfig));
    } catch (error: any) {
      console.error(`|ERR| server > Unable to parse config: ${error.message}`);
      res.status(200).json(invalidConfig(rootUrl(req), 'Unable to parse config'));
      return;
    }
  }
  // look through the credentials object in each service and decrypt the values if they are encrypted
  if (configJson.services) {
    configJson.services.forEach((service: any) => {
      if (service.credentials) {
        // go through each key in the credentials object
        // decrypt the value and replace the value with the decrypted value
        Object.keys(service.credentials).forEach((key) => {
          const value = service.credentials[key];
          const decrypted = parseAndDecryptString(value);
          if (!decrypted) {
            console.error(`|ERR| server > Failed to decrypt ${key} for service ${service.id}`);
            res.status(200).json(invalidConfig(rootUrl(req), 'Failed to decrypt config'));
          }
          service.credentials[key] = decrypted;
        });
      }
    })
  };
  // also decrypt the apiPassword, proxyUrl, and publicIp if they are encrypted
  if (configJson.mediaFlowConfig?.apiPassword) {
    const decrypted = parseAndDecryptString(configJson.mediaFlowConfig.apiPassword);
    if (!decrypted) {
      console.error(`|ERR| server > Failed to decrypt apiPassword for MediaFlow`);
      res.status(200).json(invalidConfig(rootUrl(req), 'Failed to decrypt config'));
      return;
    }
    configJson.mediaFlowConfig.apiPassword = decrypted;
  }
  if (configJson.mediaFlowConfig?.proxyUrl) {
    const decrypted = parseAndDecryptString(configJson.mediaFlowConfig.proxyUrl);
    if (!decrypted) {
      console.error(`|ERR| server > Failed to decrypt proxyUrl for MediaFlow`);
      res.status(200).json(invalidConfig(rootUrl(req), 'Failed to decrypt config'));
      return;
    }
    configJson.mediaFlowConfig.proxyUrl = decrypted;
  }
  if (configJson.mediaFlowConfig?.publicIp) {
    const decrypted = parseAndDecryptString(configJson.mediaFlowConfig.publicIp);
    if (!decrypted) {
      console.error(`|ERR| server > Failed to decrypt publicIp for MediaFlow`);
      res.status(200).json(invalidConfig(rootUrl(req), 'Failed to decrypt config'));
      return;
    }
    configJson.mediaFlowConfig.publicIp = decrypted;
  }
  // also decrypt the addon options if they are encrypted
  if (configJson.addons) {
    configJson.addons.forEach((addon: any) => {
      if (addon.options) {
        Object.keys(addon.options).forEach((key) => {
          const value = addon.options[key];
          const decrypted = parseAndDecryptString(value);
          if (!decrypted) {
            console.error(`|ERR| server > Failed to decrypt ${key} for addon ${addon.id}`);
            res.status(200).json(invalidConfig(rootUrl(req), 'Failed to decrypt config'));
          }
          addon.options[key] = decrypted;
        });
      }
    });
  }
  


  const decodedPath = decodeURIComponent(req.path);

  const streamMatch = new RegExp(`/stream/(movie|series)/([^/]+)\.json`).exec(
    decodedPath.replace(`/${config}`, '')
  );
  if (!streamMatch) {
    // log after removing config if present
    console.error(`|ERR| server > request did not match expected format`);
    res.status(400).send('Invalid request');
    return;
  }

  const [type, id] = streamMatch.slice(1);

  console.log(`|DBG| server > Requesting streams for ${type} ${id}`);

  if (type !== 'movie' && type !== 'series') {
    console.error(`|ERR| server > Invalid type for stream request`);
    res.status(400).send('Invalid type');
    return;
  }
  let streamRequest: StreamRequest = { id, type };

  try {
    const { valid, errorCode, errorMessage } = validateConfig(configJson);
    if (!valid) {
      console.error(`|ERR| server > Received invalid config: ${errorCode} - ${errorMessage}`);
      res
        .status(200)
        .json(invalidConfig(rootUrl(req), errorMessage ?? 'Unknown'));
      return;
    }
    configJson.requestingIp = req.get('CF-Connecting-IP') || req.ip;
    const aioStreams = new AIOStreams(configJson);
    aioStreams.getStreams(streamRequest).then((streams) => {
      res.status(200).json({ streams: streams });
    });
  } catch (error: any) {
    console.error(`|ERR| server > Failed to serve streams: ${error.message}`);
    res.status(500).send(error.message);
  }
});

app.post('/encrypt-user-data', (req, res) => {
  const { data } = req.body;

  if (!data) {
    console.error('|ERR| server > /encrypt-user-data: No data provided');
    res.status(400).json({ success: false, message: 'No data provided' });
    return;
  }

  try {
    if (!Settings.SECRET_KEY) {
      console.error('|ERR| server > /encrypt-user-data: Secret key not set');
      res.status(500).json({ success: false, message: 'Secret key not set' });
      return;
    }
    const encryptedData = compressAndEncrypt(data);
    console.log(`|DBG| server > /encrypt-user-data: Encrypted data`);
    res.status(200).json({ success: true, data: encryptedData });
  } catch (error: any) {
    console.error(`|ERR| server > /encrypt-user-data: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// define 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '../../frontend/out/404.html'));
});

app.listen(Settings.PORT, () => {
  console.log(`|INF| server > init: Listening on port ${Settings.PORT}`);
});
