# Cache Tag Map

This document defines the tag structure for our caching system. Tags enable precise, surgical cache invalidation without nuking entire routes.

## Tag Structure

### Collections
- `collection:<slug>` — Single collection details & items
- `collections:public:list` — List of public collections (dashboards, explore pages)

### Items
- `item:<id>` — Individual item card cache

### Search
- `search` — Global search fallback tag
- `source:<name>` — Search cache partition per data source (tcgplayer, ebay, etc.)

## Rules

1. **Mutations must revalidate the smallest possible set**
   - When updating a collection, only invalidate `collection:<slug>`
   - When toggling visibility, also invalidate `collections:public:list`
   - When adding items, invalidate both collection and item tags

2. **Search ingest/update must revalidate source:<name> only**
   - Don't invalidate the global `search` tag unless the schema changes
   - Partition by source to enable targeted updates

3. **Prefer tags over paths**
   - Use `revalidateTag()` instead of `revalidatePath()` whenever possible
   - Only use `revalidatePath()` for structural changes (layout, navigation)

## Examples

### Creating a collection
```ts
await db.collections.create({ title });
revalidateTag(`collection:${slug}`);
if (isPublic) revalidateTag('collections:public:list');
```

### Adding items to a collection
```ts
await db.collection_items.bulkAdd(collectionId, itemIds);
revalidateTag(`collection:${slug}`);
for (const id of itemIds) revalidateTag(`item:${id}`);
```

### Updating search data
```ts
await ingestFromSource('tcgplayer', data);
revalidateTag('source:tcgplayer');
```

## Performance Notes

- Redis TTL is a guardrail (30-300 seconds typical)
- Next Data Cache respects tags immediately
- Keep cached shapes small and stable
- Monitor hit rates in Sentry spans
