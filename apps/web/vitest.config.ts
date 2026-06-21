import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    },
    test: {
        environment: 'node',
        server: {
            deps: {
                inline: ['react-transition-group', '@mui/material', '@mui/x-date-pickers']
            }
        }
    }
});
