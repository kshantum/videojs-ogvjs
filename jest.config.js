module.exports = {
    testEnvironment: 'jsdom',
    testMatch: ['<rootDir>/tests/**/*.test.js'],
    moduleNameMapper: {
        '^video\\.js$': '<rootDir>/tests/mocks/videojs.mock.js',
        '^ogv$': '<rootDir>/tests/mocks/ogv.mock.js'
    }
};
