# Federation Subgraph

A subgraph that indexes Federation events.

## Quickstart

```sh
yarn
```

## Federation subgraph

This repo contains the templates for compiling and deploying a graphql schema to thegraph.

### Authenticate

To authenticate for thegraph deployment use the `Access Token` from thegraph dashboard:

```sh
yarn run graph auth https://api.thegraph.com/deploy/ $ACCESS_TOKEN
```

### Create subgraph.yaml from config template

```sh
yarn prepare:[dao] # Supports gnars
```

### Generate types to use with Typescript

```sh
yarn codegen
```

### Compile and deploy to thegraph (must be authenticated)

```sh
yarn deploy:[dao] # Supports gnars
```
