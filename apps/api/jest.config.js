/** @type {import('jest').Config} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.test.ts'],
    globalSetup: './src/__tests__/helpers/setup.ts',
    globalTeardown: './src/__tests__/helpers/teardown.ts',
    clearMocks: true,
    testTimeout: 15000,

    transform: {
        '^.+\\.ts$': ['ts-jest', { tsconfig: './tsconfig.test.json' }],
    },
};
