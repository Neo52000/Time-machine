import {
  MachineProfileSchema,
  SourceReferenceSchema,
  type MachineProfile,
  type SourceReference,
} from "@time-machine/content-schema";

export interface MachineData {
  machines: unknown[];
  sources: unknown[];
}

export interface MachineCatalog {
  machines: MachineProfile[];
  getMachine(id: string): MachineProfile | undefined;
  /** Sources cited by a profile, in citation order. */
  sourcesOf(machine: MachineProfile): SourceReference[];
}

/** Validates every profile and checks that every cited source exists (fail fast). */
export function createMachineCatalog(data: MachineData): MachineCatalog {
  const machines = data.machines.map((m) => MachineProfileSchema.parse(m));
  const sources = data.sources.map((s) => SourceReferenceSchema.parse(s));
  const sourceById = new Map(sources.map((s) => [s.id, s]));

  const machineById = new Map<string, MachineProfile>();
  for (const m of machines) {
    if (machineById.has(m.id)) throw new Error(`Duplicate machine id "${m.id}"`);
    machineById.set(m.id, m);
    for (const sourceId of m.sourceIds) {
      if (!sourceById.has(sourceId)) {
        throw new Error(`machine ${m.id} references unknown source "${sourceId}"`);
      }
    }
  }

  return {
    machines,
    getMachine: (id) => machineById.get(id),
    sourcesOf: (machine) =>
      machine.sourceIds.flatMap((id) => {
        const source = sourceById.get(id);
        return source ? [source] : [];
      }),
  };
}
