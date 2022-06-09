#!/usr/bin/env zx

import {
  defaultCompression,
  crfCompression,
  testFfmpegCmd,
  scalingCompression,
  scalingForcedCompression,
} from "../lib/ffmpegTesting.js";

(async () => {
  console.log(`\n`);
  await testFfmpegCmd(defaultCompression);
  console.log(`\n`);
  await testFfmpegCmd(crfCompression);
  console.log(`\n`);
  await testFfmpegCmd(scalingCompression);
  console.log(`\n`);
  await testFfmpegCmd(scalingForcedCompression);
})();
