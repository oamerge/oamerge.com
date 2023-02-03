---
sidebar_position: 6
---

# Routes

The plugin `@oamerge/generator-routes` generates a file used to initialize your router, it contains a reference to all paths with request handlers.

The generated output looks something like this:

```js
import handler_0 from 'my-api/paths/hello/get.@.js'
export const routes = [
	{
		path: '/hello',
		method: 'get',
		handler: handler_0,
	},
]
```

You might use the output with a router like [Polka](https://github.com/lukeed/polka) like this:

```js
import polka from 'polka'
import { routes } from './build/routes.js'

const app = polka()
for (const { path, method, handler } of routes) {
	app[method](path, handler)
}

app.listen(3000, () => {
	console.log('> Running on localhost:3000')
})
```

## Install and Configure

Install the usual ways:

```bash
npm install --save-dev @oamerge/generator-routes
```

Use as an OA Merge generator plugin in your config file:

```js
// oamerge.config.js
import routes from '@oamerge/generator-routes'
export default {
	// ...
	generators: [
		routes({
			// Change the default ('routes.js') filepath, which is relative
			// to the root `output` folder path:
			output: 'express-routes.js',
		}),
	],
}
```

The full list of options:

* `output` <`String`> - This is the filepath for the generated routes file, it is relative to the `output` folder. (Default: `routes.js`)

## OpenAPI Paths

OA Merge uses the filesystem paths to construct the path strings in the OpenAPI [Paths Object](https://spec.openapis.org/oas/v3.1.0#paths-object).

For example, given a filesystem folder structure like this:

```
/paths
	/users
		/{userId}
	/list
		/prefix{key}
	/some
		/long
			/path
```

The corresponding generated OpenAPI definition in JSON would look like this (other properties removed for brevity):

```json
{
	"paths": {
		"/users": {},
		"/users/{userId}": {},
		"/list/prefix{key}": {},
		"/some/long/path": {}
	}
}
```

## Operation Object

This is where the request handlers for most of your endpoints will be defined, and the files correspond to the [Operation Object](https://spec.openapis.org/oas/v3.1.0#operation-object) in the OpenAPI specs.

Along with normal named properties, operation object files can also export a default function as the request handler:

```js
// paths/hello/get.@.js
export const summary = 'Say hello.'
export const description = 'Ping the server to make sure it is awake.'
export default (request, response) => {
	// Respond with a "hello world"
}
```

:::info
Although the `(request, response)` signature is common, OA Merge does *not* have an opinion about how you write your handler functions.
:::

You can also use the special underscore (`_`) file to define the handler in a separate file, e.g.:

```js
// paths/hello/get.@.js
export const summary = 'Say hello.'
export const description = 'Ping the server to make sure it is awake.'

// paths/hello/get/_.@.js
export default (request, response) => {
	// Respond with a "hello world"
}
```

:::info
If you export a default function from `get.@.js` *and* from `get/_.@.js` OA Merge will take the more "explicit" file as authoritative, which is the underscore file.
:::

## Security Requirements

You can optionally include the reference to the [Security Requirement Object](https://spec.openapis.org/oas/v3.1.0#securityRequirementObject). For instance, if your [Operation Object](https://spec.openapis.org/oas/v3.1.0#operation-object) looked like this:

```js
// paths/hello/get.@.js
export const summary = 'Say hello, securely.'
export const security = [ { api_key: [] } ]
export default (request, response) => {
	// Respond with a "hello world"
}
```

Simply set your configuration options to have `security: true` like this:

```js
// oamerge.config.js
import routes from '@oamerge/generator-routes'
export default {
	// ...
	generators: [
		routes({ security: true }),
	],
}
```

And the generated output will look more like this:

```js
import handler_0, { security as security_0 } from 'my-api/paths/hello/get.@.js'
export const routes = [
	{
		path: '/hello',
		method: 'get',
		handler: handler_0,
		security: security_0,
	},
]
```

You could then use that in conjunction with `@oamerge/generator-security` (see [the docs](/docs/generators/security.md)) to easily secure your API.

## Path Rewrites

You may find that you need to use advanced path templating, where the OpenAPI path template string contains characters that cause problems with filesystem access.

To handle this type of concern, OA Merge supports exporting a property named `$path` from inside the underscore (`_`) file in a path folder.

For example, the `/users/[userId]` file-based path here would become `/users/{userId}` instead:

```js
// paths/users/[userId]/_.@.js
export const $path = '/users/{userId}'
```

The string must be the exact string as represented in the OpenAPI definition, e.g. any escaped characters must already be escaped.

:::warning
Technically you could create files with filename paths that don't correspond to the exported `$path`, e.g. at `paths/foo/_.@.js` you could define a path like `/bar`. While this **is** supported by OA Merge, it will be very confusing to maintain later!
:::

## Aliased Paths

The OpenAPI [Paths Object](https://spec.openapis.org/oas/v3.1.0#paths-object) is a map of templated paths to a [Path Item Object](https://spec.openapis.org/oas/v3.1.0#path-item-object), which can contain a Reference (the `$ref` key).

For example, to create an aliased path you might have something like this:

```json
{
	"paths": {
		"/hello": {
			"get": {
				"summary": "Make sure the server is working."
			}
		},
		"/aliased_hello": {
			"$ref": "#/paths/~1hello"
		}
	}
}
```

:::note
The OpenAPI specs say that, if you're using JSON, the reference should be interpreted as a JSON-Pointer notation. For that, the character `/` is escaped to `~1`, so e.g. `/users/{userId}` would be `~1users~1{userId}`. **This generator requires the same escaping.**
:::

To do this from OA Merge, you would simply export the named `$ref` property:

```js
// paths/aliased_hello/_.@.js
export const $ref = '#/paths/~1hello'
```

Note that the OpenAPI specs say:

> In case a Path Item Object field appears both in the defined object and the referenced object, the behavior is undefined.

However, one of the main ways references are useful is to be able to re-use methods from another path, while overriding a single method:

```json
{
	"paths": {
		"/hello": {
			"get": {},
			"post": {},
			"put": {}
		},
		"/aliased_hello": {
			"$ref": "#/paths/~1hello",
			"get": {
				"description": "A different implementation of `GET /hello`"
			}
		}
	}
}
```

So although within the OpenAPI specs the behaviour is undefined, OA Merge defines the behaviour of a Path Item Object containing a `$ref` field:

1. The properties of the referenced Path Item Object are applied first.
2. Any additional properties in the original are merged on top of that.

So given a folder structure like this:

```
/paths
	/users
		/get.@.js
		/patch.@.js
	/alias
		/_.@.js => export const $ref = '#/paths/~1users'
		/get.@.js
```

The final exported routes would have:

- `GET /users` from `/paths/users/get.@.js`
- `PATCH /users` from `/paths/users/patch.@.js`
- `GET /alias` from `/paths/alias/get.@.js`
- `PATCH /alias` from `/paths/users/patch.@.js`

## Removing Path Methods

If you need to un-set a route you can export `null` as the default, from that method.

For example, if you didn't want to inherit the `put` method on the `/aliased_users` path in the example above:

```js
// api_2/paths/aliased_users/put.@.js
export default null
```

If that file is loaded later in the inputs, OA Merge will remove it from the final merged list.

## Output

The output of `routes` builds and exports a list of objects, each object containing the path information and the handler functions, with all `$ref` references resolved. For example:

```js
import handler_1 from 'my_api/paths/hello/get.@.js'
export const routes = [
	{
		path: '/hello',
		method: 'get',
		handler: handler_1,
	},
	{
		path: '/aliased_hello',
		method: 'get',
		// a resolved reference
		handler: handler_1,
	},
]
```

## Merging Strategy

The default merge strategy is to take each input as ordered, writing the path string with method name to a map and overwriting whatever is there, whether function or reference.

References are resolved *at the end* so that the exported `routes` list handlers point directly to the exported handler(s).

This is complicated by the possibility of a reference on the Path Item Object being overwritten.

For example, suppose that there are two input folders, with files like this:

```
/api_1
	/paths
		/users
			/get.@.js
				# export default () => {}
			/put.@.js
				# export default () => {}
/api_2
	/paths
		/aliased_users
			/_.@.js
				# export $ref = '#/paths/~1users'
			/get.@.js
				# export default () => {}
```

If the input order was `api_1, api_2` than the output `routes` file would look something like this:

```js
import handler_1 from 'api_1/paths/users/get.@.js'
import handler_2 from 'api_1/paths/users/put.@.js'
import handler_3 from 'api_2/paths/aliased_users/get.@.js'
export const routes = [
	{
		path: '/users',
		method: 'get',
		handler: handler_1,
	},
	{
		path: '/users',
		method: 'put',
		handler: handler_2,
	},
	{
		path: '/aliased_users',
		method: 'get',
		// defined in its own file
		handler: handler_3,
	},
	{
		path: '/aliased_users',
		method: 'put',
		// inherited from the $ref
		handler: handler_2,
	},
]
```
