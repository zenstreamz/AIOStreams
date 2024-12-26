import { AIOStreams, getManifest, validateConfig } from '@aiostreams/addon';
import { Config, StreamRequest } from '@aiostreams/types';

function createJsonResponse(data: any): Response {
    return new Response(JSON.stringify(data, null, 4), {
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
    });
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		try {
            
            const url = new URL(
                decodeURIComponent(request.url)
            );
            const components = url.pathname.split('/').splice(1);
            console.log(components);
            if (components.includes('_next')) {
                return env.ASSETS.fetch(request);
            }
            

            if (components.includes('configure')) {
                let components = url.pathname.split('/');
                console.log(components);
                if (components.length === 1)  {
                    return env.ASSETS.fetch(request);

                } else {
                    return env.ASSETS.fetch(new Request(url.origin + '/configure', request));
                }
            }


            if (url.pathname === '/') {
                return Response.redirect(url.origin + "/configure", 301);
            }

            if (components.includes('manifest.json')) {
                if (components.length === 1) {
                    return createJsonResponse(getManifest(true));
                } else {
                    return createJsonResponse(getManifest(false));
                }
            }

            if (components.includes('stream')) {


                if (components.length !== 4) {
                    return createJsonResponse({
                        streams: [
                            {
                                externalUrl: url.origin + '/configure',
                                name: 'Missing Config',
                                description: 'You must configure this addon to use it',
                            },
                        ],
                    });
                }
                const config = components[0];
                const decodedPath = decodeURIComponent(url.pathname);
                
                const streamMatch = new RegExp(
                    `/${config}/stream/(movie|series)/tt([0-9]{7,})(?::([0-9]+):([0-9]+))?.json`
                  ).exec(decodedPath);

                if (!streamMatch) {
                    let path = decodedPath.replace(`/${config}`, '')
                    console.error(`Invalid request: ${path}`);
                    return new Response('Invalid Request', {
                        status: 400,
                        headers: {
                            'Content-Type': 'text/plain',
                        },
                    });
                }
                
                const [type, id, season, episode] = streamMatch.slice(1);
                console.log(`Received /stream request with Type: ${type}, ID: ${id}, Season: ${season}, Episode: ${episode}`);

                let decodedConfig: Config;
                try {
                    decodedConfig = JSON.parse(atob(config));
                } catch (error: any) {
                    return createJsonResponse({
                        streams: [
                            {
                                externalUrl: url.origin + '/configure',
                                name: 'Invalid Config',
                                description: 'You must configure this addon to use it',
                            },
                        ],
                    })
                }
                const {valid, errorMessage, errorCode} = validateConfig(decodedConfig);
                if (!valid) {
                    console.error(`Invalid config: ${errorMessage}`);
                    return createJsonResponse({
                        streams: [
                            {
                                externalUrl: url.origin + '/configure',
                                name: 'Invalid Config',
                                description: errorMessage,
                            },
                        ],
                    });
                }

                let streamRequest: StreamRequest;

                switch (type) {
                    case 'series':
                        if (!season || !episode) {
                            return new Response('Invalid Request', {
                                status: 400,
                                headers: {
                                    'Content-Type': 'text/plain',
                                },
                            });
                        }
                        streamRequest = {
                            id,
                            type: 'series',
                            season: season,
                            episode: episode,
                        };
                        break;
                    case 'movie':
                        streamRequest = {
                            id,
                            type: 'movie',
                        };
                        break;
                    default:
                        return new Response('Invalid Request', {
                            status: 400,
                            headers: {
                                'Content-Type': 'text/plain',
                            },
                        });
                }

                const aioStreams = new AIOStreams(decodedConfig);
                const streams = await aioStreams.getStreams(streamRequest);
                return createJsonResponse({ streams });

            }

            return env.ASSETS.fetch(new Request(url.origin + "/404", request));

                    
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
