---
title: "OpenAPI: Security Scheme Object"
weight: 35
summary: Special considerations for exported properties of Security Scheme Objects.
---

## Reserved Keyword "in"

The OpenAPI specs for Security Scheme Objects [Fixed Fields](https://spec.openapis.org/oas/v3.1.0#fixed-fields-22) define the property name `in` as the "location of the API key", for example:

```json
{
	"components": {
		"securitySchemes": {
			"token": {
				"type": "apiKey",
				"name": "PHP_SESSION",
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

One way you can achieve this is by renaming the export, like this:

```js
// this will work
const _in = 'cookie'
export { _in as in }
```

Although that is valid JavaScript, it can feel a little clunky, so OA Merge supports exporting `$in` as an alternative:

```js
export const $in = 'cookie'
```

If you try to export both, OA Merge will throw an error:

```js
// this is valid JavaScript, but the compiler will throw an error
const _in = 'cookie'
export { _in as in }
export const $in = 'cookie'
```
