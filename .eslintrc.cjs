  /* eslint-env node */
module.exports = {
  root: true,
  'extends': [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    "@vue/eslint-config-prettier",
    "@vue/eslint-config-typescript" 
  ],
  parserOptions: {
    ecmaVersion: 'latest'
  }
}
