---
sidebar_position: 8
---

# Advanced: Make Your Own

Follow along to make your own output generator plugin, or look at the [source code](https://github.com/oamerge/oamerge/tree/main/packages) of some OA Merge generators.

## Introduction

A generator plugin is simply an asynchronous function that is called every time the OA Merge internal code-tree is rebuilt.

Start by making a new file, next to your `oamerge.config.js` file, make it look like this:

```js
// my-generator.js
export default opts => {
	// Add any instantiation logic here, and then return a
	// function that looks like this:
	return async ({ cwd, output, TREE }) => {
		// This function is called every time the TREE is rebuilt.
	}
}
```

Now inside your `oamerge.config.js` file, you would import it like normal:

```js
import myGenerator from './my-generator.js'

export default {
	input: 'my-api',
	// Other configurations, and then
	generators: [
		myGenerator({
			// Any options to pass to the generator.
		})
	]
}
```

You could also just inline the generator, if it were a very simple one. For example, to write out the `TREE` on every update, you could do something as simple as this:

```js
import { join } from 'node:path'
import { writeFile } from 'node:fs/promises'

export default {
	// ... as before ...
	generators: [
		async ({ cwd, output, TREE }) => {
			await writeFile(
				join(cwd, output, 'tree.json'),
				JSON.stringify(TREE, undefined, '\t'),
				'utf8',
			)
		}
	]
}
```

Generator plugins do not need to return anything, so you can exit early.

## Types

Generators are called with types described below:

### OamergeGeneratorParameters

When the OA Merge compiler runs, it calls the generator plugins with an object containing the following properties:

- `cwd` <`String`> - The current working directory as detected or input by the user. Use this instead of `process.cwd()`.
- `output` <`String`> - The absolute output folder to place generated content.
- `TREE` <[`OamergeTree`](#oamergetree)> - The loaded and normalized file details, from the input folders.

### OamergeTree

This is a tree representing all loaded files. It has the following property:

- `inputs` <`Array`<[`OamergeTreeInputs`](#oamergetreeinputs)>> - The loaded and normalized file details, with the list order matching the configuration inputs order.

### OamergeTreeInputs

Each of the inputs objects has the following properties:

- `api` <`String`> - The normalized `api` property, e.g. `/` if using the default.
- `dir` <`String`> - The normalized `dir` property.
- `ext` <`String`> - The normalized `ext` property, e.g. `@` if using the default.
- `files` <`Map`<`String`,[`OamergeTreeInputFile`](#oamergetreeinputfile)>> - A map of the filepath, relative to the input folder, to the loaded file details.

### OamergeTreeInputFile

This is an object representing the loaded file details. It has the following properties:

- `key` <`Array`<`String`>> - The filepath, parsed into the OpenAPI object path. E.g. the file `paths/hello/world/get.@.js` becomes the array of strings `[ 'paths', 'hello', 'world', 'get' ]`.
- `exports` <`Any`> - This is whatever the loader plugin gives back.
