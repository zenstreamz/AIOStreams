
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
- Torbox
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

### Cloudflare Workers

This addon can be deployed as a [Cloudflare Worker](https://workers.cloudflare.com/).

Follow the [guide](https://developers.cloudflare.com/workers/get-started/guide/) to get started and then run the following commands: 

```
git clone https://github.com/Viren070/AIOStreams.git
cd AIOStreams
npm i
npm run build
npm run deploy:cloudflare-worker
```

> [!NOTE]
> Cloudflare Workers cannot make requests to other Cloudflare Workers from the same account. If you have deployed the Stremio GDrive addon already on a Cloudflare account, the AIOStreams worker on the same account will not be able to fetch streams from your Stremio GDrive worker.

### Huggingface 

https://huggingface.co/spaces/Viren070/AIOStreams

![hd deploy](https://github.com/user-attachments/assets/11d2ad91-bb17-4f79-9131-666a372f334b)


### Render

https://render.com/

1. Deploy a new web service
2. Select `Public Git Repository` as the source
3. Enter `https://github.com/Viren070/AIOStreams`
4. Deploy



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
