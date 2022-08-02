---
title: "Output: Schema"
weight: 13
summary: The merged OpenAPI file properties, exported as a JavaScript object.
---

Along with the [JSON output](/docs/json), this is the most complex part of OA Merge. After all input files are merged, a JavaScript tree object is constructed that represents the entire OpenAPI definition, using named imports and [spread syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax) to generate as concise a file as possible.

## Example

Suppose that you want to represent an OpenAPI definition that looks like this:

```json
{
	"openapi": "3.1.0",
	"info": {
		"title": "My Cool API",
		"version": "0.0.0"
	},
	"components": {
		"securitySchemes": {
			"session": {
				"type": "apiKey",
				"name": "PHP_SESSION",
				"in": "cookie"
			}
		}
	},
	"paths": {
		"/hello": {
			"get": {
				"summary": "Endpoint to make sure the API works.",
				"security": [
					{ "session": [] }
				]
			}
		}
	}
}
```

If this was made in a single input directory named `openapi`, the files would look something like this:

```js
// openapi/_.@.js
export const openapi = '3.1.0'
export const info = {
	title: 'My Cool API',
	version: '0.0.0',
}

// openapi/components/securitySchemes/session.@.js
export const type = 'apiKey'
export const name = 'PHP_SESSION'
const _in = 'cookie'
export { _in as in } // or the shorthand `export const $in = 'cookie'`

// openapi/paths/hello/get.@.js
export const summary = 'Endpoint to make sure the API works.'
export const security = [ { session: [] } ]
export default (request, response) => { /* request handler code */ }
```

Now suppose the build output was in a directory next to `openapi` named `build`. Then, the generated `build/schema.js` file would look something *like* this:

```js
import { openapi, info } from '../openapi/_.@.js'
import { type, name, in as $in } from '../openapi/components/securitySchemes/session.@.js'
import handler, { summary, security } from '../openapi/paths/hello/get.@.js'
export const schema = {
	openapi,
	info,
	components: {
		securitySchemes: {
			session: {
				type,
				name,
				in: $in, // configurable (can use $in)
			},
		},
	},
	paths: {
		'/hello': {
			get: {
				summary,
				security,
				$handler: handler, // configurable (name and whether set)
			}
		}
	}
}
```

## Reference Objects

All reference objects are fully resolved to their final files, so e.g. an additional `securitySchemes` like this:

```js
// openapi/components/securitySchemes/old-session.@.js
export const $ref = '#/components/securitySchemes/session'
```

Would not generate an additional import line, but would add a new property to the `securitySchemes` object, something like this (note how the properties are from the `session.@.js` file):

```diff
import { openapi, info } from '../openapi/_.@.js'
import { type, name, in as $in } from '../openapi/components/securitySchemes/session.@.js'
import handler, { summary, security } from '../openapi/paths/hello/get.@.js'
export const schema = {
	openapi,
	info,
	components: {
		securitySchemes: {
+			'old-session': {
+				type,
+				name,
+				in: $in,
+			}
			session: {
				type,
				name,
				in: $in, // configurable (can use $in)
			},
...
```
