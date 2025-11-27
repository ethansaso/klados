import path from "node:path";
import { Worker } from "node:worker_threads";
import type {
  KeyGenerationInput,
  KeyGenerationResult,
} from "../src/keygen/domain";

type KeygenJob = {
  type: "generateKey";
  payload: KeyGenerationInput;
};

type KeygenJobResult = {
  type: "generateKey:result";
  payload: KeyGenerationResult;
};

type KeygenJobError = {
  type: "generateKey:error";
  error: string;
};

const WORKER_COUNT = Number.parseInt(process.env.KEYGEN_WORKERS ?? "", 10) || 2;

const workerScript = path.join(__dirname, "key-worker.js");

const workers: Worker[] = [];
let nextWorkerIndex = 0;

for (let i = 0; i < WORKER_COUNT; i += 1) {
  workers.push(new Worker(workerScript));
}

export function generateKeyInWorker(
  input: KeyGenerationInput
): Promise<KeyGenerationResult> {
  return new Promise((resolve, reject) => {
    const worker = workers[nextWorkerIndex];
    nextWorkerIndex = (nextWorkerIndex + 1) % workers.length;

    const handleMessage = (message: KeygenJobResult | KeygenJobError) => {
      worker.off("error", handleError);

      if (message.type === "generateKey:result") {
        resolve(message.payload);
      } else {
        reject(new Error(message.error));
      }
    };

    const handleError = (err: Error) => {
      worker.off("message", handleMessage);
      reject(err);
    };

    worker.once("message", handleMessage);
    worker.once("error", handleError);

    const job: KeygenJob = {
      type: "generateKey",
      payload: input,
    };

    worker.postMessage(job);
  });
}
