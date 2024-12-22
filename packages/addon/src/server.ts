import express, { Request, Response} from 'express';
import path from 'path';
import { AIOStreams } from './addon';
import { StreamRequest } from '@aiostreams/types';

const app = express();
const port = process.env.PORT || 3000;

// Built-in middleware for parsing JSON
app.use(express.json());

// Built-in middleware for parsing URL-encoded data
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/', (req, res) => {
  res.redirect('/configure');
});

app.get('/configure', (req, res) => {
  // Render a form for configuring the addon
  res.sendFile(path.join(__dirname, '..', 'public', 'configure.html'));
});

app.get('/stream/:type/:id', (req, res) => {
  const response = {
    streams: [
      {
        url: 'https://example.com',
        name: 'Missing Config',
        description: 'You must configure this addon to use it',
      },
    ],
  };

  res.send(JSON.stringify(response, null, 2)); // 2 spaces for indentation
});

app.get('/:config/stream/:type/:id', (req: Request, res: Response) => {
  const config = req.params.config;

  // Decode Base64 encoded JSON config
  const decodedConfig = Buffer.from(config, 'base64').toString('utf-8');
  const configJson = JSON.parse(decodedConfig);

  console.log(`Config: ${JSON.stringify(configJson, null, 2)}`);

  const streamMatch = new RegExp(`/${config}/stream/(movie|series)/tt([0-9]{7,})(?::([0-9]+):([0-9]+))?\.json`).exec(req.path);

  if (!streamMatch) {
    res.status(400).send('Invalid request');
    return;
  }

  const [type, id, season, episode] = streamMatch.slice(1);

  console.log(`Type: ${type}, ID: ${id}, Season: ${season}, Episode: ${episode}`);

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
      res.send(streams);
    });
  } catch (error: any) {
    res.status(500).send(error.message);
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
