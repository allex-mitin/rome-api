// Tailwind 4 ships its own PostCSS plugin (`@tailwindcss/postcss`) and handles vendor
// prefixing itself via Lightning CSS, so `autoprefixer` is no longer part of the pipeline.
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
