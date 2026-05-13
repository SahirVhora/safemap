import { useEffect, useMemo, useRef } from 'react'
import * as d3 from 'd3'

const categoryColor = {
  Physics: '#58c0ff',
  Philosophy: '#e0c56f',
  Neuroscience: '#87ffb0',
  AI: '#d08cff',
  Cosmology: '#ff8fa3',
  'Speculative Theories': '#9aa5ff'
}

const relationStyle = {
  supports: { color: '#5be1b8', width: 2.1, dash: '' },
  contradicts: { color: '#ff7070', width: 2.0, dash: '5 4' },
  extends: { color: '#79b8ff', width: 2.2, dash: '2 2' },
  related_to: { color: '#556188', width: 1.5, dash: '' },
  explains: { color: '#ffd56b', width: 2.0, dash: '' }
}

const confidenceStroke = {
  'strong scientific consensus': '#9cffde',
  'debated theory': '#ffd789',
  'speculative hypothesis': '#ff9cc0'
}

const categoryAnchors = {
  Physics: [-280, -120],
  Philosophy: [260, -140],
  Neuroscience: [-260, 140],
  AI: [260, 140],
  Cosmology: [0, -220],
  'Speculative Theories': [0, 220]
}

function nodeRadius(node) {
  if (node.id === 'root') return 22
  if (node.is_path) return 16
  return 13
}

// Legend overlay rendered as a fixed HTML element over the SVG.
function GraphLegend() {
  return (
    <div className="graph-legend">
      <div className="legend-section">
        <div className="legend-title">Relation</div>
        {Object.entries(relationStyle).map(([rel, style]) => (
          <div className="legend-row" key={rel}>
            <svg width="28" height="10">
              <line
                x1="2" y1="5" x2="26" y2="5"
                stroke={style.color}
                strokeWidth={style.width}
                strokeDasharray={style.dash || undefined}
              />
            </svg>
            <span>{rel.replace('_', ' ')}</span>
          </div>
        ))}
      </div>
      <div className="legend-section">
        <div className="legend-title">Confidence</div>
        {Object.entries(confidenceStroke).map(([level, color]) => (
          <div className="legend-row" key={level}>
            <svg width="14" height="14">
              <circle cx="7" cy="7" r="5" fill="none" stroke={color} strokeWidth="2" />
            </svg>
            <span>{level}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function GraphCanvas({ graph, onNodeClick, selectedNodeId, expandingIds, expandedIds }) {
  const svgRef = useRef(null)
  // Preserve node positions across re-renders so the layout doesn't reset on expand.
  const positionCacheRef = useRef({})
  const simulationRef = useRef(null)

  const pathSet = useMemo(() => new Set(graph.curiosity_path || []), [graph.curiosity_path])

  useEffect(() => {
    if (!svgRef.current || graph.nodes.length === 0) return

    const svg = d3.select(svgRef.current)
    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight

    svg.selectAll('*').remove()
    if (simulationRef.current) simulationRef.current.stop()

    const root = svg.append('g')

    svg.call(
      d3.zoom().scaleExtent([0.3, 2.8]).on('zoom', (event) => {
        root.attr('transform', event.transform)
      })
    )

    // Restore previously computed positions so existing nodes don't fly around.
    const cache = positionCacheRef.current
    const links = graph.links.map((item) => ({ ...item }))
    const nodes = graph.nodes.map((item) => {
      const saved = cache[item.id]
      return saved ? { ...item, x: saved.x, y: saved.y, fx: null, fy: null } : { ...item }
    })

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        'link',
        d3
          .forceLink(links)
          .id((node) => node.id)
          .distance((link) => (link.relation === 'extends' ? 85 : 125))
          .strength((link) => (link.relation === 'extends' ? 0.9 : 0.45))
      )
      .force('charge', d3.forceManyBody().strength(-430))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force(
        'x',
        d3.forceX((node) => {
          const anchor = categoryAnchors[node.category] || [0, 0]
          return width / 2 + anchor[0]
        }).strength(0.08)
      )
      .force(
        'y',
        d3.forceY((node) => {
          const anchor = categoryAnchors[node.category] || [0, 0]
          return height / 2 + anchor[1]
        }).strength(0.08)
      )
      .force('collision', d3.forceCollide().radius((node) => nodeRadius(node) + 18))

    simulationRef.current = simulation

    // Nodes that already have positions cool down faster; new ones settle from scratch.
    const newNodeIds = new Set(nodes.filter((n) => !cache[n.id]).map((n) => n.id))
    simulation.alphaDecay(newNodeIds.size === 0 ? 0.15 : 0.028)

    const defs = svg.append('defs')
    const glow = defs
      .append('filter')
      .attr('id', 'node-glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%')

    glow.append('feGaussianBlur').attr('stdDeviation', '2.8').attr('result', 'blur')
    glow.append('feMerge').selectAll('feMergeNode').data(['blur', 'SourceGraphic']).join('feMergeNode').attr('in', (d) => d)

    const linkGroup = root.append('g').attr('class', 'link-layer')
    const nodeGroup = root.append('g').attr('class', 'node-layer')

    const linkSelection = linkGroup
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', (d) => relationStyle[d.relation]?.color || relationStyle.related_to.color)
      .attr('stroke-width', (d) => relationStyle[d.relation]?.width || relationStyle.related_to.width)
      .attr('stroke-dasharray', (d) => relationStyle[d.relation]?.dash || '')
      .attr('stroke-opacity', 0.85)

    const nodeSelection = nodeGroup
      .selectAll('g')
      .data(nodes, (d) => d.id)
      .join((enter) => {
        const isNew = (d) => newNodeIds.has(d.id)
        const newNodes = enter.append('g').style('cursor', 'pointer').attr('opacity', (d) => (isNew(d) ? 0 : 1))

        newNodes
          .append('circle')
          .attr('r', (d) => (isNew(d) ? 1 : nodeRadius(d)))
          .attr('fill', (d) => categoryColor[d.category] || '#8ea2ff')
          .attr('stroke', (d) => {
            if (pathSet.has(d.id)) return '#7de2ff'
            return confidenceStroke[d.confidence] || '#ffd789'
          })
          .attr('stroke-width', (d) => {
            if (d.id === selectedNodeId) return 4
            if (pathSet.has(d.id)) return 3.2
            return 2.2
          })
          .attr('stroke-dasharray', (d) => (expandedIds && expandedIds.has(d.id) ? '4 2' : ''))
          .attr('filter', 'url(#node-glow)')
          .transition()
          .duration(500)
          .attr('r', (d) => nodeRadius(d))

        newNodes
          .append('text')
          .text((d) => (d.label.length > 24 ? `${d.label.slice(0, 24)}...` : d.label))
          .attr('fill', '#f4f8ff')
          .attr('font-size', 10.5)
          .attr('text-anchor', 'middle')
          .attr('dy', (d) => nodeRadius(d) + 13)
          .attr('pointer-events', 'none')

        // Spinner ring for nodes currently being expanded.
        newNodes
          .filter((d) => expandingIds && expandingIds.has(d.id))
          .append('circle')
          .attr('class', 'spinner-ring')
          .attr('r', (d) => nodeRadius(d) + 6)
          .attr('fill', 'none')
          .attr('stroke', '#79b8ff')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '8 4')

        newNodes.transition().duration(360).attr('opacity', 1)
        return newNodes
      })

    nodeSelection
      .on('click', (_, node) => onNodeClick(node))
      .select('circle')
      .attr('stroke-width', (d) => {
        if (d.id === selectedNodeId) return 4
        if (pathSet.has(d.id)) return 3.2
        return 2.2
      })
      .attr('stroke', (d) => {
        if (pathSet.has(d.id)) return '#7de2ff'
        return confidenceStroke[d.confidence] || '#ffd789'
      })
      .attr('stroke-dasharray', (d) => (expandedIds && expandedIds.has(d.id) ? '4 2' : ''))

    const relationText = root
      .append('g')
      .selectAll('text')
      .data(links)
      .join('text')
      .text((d) => d.relation)
      .attr('fill', '#97a6d7')
      .attr('font-size', 9)
      .attr('text-anchor', 'middle')
      .attr('pointer-events', 'none')

    simulation.on('tick', () => {
      linkSelection
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y)

      nodeSelection.attr('transform', (d) => `translate(${d.x},${d.y})`)

      relationText
        .attr('x', (d) => (d.source.x + d.target.x) / 2)
        .attr('y', (d) => (d.source.y + d.target.y) / 2)
    })

    // Save positions whenever simulation updates so they survive the next render.
    simulation.on('end', () => {
      nodes.forEach((n) => { positionCacheRef.current[n.id] = { x: n.x, y: n.y } })
    })
    // Also save on each tick so positions persist even if simulation is cut short.
    simulation.on('tick.cache', () => {
      nodes.forEach((n) => { positionCacheRef.current[n.id] = { x: n.x, y: n.y } })
    })

    return () => simulation.stop()
  }, [graph, onNodeClick, pathSet, selectedNodeId, expandingIds, expandedIds])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg className="graph-canvas" ref={svgRef} />
      <GraphLegend />
    </div>
  )
}
