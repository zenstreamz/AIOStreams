import express, { Request, Response } from 'express';
import path from 'path';
import { AIOStreams } from './addon';
import { Config, StreamRequest } from '@aiostreams/types';
import { validateConfig } from './config';
import manifest from './manifest';
import { invalidConfig, missingConfig } from './responses';
import {Settings, compressAndEncrypt, decryptAndDecompress} from '@aiostreams/utils';

const app = express();

(Object.keys(Settings) as Array<keyof typeof Settings>).forEach((key) => {
  if (key === 'SECRET_KEY' || key === 'BRANDING') {
    if (Settings[key]) {
      console.log(`${key}: Set`);
    }
    if (key === 'SECRET_KEY' && !Settings[key]) {
      console.warn('SECRET_KEY: NOT SET! You have not set a SECRET_KEY, you will not be able to use encrypted configs');
    } else if (key === 'BRANDING' && !Settings[key]) {
      console.log('BRANDING: Not set');
    }
    return
  }
  console.log(`${key}: ${Settings[key]}`);
})

const rootUrl = (req: Request) =>
  `${req.protocol}://${req.hostname}${req.hostname === 'localhost' ? `:${Settings.PORT}` : ''}`;

// Built-in middleware for parsing JSON
app.use(express.json());

// Built-in middleware for parsing URL-encoded data
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.append('Access-Control-Allow-Origin', '*');
  res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  next();
});

app.get('/', (req, res) => {
  res.redirect('/configure');
});

app.get(['/_next/*', '/assets/*', '/icon.ico', '/configure.txt', ], (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/out', req.path));
});


if (Settings.BRANDING) {
  app.get('/branding', (req, res) => {
    res.send(Settings.BRANDING);
  });
}

app.get('/configure', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/out/configure.html'));
});

app.get('/:config/configure', (req, res) => {
  const config = req.params.config;
  if (config.startsWith("E-")) {
    if (!Settings.SECRET_KEY) {
      res.status(302).redirect('/configure');
      console.log('Secret key was not set, unable to decrypt config, redirecting to /configure')
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
            if (value) {
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

app.get('/:config/stream/:type/:id.json', (req: Request, res: Response) => {
  const config = req.params.config;

  // if config starts with E- then it is encrypted, decrypt it
  let configJson: Config;
  if (config.startsWith('E-')) {
    if (!Settings.SECRET_KEY) {
      res.status(500).send('Secret key not set');
      return;
    }
    try {
      const encryptedConfig = config.replace('E-', '');
      const [ivHex, encryptedHex] = encryptedConfig.split('-');
      const iv = Buffer.from(ivHex, 'hex');
      const encrypted = Buffer.from(encryptedHex, 'hex');
      const decryptedData = decryptAndDecompress(encrypted, iv);
      configJson = JSON.parse(decryptedData);
    } catch (error: any) {
      res.status(400).send('Failed to decrypt config');
      return;
    }
  } else {
    // Decode Base64 encoded JSON config
    const decodedConfig = Buffer.from(config, 'base64').toString('utf-8');
    try {
      configJson = JSON.parse(decodedConfig);
    } catch (error: any) {
      res.status(400).send('Invalid config');
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
          if (value.startsWith('E-')) {
            try {
              const [ivHex, encryptedHex] = value.replace('E-', '').split('-');
              const iv = Buffer.from(ivHex, 'hex');
              const encrypted = Buffer.from(encryptedHex, 'hex');
              const decrypted = decryptAndDecompress(encrypted, iv);
              service.credentials[key] = decrypted;
            } catch (error: any) {
              console.error(`Failed to decrypt ${key} for service ${service.id}`);
              return invalidConfig(rootUrl(req), `Failed to decrypt ${key} for service ${service.id}`);
            }
          }
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
    console.error(`Invalid request: ${decodedPath.replace(`/${config}`, '')}`);
    res.status(400).send('Invalid request');
    return;
  }

  const [type, id] = streamMatch.slice(1);

  console.log(`Received /stream request with Type: ${type}, ID: ${id}`);

  if (type !== 'movie' && type !== 'series') {
    res.status(400).send('Invalid type');
    return;
  }
  let streamRequest: StreamRequest = { id, type };

  try {
    const { valid, errorCode, errorMessage } = validateConfig(configJson);
    if (!valid) {
      console.error(`Invalid config: ${errorCode} - ${errorMessage}`);
      res
        .status(200)
        .json(invalidConfig(rootUrl(req), errorMessage ?? 'Unknown'));
      return;
    }

    const aioStreams = new AIOStreams(configJson);
    aioStreams.getStreams(streamRequest).then((streams) => {
      res.status(200).json({ streams: streams });
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

app.post('/encrypt-user-data', (req, res) => {
  const { data } = req.body;

  if (!data) {
    res.status(400).json({ success: false, message: 'No data provided' });
    return;
  }

  try {
    if (!Settings.SECRET_KEY) {
      res.status(500).json({ success: false, message: 'Secret key not set' });
      return;
    }
    const encryptedData = compressAndEncrypt(data);

    res.status(200).json({ success: true, data: encryptedData });
  } catch (error: any) {
    console.error(error);
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
  console.log(`Server is running at http://localhost:${Settings.PORT}`);
});
