const konstaConfig = require('konsta/config');

module.exports = konstaConfig({
  content: ['./src/**/*.{js,jsx,ts,tsx,svelte}', './src/index.html'],
  darkMode: 'class',
});
