---
title: 'Configuration'
weight: 2
summary: Run the `oamerge` command and point it at a configuration JavaScript file.
---

When you run the `oamerge` command, pass in `-c` to point it to `config.oamerge.js` or another named configuration file:

```bash
oamerge -c
# or
oamerge -c config-alt.oamerge.js
```

The file needs to `export default` a configuration object:

```js
export default {
	input: [ './folder' ],
	output: './build',
	options: {
		// ...
	},
}
```

If you have multiple builds, you can `export default` an array of configuration objects:

```js
export default [
	{
		input: [ './folder1' ],
		output: './build1',
	},
	{
		input: [ './folder2' ],
		output: './build2',
	},
]
```

## Input

Specify how to ingest one or more folders, either by using a string (which will use the default options) or an object:

```js
export default {
	input: [
		// plain string
		'./folder1',
		// object
		{
			dir: './folder2',
			ext: '@', // (the default)
			api: '/', // (the default)
		}
	],
	// ...
}
```

The order of the input elements determines which properties will override others. Look at the page for each output for more details.

The properties on the input object are:

* `dir: String` - Folder path to the OpenAPI files to be ingested.
* `ext: String = "@"` - Optional filename suffix to use, e.g. for `*.oa.js` use `oa`.
* `api: String = "/"` - Optional API path prefix, e.g. if the ingested path name was `/tasks` and `api = "/api"` the final path name would be `/api/tasks`.

## Output

There are many optional output files, OA Merge will build all of them if you specify a string as `output`, using that string as the folder path:

```js
export default {
	// ...
	output: './build',
}
```

Or you can build only the components you want by using an object and specifying filepaths for each buildable thing:

```js
export default {
	// ...
	output: {
		// only the routes file will be built
		routes: './build/routes.js',
	},
}
```

Available output options (each value must be a filepath):

* [`json`](/docs/json) - The merged OpenAPI schema, output as a JSON file.
* [`routes`](/docs/routes) - The array of path and request handler exports.
* [`security`](/docs/security) - The map of security names to security handler exports.
* [`schema`](/docs/schema) - The merged OpenAPI schema file.

## Options

The `options` property is used to modify each output. It is a map of output-option keys to configuration objects, each output has its own options.

```js
export default {
	// ...
	options: {
		json: {
			// ...
		},
		routes: {
			// ...
		},
		security: {
			// ...
		},
		schema: {
			// ...
		},
	}
}
```

The available options for each build output are defined more completely in each build documentation page, but for reference they are:

* `json.compact: Boolean` - If this options is specified, all non-required labels and descriptions will be removed from the JSON.
* `schema.compact: Boolean` - If this options is specified, all non-required labels and descriptions will not be imported.
* [`security.merge: Function`](/docs/security#custom-merge) - An optional function to change the merging strategy for security scheme handlers.