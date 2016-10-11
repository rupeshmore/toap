# Toap (तोप)

Toap (तोप) means artillery in Hindi.

This app records http(s) traffic for a website and converts them to [Artillery.io](https://artillery.io/) load test scripts.

[Artillery.io](https://artillery.io/) is a new load testing tool based on node.js

## Getting Started
1. Install Node.js

2. Clone or Download the repo
```sh
  git clone https://github.com/rupeshmore/toap
```

3. Install all dependencies
```sh
  npm install
```

4. Run the app
```sh
  npm start
```

## Features
1. Record the browser interactions without configuring browser network proxy settings.
2. Calculate Think Time between requests.
3. Configure to record think time and/or headers.
4. Add comments to the script.
5. Option to open new browser window instead of within an iframe.
6. Download the JSON flow file at any point in time.

## More Info
1. Sites with multiple iframes will not open within the iframe, it is recommended to open in the new browser.

## Config
1. The default browser client is chrome. If you need to change the browser option edit `config.json` and change the browser to firefox/IE.
2. Toap gui runs on port 3001. Change the `toapGuiPort` in `config.json` and set to available value.
3. Toap proxy runs on port 3010. Change the `toapProxyPort` in `config.json` and set to available value.

## Known Issues
1. If filename exists then it will append to the existing file.
2. Websites with 'content-security-policy' will not display correctly within the iframe

## TODO
1. Better HTTPS support.
2. Resolve site requests which have 'content-security-policy'.

## License
MIT
