const { withShlikshlak } = require('../../dist/NextjsHook.cjs')
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = withShlikshlak(nextConfig)
