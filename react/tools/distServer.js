// This file configures a web server for testing the production build on your
// local machine.

import browserSync from 'browser-sync';
import historyApiFallback from 'connect-history-api-fallback';
import {chalkProcessing} from './chalkConfig';
import {REACT_PORT, REACT_UI_PORT} from '../../constants';

/* eslint-disable no-console */

console.log(chalkProcessing('Opening production build...'));

// Run Browsersync
browserSync({
  port: REACT_PORT,
  ui: {
    port: REACT_UI_PORT
  },
  server: {
    baseDir: 'dist'
  },

  files: ['src/*.html'],

  middleware: [historyApiFallback()]
});
