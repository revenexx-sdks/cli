import fs from "fs";
import os from "os";
import path from "path";
import { create } from "tar";

/**
 * Package a directory into a tar.gz File object for deployment
 */
async function packageDirectory(dirPath: string): Promise<File> {
  const tempFile = path.join(os.tmpdir(), `appwrite-deploy-${Date.now()}.tar.gz`);

  await create(
    {
      gzip: true,
      file: tempFile,
      cwd: dirPath,
    },
    ["."],
  );

  try {
    const buffer = fs.readFileSync(tempFile);
    return new File([buffer], path.basename(tempFile), {
      type: "application/gzip",
    });
  } finally {
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
}

/**
 * Resolve a file path (file or directory) into a File object for upload.
 * Directories are packaged into a tar.gz archive.
 */
export async function resolveFileParam(filePath: string): Promise<File> {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`File or directory not found: ${resolved}`);
  }
  const stat = fs.statSync(resolved);
  if (stat.isDirectory()) {
    return packageDirectory(resolved);
  }
  const buffer = fs.readFileSync(resolved);
  return new File([buffer], path.basename(resolved));
}
