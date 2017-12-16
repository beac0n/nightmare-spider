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

This `config.json` should look like this:

```
{
  "ssl": true, // use http oder https? - default http
  "domain": "ethereum.org", // only crawl links on this domain
  "start": "ethereum.org", // start to crawl here
  "path": "/home/foo/test", // files are saved here - must be absolute
  "maxConnections": 10 // how many connections - default: 10
}
```
