# AIOStreams

Combines streams from other addons into one and provides much greater customisation: 
- Change the format of the resutls
- Filter all results by resolution, quality, visual tags.
- Sort all results by quality, resolution, size, cached, visual tags, seeders
- Prioritise specific languages
- Specify a minimum and/or maximum size

You simply configure your options, add any API keys for any services you use, then enable whichever addons you want, and install. 

The addon will scrape all results from all addons, apply your configuration, and give the results back to you in one go. 

## FAQ

### How does it work? 

The addon has parsers for specific addons and can extract the relevant information. 
It goes through each addon you selected and obtains the results with all the parsed information. 

Once it has all the parsed information for each result, it can apply your configured sorting and filtering options. 

## Self-Hosting

### From source 

You need Node.js installed. Node v22 and npm v10.9 were used in the development of this project. I can not guarantee earlier versions will work.

1. Install [Node.js](https://nodejs.org/en/download/prebuilt-installer/current)
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

