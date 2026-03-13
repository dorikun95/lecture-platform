import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const IS_VERCEL = !!process.env.VERCEL;

// In-memory store for serverless environments
const memoryStore = new Map<string, unknown[]>();

async function ensureDir() {
  if (IS_VERCEL) return;
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readJson<T>(filename: string): Promise<T[]> {
  // Check memory first
  if (memoryStore.has(filename)) {
    return memoryStore.get(filename) as T[];
  }

  if (IS_VERCEL) {
    memoryStore.set(filename, []);
    return [];
  }

  await ensureDir();
  const filePath = path.join(DATA_DIR, filename);
  try {
    const data = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(data) as T[];
    memoryStore.set(filename, parsed);
    return parsed;
  } catch {
    memoryStore.set(filename, []);
    return [];
  }
}

async function writeJson<T>(filename: string, data: T[]): Promise<void> {
  memoryStore.set(filename, data);

  if (IS_VERCEL) return;

  await ensureDir();
  const filePath = path.join(DATA_DIR, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export class JsonCollection<T extends { id: string }> {
  constructor(private filename: string) {}

  async findAll(): Promise<T[]> {
    return readJson<T>(this.filename);
  }

  async findById(id: string): Promise<T | null> {
    const items = await this.findAll();
    return items.find((item) => item.id === id) ?? null;
  }

  async findMany(predicate: (item: T) => boolean): Promise<T[]> {
    const items = await this.findAll();
    return items.filter(predicate);
  }

  async findOne(predicate: (item: T) => boolean): Promise<T | null> {
    const items = await this.findAll();
    return items.find(predicate) ?? null;
  }

  async create(item: T): Promise<T> {
    const items = await this.findAll();
    items.push(item);
    await writeJson(this.filename, items);
    return item;
  }

  async update(id: string, updates: Partial<T>): Promise<T | null> {
    const items = await this.findAll();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return null;
    items[index] = { ...items[index], ...updates };
    await writeJson(this.filename, items);
    return items[index];
  }

  async delete(id: string): Promise<boolean> {
    const items = await this.findAll();
    const filtered = items.filter((item) => item.id !== id);
    if (filtered.length === items.length) return false;
    await writeJson(this.filename, filtered);
    return true;
  }

  async deleteMany(predicate: (item: T) => boolean): Promise<number> {
    const items = await this.findAll();
    const remaining = items.filter((item) => !predicate(item));
    const count = items.length - remaining.length;
    await writeJson(this.filename, remaining);
    return count;
  }
}
