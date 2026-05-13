function renderList(items, emptyMessage) {
  if (!items || items.length === 0) return <p className="muted">{emptyMessage}</p>
  return (
    <ul>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

export default function NodeDetailsPanel({ node, expandingIds, expandedIds, error, onExpand }) {
  const isExpanding = node && expandingIds && expandingIds.has(node.id)
  const isExpanded = node && expandedIds && expandedIds.has(node.id)

  return (
    <div className="details-block">
      <h3>Node Intelligence</h3>
      {!node && <p className="muted">Click a concept node to inspect it. Use the Expand button to load its knowledge neighbourhood.</p>}
      {error && <p className="error">{error}</p>}

      {node && (
        <>
          <h4>{node.label}</h4>
          <div className="meta-tags">
            <span className="tag">{node.category}</span>
            <span className="tag">{node.confidence}</span>
            {node.is_path && <span className="tag tag-path">Curiosity Path</span>}
            {isExpanded && <span className="tag tag-expanded">Expanded</span>}
          </div>

          <button
            className="expand-btn"
            disabled={isExpanding || isExpanded}
            onClick={() => onExpand(node)}
          >
            {isExpanding ? 'Expanding...' : isExpanded ? 'Already Expanded' : 'Expand Neighbourhood'}
          </button>

          <p>{node.description || 'No description available for this concept yet.'}</p>

          <h5>Key Scientists / Thinkers</h5>
          {renderList(node.key_thinkers, 'No thinker list yet.')}

          <h5>Related Fields</h5>
          {renderList(node.related_fields, 'No related fields listed yet.')}

          <h5>Simple</h5>
          <p>{node.explanations?.simple}</p>

          <h5>Standard</h5>
          <p>{node.explanations?.standard}</p>

          <h5>Advanced</h5>
          <p>{node.explanations?.advanced}</p>
        </>
      )}
    </div>
  )
}
