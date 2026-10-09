/**
 * Phusion Passenger loads the startup file with require().
 * The BigDrop API is ESM and uses top-level await, so this CJS wrapper
 * dynamically imports it.
 */
import('./server/src/index.js').catch((err) => {
  console.error(err);
  process.exit(1);
});
