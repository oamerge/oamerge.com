---
title: 'Configuration'
sidebar_position: 2
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
	input: './folder',
	output: './build',
	generators: [
		// ...
	],
}
```

If you have multiple builds, you can `export default` an array of configuration objects:

```js
export default [
	{
		input: './folder1',
		output: './build1',
	},
	{
		input: './folder2',
		output: './build2',
	},
]
```

## Input

Specify how to ingest one or more folders, either by using a string (which will use the default options) or an object:

```js
export default {
	// plain string
	input: './folder1',
	// list of strings or objects
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

The order of the input elements determines which properties will override others during merging, following a last-property-wins strategy.

The properties on the input object are:

* `dir: String` - Folder path to the OpenAPI files to be ingested.
* `ext: String = "@"` - Optional filename suffix to use, e.g. for `*.oa.js` use `oa`.
* `api: String = "/"` - Optional API path prefix, e.g. if the ingested path name was `/tasks` and `api = "/api"` the final path name would be `/api/tasks`.

## Output

Each generator specifies its own output file, so there are many potential output files. Specify a folder, and it will be used as the default path prefix for each generator output:

```js
export default {
	// ...
	output: './build',
}
```

## Generators

The `generators` property is an array of generator plugins that will be called during build, or after each file change, if in watch mode.

```js
export default {
	// ...
	generators: [
		// ...
	]
}
```

You can build your own, but OA Merge has a few core generators:

* [`@oamerge/generator-routes`](/docs/generators/routes)
