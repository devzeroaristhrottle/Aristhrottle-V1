import { withAccountKitUi, createColorSet } from '@account-kit/react/tailwind'

// wrap your existing tailwind config with 'withAccountKitUi'

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
