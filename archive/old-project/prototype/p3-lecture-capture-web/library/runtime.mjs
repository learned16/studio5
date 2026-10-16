import { openStudio5BrowserStorage } from "../storage-runtime.mjs";
import { createLibraryDemo } from "./library-demo.mjs";

export async function openBrowserLibraryDemo() {
  const { repository } = await openStudio5BrowserStorage();
  return createLibraryDemo(repository);
}
