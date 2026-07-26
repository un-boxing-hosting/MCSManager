import os from "os";
import path from "path";
import { commandStringToArray } from "./command_parser";

const UNIX_SCRIPT_EXTENSIONS = new Set([".sh", ".bash", ".zsh", ".command"]);
const WINDOWS_SCRIPT_EXTENSIONS = new Set([".bat", ".cmd", ".ps1"]);

interface IBuildStartupCommandListOptions {
  windowsRawMode?: boolean;
}

export function buildStartupCommandList(
  startCommand: string,
  cwd: string,
  options: IBuildStartupCommandListOptions = {}
) {
  const platform = os.platform();
  const parsedCommandList = commandStringToArray(startCommand);
  if (parsedCommandList.length === 0) return [];

  const commandExeFile = parsedCommandList[0];
  const commandParameters = parsedCommandList.slice(1);
  const extension = path.extname(commandExeFile).toLowerCase();
  const windowsRawMode = !!options.windowsRawMode;

  if (platform === "win32" && WINDOWS_SCRIPT_EXTENSIONS.has(extension)) {
    if (extension === ".ps1") {
      const scriptPath = path.isAbsolute(commandExeFile)
        ? commandExeFile
        : path.resolve(cwd, commandExeFile);
      return ["powershell.exe", "-ExecutionPolicy", "Bypass", "-File", scriptPath, ...commandParameters];
    }
    return ["cmd.exe", "/d", "/s", "/c", startCommand];
  }

  if (platform !== "win32" && UNIX_SCRIPT_EXTENSIONS.has(extension)) {
    const scriptPath = path.isAbsolute(commandExeFile)
      ? commandExeFile
      : path.resolve(cwd, commandExeFile);
    return ["bash", scriptPath, ...commandParameters];
  }

  if (platform === "win32" && windowsRawMode) {
    return [startCommand];
  }

  return parsedCommandList;
}
