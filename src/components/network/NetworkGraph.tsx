'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'
import { Loader } from '@/components/ui/Loader'

const ROLE_COLORS: Record<string, string> = {
  admin: '#D4AF37',
  partner: '#4F8FCC',
  advisor: '#5DADE2',
  friend: '#F39C12',
  client: '#27AE60',
}

interface Node extends d3.SimulationNodeDatum {
  id: string
  full_name: string
  email: string
  role: string
  partner_line?: string
  ruolo_enumerato?: string
}

interface Edge {
  source: string | Node
  target: string | Node
  relationship_type: string
  strength: number
}

export function NetworkGraph() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [data, setData] = useState<{ nodes: Node[]; edges: Edge[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const simulationRef = useRef<d3.Simulation<Node, Edge> | null>(null)

  useEffect(() => {
    fetch('/api/network-graph')
      .then(r => r.json())
      .then(d => {
        setData({
          nodes: d.nodes.map((n: Node) => ({ ...n })),
          edges: d.edges.map((e: { contact_a: string; contact_b: string; relationship_type: string; strength: number }) => ({
            source: e.contact_a,
            target: e.contact_b,
            relationship_type: e.relationship_type,
            strength: e.strength ?? 1,
          })),
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!data || !canvasRef.current || !containerRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!
    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    canvas.width = width * window.devicePixelRatio
    canvas.height = height * window.devicePixelRatio
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    const simulation = d3.forceSimulation<Node>(data.nodes)
      .force('link', d3.forceLink<Node, Edge>(data.edges).id(d => d.id).distance(80).strength(0.5))
      .force('charge', d3.forceManyBody<Node>().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide(20))

    simulationRef.current = simulation

    const draw = () => {
      ctx.clearRect(0, 0, width, height)

      // Edges
      data.edges.forEach((e: Edge) => {
        const source = e.source as Node
        const target = e.target as Node
        if (source.x == null || target.x == null) return

        ctx.beginPath()
        ctx.moveTo(source.x, source.y!)
        ctx.lineTo(target.x, target.y!)
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.15)'
        ctx.lineWidth = Math.max(1, (e.strength || 1) * 0.5)
        ctx.stroke()
      })

      // Nodes
      data.nodes.forEach((n: Node) => {
        if (n.x == null || n.y == null) return
        const radius = n.role === 'admin' ? 12 : 7
        const color = ROLE_COLORS[n.role] || '#888'

        ctx.beginPath()
        ctx.arc(n.x, n.y, radius, 0, 2 * Math.PI)
        ctx.fillStyle = color
        ctx.fill()

        if (n.id === hoveredNode?.id || n.id === selectedNode?.id) {
          ctx.strokeStyle = '#FFD700'
          ctx.lineWidth = 3
          ctx.stroke()
        }

        if (n.role === 'admin') {
          ctx.fillStyle = '#001220'
          ctx.font = '11px serif'
          ctx.textAlign = 'center'
          ctx.fillText(n.full_name?.split(' ')[0] ?? '', n.x, n.y + radius + 15)
        }
      })
    }

    simulation.on('tick', draw)

    const findNode = (x: number, y: number): Node | undefined => {
      return data.nodes.find((n: Node) => {
        const dx = (n.x ?? 0) - x
        const dy = (n.y ?? 0) - y
        return dx * dx + dy * dy < 150
      })
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const found = findNode(x, y)
      setHoveredNode(found ?? null)
      canvas.style.cursor = found ? 'pointer' : 'default'
    }

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      setSelectedNode(findNode(x, y) ?? null)
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('click', handleClick)

    return () => {
      simulation.stop()
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('click', handleClick)
    }
  }, [data, hoveredNode, selectedNode])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader size="xl" />
      </div>
    )
  }

  if (!data || data.nodes.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <p>Nessun nodo da visualizzare</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
      {/* Graph */}
      <div ref={containerRef} className="relative bg-white border border-slate-100 rounded-2xl overflow-hidden h-[600px]">
        <canvas ref={canvasRef} className="w-full h-full" />

        {hoveredNode && (
          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur border border-slate-200 rounded-xl p-3 shadow-lg">
            <div className="text-sm text-slate-800 font-medium">{hoveredNode.full_name}</div>
            <div className="text-xs text-slate-500">{hoveredNode.role}</div>
            {hoveredNode.partner_line && <div className="text-xs text-slate-500">{hoveredNode.partner_line}</div>}
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur border border-slate-200 rounded-xl p-3 text-xs">
          <div className="text-slate-400 mb-2 uppercase tracking-wider font-bold text-[10px]">Legenda</div>
          {Object.entries(ROLE_COLORS).map(([role, color]) => (
            <div key={role} className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-slate-600 capitalize">{role}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Side panel */}
      <aside className="bg-white border border-slate-100 rounded-2xl p-5">
        {selectedNode ? (
          <div>
            <h3 className="text-2xl font-[family-name:var(--font-cormorant)] text-slate-800 mb-1">{selectedNode.full_name}</h3>
            <p className="text-sm text-slate-500 mb-4">{selectedNode.email}</p>

            <div className="space-y-2 text-sm">
              <Row label="Ruolo" value={selectedNode.role} />
              {selectedNode.partner_line && <Row label="Verticale" value={selectedNode.partner_line} />}
              {selectedNode.ruolo_enumerato && <Row label="Code" value={selectedNode.ruolo_enumerato} />}
            </div>

            <a
              href={`/portal/admin/relationships/${selectedNode.id}`}
              className="mt-4 inline-block text-[#D4AF37] underline text-sm font-medium"
            >
              Vai al dettaglio &rarr;
            </a>
          </div>
        ) : (
          <div className="text-slate-400 text-sm text-center py-8">
            Click su un nodo per dettagli
          </div>
        )}
      </aside>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-slate-50 pb-2">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-700 capitalize">{value}</span>
    </div>
  )
}
