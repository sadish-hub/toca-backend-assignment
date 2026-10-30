import {
  buildChildrenByParent,
  buildContentByPack,
  collectUniqueContentIds,
  wouldIntroduceCycle,
} from './pack-graph.js';

describe('pack-graph', () => {
  describe('collectUniqueContentIds (BFS)', () => {
    it('returns direct content for a leaf pack', () => {
      const contentByPack = buildContentByPack([
        { packId: 'pack.a', contentId: 'item.1' },
        { packId: 'pack.a', contentId: 'item.2' },
      ]);

      expect(
        collectUniqueContentIds('pack.a', new Map(), contentByPack).sort(),
      ).toEqual(['item.1', 'item.2']);
    });

    it('aggregates nested child content uniquely', () => {
      const childrenByParent = buildChildrenByParent([
        { parentPackId: 'pack.parent', childPackId: 'pack.child' },
      ]);
      const contentByPack = buildContentByPack([
        { packId: 'pack.parent', contentId: 'furniture.whiteboard' },
        { packId: 'pack.child', contentId: 'character.teacher' },
        { packId: 'pack.child', contentId: 'furniture.whiteboard' },
      ]);

      expect(
        collectUniqueContentIds(
          'pack.parent',
          childrenByParent,
          contentByPack,
        ).sort(),
      ).toEqual(['character.teacher', 'furniture.whiteboard']);
    });

    it('handles a diamond graph (shared grandchild) without duplicates', () => {
      const childrenByParent = buildChildrenByParent([
        { parentPackId: 'root', childPackId: 'left' },
        { parentPackId: 'root', childPackId: 'right' },
        { parentPackId: 'left', childPackId: 'shared' },
        { parentPackId: 'right', childPackId: 'shared' },
      ]);
      const contentByPack = buildContentByPack([
        { packId: 'root', contentId: 'c.root' },
        { packId: 'left', contentId: 'c.left' },
        { packId: 'right', contentId: 'c.right' },
        { packId: 'shared', contentId: 'c.shared' },
      ]);

      expect(
        collectUniqueContentIds('root', childrenByParent, contentByPack).sort(),
      ).toEqual(['c.left', 'c.right', 'c.root', 'c.shared']);
    });

    it('does not hang on a cycle thanks to the visited set', () => {
      const childrenByParent = buildChildrenByParent([
        { parentPackId: 'a', childPackId: 'b' },
        { parentPackId: 'b', childPackId: 'a' },
      ]);
      const contentByPack = buildContentByPack([
        { packId: 'a', contentId: 'c.a' },
        { packId: 'b', contentId: 'c.b' },
      ]);

      expect(
        collectUniqueContentIds('a', childrenByParent, contentByPack).sort(),
      ).toEqual(['c.a', 'c.b']);
    });

    it('includes content from inactive packs in the traversal', () => {
      const childrenByParent = buildChildrenByParent([
        { parentPackId: 'active.parent', childPackId: 'inactive.child' },
      ]);
      const contentByPack = buildContentByPack([
        { packId: 'active.parent', contentId: 'c.parent' },
        { packId: 'inactive.child', contentId: 'c.inactive' },
      ]);

      expect(
        collectUniqueContentIds(
          'active.parent',
          childrenByParent,
          contentByPack,
        ).sort(),
      ).toEqual(['c.inactive', 'c.parent']);
    });

    it('aggregates unique content across a 5-level deep chain (a→b→c→d→e)', () => {
      const childrenByParent = buildChildrenByParent([
        { parentPackId: 'pack.a', childPackId: 'pack.b' },
        { parentPackId: 'pack.b', childPackId: 'pack.c' },
        { parentPackId: 'pack.c', childPackId: 'pack.d' },
        { parentPackId: 'pack.d', childPackId: 'pack.e' },
      ]);
      const contentByPack = buildContentByPack([
        { packId: 'pack.a', contentId: 'c.a' },
        { packId: 'pack.b', contentId: 'c.b' },
        { packId: 'pack.c', contentId: 'c.c' },
        { packId: 'pack.d', contentId: 'c.d' },
        { packId: 'pack.e', contentId: 'c.e' },
      ]);

      expect(
        collectUniqueContentIds(
          'pack.a',
          childrenByParent,
          contentByPack,
        ).sort(),
      ).toEqual(['c.a', 'c.b', 'c.c', 'c.d', 'c.e']);
    });

    it('dedupes the same content id appearing on level 1 and level 5', () => {
      const childrenByParent = buildChildrenByParent([
        { parentPackId: 'pack.a', childPackId: 'pack.b' },
        { parentPackId: 'pack.b', childPackId: 'pack.c' },
        { parentPackId: 'pack.c', childPackId: 'pack.d' },
        { parentPackId: 'pack.d', childPackId: 'pack.e' },
      ]);
      const contentByPack = buildContentByPack([
        { packId: 'pack.a', contentId: 'c.shared' },
        { packId: 'pack.a', contentId: 'c.a-only' },
        { packId: 'pack.b', contentId: 'c.b' },
        { packId: 'pack.c', contentId: 'c.c' },
        { packId: 'pack.d', contentId: 'c.d' },
        { packId: 'pack.e', contentId: 'c.shared' },
        { packId: 'pack.e', contentId: 'c.e-only' },
      ]);

      expect(
        collectUniqueContentIds(
          'pack.a',
          childrenByParent,
          contentByPack,
        ).sort(),
      ).toEqual(['c.a-only', 'c.b', 'c.c', 'c.d', 'c.e-only', 'c.shared']);
    });

    it('handles a wide root with a deep branch (3+ depth) without duplicates', () => {
      // root → left | mid | right; mid → mid.g1 | mid.g2; mid.g1 → mid.gg
      const childrenByParent = buildChildrenByParent([
        { parentPackId: 'root', childPackId: 'left' },
        { parentPackId: 'root', childPackId: 'mid' },
        { parentPackId: 'root', childPackId: 'right' },
        { parentPackId: 'mid', childPackId: 'mid.g1' },
        { parentPackId: 'mid', childPackId: 'mid.g2' },
        { parentPackId: 'mid.g1', childPackId: 'mid.gg' },
      ]);
      const contentByPack = buildContentByPack([
        { packId: 'root', contentId: 'c.root' },
        { packId: 'left', contentId: 'c.left' },
        { packId: 'mid', contentId: 'c.mid' },
        { packId: 'right', contentId: 'c.right' },
        { packId: 'mid.g1', contentId: 'c.mid-g1' },
        { packId: 'mid.g2', contentId: 'c.shared' },
        { packId: 'mid.gg', contentId: 'c.shared' },
        { packId: 'mid.gg', contentId: 'c.deep' },
      ]);

      expect(
        collectUniqueContentIds('root', childrenByParent, contentByPack).sort(),
      ).toEqual([
        'c.deep',
        'c.left',
        'c.mid',
        'c.mid-g1',
        'c.right',
        'c.root',
        'c.shared',
      ]);
    });

    it('finds leaf-only content through empty intermediate nodes via BFS', () => {
      const childrenByParent = buildChildrenByParent([
        { parentPackId: 'root', childPackId: 'empty.1' },
        { parentPackId: 'empty.1', childPackId: 'empty.2' },
        { parentPackId: 'empty.2', childPackId: 'leaf' },
      ]);
      const contentByPack = buildContentByPack([
        { packId: 'leaf', contentId: 'c.leaf-a' },
        { packId: 'leaf', contentId: 'c.leaf-b' },
      ]);

      expect(
        collectUniqueContentIds('root', childrenByParent, contentByPack).sort(),
      ).toEqual(['c.leaf-a', 'c.leaf-b']);
    });

    it('returns only root content when all descendants are empty', () => {
      const childrenByParent = buildChildrenByParent([
        { parentPackId: 'root', childPackId: 'child' },
        { parentPackId: 'child', childPackId: 'grandchild' },
      ]);
      const contentByPack = buildContentByPack([
        { packId: 'root', contentId: 'c.root-a' },
        { packId: 'root', contentId: 'c.root-b' },
      ]);

      expect(
        collectUniqueContentIds('root', childrenByParent, contentByPack).sort(),
      ).toEqual(['c.root-a', 'c.root-b']);
    });

    it('dedupes the same content id across many sibling packs', () => {
      const childrenByParent = buildChildrenByParent([
        { parentPackId: 'root', childPackId: 'sib.1' },
        { parentPackId: 'root', childPackId: 'sib.2' },
        { parentPackId: 'root', childPackId: 'sib.3' },
        { parentPackId: 'root', childPackId: 'sib.4' },
      ]);
      const contentByPack = buildContentByPack([
        { packId: 'root', contentId: 'c.common' },
        { packId: 'sib.1', contentId: 'c.common' },
        { packId: 'sib.2', contentId: 'c.common' },
        { packId: 'sib.3', contentId: 'c.unique-3' },
        { packId: 'sib.4', contentId: 'c.common' },
      ]);

      expect(
        collectUniqueContentIds('root', childrenByParent, contentByPack).sort(),
      ).toEqual(['c.common', 'c.unique-3']);
    });

    it('returns an empty list for a pack with no content and no children', () => {
      expect(collectUniqueContentIds('lonely', new Map(), new Map())).toEqual(
        [],
      );
    });

    it('ignores content from packs outside the reachable subgraph', () => {
      const childrenByParent = buildChildrenByParent([
        { parentPackId: 'root', childPackId: 'child' },
        { parentPackId: 'orphan.parent', childPackId: 'orphan.child' },
      ]);
      const contentByPack = buildContentByPack([
        { packId: 'root', contentId: 'c.root' },
        { packId: 'child', contentId: 'c.child' },
        { packId: 'orphan.parent', contentId: 'c.orphan' },
        { packId: 'orphan.child', contentId: 'c.orphan-child' },
      ]);

      expect(
        collectUniqueContentIds('root', childrenByParent, contentByPack).sort(),
      ).toEqual(['c.child', 'c.root']);
    });

    it('survives a deep cycle without duplicating content', () => {
      // a → b → c → d → e → b (cycle back into the chain)
      const childrenByParent = buildChildrenByParent([
        { parentPackId: 'a', childPackId: 'b' },
        { parentPackId: 'b', childPackId: 'c' },
        { parentPackId: 'c', childPackId: 'd' },
        { parentPackId: 'd', childPackId: 'e' },
        { parentPackId: 'e', childPackId: 'b' },
      ]);
      const contentByPack = buildContentByPack([
        { packId: 'a', contentId: 'c.a' },
        { packId: 'b', contentId: 'c.b' },
        { packId: 'c', contentId: 'c.c' },
        { packId: 'd', contentId: 'c.d' },
        { packId: 'e', contentId: 'c.e' },
        { packId: 'e', contentId: 'c.b' },
      ]);

      expect(
        collectUniqueContentIds('a', childrenByParent, contentByPack).sort(),
      ).toEqual(['c.a', 'c.b', 'c.c', 'c.d', 'c.e']);
    });
  });

  describe('wouldIntroduceCycle', () => {
    it('detects self-reference', () => {
      expect(wouldIntroduceCycle('pack.a', ['pack.a'], new Map())).toBe(true);
    });

    it('allows linking to an unrelated existing pack', () => {
      const childrenByParent = buildChildrenByParent([
        { parentPackId: 'other', childPackId: 'leaf' },
      ]);
      expect(wouldIntroduceCycle('pack.new', ['leaf'], childrenByParent)).toBe(
        false,
      );
    });

    it('detects a cycle when a child can already reach the parent', () => {
      // Existing: a → b. Adding b → a would cycle.
      const childrenByParent = buildChildrenByParent([
        { parentPackId: 'a', childPackId: 'b' },
      ]);
      expect(wouldIntroduceCycle('b', ['a'], childrenByParent)).toBe(true);
    });

    it('detects a longer cycle (a → b → c, adding c → a)', () => {
      const childrenByParent = buildChildrenByParent([
        { parentPackId: 'a', childPackId: 'b' },
        { parentPackId: 'b', childPackId: 'c' },
      ]);
      expect(wouldIntroduceCycle('c', ['a'], childrenByParent)).toBe(true);
    });
  });
});
