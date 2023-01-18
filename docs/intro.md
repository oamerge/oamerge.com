---
sidebar_position: 1
---

# Intro to OA Merge

Let's discover **OA Merge in less than 5 minutes**.

## What you'll need

[Node.js](https://nodejs.org/en/download/) version 16.14 or above.

## Initialize the Project

Create a new directory and initialize `npm`:

```bash
mkdir my-api
cd my-api
npm init -y
```

Install dependencies:

```bash
npm install --save-dev oamerge @oamerge/generator-routes
```

- `oamerge` - The core CLI.
- `@oamerge/generator-routes` - OA Merge is a plugin-based system, this one generates output for routers.

## Create your API

Add an API endpoint for `GET /hello` by adding the file `api/paths/hello/get.@.js` with this:

```js
export const summary = 'Says Hello'
export const description = 'Simple example using the NodeJS http request/response model.'
export default async (request, response) => {
	response.statusCode = 200
	response.setHeader('Content-Type', 'text/plain')
	response.end('Hello World!')
}
```

## Configure OA Merge

Add a configuration file `oamerge.config.js` with this:

```js
import routes from '@oamerge/generator-routes'
export default {
	input: './api',
	output: './build',
	generators: [
		routes(),
	],
}
```

And to your `package.json` file, add a run script for building:

```json
{
	"scripts": {
		"run": "oamerge -c"
	}
}
```

## Run the Server

OA Merge *does not* have opinions about how you handle requests, but in this demo we're using `@oamerge/dev-nodejs-http` which
is a simple implementation using [NodeJS `createServer`](https://nodejs.org/api/http.html#httpcreateserveroptions-requestlistener).

Add a file `server.js` and put in it:

```js
import { createServer } from 'node:http'
import { routes } from './build/routes.js'

const server = createServer((request, response) => {
	// a very rudimentary router, as OA Merge does not ship one, on purpose!
	for (const { path, method, handler } of routes) {
		if (request.url === path && request.method.toLowerCase() === method) {
			return handler(request, response)
		}
	}
})

server.listen(3000, '127.0.0.1', () => {
	console.log('Server running!')
})
```

Now open up [`http://127.0.0.1:3000/hello`](http://127.0.0.1:3000/hello) to see the server response.
