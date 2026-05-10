/**
 * Smart Search utility helpers
 */

/**
 * Maps entity types from semantic search results to portal URLs.
 */
export function getEntityUrl(type: string, id: string): string {
  switch (type) {
    case 'deal':
      return `/portal/deals/${id}`
    case 'contact':
      return `/portal/relationships`
    case 'document':
      return `/portal/deals`
    case 'codice':
      return `/portal/knowledge-base`
    default:
      return `/portal`
  }
}
