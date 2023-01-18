import React from 'react'
import clsx from 'clsx'
import styles from './styles.module.css'

const FeatureList = [
	{
		title: 'The Power of OpenAPI',
		description: (
			<>
				Based on the extremely powerful OpenAPI specs and a file-based merging
				system, be confident your API is well designed.
			</>
		),
	},
	{
		title: 'Focus on What Matters',
		description: (
			<>
				OA Merge lets you focus on the <em>business logic</em> of your API, and we&apos;ll do
				the hard work of merging it all together.
			</>
		),
	},
	{
		title: 'Easy to Understand',
		description: (
			<>
				OA Merge is designed to be simple and easy to step out of, so you never
				have to worry that you're trapped in spaghetti code.
			</>
		),
	},
]

function Feature({ Svg, title, description }) {
	return (
		<div className={clsx('col col--4')}>
			<div className="text--center">
				{/*<Svg className={styles.featureSvg} role="img" />*/}
			</div>
			<div className="text--center padding-horiz--md">
				<h3>{title}</h3>
				<p>{description}</p>
			</div>
		</div>
	)
}

export default function HomepageFeatures() {
	return (
		<section className={styles.features}>
			<div className="container">
				<div className="row">
					{FeatureList.map((props, idx) => (
						<Feature key={idx} {...props} />
					))}
				</div>
			</div>
		</section>
	)
}
