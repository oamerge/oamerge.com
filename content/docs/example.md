---
title: 'Example'
weight: 1
summary: Simple API to show the basics of OA Merge.
---

Let's use OA Merge to build a simple API with merged properties.

> ℹ️ If you want to follow along locally, you don't even need to install anything (using the power of [npx](https://docs.npmjs.com/cli/v7/commands/npx)).

Since we want to demonstrate merging, we'll have two input folders. For this example, that'll look like this:

```
/config.oamerge.js
/server.js
/api_1
	/_.@.js
	/paths
		/hello
			/get.@.js
/api_2
	/info.@.js
```

Our configuration file is pretty simple:

```js
// config.oamerge.js
export default {
	input: [ './api_1', './api_2' ],
	output: './build'
}
```

According to the [OpenAPI specs](https://spec.openapis.org/oas/v3.1.0#schema), the *absolute minimum* OpenAPI schema needs these properties:

```json
{
	"openapi": "3.1.0",
	"info": {
		"title": "My Cool API",
		"version": "0.0.0"
	}
}
```

So we'll define those properties in the `api_1/_.@.js` file:

```js
// api_1/_.@.js
export const openapi = '3.1.0'
export const info = {
	title: 'My Cool API',
	version: '0.0.0',
}
```

To override the `info.title` in `api_2` we'll export it in the `api_2/info.@.js` file:

```js
// api_2/info.@.js
export const title = 'My Even Cooler API'
```

Since the `config.oamerge.js` specifies `api_2` as the last input, the `info.title` will be overridden by that.

To add a request handler, let's set up that `get.@.js` file. OA Merge doesn't have an opinion about the request handler signature, you only have to export a default function. Let's use the normal request/response format for now:

```js
// api_1/paths/hello/get.@.js
export const summary = 'Endpoint to make sure the API works.'
export default (request, response) => {
	response.end('Hello world!')
}
```

Now we can build all the files:

```bash
npx oamerge -c
```

> ℹ️ If you're following along locally, be sure to have a look at the output files in the `build` folder!

For this example we don't have path parameters, so we can make a very rudimentary router and HTTP server:

```js
// create a map of path->method->handler
import { routes } from './build/routes.js'
const simpleRouter = {}
for (const { path, method, handler } of routes) {
	if (!simpleRouter[path]) simpleRouter[path] = {}
	simpleRouter[path][method.toUpperCase()] = handler
}
// now create the HTTP server
import { createServer } from 'node:http'
const server = createServer((request, response) => {
	const handler = simpleRouter[request.url]?.[request.method]
	if (handler) handler(request, response)
	else {
		response.statusCode = 200
		response.end('No route found!')
	}
})
server.listen(3000, () => {
	console.log('Listening: http://localhost:3000')
})
```

If you're following along locally you can open [http://localhost:3030/hello](http://localhost:3030/hello) in your browser, or with `curl`:

```bash
curl http://localhost:3030/hello
# Hello world!
```

If you look at the `build/openapi.json` file, it'll look something like this:

```json
{
	"openapi": "3.1.0",
	"info": {
		"title": "My Cool API",
		"version": "0.0.0"
	},
	"paths": {
		"/hello": {
			"get": {
				"summary": "Endpoint to make sure the API works."
			}
		}
	}
}
```

For further reading on configuration and output options, have a look at any of the documentation pages.

If you want a more complete walk-through, have a look at the [advanced tutorial](/docs/tutorial).
