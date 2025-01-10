<p align="center"><img src="https://raw.githubusercontent.com/Viren070/AIOStreams/refs/heads/main/packages/frontend/public/assets/logo.png" /></p>
<h1 align="center" id="title">AIOStreams</h1>

## Table of Contents 

- [Description](#description)
- [FAQ](#faq)
    - [How does it work?](#how-does-it-work)
- [Usage](#usage)
    - [Public Instance](#public-instance)
    - [Personal Instance](#deploying-your-own-instance)
        - [Hugging Face](#hugging-face)
        - [Cloudflare Workers](#cloudflare-workers)
        - [Render](#render)
- [Configuring](#configuring)
- [Development](#development)
- [Credits](#credits)
  
## Description

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

The addon can display your results in different formats. The formats available are:

- gdrive:
  Uses the format from this [Stremio GDrive](https://github.com/Viren070/stremio-gdrive-addon) addon

  ![image](https://github.com/user-attachments/assets/9d9c74ab-afde-41f9-ba94-eaf8904b580b)

- torrentio:
  Uses the format from the Torrentio addon.

  ![image](https://github.com/user-attachments/assets/343dccb4-13c5-4b57-998a-82b763e9ebf9)

- torbox:
  Uses the format from the Torbox stremio addon.

  ![image](https://github.com/user-attachments/assets/21f90ee2-e81d-4a56-9e64-8937fb7ab2bc)

## Usage
### Public Instance 

[ElfHosted](https://elfhosted.com/) have been kind enough to host a [community instance of AIOStreams](https://aiostreams.elfhosted.com/configure). 

This community instance does have a ratelimit in place, but it is unlikely you will reach it. It also avoids the ratelimits of ElfHosted addons like Comet and MediaFusion as AIOStreams' requests to these addons are routed internally. 
However, other non-ElfHosted addons may rate limit the community instance. 

### Deploying your own instance

Rather than hosting the addon locally, you can make use of some services to deploy the addon for you. This would be your own instance. However, if anyone has the URL to it, they can also use it.

#### Hugging Face

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

COPY --from=builder /build/package\*.json /build/LICENSE ./

COPY --from=builder /build/packages/addon/package.*json ./packages/addon/
COPY --from=builder /build/packages/frontend/package.*json ./packages/frontend/
COPY --from=builder /build/packages/formatters/package.*json ./packages/formatters/
COPY --from=builder /build/packages/parser/package.*json ./packages/parser/
COPY --from=builder /build/packages/types/package.*json ./packages/types/
COPY --from=builder /build/packages/wrappers/package.*json ./packages/wrappers/
COPY --from=builder /build/packages/utils/package.*json ./packages/utils/

COPY --from=builder /build/packages/addon/dist ./packages/addon/dist
COPY --from=builder /build/packages/frontend/out ./packages/frontend/out
COPY --from=builder /build/packages/formatters/dist ./packages/formatters/dist
COPY --from=builder /build/packages/parser/dist ./packages/parser/dist
COPY --from=builder /build/packages/types/dist ./packages/types/dist
COPY --from=builder /build/packages/wrappers/dist ./packages/wrappers/dist
COPY --from=builder /build/packages/utils/dist ./packages/utils/dist

COPY --from=builder /build/node_modules ./node_modules

EXPOSE 7860

ENV PORT=7860

ENTRYPOINT ["npm", "run", "start:addon"]
</code></pre>

</details>

5. Click `Commit new file to main`

6. Your addon will be hosted at {username}-{space-name}.hf.space. You can also find a direct URL to it by clicking the 3 dots > Embed this space > Direct URL > Copy


##### Updating 

To update the addon, you can simply go to the `Settings` tab and click `Factory rebuild`. This will rebuild the addon with the latest changes. 

#### Cloudflare Workers

This addon can be deployed as a [Cloudflare Worker](https://workers.cloudflare.com/).

> [!NOTE]
> Cloudflare Workers cannot make requests to other Cloudflare Workers from the same account. If you have deployed the Stremio GDrive addon already on a Cloudflare account, the AIOStreams worker on the same account will not be able to fetch streams from your Stremio GDrive worker.

1. Sign up for a [Cloudflare Account](https://dash.cloudflare.com/sign-up/workers-and-pages)
2. Install Node.js (I would recommend using package managers e.g. fnm on Windows)
3. Install Git
4. Run the following commands: 
```
git clone https://github.com/Viren070/AIOStreams.git
cd AIOStreams
npm i
npm run build
npm run deploy:cloudflare-worker
```

##### Updating

To update the addon, you can simply run the following commands to pull the latest changes, build the project, and deploy the worker.
This will update the worker with the latest changes, which may not be stable.

```
git pull
npm run build
npm run deploy:cloudflare-worker
```

#### Render

https://render.com/

> [!WARNING]
> Free instances 'spin down' after 15 minutes of inactivity. In this suspended state, it can take around a minute to start back up again when you make a request to it.

1. Deploy a new web service
2. Select `Public Git Repository` as the source
3. Enter `https://github.com/Viren070/AIOStreams`
4. Deploy

##### Updating 

When you deploy with Render, it automatically builds the addon every time a commit is pushed to this repository. You can also manually trigger a build by clicking the `Deploy` button. 

It is recommend to disable the `Auto Deploy` feature as the latest changes may not be stable. You can do this by going to the `Settings` tab and scrolling down to the `Auto Deploy` setting near the bottom of the `Build & Deploy` section.

### Self-Hosting

#### Docker

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

#### From source

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

## Configuring

Most users don't need to set any environment variables. However, if you do, the SECRET_KEY is the one you might want to configure. This key enables encrypted manifest URLs, which help protect your API keys.

With encryption, someone who has your manifest URL can't directly see your API keys. However, they can still install the addon using the encrypted URL. Once installed, they can view API keys within other addons' URLs that are contained within AIOStreams' responses, as most addons don’t encrypt their manifest URLs.

To modify the behaviour of the addon, you can provide the following environment variables:

- **ADDON_NAME**
   - Type: string
   - Default: 'AIOStreams'
   - Description: The name of the addon.

- **ADDON_ID**
   - Type: string
   - Default: 'aiostreams.viren070.com'
   - Description: The unique identifier for the addon.


- **PORT**
   - Type: number
   - Default: 3000
   - Description: The port on which the server will run. 

- **BRANDING**
   - Type: string
   - Default: undefined
   - Description: Custom branding HTML content. This can be customized by setting the BRANDING environment variable. This HTML content will be displayed at the top of the addon configuration page.
>[!NOTE]
>`BRANDING` is a **build-time** environment variable. It must be present during the build process. 

- **SECRET_KEY**
   - Type: string
   - Default: ''
   - Description: The secret key used for encryption. This should be set using the SECRET_KEY environment variable. ```openssl rand -hex 16``` or ```[System.Guid]::NewGuid().ToString("N").Substring(0, 32)``` can be used to generate a new secret key for Linux/MacoS and Windows respectively.

- **COMET_URL**
   - Type: string
   - Default: `'https://comet.elfhosted.com/'`
   - Description: The URL for the Comet addon. This URL is used internally by the addon to fetch results from the Comet addon. This environment variable allows you to modify the base URL being used without having to configure the addon yourself and then providing an `Override URL` in the addon configuration.

- **MEDIAFUSION_URL**
   - Type: string
   - Default: `'https://mediafusion.elfhosted.com/'`
   - Description: The URL for the MediaFusion addon.

- **TORRENTIO_URL**
   - Type: string
   - Default: `'https://torrentio.strem.fun/'`
   - Description: The URL for the Torrentio addon.

- **TORBOX_STREMIO_URL**
   - Type: string
   - Default: `'https://stremio.torbox.app/'`
   - Description: The URL for the Torbox Stremio addon.

- **MAX_ADDONS**
   - Type: number
   - Default: 15
   - Description: The maximum number of addons that is allowed. This is checked when the addon is configured and when you make a request to the addon. 

- **MAX_MOVIE_SIZE**
   - Type: number
   - Default: 150000000000 (150GB)
   - Description: The maximum size for movie files in bytes. This URL controls the maximum size you can set for the movie size filters. This affects the maximum value for the sliders in the configure page.
- **MAX_EPISODE_SIZE**
   - Type: number
   - Default: 15000000000 (15GB)
   - Description: The maximum size for episode files in bytes. This URL controls the maximum size you can set for the episode size filters. This affects the maximum value for the sliders in the configure page.

- **MAX_TIMEOUT**
   - Type: number
   - Default: 50000
   - Description: The maximum timeout value in milliseconds. The timeout value controls how long the addon will wait for a response from an addon before moving on to the next addon. This controls the max value the user can set for the timeout slider in the configure page.

- **MIN_TIMEOUT**
   - Type: number
   - Default: 1000
   - Description: The minimum timeout value in milliseconds.

- **DEFAULT_TIMEOUT**
   - Type: number
   - Default: 15000
   - Description: The default timeout value in milliseconds.

- **DEFAULT_TORRENTIO_TIMEOUT**
   - Type: number
   - Default: 5000
   - Description: The default timeout value for Torrentio in milliseconds. 

- **DEFAULT_TORBOX_TIMEOUT**
   - Type: number
   - Default: 15000
   - Description: The default timeout value for Torbox in milliseconds.

- **DEFAULT_COMET_TIMEOUT**
   - Type: number
   - Default: 15000
   - Description: The default timeout value for Comet in milliseconds.

- **DEFAULT_MEDIAFUSION_TIMEOUT**
   - Type: number
   - Default: 15000
   - Description: The default timeout value for MediaFusion in milliseconds. 

- **SHOW_DIE**
   - Type: boolean
   - Default: true
   - Description: A flag to indicate whether to show a die (singular dice) emoji in the stream result names. This is available to distinguish results from the AIOStreams addon from other addons.

Below, you can find how to set environment variables for the different methods of deployment.

### Cloudflare Workers

Unfortunately, it is not currently possible to set environment variables for this addon on a Cloudflare Worker. You will have to modify the code directly. You can look in `packages/utils/src/settings.ts` to change the default values.

### Render 

You can set environment variables in the Render dashboard.

1. Go to the [Render dashboard](https://dashboard.render.com/) and select the `AIOStreams` service.
2. Click on the `Environment` tab under the `Manage` section.
3. Click on the `Edit` button.
4. Click `Add Environment Variable` and enter the name and value of the environment variable you want to set.
5. Once you have added all the environment variables you want to set, click `Save, build, and deploy`.


### Huggingface

1. Go to your Hugging Face space and click on the `Settings` tab.
2. Scroll down to `Variables and Secrets` and click on `New secret`. 
> [!WARNING]
> Ensure you are using `Secrets`, especially for  `SECRET_KEY`. Variables are public and can be seen by anyone.
3. Enter the name and value of the environment variable you want to set. The description is optional and can be left empty. 


### Local 

You can set environment variables using a .env file in the root of the project. 

```
ADDON_NAME=AIOStreams
ADDON_ID=aiostreams.viren070.com
PORT=3000
SECRET_KEY=your_secret_key
COMET_URL=https://comet.elfhosted.com/
...
```

## Development 



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


Now, you can run various aspects of the project in development.

> [!NOTE]
> Most of these commands require that you build the project beforehand. Changes in other packages do not reflect immediately as it needs to be compiled into JavaScript first.
> Run `npm run build` to build the project.


To start the addon in development mode, run the following command: 

```
npm run start:addon:dev
```

To run the cloudflare worker in development mode, run the following command 

```
npm run start:cloudflare-worker:dev
```

To run the frontend of the project, run the following command

```
npm run start:frontend:dev
```

### Deploying 

To deploy your cloudflare worker, run the following command: 

```
npm run deploy:cloudflare-worker
```


## Credits

Thanks to [sleeyax/stremio-easynews-addon](https://github.com/Sleeyax/stremio-easynews-addon) for the repository structure and dockerfile.
