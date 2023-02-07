---
slug: openapi-paths-as-files
title: OpenAPI Paths as Files
authors: [saibotsivad]
---

OA Merge is a library that merges a directory of folders and files into an OpenAPI document. In this long essay you'll learn about the motivation and challenges involved, and hopefully learn a bit about the OpenAPI specifications as well.

First, to set the stage, let's talk about...

## Context

As someone who has built and maintained many different applications over a several-year lifespan, one thing that I push strongly against is bike-shedding: internal arguments over exactly how things like schemas and APIs should be designed, where everyone feels a "need" to "help" pick the "right way".

Generally speaking, to solve bike-shedding you want to pick an existing framework of thinking, and you want it to be two things: 1) broad enough in scope and well-defined such that you don't need to make many decisions, aka "just follow the specs", and 2) the right kind of "escape hatch" so you can step outside the specs to handle special cases.

I've found the [OpenAPI specs](https://spec.openapis.org/oas/v3.1.0) to be a very powerful tool to avoid bike-shedding and the problems that come with it. If you are designing an API that you want to be well maintained, I cannnot recommend anything better.

## Motivation

However... building and maintaining an OpenAPI document as a flat JSON file gets complicated very quickly, and especially as it gets larger over time. For example, the last two moderate sized applications I've built have 150+ unique *paths* (e.g. `/teams` versus `/players`) and that doesn't seem too unreasonable for any maturing business.

```
{
	openapi: "...",
	info: {
		version: "1.2.3",
		title: "My App",
		description: "... long text here ..."
	},
	tags: [
		... 40+ of these
	],
	components: {
		schemas: {
			... 100+ of these
		},
		parameters: {
			... 100+ of these
		},
	},
	paths: {
		... 100+ of these
	},
}
```

Trying to resolve merge conflicts across a JSON file of that size would obviously be frustrating, *at best*.

One of the first solutions I used to manage that across teams was simply splitting it into multiple files, mostly ad-hoc, and merging them as part of a home-grown build script, globbing on the `.api` file extension prefix:

```json
// index.api.json
{
	"openapi": "...",
	"info": {
		"version": "1.2.3",
		"title": "My App"
	},
	"tags": [
		// ... 40+ of these
	]
}
```

```md
// info/description.api.md
...Long `info.description` text...
```

```js
// components/schemas/user.api.js
export default {
	type: 'object',
	// ... the user schema object
}
```

```js
// paths/auth/login/post.api.js
export const summary = 'Start Login'
export const handler = async (request, response) => {
	// ... business logic
}
```

This is a pretty great start:

- It splits up all the code that gets updated frequently into separate files, meaning fewer merge conflicts and easier peer review.
- The directory+file structure mostly maps pretty directly to the OpenAPI document output.

As a home-grown and maintained solution that worked pretty well across several projects, so I set about extracting the home-grown bits out into something standalone that I could share and reuse across projects.

And that's when the first problem arrived...

## The Challenge

It might not be obvious immediately how this might matter, but note that the above design (mostly) maps JSON object access notation using folder separators.

For example, given a JSON object containing a user schema:

```json
{
	"components": {
		"schemas": {
			"user": {
				"type": "object"
			}
		}
	}
}
```

The file based approach uses `components/schemas/user.api.js` to access `components` -> `schemas` -> `user`, which ... works okay!

:::info
The OpenAPI spec says that the `components.*.KEY` [fixed field names](https://spec.openapis.org/oas/v3.1.0#fixed-fields-5), e.g. the `KEY`, can't contain forward `/` or back `\` slash.
:::

However, the OpenAPI [Paths Object](https://spec.openapis.org/oas/v3.1.0#paths-object) has a JSON structure like this:

```json
{
	"paths": {
		"/auth/login": {
			"post": {
				"summary": "Start Login"
			}
		}
	}
}
```

The file based approach uses `paths/auth/login/post.api.js` to access `paths` -> `/auth/login` -> `post`, which ... *kind of* works?

### Potential for Filepath Conflicts

Let's explore a problem with this approach.

For a good developer experience, we want to be able to write long Markdown-formatted descriptions inside actual Markdown files.

E.g. if you have an OpenAPI structure like this:

```json
{
	"paths": {
		"/auth/login": {
			"post": {
				"description": "... long text ..."
			}
		}
	}
}
```

You'd like to be able to write the `description` contents in an actual Markdown file, and with the approach I've described so far that would be:

```md
// paths/auth/login/post/description.api.md

... long text ...
```

That seems pretty simple, but consider this OpenAPI structure:

```json
{
	"paths": {
		"/foo": {
			"get": {
				"description": "... operation text ..."
			}
		},
		"/foo/get": {
			"description": "... path text ..."
		}
	}
}
```

Mapping this to the two Markdown files would would create these filepaths:

* `paths/foo/get/description.api.md` - The description for the `GET /foo` request.
* `paths/foo/get/description.api.md` - The overall description for the `/foo/get` path.

Arguably it's probably not best practice to name a URL pathname with an HTTP method name, but it's definitely *allowed*, and since the [abstraction has a leak](https://www.joelonsoftware.com/2002/11/11/the-law-of-leaky-abstractions/) let's see if we can resolve it smartly.

### Question the Spec

A good first approach when encountering problems with an existing framework or spec is to ask: why is it this way? If the framework or spec is mature, there are probably reasons behind the design, and knowing the answer to "why?" will let you know how much you should care.

For the OpenAPI specs, it's pretty simple: if paths were represented as JSON structures, you would likely end up with the same problem of indeterminate route paths.

In other words, representing the paths as open tree structures would end up with similar problems to our file-based system. For example, if we split the path on the leading `/` slashes, the earlier non-conflicting JSON would become:

```json
{
	"paths": {
		"/foo": {
			"get": {
				"description": "... operation text ..."
			},
			// conflict!
			"get": {
				"description": "... path text ..."
			}
		}
	}
}
```

Perhaps this could still have worked as a spec if all path "folders" were prefixed with a `/` slash:

```json
{
	"paths": {
		"/foo": {
			"get": {
				"description": "... operation text ..."
			},
			// no conflict
			"/get": {
				"description": "... path text ..."
			}
		}
	}
}
```

For a mature spec like OpenAPI, there are likely *many* thousands of discussions, and other very smart engineers have no doubt argued about this basic structure and landed on this decision for smart reasons.

In any case, this particular decision seems reasonable enough that I'm not going to dig deeper.

## Solutions

Let's look at the previous OpenAPI structure that showcased the problem:

```json
{
	"paths": {
		"/foo": {
			"get": {
				"description": "... operation text ..."
			}
		},
		"/foo/get": {
			"description": "... path text ..."
		}
	}
}
```

And then look at three potential solutions I've tried in different projects:

1. Flat folder
2. Specially marked folder
3. File property
4. Attempt a best guess

### Flat Folder?

What if we try to emulate the OpenAPI structure by flattening the folder structure like this:

```
paths/
	foo/ # things about the `/foo` path
		get/
			description.api.md
	foo.get/ # things about the `/foo/get` path
		description.api.md
```

We would need some way to denote that the period (`.`) is a path separator, instead of an actual period in the path. (There's not an intuitively obvious character that maps the slash (`/`) to a filepath-safe separator, e.g. `foo-get` is probably as intuitive as `foo.get`, but others exist.)

Apart from that concern, it's probably an *okay* approach, so long as you don't have too many paths. 

Imagine this in your IDE of choice:

```
paths/
	api.mobile.authenticate
	api.orgs.{orgId}
	api.orgs.{orgId}.apiKeys
	api.orgs.{orgId}.apiKeys.{apiKeyId}
	api.orgs.{orgId}.building
	api.orgs.{orgId}.building.{buildingId}
	... for 100+ more items ...
```

When I think of maintaining that folder structure in the applications I've built and maintained, I'm certain I would get frustrated quickly.

### Special Path Folder?

Maybe we could denote a special "ending" folder, for this example call it something wildly obvious like `@` and it would look like:

```
paths/
	foo/
		@/
			description.api.md
		get/
			@/
				description.api.md
```

That would be a relatively simple algorithm: start at the `paths` folder, go out until you find the `@` folder, and the folders between that are the OpenAPI `paths` key.

- `paths/foo/@` -> `[ 'paths', 'foo' ]` -> `/foo`
- `paths/foo/get/@` -> `[ 'paths', 'foo', 'get' ]` -> `/foo/get`

This resolves the problem of 100+ items cluttering the IDE when you open the `paths` folder, but it does add one additional "open folder" action, and one additional expanded folder to explore a path structure.

It still a little annoying feeling to me, and sometimes is hard to see exactly where a new property should be put.

### Special File Property?

Suppose you have a path [Parameter Object](https://spec.openapis.org/oas/v3.1.0#parameterObject) defined like this:

```json
{
	"paths": {
		"/users/{userId}": {
			"parameters": [
				{
					"name": "userId",
					"in": "path"
				}
			]
		}
	}
}
```

It ends up being really handy to define those in a programmatic way, because it's easier to cross-reference things in code instead of raw strings:

```js
// paths/users/{userId}/parameters.api.js
import { userId } from '$PROJECT/parameters.js'
export default [ userId ]
```

As a developer experience it's pretty annoying to have

* A whole file for those two lines, one file per path-with-parameters
* Next to it a file `paths/users/{userId}/summary.api.md`
* And don't forget the `paths/users/{userId}/description.api.md` as well

In applications I've built using this pattern, I would merge them into a file, e.g.:

```js
import { userId } from '$PROJECT/parameters.js'
export const parameters [ userId ]
export const summary = 'Get User'
export const description = 'Longer description about getting a user.'
```

But... where to put the file?

Using the pattern so far, it should be `paths/users/{userId}.api.js` which would look like this in an IDE when you open a folder:

```
paths/
	users/
		{userId}/
			apiTokens/
			coaches/
			events/
			... and so on for each path, then ...
			apiTokens.api.js
			coaches.api.js
			events.api.js
			... and so on for each path ...
		{userId}.api.js
```

This always looks a little odd to me, with the path-level files getting pushed below the folders, so I often define the underscore string as the "root". E.g. `folder/foo/bar/_.api.js` would map to the equivalent `folder/foo/bar.api.js`. It looks like this in an IDE:

```
paths/
	users/
		{userId}/
			_.api.js
			apiTokens/
			coaches/
			events/
			... and so on for each path ...
```

If we follow this approach, we could require a special exported value at each path, e.g. `export const $path = true`, so that our earlier example:

```json
{
	"paths": {
		"/foo": {
			"get": {
				"description": "... operation text ..."
			}
		},
		"/foo/get": {
			"description": "... path text ..."
		}
	}
}
```

Would have these files:

```
paths/
	foo/
		_.api.js => `export const $path = true`
		get/
			_.api.js => `export const $path = true`
```

This is not perfect, but I've found in practice it's also not *too* bad to use.

But... if you think about where the `description.api.md` file would go, you'll see we're right back where we started, because they would both go in the `paths/foo/get` folder!

### Attempt a Best Guess?

What if we went with a "best guess" approach, with a "simple" algorithm like this:

1. We'll call it a "path termination" if a folder has files that resolve to properties matching the [Path Item Object](https://spec.openapis.org/oas/v3.1.0#path-item-object) properties:
	* `$ref`
	* `description`
	* `parameters`
	* `servers`
	* `summary`
2. Or if it has a subfolder named any of the HTTP methods, AND
3. One or more of those subfolders have files that resolve to properties matching the [Operation Object](https://spec.openapis.org/oas/v3.1.0#operation-object) properties:
	* `callbacks`
	* `deprecated`
	* `description`
	* `externalDocs`
	* `operationId`
	* `parameters`
	* `requestBody`
	* `responses`
	* `security`
	* `servers`
	* `summary`
	* `tags`

So for example, this folder structure:

```
paths/
	foo/
		_.api.js => export const summary = 'Foo Things'
		bar/
			fizz/
				get.api.js => export const summary = 'Get a Bar Fizz Foo'
```

Would resolve to these paths:

* `/foo`
* `/foo/bar/fizz`

But would not create a path `/foo/bar` since nothing there indicates it as a separate path.

This *does not* solve the ambiguous case of the two `description.api.md` files, plus it adds a huge mental overhead, trying to understand when a path is or is not a path.

My verdict, after using it in a project for a while: **not** worth the ambiguity!

## OA Merge Solutions

We've been talking about a mostly-made-up scenario here, and for the most part this is a *special case* that should be avoided.

That doesn't mean we can disregard it, but if we can find a solution for the ambiguous path as a *special case* than we don't necessarily need to find a solution that grossly impacts the general case.

### Merged Folders

Let's look at the special-file-property approach, combined with the underscore-file approach, and adding in the ability to merge multiple folders.

Here's that JSON structure again:

```json
{
	"paths": {
		"/foo": {
			"get": {
				"description": "... operation text ..."
			}
		},
		"/foo/get": {
			"description": "... path text ..."
		}
	}
}
```

If we divide these into separate folders, we could have something like this:

```
folder1/
	paths/
		foo/
			_.api.js => export const _path = true
			get/
				description.api.md
folder2/
	paths/
		foo/
			get/
				_.api.js => export const _path = true
				description.api.md
```

This works well and is pretty understandable. (The `_` prefix of the `const` prevents potential OpenAPI namespace collisions.)

The downside is that it means needing a new folder in these cases of path ambiguity. These property names would include a *subset* of those that match to the OpenAPI [Path Item Object](https://spec.openapis.org/oas/v3.1.0#path-item-object) properties. These properties are:

* `$ref`
* `description`
* `parameters`
* `servers`
* `summary`
* And then the HTTP method names: `get`, `put`, `post`, `delete`, `options`, `head`, `patch`, and `trace`.

For example, there is ambiguity in the `description.api.md` files for this OpenAPI document:

```json
{
	"paths": {
		"/foo": {
			"get": {
				"responses": {
					"default": {
						"description": "... default response ..."
					}
				}
			}
		},
		"/foo/get/responses/default": {
			"description": "... path ..."
		}
	}
}
```

### Named Paths

OpenAPI path templates can use the curly-brace characters, e.g. `/users/{userId}`, and these are not traditionally considered filename-safe.

To support templating scenarios, we can expand the use of the `export const _path = true` flag and export it as a string:

```js
// paths/users/[userId]/_.api.js
export const _path = '/users/{userId}'
```

This doesn't directly solve the ambiguity problem, but for these ambiguous file paths it means we separate them into folders, e.g.:

```
paths/
	foo/
		_.api.js => export const _path = true
		get/
			responses/
				default/
					description.api.md
	foo-get-responses-default/
		_.api.js => export const _path = '/foo/get/responses/default'
		description.api.md
```

So long as the OA Merge tool gives appropriate notice for ambiguous paths, this is a reasonable workaround for occasional conflicts.

### Named Exports

The last way to resolve the ambiguous paths is to not write those ambiguous properties to textfiles, and instead represent this JSON:

```json
{
	"paths": {
		"/foo": {
			"get": {
				"description": "... operation text ..."
			}
		},
		"/foo/get": {
			"description": "... path text ..."
		}
	}
}
```

With this folder structure:

```
paths/
	foo/
		_.api.js
		get/
			_.api.js
```

And give these two files with these contents:

```js
// paths/foo/_.api.js
export const _path = true
export const get = {
	description: '... operation text ...',
}
// paths/foo/get/_.api.js
export const _path = true
export const description = '... path text ...'
```

This requires a path+file+contents precedence that says something like: properties in the file that defines the path will be associated with that path.

## Conclusion

For most APIs, we can make use of the following tools to define paths:

* Folders represent the `paths` key, e.g. `"/auth/login"` becomes the folder `paths/auth/login`, and
* The path termination is signified using the underscore (`_`) file, e.g. `paths/auth/login/_.api.js`, and
* That underscore file needs to export the const `_path`, and
	* If the `_path` is the boolean `true`, the folder names are used for the path name, but
	* If the `_path` is a string, that is used for the OpenAPI path key, e.g. mapping the folder `paths/users/[userId]` to `"/users/{userId}"`

This will work fine, so long as your API path URL doesn't have the following folder names:

* `$ref`
* `description`
* `parameters`
* `servers`
* `summary`
* And then the HTTP method names: `get`, `put`, `post`, `delete`, `options`, `head`, `patch`, and `trace`.

Where these are used, the possibility of ambiguity *may* exist, although not all of those can create ambiguous states.

In those cases, the API developer has the following options:

* Define those properties in the underscore file containing the `_path` marker, or
* Split the API paths into multiple input folders to be merged together by OA Merge, or
* Use a folder name for the path that puts the conflicting property in a different folder, and use the `_path` to reset the OpenAPI path key.
