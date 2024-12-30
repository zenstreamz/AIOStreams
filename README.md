
<p align="center"><img src="https://raw.githubusercontent.com/Viren070/AIOStreams/refs/heads/main/packages/frontend/public/assets/logo.png" /></p>
<h1 align="center" id="title">AIOStreams</h1>


> [!WARNING]
> This addon is currently still in development. Things may not work as expected.

Combines streams from other addons into one and provides much greater customisation:

- Change the format of the resutls
- Filter all results by resolution, quality, visual tags, audio tags, encodes.
- Sort all results by quality, resolution, size, cached, visual tags, audio tags, encodes, seeders.
- Prioritise specific languages
- Specify a minimum and/or maximum size

You simply configure your options, add any API keys for any services you use, then enable whichever addons you want, and install.

The addon will scrape all results from all addons, apply your configuration, and give the results back to you in one go.

> [!NOTE]
> Do not install other addons that you have enabled through this addon. You will only cause unnecessary requests to the addon.
> I also do not recommend installing/enabling too many addons as they all scrape mostly the same sources.

## FAQ

### How does it work?

The addon has parsers for specific addons and can extract the relevant information.
It goes through each addon you selected and obtains the results with all the parsed information.

Once it has all the parsed information for each result, it can apply your configured sorting and filtering options.

### Why was this addon created?

I wanted to have a single addon that could scrape all the sources I wanted and apply my own custom filters and sorting options.
Many addons lack the ability to finely tune how you want your results to be sorted and filtered. 

Being able to change the format of every result was also a big factor in creating this addon. 
I preferred the format of my GDrive addon and wanted to use that format for all my results.
This makes it easier to parse the results and explain to less tech-savvy people how to pick the best result.

It also means you only have to install one addon instead of configuring multiple addons.

Furthermore, being able to apply a global filter and sort to all results means that you can get the best results from all sources displayed first, 
rather than having to check each addon individually.

### What are the currently supported addons?

It currently supports:

- Torrentio
- MediaFusion
- Comet
- Torbox Addon
- [Stremio GDrive](https://github.com/Viren070/stremio-gdrive-addon)
- Custom: You can input an addon URL and name and it will parse as much information as it can.

> [!NOTE]
> The URL can either be a URL to the manifest.json or the url without the manifest.json
> e.g. `https://torrentio.strem.fun/` or `https://torrentio.strem.fun/manifest.json`

### What are the supported formatters?

The addon can display your results in different formats. The two formats available are:

- gdrive:
  Uses the format from this [Stremio GDrive](https://github.com/Viren070/stremio-gdrive-addon) addon

  ![image](https://github.com/user-attachments/assets/9d9c74ab-afde-41f9-ba94-eaf8904b580b)

- torrentio:
  Uses the format from the Torrentio addon.

  ![image](https://github.com/user-attachments/assets/343dccb4-13c5-4b57-998a-82b763e9ebf9)

- torbox:
  Uses the format from the Torbox stremio addon.

  ![image](https://github.com/user-attachments/assets/21f90ee2-e81d-4a56-9e64-8937fb7ab2bc)

## Deploying your own instance

Rather than hosting the addon locally, you can make use of some services to deploy the addon for you. This would be your own instance. However, if anyone has the URL to it, they can also use it. 

### Cloudflare Workers

This addon can be deployed as a [Cloudflare Worker](https://workers.cloudflare.com/).

> [!NOTE]
> Cloudflare Workers cannot make requests to other Cloudflare Workers from the same account. If you have deployed the Stremio GDrive addon already on a Cloudflare account, the AIOStreams worker on the same account will not be able to fetch streams from your Stremio GDrive worker.


Follow the [guide](https://developers.cloudflare.com/workers/get-started/guide/) to get started and then run the following commands: 

```
git clone https://github.com/Viren070/AIOStreams.git
cd AIOStreams
npm i
npm run build
npm run deploy:cloudflare-worker
```

### Huggingface 


This addon can be deployed as a [Huggingface](https://huggingface.co/) space. 

> [!WARNING]
> Huggingface is centered around AI and as this addon is not related to AI, they may take it down.

> [!NOTE]
> GDrive doesn't seem to work on Huggingface Spaces. I'm not sure why.

1. Create a Huggingface account and on the [home page](https://huggingface.co) create a new space.

  ![Screenshot 2024-12-29 133648](https://github.com/user-attachments/assets/9d20a1ac-8eff-4748-8ed7-29da174bd438)

2. In the 'Create a space' menu, choose 'Docker' as the `Space SDK` and 'Blank' for the docker template.

  ![image](https://github.com/user-attachments/assets/99dc4aed-9331-4bde-a500-2fa1b9dac572)

  - Ensure the space is set to `Public`
  - The `Space name` can be anything.

3. After clicking 'Create Space', you should be taken to your space. Scroll down to 'Create your dockerfile', and click the link contained in the hint.

  ![image](https://github.com/user-attachments/assets/8020ca91-abbf-4077-9379-1e0b693444a0)

4. Copy and paste the following Dockerfile into the text box. Do not use the Dockerfile in this repository. Make sure to use the one below
<details>
<summary>Dockerfile - Click to expand</summary>
<pre><code>
FROM node:22-alpine AS builder
WORKDIR /build
RUN apk add --no-cache git && \
git clone https://github.com/Viren070/AIOStreams.git . && \
apk del git

RUN npm install


RUN npm run build

RUN npm --workspaces prune --omit=dev

FROM node:22-alpine AS final

WORKDIR /app

COPY --from=builder /build/package*.json /build/LICENSE ./

COPY --from=builder /build/packages/addon/package.*json ./packages/addon/
COPY --from=builder /build/packages/frontend/package.*json ./packages/frontend/
COPY --from=builder /build/packages/formatters/package.*json ./packages/formatters/
COPY --from=builder /build/packages/parser/package.*json ./packages/parser/
COPY --from=builder /build/packages/types/package.*json ./packages/types/
COPY --from=builder /build/packages/wrappers/package.*json ./packages/wrappers/

COPY --from=builder /build/packages/addon/dist ./packages/addon/dist
COPY --from=builder /build/packages/frontend/out ./packages/frontend/out
COPY --from=builder /build/packages/formatters/dist ./packages/formatters/dist
COPY --from=builder /build/packages/parser/dist ./packages/parser/dist
COPY --from=builder /build/packages/types/dist ./packages/types/dist
COPY --from=builder /build/packages/wrappers/dist ./packages/wrappers/dist

COPY --from=builder /build/node_modules ./node_modules

EXPOSE 7860

ENV PORT=7860

ENTRYPOINT ["npm", "run", "start:addon"]
</code></pre>
</details>

5. Click `Commit new file to main`

6. Your addon will be hosted at {username}-{space-name}.hf.space. You can also find a direct URL to it by clicking the 3 dots > Embed this space > Direct URL > Copy 



### Render

https://render.com/

> [!WARNING]
> Free instances 'spin down' after 15 minutes of inactivity. In this suspended state, it can take around a minute to start back up again when you make a request to it. 

1. Deploy a new web service
2. Select `Public Git Repository` as the source
3. Enter `https://github.com/Viren070/AIOStreams`
4. Deploy

## Self-Hosting

### Docker

Use the Dockerfile with [Docker](https://docs.docker.com/get-docker/) installed .
```
docker run -p 8080:3000 ghcr.io/viren070/aiostreams:latest
```

Or, build the docker image yourself
```
git clone https://github.com/Viren070/aiostreams.git
cd aiostreams
docker build -t aiostreams .
docker run -p 8080:3000 aiostreams
```


### From source

You need Node.js and git installed. Node v22 and npm v10.9 were used in the development of this project. I can not guarantee earlier versions will work.

1. Clone the project and set it as the current directory
   ```
   git clone https://github.com/Viren070/AIOStreams.git
   ```
   ```
   cd aiostreams
   ```
2. Install project dependencies
   ```
   npm i
   ```
3. Build project
   ```
   npm run build
   ```
4. Run project
   ```
   npm run start:addon
   ```
5. Go to `http://localhost:3000/configure`

You can change the PORT environment variable to change the port that the addon will listen on.
