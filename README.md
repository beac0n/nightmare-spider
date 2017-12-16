# Intro

this is a script, which crawls through a website and saves everything in
either the data or the downloads folder, depending on where the data comes from.

Html pages and their resources go to `/data`.
Everything else goes to `/download`.

# Usage
run the script and provide the path to your `config.json` file.
This file must include tree properties and should look like this:

```json
{
  "ssl": true, // use http oder https?
  "domain": "ethereum.org", // only crawl links on this domain
  "start": "ethereum.org" // start to crawl here
}
```
