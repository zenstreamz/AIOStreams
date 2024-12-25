import express, { Request, Response } from 'express';
import path from 'path';
import { AIOStreams } from './addon';
import { Config, StreamRequest } from '@aiostreams/types';

const app = express();
const port = process.env.PORT || 3000;

const manifest = {
  name: 'aiostreams',
  id: 'viren070.aiostreams.com',
  version: '1.0.0',
  description: 'Combine your streams into one addon',
  catalogs: [],
  resources: ['stream'],
  types: ['movie', 'series'],
  behaviorHints: {
    configurable: true,
    configurationRequired: true,
  },
};

// Built-in middleware for parsing JSON
app.use(express.json());

// Built-in middleware for parsing URL-encoded data
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.append('Access-Control-Allow-Origin', '*');
  res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  next();
});

app.use(express.static(path.join(__dirname, '../../frontend/out')));

app.get(['/configure', '/:config/configure'], (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/out/configure.html'));
});

app.get('/manifest.json', (req, res) => {
  res.status(200).json(manifest);
});

app.get('/:config/manifest.json', (req, res) => {
  let configuredManifest = manifest;
  configuredManifest.behaviorHints.configurationRequired = false;
  res.status(200).json(configuredManifest);
});

// Route for /stream
app.get('/stream/:type/:id', (req: Request, res: Response) => {
  const response = {
    streams: [
      {
        url: 'https://example.com',
        name: 'Missing Config',
        description: 'You must configure this addon to use it',
      },
    ],
  };

  res.status(200).json(response);
});

app.get('/:config/stream/:type/:id', (req: Request, res: Response) => {
  const config = req.params.config;

  // Decode Base64 encoded JSON config
  const decodedConfig = Buffer.from(config, 'base64').toString('utf-8');
  let configJson: Config;
  try {
    configJson = JSON.parse(decodedConfig);
  } catch (error: any) {
    res.status(400).send('Invalid config');
    return;
  }

  console.log(`Config: ${JSON.stringify(configJson, null, 2)}`);

  const streamMatch = new RegExp(
    `/${config}/stream/(movie|series)/tt([0-9]{7,})(?::([0-9]+):([0-9]+))?\.json`
  ).exec(req.path);

  if (!streamMatch) {
    res.status(400).send('Invalid request');
    return;
  }

  const [type, id, season, episode] = streamMatch.slice(1);

  console.log(
    `Type: ${type}, ID: ${id}, Season: ${season}, Episode: ${episode}`
  );

  let streamRequest: StreamRequest;

  switch (type) {
    case 'series':
      if (!season || !episode) {
        res.status(400).send('Invalid request');
        return;
      }
      streamRequest = {
        id,
        type: 'series',
        season,
        episode,
      };
      break;
    case 'movie':
      if (season || episode) {
        res.status(400).send('Invalid request');
        return;
      }
      streamRequest = {
        id,
        type: 'movie',
      };
      break;
    default:
      res.status(400).send('Invalid request');
      return;
  }
  try {
    const aioStreams = new AIOStreams(configJson);

    aioStreams.getStreams({ id, type, season, episode }).then((streams) => {
      res.status(200).json({ streams: streams });
    });
  } catch (error: any) {
    res.status(500).send(error.message);
  }
});

// define 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '../../frontend/out/404.html'));
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
