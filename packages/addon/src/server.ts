import express, { Request, Response } from 'express';
import path from 'path';
import { AIOStreams } from './addon';
import { Config, StreamRequest } from '@aiostreams/types';
import { validateConfig } from './config';
import { getManifest } from './manifest';
import { invalidConfig, missingConfig } from './responses';

const app = express();
const port = process.env.PORT || 3000;

const rootUrl = (req: Request) =>
  `${req.protocol}://${req.hostname}${req.hostname === 'localhost' ? `:${port}` : ''}`;

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

app.get('/', (req, res) => {
  res.redirect('/configure');
});

app.get(['/configure', '/:config/configure'], (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/out/configure.html'));
});

app.get('/manifest.json', (req, res) => {
  res.status(200).json(getManifest(false));
});

app.get('/:config/manifest.json', (req, res) => {
  res.status(200).json(getManifest(true));
});

// Route for /stream
app.get('/stream/:type/:id', (req: Request, res: Response) => {
  res.status(200).json(missingConfig(rootUrl(req)));
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

  const decodedPath = decodeURIComponent(req.path);

  const streamMatch = new RegExp(
    `/${config}/stream/(movie|series)/tt([0-9]{7,})(?::([0-9]+):([0-9]+))?\.json`
  ).exec(decodedPath);

  if (!streamMatch) {
    // log after removing config if present
    console.error(`Invalid request: ${decodedPath.replace(`/${config}`, '')}`);
    res.status(400).send('Invalid request');
    return;
  }

  const [type, id, season, episode] = streamMatch.slice(1);

  console.log(
    `Received /stream request with Type: ${type}, ID: ${id}, Season: ${season}, Episode: ${episode}`
  );

  let streamRequest: StreamRequest;

  switch (type) {
    case 'series':
      if (!season || !episode) {
        res.status(400).send('Invalid request');
        console.log(
          `Request type was series but season or episode was missing`
        );
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
        console.log(`Request type was movie but season or episode was present`);
        res.status(400).send('Invalid request');
        return;
      }
      streamRequest = {
        id,
        type: 'movie',
      };
      break;
    default:
      console.log(`Request type was invalid`);
      res.status(400).send('Invalid request');
      return;
  }
  try {
    const { valid, errorCode, errorMessage } = validateConfig(configJson);
    if (!valid) {
      console.error(`Invalid config: ${errorCode} - ${errorMessage}`);
      res
        .status(200)
        .json(invalidConfig(rootUrl(req), errorMessage ?? 'Unknown'));
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

app.get('/mediafusion-encrypt', (req, res) => {
  const data = {"streaming_provider":null,"selected_catalogs":[],"selected_resolutions":["4k","2160p","1440p","1080p","720p","576p","480p","360p","240p",null],"enable_catalogs":true,"enable_imdb_metadata":false,"max_size":"inf","max_streams_per_resolution":"500","torrent_sorting_priority":[{"key":"language","direction":"desc"},{"key":"cached","direction":"desc"},{"key":"resolution","direction":"desc"},{"key":"quality","direction":"desc"},{"key":"size","direction":"desc"},{"key":"seeders","direction":"desc"},{"key":"created_at","direction":"desc"}],"show_full_torrent_name":true,"nudity_filter":["Severe"],"certification_filter":["Adults"],"language_sorting":["English","Tamil","Hindi","Malayalam","Kannada","Telugu","Chinese","Russian","Arabic","Japanese","Korean","Taiwanese","Latino","French","Spanish","Portuguese","Italian","German","Ukrainian","Polish","Czech","Thai","Indonesian","Vietnamese","Dutch","Bengali","Turkish","Greek","Swedish",null],"quality_filter":["BluRay/UHD","WEB/HD","DVD/TV/SAT","CAM/Screener","Unknown"],"api_password":null,"mediaflow_config":null,"rpdb_config":null,"live_search_streams":false,"contribution_streams":false};
  const encryptUrl = 'https://mediafusion.elfhosted.com/encrypt-user-data';
  fetch(encryptUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((data) => {
      res.json(data);
    })
    .catch((error) => {
      console.error('Error:', error);
      res.status(500).send('Internal server error');
    });
});
// define 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '../../frontend/out/404.html'));
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
