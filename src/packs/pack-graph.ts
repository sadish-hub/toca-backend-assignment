/**
 * In-app graph helpers for pack trees (BFS + cycle checks).
 * Service getContent walks hop-scoped via TypeORM In(...); these helpers
 * stay pure for unit tests. No recursive SQL.
 */

export function buildChildrenByParent(
  edges: ReadonlyArray<{ parentPackId: string; childPackId: string }>,
): Map<string, string[]> {
  const childrenByParent = new Map<string, string[]>();
  for (const edge of edges) {
    const list = childrenByParent.get(edge.parentPackId);
    if (list) {
      list.push(edge.childPackId);
    } else {
      childrenByParent.set(edge.parentPackId, [edge.childPackId]);
    }
  }
  return childrenByParent;
}

export function buildContentByPack(
  rows: ReadonlyArray<{ packId: string; contentId: string }>,
): Map<string, string[]> {
  const contentByPack = new Map<string, string[]>();
  for (const row of rows) {
    const list = contentByPack.get(row.packId);
    if (list) {
      list.push(row.contentId);
    } else {
      contentByPack.set(row.packId, [row.contentId]);
    }
  }
  return contentByPack;
}

/** BFS from root; accumulate unique content ids; visited-set prevents cycles. */
export function collectUniqueContentIds(
  rootId: string,
  childrenByParent: ReadonlyMap<string, readonly string[]>,
  contentByPack: ReadonlyMap<string, readonly string[]>,
): string[] {
  const visited = new Set<string>();
  const unique = new Set<string>();
  const queue: string[] = [rootId];

  while (queue.length > 0) {
    const packId = queue.shift()!;
    if (visited.has(packId)) {
      continue;
    }
    visited.add(packId);

    for (const contentId of contentByPack.get(packId) ?? []) {
      unique.add(contentId);
    }

    for (const childId of childrenByParent.get(packId) ?? []) {
      if (!visited.has(childId)) {
        queue.push(childId);
      }
    }
  }

  return [...unique];
}

/**
 * Returns true if linking parentId → childIds would create a cycle
 * (self-ref or a child can already reach the parent via existing edges).
 */
export function wouldIntroduceCycle(
  parentId: string,
  childIds: readonly string[],
  childrenByParent: ReadonlyMap<string, readonly string[]>,
): boolean {
  if (childIds.includes(parentId)) {
    return true;
  }

  for (const childId of childIds) {
    const visited = new Set<string>();
    const queue: string[] = [childId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === parentId) {
        return true;
      }
      if (visited.has(current)) {
        continue;
      }
      visited.add(current);

      for (const next of childrenByParent.get(current) ?? []) {
        if (!visited.has(next)) {
          queue.push(next);
        }
      }
    }
  }

  return false;
}

export type PackChildEdge = {
  parentPackId: string;
  childPackId: string;
};

/**
 * Hop-scoped cycle check: walk from proposed children toward descendants,
 * loading only outgoing edges for the current frontier (no full-table scan).
 */
export async function wouldIntroduceCycleHopScoped(
  parentId: string,
  childIds: readonly string[],
  loadOutgoingEdges: (
    parentIds: readonly string[],
  ) => Promise<ReadonlyArray<PackChildEdge>>,
): Promise<boolean> {
  if (childIds.includes(parentId)) {
    return true;
  }

  const visited = new Set<string>();
  let frontier: string[] = [...childIds];

  while (frontier.length > 0) {
    const batch = [
      ...new Set(frontier.filter((packId) => !visited.has(packId))),
    ];
    frontier = [];
    if (batch.length === 0) {
      continue;
    }
    if (batch.includes(parentId)) {
      return true;
    }
    for (const packId of batch) {
      visited.add(packId);
    }

    const edges = await loadOutgoingEdges(batch);
    for (const edge of edges) {
      if (edge.childPackId === parentId) {
        return true;
      }
      if (!visited.has(edge.childPackId)) {
        frontier.push(edge.childPackId);
      }
    }
  }

  return false;
}
