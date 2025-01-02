import {
  AIOStreams,
  compressAndEncrypt,
  decryptAndDecompress,
  getManifest,
  invalidConfig,
  missingConfig,
  validateConfig,
} from '@aiostreams/addon';
import { Config, StreamRequest } from '@aiostreams/types';

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
};

function createJsonResponse(data: any): Response {
  return new Response(JSON.stringify(data, null, 4), {
    headers: HEADERS,
  });
}

function createResponse(message: string, status: number): Response {
  return new Response(message, {
    status,
    headers: HEADERS,
  });
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    try {
      const url = new URL(decodeURIComponent(request.url));
      const components = url.pathname.split('/').splice(1);

      // handle static asset requests
      if (components.includes('_next')) {
        return env.ASSETS.fetch(request);
      }

      // redirect to /configure if root path is requested
      if (url.pathname === '/') {
        return Response.redirect(url.origin + '/configure', 301);
      }

      // handle /configure and /:config/configure requests
      if (components.includes('configure')) {
        if (components.length === 1) {
          return env.ASSETS.fetch(request);
        } else {
          // display configure page with config still in url
          return env.ASSETS.fetch(
            new Request(url.origin + '/configure', request)
          );
        }
      }

      // handle /manifest.json and /:config/manifest.json requests
      if (components.includes('manifest.json')) {
        if (components.length === 1) {
          return createJsonResponse(getManifest(false));
        } else {
          return createJsonResponse(getManifest(true));
        }
      }

      if (components.includes('stream')) {
        // when /stream is requested without config
        if (components.length !== 4) {
          return createJsonResponse(missingConfig(url.origin));
        }

        const config = components[0];
        const decodedPath = decodeURIComponent(url.pathname);

        const streamMatch = /stream\/(movie|series)\/([^/]+)\.json/.exec(decodedPath.replace(`/${config}`, ''));

        if (!streamMatch) {
          let path = decodedPath.replace(`/${config}`, '');
          console.error(`Invalid request: ${path}`);
          return createResponse('Invalid request', 400);
        }

        const [type, id] = streamMatch.slice(1);
        console.log(
          `Received /stream request with Type: ${type}, ID: ${id}`
        );

        let decodedConfig: Config;

        if (config.startsWith('E-')) {
          return createResponse('Encrypted Config Not Supported', 400);
        }
        try {
          decodedConfig = JSON.parse(atob(config));
        } catch (error: any) {
          return createJsonResponse(
            invalidConfig(url.origin, 'Outdated Configuration')
          );
        }
        const { valid, errorMessage, errorCode } =
          validateConfig(decodedConfig);
        if (!valid) {
          console.error(`Invalid config: ${errorMessage}`);
          return createJsonResponse(
            invalidConfig(url.origin, errorMessage ?? 'Unknown')
          );
        }

        if (type !== 'movie' && type !== 'series') {
          return createResponse('Invalid Request', 400);
        }

        let streamRequest: StreamRequest = { id, type };

        const aioStreams = new AIOStreams(decodedConfig);
        const streams = await aioStreams.getStreams(streamRequest);
        return createJsonResponse({ streams });
      }

      const notFound = await env.ASSETS.fetch(new Request(url.origin + '/404', request));
      return new Response(notFound.body, { ...notFound, status: 404 });
    } catch (e) {
      console.error(e);
      return new Response('Internal Server Error', {
        status: 500,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }
  },
} satisfies ExportedHandler<Env>;
