#!/usr/bin/env zx

import fs from "fs";
import { $, quiet } from "zx";

import { humanFileSize } from "../lib/bytes-conversion.mjs";
import { INPUT_DIR, OUTPUT_DIR } from "./constants.js";

type FfmpegCmd = (inputFilepath: string, outputFilepath: string) => Promise<void>;

type FfmpegCompressionTest = {
  cmd: FfmpegCmd;
  name: string;
  filePrefix: string;
};

export const defaultCompression: FfmpegCompressionTest = {
  cmd: async (inputFilepath: string, outputFilepath: string) => {
    await quiet($`ffmpeg -loglevel panic -y -i ${inputFilepath} ${outputFilepath}`);
  },
  name: "Default Compression",
  filePrefix: "default",
};

export const crfCompression: FfmpegCompressionTest = {
  cmd: async (inputFilepath: string, outputFilepath) => {
    await quiet(
      $`ffmpeg -loglevel panic -y -i ${inputFilepath} -vcodec libx265 -crf 28 ${outputFilepath}`,
    );
  },
  name: "CRF Compression",
  filePrefix: "crf",
};

export const scalingCompression: FfmpegCompressionTest = {
  cmd: async (inputFilepath: string, outputFilepath: string) => {
    await quiet(
      $`ffmpeg -loglevel panic -y -i ${inputFilepath} -vf "scale='min(1080, iw)':-2" ${outputFilepath}`,
    );
    await quiet(
      $`ffmpeg -loglevel panic -y -i ${inputFilepath} -vf "scale='-2:min(1080, ih)'" ${outputFilepath}`,
    );
  },
  name: "Scaling Compression",
  filePrefix: "scaling",
};

export const scalingForcedCompression: FfmpegCompressionTest = {
  cmd: async (inputFilepath: string, outputFilepath: string) => {
    await quiet(
      $`ffmpeg -loglevel panic -y -i ${inputFilepath} -vf scale=w=1080:h=1080:force_original_aspect_ratio=decrease ${outputFilepath}`,
    );
  },
  name: "Scaling Forced Compression",
  filePrefix: "scaling",
};

export const testFfmpegCmd = async (compressionTest: FfmpegCompressionTest) => {
  console.log(`Starting test for ${compressionTest.name}`);
  const dir = fs.readdirSync(INPUT_DIR);

  const results = await Promise.all(
    dir.map(async (filename) => {
      const inputFilepath = `${INPUT_DIR}/${filename}`;
      const outputFilepath = `${OUTPUT_DIR}/${compressionTest.filePrefix}/${filename}`;
      if (!fs.existsSync(`${OUTPUT_DIR}/${compressionTest.filePrefix}`)) {
        fs.mkdirSync(`${OUTPUT_DIR}/${compressionTest.filePrefix}`);
      }

      const initialSize = fs.statSync(inputFilepath).size;
      const startTime = new Date().getTime();
      await compressionTest.cmd(inputFilepath, outputFilepath);
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

  console.log(`Results for ${compressionTest.name}`);
  results.forEach((result) => {
    console.log(
      `Compressed ${result.filename} from ${result.readableInitialSize} to ${result.readableCompressedSize} in ${result.timeInSeconds}, a ${result.percentChange}% change`,
    );
  });
};
