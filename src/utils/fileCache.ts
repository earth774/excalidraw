type FileCacheEntry = {
  fileId: string;
  objectUrl: string;
  blob?: Blob;
};

class FileCacheManager {
  private map = new Map<string, FileCacheEntry>();

  has(fileId: string): boolean {
    return this.map.has(fileId);
  }

  get(fileId: string): FileCacheEntry | undefined {
    return this.map.get(fileId);
  }

  put(fileId: string, blob: Blob): string {
    const existing = this.map.get(fileId);
    if (existing) return existing.objectUrl;
    const url = URL.createObjectURL(blob);
    this.map.set(fileId, { fileId, objectUrl: url, blob });
    return url;
  }

  setObjectUrl(fileId: string, url: string) {
    const existing = this.map.get(fileId);
    if (existing) {
      existing.objectUrl = url;
    } else {
      this.map.set(fileId, { fileId, objectUrl: url });
    }
  }

  revoke(fileId: string) {
    const entry = this.map.get(fileId);
    if (entry) {
      try { URL.revokeObjectURL(entry.objectUrl); } catch { /* ignore */ }
      this.map.delete(fileId);
    }
  }

  revokeMany(fileIds: string[]) {
    fileIds.forEach((id) => this.revoke(id));
  }
}

export const FileCache = new FileCacheManager();


