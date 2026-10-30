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
