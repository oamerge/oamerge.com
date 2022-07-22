---
title: "Output: Routes"
weight: 11
summary: A generated list of paths and request handlers, for you to pass to your preferred routing library.
---

The OpenAPI [Paths Object](https://spec.openapis.org/oas/v3.1.0#pathsObject) is a map of templated paths to either a [Path Item Object](https://spec.openapis.org/oas/v3.1.0#path-item-object) or a Reference Object:

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

> Note: the OpenAPI specs say that, if you're using JSON, you should interpret reference as JSON-Pointer notation. For that, the character `/` is escaped to `~1`, so e.g. `/users/{userId}` would be `~1users~1{userId}`.

## Reference Object

To define a Path Item Object as a reference, simply export the named property `$ref` as a `const`, typically in the file with the underscore character:

```js
// paths/aliased_hello/_.@.js
export const $ref = '#/paths/~1hello'
```

Please note that the OpenAPI specs support defining the reference property of a Path Item Object along with other properties. This is primarily for documentation purposes, for example you might include a `description` property, or a special `alias` tag:

```json
{
	"paths": {
		"/hello": {
			"get": {
				"summary": "Make sure the server is working."
			}
		},
		"/aliased_hello": {
			"$ref": "#/paths/~1hello",
			"description": "These are aliases of /hello for some good reasons.",
			"tags": [ "alias" ]
		}
	}
}
```

To do this, you simply export those named properties, just like normal:

```js
// paths/aliased_hello/_.@.js
export const $ref = '#/paths/~1hello'
export const description = 'These are aliases of /hello for some good reasons.'
export const tags = [ 'alias' ]
```

## Paths

Within an OpenAPI definition, properties are represented by folder structure, so the *filesystem* folder path `components/parameters/foo` mirrors the JSON-pointer path `#/components/parameters/foo`. This is not the case with path strings in the `paths` property.

Generally you will likely find this to be a simple and easily understood difference. For example, here is an OpenAPI definition in JSON, with other properties removed for brevity:

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

These `paths` properties would correspond to the *filesystem* folder path of:

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

You may find that you have advanced path templating needs, where the path string contains characters that cause problems with filesystem access, or other complicated concerns.

To help with this, OA Merge supports exporting a property named `$path` from inside the underscore / `_` file in a path folder.

For example, if you absolutely cannot use curly braces as folder names, for the `/users/{userId}` path string you could have this file and exported property:

```js
// paths/users/[userId]/_.@.js
export const $path = '/users/{userId}'
```

The string must be the exact string as represented in the OpenAPI definition.

> Note: Technically, you could create a file at `paths/anything/_.@.js` and use the `$path` property to define a path like `/something/else`. While this is supported by OA Merge, it will be very confusing to maintain later. You should use folder paths that make sense!

## Operation Object

This is where the request handlers for most of your endpoints will be defined, and the files correspond to the [Operation Object](https://spec.openapis.org/oas/v3.1.0#operation-object) in the OpenAPI specs.

Like other files, simply export named properties:

```js
// paths/hello/get.@.js
export const summary = 'Say hello.'
export const description = 'Ping the server to make sure it is awake.'
```

However, these files also optionally export a default function as the request handler.

```js
// paths/hello/get.@.js
export const summary = 'Say hello.'
export const description = 'Ping the server to make sure it is awake.'
export default (request, response) => {
	// Respond with a "hello world"
}
```

> Note: Although the `request, response` signature is common, like the request handler functions OA Merge does *not* have an opinion about how you write your security handler function.

## Output

The output of `routes` builds and exports a list of objects, each object containing the path information (for routing purposes) and the handler functions, with all `$ref` references resolved. For example:

```js
import handler_1 from 'my_api/paths/hello/get.@.j1'
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

The default merge strategy is to take each input as ordered, writing the path string with method name to a map and overwriting whatever is there, whether function or reference. References are resolved *at the end* so that the exported `routes` list handlers point directly to the exported handler(s).

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

If you need to un-set a route, for example if you didn't want to inherit the `put` method on the `/aliased_users` path in the example above, you can export `null` as the default, from that method:

```js
// api_2/paths/aliased_users/put.@.js
export default null
```

If you make sure that file is loaded later in the inputs, OA Merge will remove it from the list.

## Custom Merge

You can also define a custom merge function in your configuration file, like this:

```js
export default {
	input: [ /* ... */ ],
	options: {
		// ...
		routes: {
			merge: (list) => {
				return {}
			}
		},
	}
}
```

The `list` property is an array of objects containing the following properties:

* `dir: String` - The full directory of the file, e.g. `/path/to/api`
* `filepath: String` - The filepath within the directory, e.g. `paths/users/{userId}/get.@.js`
* `handler: Boolean` - Will be `true` if there is an exported handler function.
* `reference?: String` - If present, the `$ref` string value.










TODO



What you need to return is a map where the name is the final security scheme name, and the value is an object containing the following properties:

* `dir: String` - The full directory of the file, e.g. `/path/to/api`
* `filepath: String` - The filepath within the directory, e.g. `components/securitySchemes/token.@.js`

All references must be fully resolved in the output map.

You technically don't even need to use anything from the provided list, for example if you want to overwrite all security schemes:

```js
export default {
	// ...
	options: {
		// ...
		security: {
			merge: () => {
				return {
					my_only_scheme: {
						dir: '/somewhere/else',
						filepath: 'some/other/file/entirely.js'
					}
				}
			}
		},
	}
}
```
