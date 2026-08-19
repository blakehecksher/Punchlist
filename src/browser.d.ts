/**
 * Browser APIs this app uses that TypeScript's DOM library does not declare.
 *
 * Verified against the compiler rather than assumed: everything else the app
 * touches (createWritable, document.execCommand, navigator.storage.persist and
 * .estimate) already resolves. Only these three are missing, which is far less
 * than a whole @types package is worth.
 */

interface FileSystemHandlePermissionDescriptor {
  mode?: "read" | "readwrite";
}

interface FileSystemHandle {
  queryPermission(
    descriptor?: FileSystemHandlePermissionDescriptor,
  ): Promise<PermissionState>;
  requestPermission(
    descriptor?: FileSystemHandlePermissionDescriptor,
  ): Promise<PermissionState>;
}

interface DirectoryPickerOptions {
  id?: string;
  mode?: "read" | "readwrite";
  startIn?:
    | "desktop"
    | "documents"
    | "downloads"
    | "music"
    | "pictures"
    | "videos"
    | FileSystemHandle;
}

interface Window {
  showDirectoryPicker?(
    options?: DirectoryPickerOptions,
  ): Promise<FileSystemDirectoryHandle>;
}
