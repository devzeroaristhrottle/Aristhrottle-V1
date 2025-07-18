import type { Config } from 'tailwindcss'
import { withAccountKitUi, createColorSet } from '@account-kit/react/tailwind'

export default withAccountKitUi(
	{
		content: [
			'./src/pages/**/*.{js,ts,jsx,tsx,mdx}',
			'./src/components/**/*.{js,ts,jsx,tsx,mdx}',
			'./src/app/**/*.{js,ts,jsx,tsx,mdx}',
		],
		theme: {
			extend: {
				colors: {
					background: 'var(--background)',
					foreground: 'var(--foreground)',
				},
				borderRadius: {
					'10px': '10px',
				},
				animation: {
					marquee: 'marquee 15s linear infinite',
				},
				keyframes: {
					marquee: {
						'0%': { transform: 'translateX(100%)' },
						'100%': { transform: 'translateX(-100%)' },
					},
				},
			},
		},
		plugins: [],
	},
	{
		// override account kit themes
		colors: {
			'btn-primary': createColorSet('#E82594', '#FF66CC'),
			'fg-accent-brand': createColorSet('#E82594', '#FF66CC'),
		},
	}
)
