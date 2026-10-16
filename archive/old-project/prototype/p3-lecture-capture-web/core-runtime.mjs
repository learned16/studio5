import { createLectureCaptureDemo } from "./lecture-demo.mjs";
import { openStudio5BrowserStorage } from "./storage-runtime.mjs";

export async function openBrowserLectureCaptureDemo(options = {}) {
  const { repository } = await openStudio5BrowserStorage();
  return createLectureCaptureDemo(repository, options);
}
