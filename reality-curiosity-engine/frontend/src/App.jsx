import { useCallback, useMemo, useState } from 'react'
import CuriosityPath from './components/CuriosityPath'
import GraphCanvas from './components/GraphCanvas'
import NodeDetailsPanel from './components/NodeDetailsPanel'
import QuestionInput from './components/QuestionInput'

export default function App() {
  const [question, setQuestion] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [graph, setGraph] = useState({ nodes: [], links: [], deeper_questions: [], curiosity_path: [] })
  const [selectedNodeId, setSelectedNodeId] = useState('')
  // Track which nodes are currently being expanded (per-node loading).
  const [expandingIds, setExpandingIds] = useState(new Set())
  // Track which nodes have already been expanded so we skip duplicate API calls.
  const [expandedIds, setExpandedIds] = useState(new Set())
  const [globalLoading, setGlobalLoading] = useState(false)
  const [error, setError] = useState('')

  const selectedNode = useMemo(
    () => graph.nodes.find((node) => node.id === selectedNodeId) || null,
    [graph.nodes, selectedNodeId]
  )

  const summary = useMemo(
    () => `${graph.nodes.length} concepts • ${graph.links.length} semantic relationships`,
    [graph.nodes.length, graph.links.length]
  )

  async function generateUniverse(overrideQuestion) {
    const targetQuestion = (overrideQuestion || question).trim()
    if (!targetQuestion) return

    setGlobalLoading(true)
    setError('')
    setSelectedNodeId('')
    setExpandingIds(new Set())
    setExpandedIds(new Set())

    try {
      const response = await fetch('/api/graph/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: targetQuestion })
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Failed to generate graph')

      setQuestion(targetQuestion)
      setSessionId(payload.session_id)
      setGraph(payload.graph)
    } catch (err) {
      setError(err.message || 'Request failed')
    } finally {
      setGlobalLoading(false)
    }
  }

  // Single click — inspect only, no API call.
  const inspectNode = useCallback((node) => {
    setSelectedNodeId(node.id)
  }, [])

  // Explicit expand — called from NodeDetailsPanel button.
  const expandNode = useCallback(async (node) => {
    if (!sessionId || expandingIds.has(node.id) || expandedIds.has(node.id)) return

    setExpandingIds((prev) => new Set([...prev, node.id]))
    setError('')

    try {
      const response = await fetch('/api/graph/expand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, node_id: node.id })
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Failed to expand node')
      setGraph(payload.graph)
      setExpandedIds((prev) => new Set([...prev, node.id]))
    } catch (err) {
      setError(err.message || 'Request failed')
    } finally {
      setExpandingIds((prev) => {
        const next = new Set(prev)
        next.delete(node.id)
        return next
      })
    }
  }, [sessionId, expandingIds, expandedIds])

  function exportGraph() {
    const blob = new Blob([JSON.stringify({ question, graph }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `curiosity-${question.slice(0, 40).replace(/\s+/g, '-')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="app-shell">
      <div className="cosmic-overlay" />
      <header className="header">
        <h1>Reality Curiosity Engine</h1>
        <p>Explore a living universe of ideas across science, philosophy, consciousness, and speculative theories.</p>
      </header>

      <QuestionInput
        value={question}
        loading={globalLoading}
        onChange={setQuestion}
        onSubmit={() => generateUniverse()}
      />

      <section className="workspace">
        <div className="graph-column panel">
          <div className="panel-meta">
            {summary}
            {graph.nodes.length > 0 && (
              <button className="export-btn" onClick={exportGraph} title="Export graph as JSON">
                Export JSON
              </button>
            )}
          </div>
          <GraphCanvas
            graph={graph}
            onNodeClick={inspectNode}
            selectedNodeId={selectedNodeId}
            expandingIds={expandingIds}
            expandedIds={expandedIds}
          />
        </div>

        <aside className="panel side-column">
          <NodeDetailsPanel
            node={selectedNode}
            expandingIds={expandingIds}
            expandedIds={expandedIds}
            error={error}
            onExpand={expandNode}
          />
          <CuriosityPath graph={graph} onStepClick={inspectNode} />
        </aside>
      </section>

      {graph.deeper_questions.length > 0 && (
        <section className="panel deeper-questions">
          <h3>Deeper Questions</h3>
          <p>Click a prompt to generate a new universe centered on that question.</p>
          <div className="question-list">
            {graph.deeper_questions.map((item) => (
              <button
                className="question-chip"
                key={item}
                disabled={globalLoading}
                onClick={() => generateUniverse(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
