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

### What are the currently supported addons? 

It currently supports: 
- Torrentio
- Torbox

### What are the supported formatters? 

The addon can display your results in different formats. The two formats available are: 

- gdrive:
  Uses the format from this [Stremio GDrive](https://github.com/Viren070/stremio-gdrive-addon) addon
  
  ![image](https://github.com/user-attachments/assets/9d9c74ab-afde-41f9-ba94-eaf8904b580b)

  - Does not display the indexer

- torrentio:
  Uses the format from the Torrentio addon.
  
  ![image](https://github.com/user-attachments/assets/343dccb4-13c5-4b57-998a-82b763e9ebf9)


## Self-Hosting

### From source 

You need Node.js and git installed. Node v22 and npm v10.9 were used in the development of this project. I can not guarantee earlier versions will work.

1. Clone the project and set it as the current directory
   ```
   git clone https://github.com/Viren070/aiostreams.git
   ```
   ```
   cd aiostreams
   ```
3. Install project dependencies
   ```
   npm i
   ```
4. Build project
   ```
   npm run build
   ```
5. Run project
   ```
   npm run start:addon
   ```
6. Go to `http://localhost:3000/configure`

You can change the PORT environment variable to change the port that the addon will listen on. 

