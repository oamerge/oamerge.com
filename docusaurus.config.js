// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github')
const darkCodeTheme = require('prism-react-renderer/themes/dracula')

/** @type {import('@docusaurus/types').Config} */
const config = {
	title: 'OpenAPI Merge',
	tagline: 'Merge and share OpenAPI endpoints and schemas.',
	url: 'https://oamerge.com',
	baseUrl: '/',
	onBrokenLinks: 'throw',
	onBrokenMarkdownLinks: 'warn',
	favicon: 'favicon.ico',

	// Even if you don't use internalization, you can use this field to set useful
	// metadata like html lang. For example, if your site is Chinese, you may want
	// to replace "en" with "zh-Hans".
	i18n: {
		defaultLocale: 'en',
		locales: [ 'en' ],
	},

	presets: [
		[
			'classic',
			/** @type {import('@docusaurus/preset-classic').Options} */
			({
				docs: {
					sidebarPath: require.resolve('./sidebars.js'),
				},
				blog: {
					showReadingTime: true,
				},
				theme: {
					customCss: require.resolve('./src/css/custom.css'),
				},
			}),
		],
	],

	themeConfig:
	/** @type {import('@docusaurus/preset-classic').ThemeConfig} */
	({
		navbar: {
			title: 'OA Merge',
			logo: {
				alt: 'OAM',
				src: 'favicon/apple-touch-icon.png',
			},
			items: [
				{
					type: 'doc',
					docId: 'intro',
					position: 'left',
					label: 'Documentation',
				},
				{ to: '/blog', label: 'Blog', position: 'left' },
				{
					href: 'https://github.com/oamerge',
					label: 'GitHub',
					position: 'right',
				},
			],
		},
		footer: {
			style: 'dark',
			links: [
				{
					title: 'Docs',
					items: [
						{
							label: 'Tutorial',
							to: '/docs/intro',
						},
					],
				},
				{
					title: 'Community',
					items: [
						{
							label: 'Stack Overflow',
							href: 'https://stackoverflow.com/questions/tagged/oamerge',
						},
						{
							label: 'Twitter',
							href: 'https://twitter.com/oamerge',
						},
					],
				},
				{
					title: 'More',
					items: [
						{
							label: 'Blog',
							to: '/blog',
						},
						{
							label: 'GitHub',
							href: 'https://github.com/oamerge',
						},
					],
				},
			],
			copyright: `Copyright © 2021-${new Date().getFullYear()} Tobias Labs, LLC.`,
		},
		prism: {
			theme: lightCodeTheme,
			darkTheme: darkCodeTheme,
		},
	}),
}

module.exports = config
