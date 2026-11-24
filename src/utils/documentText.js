export function flattenDocumentText(node) {
  if (!node) return ''
  if (node.text) return node.text
  return (node.content || []).map(flattenDocumentText).join(' ')
}

export function sanitizeFileName(value) {
  return (value || 'CloudSync document').replace(/[^a-z0-9-_ ]/gi, '').trim().replace(/\s+/g, '-').toLowerCase() || 'cloudsync-document'
}

export function formatDocumentDate(value, now = Date.now()) {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return 'Just created'
  const delta = Math.max(0, now - date.getTime())
  if (delta < 60_000) return 'Just now'
  if (delta < 3_600_000) return `${Math.floor(delta / 60_000)} min ago`
  if (delta < 86_400_000) return `${Math.floor(delta / 3_600_000)} hr ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: date.getFullYear() !== new Date(now).getFullYear() ? 'numeric' : undefined })
}
