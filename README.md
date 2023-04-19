# Swan Partner Mobile

A demo of a Swan integration within a native app, built with React Native.

📘 [Documentation](https://docs.swan.io/api/consent/integrate-strong-customer-authentication-sca)

## Getting started

First, besure that you correctly setted up your development environment. We recommend following [this guide](https://reactnative.dev/docs/environment-setup).<br/>
You will also need to install [yarn](https://classic.yarnpkg.com/en/docs/install#mac-stable).

### Clone

```bash
$ git clone git@github.com/swan-io/swan-partner-mobile.git
```

### Install

```bash
$ yarn
$ cd ios && pod install
$ cd ../server && yarn
```

## Google Pay

By default, the TapAndPay SDK is not included.

1. Go to [developers.google.com](https://developers.google.com/pay/issuers/apis/push-provisioning/android/releases) and download the `18.3.2` version.
2. Unzip it and copy the `com` folder in `android/libs`.

If you want to setup your android device to use the Google Pay sandbox, run:

```bash
$ yarn android:sandbox-pay
```

To go back to normal, run:

```bash
$ yarn android:live-pay
```

## Environment variables

There's 3 environment files in this project: `.env`, `server/.env` and `.env.build`, the later is only used for release build compilation, so there's no need to set it up.

1. Copy `.env.example` content to `.env` and edit some values:

```ruby
API_HOST="http://localhost:8103" # to expose the server over the internet (ngrok) replace this
DEEPLINK_CALLBACK_URL="io.swan.id://callback"
PARTNER_API_URL="https://api.swan.io/live-partner/graphql"
```

2. Copy `server/.env.example` content to `server/.env`:

```ruby
NODE_ENV="development"
PORT="8103"

LOG_LEVEL="debug"

OAUTH_SERVER_URL="https://oauth.swan.io"
OAUTH_CLIENT_ID="YOUR_CLIENT_ID" # your Swan OAuth2 live client ID
OAUTH_CLIENT_SECRET="YOUR_CLIENT_SECRET" # your Swan OAuth2 live client secret

AUTH_REDIRECT_URI="http://localhost:8103/auth/callback" # to expose the server over the internet (ngrok) replace this with <PROXY_URL>/auth/callback
PARTNER_API_URL="https://api.swan.io/live-partner/graphql"

DEEPLINK_CALLBACK_URL="io.swan.id://callback"
SESSION_TOKEN_PASSWORD="" # fill this with some not random password that is at least 32 characters
```

👉 Don't forget to add your `AUTH_REDIRECT_URI` to your redirect URIs (in our [dashboard](https://dashboard.swan.io) → Developers → API).

## Development

To start the mobile development server, use:

```bash
$ yarn android
# --- OR ---
$ yarn ios
```

You will also need to start the backend development server:

```bash
$ cd server
$ yarn dev
```
