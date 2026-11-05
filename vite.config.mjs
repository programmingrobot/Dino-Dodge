import { defineConfig } from 'vite';

// PixelVolt serves each uploaded build from /games/<slug>/.
// Relative asset URLs keep the build working from that subpath.
export default defineConfig({
    base: './'
});
