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

The order of the input elements determines which properties will override others. Look at [the page on "Merging"](/docs/merging) for more details.

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

* [`routes`](/docs/routes) - The array of path and request handler exports.
* [`schema`](/docs/schema) - The merged OpenAPI schema file.
