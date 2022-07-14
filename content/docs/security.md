---
title: "Output: Security"
weight: 12
summary: A generated map where the key is the security name and the value is the security handler.
---

The OpenAPI [Components Object](https://spec.openapis.org/oas/v3.1.0#components-object) has the `securitySchemes` object, which is a map of names to either a [Security Scheme Object](https://spec.openapis.org/oas/v3.1.0#securitySchemeObject) or a Reference Object.

```json
{
	"components": {
		"securitySchemes": {
			"aliasedScheme": {
				"$ref": "#/components/securitySchemes/actualScheme"
			},
			"actualSchema": {
				"type": "http",
				"scheme": "basic"
			}
		}
	}
}
```

## Reference Object

To define a security scheme as a reference, simply export the named property `$ref` as a `const`:

```js
// components/securitySchemes/aliasedScheme.@.js
export const $ref = '#/components/securitySchemes/actualScheme'
```

## Security Scheme Object

Like other files, simply export named properties:

```js
// components/securitySchemes/actualScheme.@.js
export const type = 'http'
export const scheme = 'basic'
```

However, like Operation Objects that export a default function as the request handler, security schemes can also export default functions to handle securing the request.

```js
// components/securitySchemes/actualScheme.@.js
export const type = 'http'
export const scheme = 'basic'
export default (request, response) => {
	// Check for headers etc.
}
```

Although the `request, response` signature is common, like the request handler functions OA Merge does *not* have an opinion about how you write your security handler function.

## Output

The output of the `security` builds and exports a map of security scheme names to handler functions, resolving all `$ref` references. For example:

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

## Custom Merge

You can also define a custom merge function in your configuration file, like this:

```js
export default {
	input: [ /* ... */ ],
	options: {
		// ...
		security: {
			merge: (list) => {
				return {}
			}
		},
	}
}
```

The `list` property is an array of objects containing the following properties:

* `dir: String` - The full directory of the file, e.g. `/path/to/api`
* `filepath: String` - The filepath within the directory, e.g. `components/securitySchemes/token.@.js`
* `handler: Boolean` - Will be `true` if there is an exported handler function.
* `name: String` - The security scheme name.
* `reference?: String` - If present, the `$ref` string value.

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
