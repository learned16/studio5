import { openStudio5BrowserStorage } from "../storage-runtime.mjs";
import { createLectureCloseoutDemo } from "./closeout-bridge.mjs";

export async function openBrowserLectureCloseoutDemo(options = {}) {
  const { repository } = await openStudio5BrowserStorage();
  return createLectureCloseoutDemo(repository, options);
}
