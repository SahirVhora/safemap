export default function CuriosityPath({ graph, onStepClick }) {
  if (!graph.curiosity_path || graph.curiosity_path.length < 2) return null

  const nodeMap = new Map(graph.nodes.map((node) => [node.id, node]))

  return (
    <div className="path-block">
      <h3>Curiosity Path</h3>
      <ol>
        {graph.curiosity_path.map((nodeId) => {
          const node = nodeMap.get(nodeId)
          const label = node ? node.label : nodeId
          return (
            <li key={nodeId}>
              <button
                className="path-step-btn"
                onClick={() => node && onStepClick(node)}
                title={node ? `Click to inspect: ${label}` : label}
              >
                {label}
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
