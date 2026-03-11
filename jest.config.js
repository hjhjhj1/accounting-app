module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.vue$': '@vue/vue3-jest',
    '^.+\\.js$': 'babel-jest'
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  globals: {
    'vue-jest': {
      compilerOptions: {
        isCustomElement: tag => tag.startsWith('ion-')
      }
    }
  }
}
