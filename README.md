# Toap (तोप)

Toap (तोप) means artillery in Hindi.

This app records http(s) traffic for a website and converts them to [Artillery.io](https://artillery.io/) load test scripts.

[Artillery.io](https://artillery.io/) is a new load testing tool based on node.js

## App Demo
[Toap (तोप) Video Demo](https://youtu.be/wpwDhpZSP8k) recording web requests, think time and comments.

## Getting Started
1. Install Node.js

2. Clone or Download the repo
```sh
  git clone https://github.com/rupeshmore/toap
```

3. Inside the toap folder using terminal, install all dependencies
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

## Test Scripts
All the artillery scripts are recorded under the `flow` folder.

## Config
1. The default browser client is chrome. If you need to change the browser option edit `config.json` and change the `browser` to firefox/IE.
2. Toap gui runs on port 3001. Change the `toapGuiPort` in `config.json` and set to available value.
3. Toap proxy runs on port 3010. Change the `toapProxyPort` in `config.json` and set to available value.

## Notes
Comments are only for readability and debugging purpose. Comments should be removed from the flow file before running the tests.

## More Info
1. Sites with multiple iframes will not open within the iframe, it is recommended switch `ON` to open in the new browser.
2. If filename exists then it will append to the existing file.

## Known Issues
1. Websites with 'content-security-policy' will not display correctly within the iframe

## TODO
1. Better HTTPS support.
2. Resolve requests with 'content-security-policy' headers.

## License
MIT
