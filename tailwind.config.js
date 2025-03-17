/** @type {import('tailwindcss').Config} */
// eslint-disable-next-line no-undef
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./app/**/*.{html,css}", "./components/**/*.{js,jsx,ts,tsx}", "./components/**/*.{html,css}"],
  // eslint-disable-next-line @typescript-eslint/no-require-imports, no-undef
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
  			primary: {
  				'100': '#E3E9FD',
  				'200': '#BCC8FB',
  				'300': '#8BA6F8',
  				'400': '#5983F5',
  				'500': '#2C59DB',
  				'600': '#2449B0',
  				'700': '#1D3A85',
  				'800': '#142959',
  				'900': '#0C1930',
  				DEFAULT: '#2C59DB'
  			},
  			secondary: {
  				DEFAULT: '#172554'
  			},
  			tertiary: {
  				DEFAULT: '#3742FA'
  			},
  			neutral: {
  				'1': '#FFFFFF',
  				'2': '#F8F9FA',
  				'3': '#DEE2E6',
  				'4': '#CED4DA',
  				'5': '#ADB5BD',
  				'6': '#7B7F83',
  				'7': '#212529',
  				'8': '#000000'
  			},
  			accent: {
  				emphasis: '#DB6B2C',
  				select: '#4DD6B2',
  				muted: '#E2E6F0',
  				destructive: '#E74C3C',
  				warning: '#F1C40F',
  				info: '#A3C9D6',
  				highlight: '#C2D7F8'
  			}
  		},
    },
  },
  plugins: [],
};

