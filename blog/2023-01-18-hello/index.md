---
slug: hello
title: Compounded Interest of Knowledge
authors: [saibotsivad]
---

I've spent the last 10 years working on countless applications, everything from starting new, maintaining old code I'd written years ago, and even taking over maintenance and feature development for outdated architectures. (P.S. I've got a [resume](https://davistobias.com/resume) if that's your thing).

After building so many things, there are a handful of design patterns that have seemed to stick: patterns that are easy to debug, fix, and incrementally improve without ever rewriting, even many years later.

## Common Pattern

One of the more powerful patterns I've used is filepath globbing as a way to programmatically generate things with routes, whether that's pages in a webapp or API endpoints.

I've written this pattern *so many times* and for *so many years* that I'm not even sure where I came across it, although I often point at [Josh Duff](https://tehshrike.github.io/) as an early mentor, so he might have ideas.

If you're familiar with it, skip to the next heading, but if not here's what I'm talking about: you start with an ordered folder structure, where the folder and file name mean "something".

It could be that only the folder name represents a URL for your website, like [SvelteKit](https://kit.svelte.dev/docs/routing) does:

```
src/routes/
  |- +page.svelte // the URL would be "/"
  \- about/
       |- +page.svelte // the URL would be "/about"
```

Or in the case of a pattern I use a lot with the [abstract-state-router](https://github.com/TehShrike/abstract-state-router) (a router for single-page apps) the folder *and* file represent a UI "page":

```
states/
  |- index.route.js // the URL would be "/"
  |- app.route.js // the URL would be "/app"
  \- dashboard/
       |- panel.route.js // the URL would be "/dashboard/panel"
```

In any case, you take whatever folder+file path that you're using, and pass it in to something like [glob](https://www.npmjs.com/package/glob) to grab all the files matching your pattern, like maybe `**/*.route.js`, and use that output to make some *generated code* that might look like:

```js
import index from './states/index.route.js'
import index_app from './states/app.route.js'
import index_dashboard_panel from './states/dashboard/panel.route.js'
export default [
	{ path: '', handler: index },
	{ path: 'app', handler: index_app },
	{ pat: 'app.dashboard.panel', handler: index_dashboard_panel },
]
```

You would then use that as part of the instantiation process for your application.

:::note
P.S. If you use this pattern much, you should check out [`glob-module-files`](https://github.com/TehShrike/glob-module-file/).
:::

I've been using this pattern for *many* years, and I've found it (or something close) to be an invaluable tool. It's become a pretty common pattern, and it's pretty easy to understand, so other developers pick it up pretty fast.

## OpenAPI

Since being introduced to the magic and power of the OpenAPI specs years ago (back when it was still Swagger *and* in beta!) I've come to appreciate the power of well-designed API specifications, and have embraced them pretty strongly.

I'm a firm believer that, over time, building and learning tools based on mature specifications becomes a *compounding knowledge interest* across all applications: less groping around in the dark to understand new concepts, less rewriting from scratch when you build a new application, and a healthier development cycle for existing applications.

## Introducing OpenAPI Merge / OA Merge / `oamerge`

After ten years of building new things and maintaining old things I wrote years ago, I feel ready to start taking all those lessons-learned and best-practices that I've developed and turn them into useful tools.

But I have a bigger vision in mind as well: I want to stop writing code that isn't actively contributing to business goals.

## The Risky Problem

How many times have I written the same tired login API endpoints? ***Too many!*** The worst part is that making solid and strongly secure login endpoints is code that I've written so many times, but never in a way that can be shared. It's discouraging.

There are many pre-built solutions and services out there that give you some sort of authentication system "for free" (e.g. no-code or very light code required) and if they work for your goals than go use them!

But... over the years, I've tried out too many libraries and services that start "okay" but can't be extended or modified in the specific ways required by the business logic at hand. In the end it feels like the proverbial square peg and round hole–you know you're going to need a different tool, and the unravel-and-migrate pain will be big.

## My Proposal

OA Merge is a tool which takes one or more folders of files organized to mirror the OpenAPI specs, and compiles output to serve specific purposes.

It's a plugin-based system, so you can add support for ingesting all sorts of file types, and outputting all sorts of generated code or other files, but everything based on the OpenAPI specs.

I'm making a bet that building tools on good specs will compound in value over time.

## Why Now?

I'm going live with OA Merge now, even though not everything is done, because I've hammered on the pattern across about a half dozen production applications and found it to be solid.

More importantly, I want to start using my lessons-learned with some new projects coming up in early 2023, but instead of hiding those lessons into proprietary client code, this time I'm starting with plugins for OA Merge, so I can use them again later.

The first generator is [`@oamerge/generator-routes`](/docs/generators/routes) which turns an OpenAPI folder into a list of routes to pass to things like Express or Polka.

I have a few more already in the works that handle security, generating an OpenAPI JSON/YAML document, and schema validation. They might be a while, but I've written them many times already, so I feel pretty good about applying best-practices to those.
