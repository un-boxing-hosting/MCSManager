import assert from "node:assert/strict";
import test from "node:test";

import GeneralStopCommand from "../entity/commands/general/general_stop";
import { DockerProcessAdapter } from "./docker_process_service";

test("DockerProcessAdapter soft stop uses graceful container.stop for SIGTERM", async () => {
  const calls: string[] = [];
  const fakeContainer = {
    stop: async (options?: { t?: number }) => {
      calls.push(`stop:${options?.t ?? 10}`);
      return undefined;
    },
    kill: async (signal?: string) => {
      calls.push(`kill:${signal ?? "DEFAULT"}`);
      return undefined;
    }
  } as any;

  const adapter = new DockerProcessAdapter({} as any);
  adapter.container = fakeContainer;

  await adapter.kill("SIGTERM");

  assert.deepEqual(calls, ["stop:10"]);
});

test("DockerProcessAdapter hard kill still uses container.kill for SIGKILL", async () => {
  const calls: string[] = [];
  const fakeContainer = {
    stop: async () => {
      calls.push("stop");
      return undefined;
    },
    kill: async (signal?: string) => {
      calls.push(`kill:${signal ?? "DEFAULT"}`);
      return undefined;
    }
  } as any;

  const adapter = new DockerProcessAdapter({} as any);
  adapter.container = fakeContainer;

  await adapter.kill("SIGKILL");

  assert.deepEqual(calls, ["kill:SIGKILL"]);
});

test("GeneralStopCommand uses graceful SIGTERM for docker instances", async () => {
  const calls: string[] = [];
  const instance = {
    status: () => 3,
    process: {
      kill: async (signal?: string) => {
        calls.push(`kill:${signal ?? "DEFAULT"}`);
        return true;
      }
    },
    config: {
      processType: "docker",
      stopCommand: "stop",
      stopTimeout: 0
    },
    ignoreEventTaskOnce: () => undefined,
    println: () => undefined,
    print: () => undefined,
    execPreset: async () => undefined,
    startCount: 1
  } as any;

  await new GeneralStopCommand().exec(instance);

  assert.deepEqual(calls, ["kill:SIGTERM"]);
});
