---
sidebar_position: 7
---

# Security

The plugin `@oamerge/generator-security` generates a file used to secure your routes, it contains a map where the key is the security scheme name and the value is the security handler function.

The generated output looks something like this:

```js
import handler_0 from './components/securitySchemes/apiToken.@.js'
export const security = {
	apiToken: handler_0,
}
```

You might use the output with a router like [Polka](https://github.com/lukeed/polka):

```js
import polka from 'polka'
import { routes } from './build/routes.js'
import { security } from './build/security.js'

const app = polka()
for (const { path, method, handler, security: requirements } of routes) {
	app[method](path, async (request, response) => {
		if (requirements) {
			// use `requirements` and `security` to secure the request
		}
		// once secured, handle the request
		handler(request, response)
	})
}

app.listen(3000, () => {
	console.log('> Running on localhost:3000')
})
```

## OpenAPI Paths

OA Merge uses the filesystem paths to construct the security scheme objects in the OpenAPI [Security Scheme Object](https://spec.openapis.org/oas/v3.1.0#security-scheme-object).

For example, given a filesystem folder structure like this:

```
/components
	/securitySchemes
		/apiToken.@.js
		/aliasedToken.@.js
```

The corresponding generated OpenAPI definition in JSON would look like this:

```json
{
	"components": {
		"securitySchemes": {
			"apiToken": {
				"type": "http",
				"scheme": "basic"
			},
			"aliasedToken": {
				"$ref": "#/components/securitySchemes/apiToken"
			}
		}
	}
}
```

## Security Scheme Object

This is where the security handlers will be defined, and the files correspond to the [Security Scheme Object](https://spec.openapis.org/oas/v3.1.0#security-scheme-object) in the OpenAPI specs.

Along with normal named properties, security scheme object files can also export a default function as the security handler:

```js
// components/securitySchemes/apiToken.@.js
export const type = 'http'
export const scheme = 'basic'
export default (request, response) => {
	// Check for headers etc.
}
```

:::info
Although the `request, response` signature is common, like the request handler functions OA Merge does *not* have an opinion about how you write your security handler function.
:::

The file name, in this case `apiToken.@.js` is used to derive the OpenAPI `securitySchemes` key, which would be `apiToken` in this case.

## Reference Object

To define a security scheme as a reference, simply export the named property `$ref` as a `const`:

```js
// components/securitySchemes/aliasedToken.@.js
export const $ref = '#/components/securitySchemes/apiToken'
```

## Reserved Keyword: `in`

The OpenAPI specs define the property name `in`, for example:

```json
{
	"components": {
		"securitySchemes": {
			"token": {
				"type": "apiKey",
				"name": "SESSION",
				"in": "cookie"
			}
		}
	}
}
```

Since this is a JavaScript reserved keyword, you can't export it directly:

```js
// this won't work
export const in = 'cookie'
```

One way you can achieve this is by using renamed exports, like this:

```js
// this will work
const _in = 'cookie'
export { _in as in }
```

Although that is valid JavaScript, it can feel a little clunky, so OA Merge supports exporting `$in` as an alternative:

```js
// this will remap to `in`
export const $in = 'cookie'
```

If you try to export both, OA Merge will throw an error:

```js
// this is valid JavaScript, but the compiler will throw an error
const _in = 'cookie'
export { _in as in }
export const $in = 'cookie'
```

## Output

The output of `security` builds and exports a map of security scheme names to handler functions, resolving all `$ref` references. For example:

```js
import handler_1 from 'my_api/components/securitySchemes/thing_1.@.j1'
export const security = {
	thing_1: handler_1,
	// a resolved reference
	thing_2: handler_1
}
```

## Merging Strategy

The default merge strategy is to take each input as ordered, writing the name to a map and overwriting whatever is there, whether function or reference. References are resolved *at the end* so that the exported `security` object points directly to the exported handler.

For example, suppose that there are two input folders, with files like this:

```
/api_1
	/components
		/securitySchemes
			/name_1.@.js
				# export default () => {}
			/name_2.@.js
				# export $ref = 'name_1'
/api_2
	/components
		/securitySchemes
			/name_2.@.js
				# export default () => {}
			/name_3.@.js
				# export $ref = 'name_1'
```

If the input order was `api_1, api_2` than the output `security` file would look something like this:

```js
import handler_1 from 'api_1/components/securitySchemes/name_1.@.js'
import handler_2 from 'api_2/components/securitySchemes/name_2.@.js'
export const security = {
	name_1: handler_1,
	name_2: handler_2,
	name_3: handler_1,
}
```

Whereas if the input order was `api_2, api_1` the output would be:

```js
import handler_1 from 'api_1/components/securitySchemes/name_1.@.js'
export const security = {
	name_1: handler_1,
	name_2: handler_1,
	name_3: handler_1,
}
```
