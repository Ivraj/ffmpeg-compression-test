#!/usr/bin/env zx

import fs from "fs";
import { $, quiet } from "zx";

import { humanFileSize } from "../lib/bytes-conversion.mjs";
import { INPUT_DIR, OUTPUT_DIR } from "./constants.js";

type FfmpegCmd = (filename: string) => Promise<void>;

export const basicCompression: FfmpegCmd = async (filename: string) => {
  await quiet($`ffmpeg -loglevel panic -y -i ${INPUT_DIR}/${filename} ${OUTPUT_DIR}/${filename}`);
};

export const crfCompression: FfmpegCmd = async (filename: string) => {
  await quiet(
    $`ffmpeg -loglevel panic -y -i ${INPUT_DIR}/${filename} -vcodec libx265 -crf 28 ${OUTPUT_DIR}/${filename}`,
  );
};

export const testFfmpegCmd = async (cmd: FfmpegCmd, cmdName: string) => {
  console.log(`Starting test for ${cmdName}`);
  const dir = fs.readdirSync(INPUT_DIR);

  const results = await Promise.all(
    dir.map(async (filename) => {
      const inputFilepath = `${INPUT_DIR}/${filename}`;
      const outputFilepath = `${OUTPUT_DIR}/${filename}`;

      const initialSize = fs.statSync(inputFilepath).size;
      const startTime = new Date().getTime();
      await cmd(filename);
      const endTime = new Date().getTime();
      const compressedSize = fs.statSync(outputFilepath).size;
      const timeInSeconds = `${((endTime - startTime) / 1000).toFixed(1)}s`;

      const readableInitialSize = humanFileSize(initialSize);
      const readableCompressedSize = humanFileSize(compressedSize);
      const percentChange = (((initialSize - compressedSize) / initialSize) * 100).toFixed(1);

      return {
        filename,
        initialSize,
        compressedSize,
        timeInSeconds,
        readableInitialSize,
        readableCompressedSize,
        percentChange,
      };
    }),
  );

  console.log(`Results for ${cmdName}`);
  results.forEach((result) => {
    console.log(
      `Compressed ${result.filename} from ${result.readableInitialSize} to ${result.readableCompressedSize} in ${result.timeInSeconds}, a ${result.percentChange}% change`,
    );
  });
};
