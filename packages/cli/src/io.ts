import { access, mkdir, mkdtemp, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

export interface PendingOutput { directory: string; name: string; content: string; }

export async function commitOutputs(outputs: PendingOutput[]) {
  const stages = new Map<string, string>();
  const staged: Array<{ temporary: string; final: string; backup: string }> = [];
  const committed: Array<{ final: string; backup?: string }> = [];
  try {
    for (const output of outputs) {
      await mkdir(output.directory, { recursive: true });
      let stage = stages.get(output.directory);
      if (!stage) {
        stage = await mkdtemp(join(output.directory, ".bolhes-stage-"));
        stages.set(output.directory, stage);
      }
      const final = join(output.directory, output.name);
      const temporary = join(stage, `${staged.length}.new`);
      const backup = join(stage, `${staged.length}.old`);
      await writeFile(temporary, output.content, "utf8");
      staged.push({ temporary, final, backup });
    }
    for (const item of staged) {
      let hadPrevious = false;
      try { await access(item.final); hadPrevious = true; } catch {}
      if (hadPrevious) await rename(item.final, item.backup);
      try { await rename(item.temporary, item.final); }
      catch (error) {
        if (hadPrevious) await rename(item.backup, item.final);
        throw error;
      }
      committed.push({ final: item.final, backup: hadPrevious ? item.backup : undefined });
    }
  } catch (error) {
    for (const item of committed.reverse()) {
      await rm(item.final, { force: true });
      if (item.backup) await rename(item.backup, item.final);
    }
    throw error;
  } finally {
    await Promise.all([...stages.values()].map((stage) => rm(stage, { recursive: true, force: true })));
  }
}
