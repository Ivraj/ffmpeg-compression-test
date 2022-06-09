#!/usr/bin/env zx

import { basicCompression, crfCompression, testFfmpegCmd } from "../lib/ffmpegTesting.js";

(async () => {
  console.log(`\n`);
  await testFfmpegCmd(basicCompression, "basic compression");
  console.log(`\n`);
  await testFfmpegCmd(crfCompression, "CRF compression");
})();
