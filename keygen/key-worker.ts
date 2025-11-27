import { parentPort } from "node:worker_threads";
import type {
  KeyGenerationInput,
  KeyGenerationResult,
} from "../src/keygen/domain";
import { generateKey } from "../src/keygen/engine";

if (!parentPort) {
  throw new Error("key-worker must be run as a worker thread");
}

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

parentPort.on("message", async (message: KeygenJob) => {
  if (message.type !== "generateKey") {
    const error: KeygenJobError = {
      type: "generateKey:error",
      error: `Unknown job type: ${(message as any).type}`,
    };
    parentPort!.postMessage(error);
    return;
  }

  try {
    const result: KeyGenerationResult = await generateKey(message.payload);
    const response: KeygenJobResult = {
      type: "generateKey:result",
      payload: result,
    };
    parentPort!.postMessage(response);
  } catch (err) {
    const error: KeygenJobError = {
      type: "generateKey:error",
      error: err instanceof Error ? err.message : String(err),
    };
    parentPort!.postMessage(error);
  }
});
