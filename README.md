# Intro

this is a script, which crawls through a website and saves everything in
either the data or the downloads folder, depending on where the data comes from.

Html pages and their resources go to `/data`.
Everything else goes to `/download`.

# Usage

install the script:
```
npm install -g nightmare-spider
```

run the script with config json
```
nightmare-spider /path/to/config.json
```

This `config.json` must include three properties and should look like this:

```json
{
  "ssl": true, // use http oder https?
  "domain": "ethereum.org", // only crawl links on this domain
  "start": "ethereum.org", // start to crawl here
   "path": "/home/foo/test" // files are saved here - must be absolute
}
```
