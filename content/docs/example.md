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
export const title 'My Even Cooler API'
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

Now to run the server with routing, let's use [Polka](https://github.com/lukeed/polka), a really lightweight router that's a lot like Express or Koa.

The generated list of routes will be in the build folder, as the `routes.js` file, so we can import that to add all routes at once.

```js
// server.js
import polka from 'polka'
import { routes } from './build/routes.js'
const server = polka()
for (const { method, path, handler } of routes) {
	server[method](path, handler)
}
server.listen(3030, () => {
	console.log('Server running at: http://localhost:3030')
})
```

If you're following along locally you can open [http://localhost:3030/hello](http://localhost:3030/hello) in your browser, or with `curl`:

```bash
curl http://localhost:3030/hello
# Hello world!
```

For further reading, have a look at any of the documentation pages.

> ℹ️ If you want to play with this example more, please note that Polka uses `/:userId` path notation whereas OpenAPI uses `/{userId}` path notation. In most cases you can do a simple regex replace:
> 
> ```diff
> -	server[method](path, handler)
> +	server[method](path.replace(/\{([^}]+)\}/g, ':$1'), handler)
> ```
