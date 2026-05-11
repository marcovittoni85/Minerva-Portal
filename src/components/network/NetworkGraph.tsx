'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'
import { ZoomTransform, zoomIdentity } from 'd3-zoom'
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
  const minimapRef = useRef<HTMLCanvasElement>(null)
  const [data, setData] = useState<{ nodes: Node[]; edges: Edge[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const simulationRef = useRef<d3.Simulation<Node, Edge> | null>(null)
  const transformRef = useRef<ZoomTransform>(zoomIdentity)
  const zoomRef = useRef<d3.ZoomBehavior<HTMLCanvasElement, unknown> | null>(null)

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

  const handleZoomIn = useCallback(() => {
    if (!canvasRef.current || !zoomRef.current) return
    d3.select(canvasRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 1.4)
  }, [])

  const handleZoomOut = useCallback(() => {
    if (!canvasRef.current || !zoomRef.current) return
    d3.select(canvasRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 0.7)
  }, [])

  const handleZoomReset = useCallback(() => {
    if (!canvasRef.current || !zoomRef.current) return
    d3.select(canvasRef.current).transition().duration(300).call(zoomRef.current.transform, zoomIdentity)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === '+' || e.key === '=') handleZoomIn()
      else if (e.key === '-') handleZoomOut()
      else if (e.key === '0') handleZoomReset()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleZoomIn, handleZoomOut, handleZoomReset])

  useEffect(() => {
    if (!data || !canvasRef.current || !containerRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!
    const container = containerRef.current
    const dpr = window.devicePixelRatio || 1

    let width = container.clientWidth
    let height = container.clientHeight

    const resize = () => {
      width = container.clientWidth
      height = container.clientHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      draw()
    }

    resize()

    const ro = new ResizeObserver(resize)
    ro.observe(container)

    // Cluster force by role
    const roleGroups = ['admin', 'partner', 'advisor', 'friend', 'client']
    const roleCenters = new Map<string, { x: number; y: number }>()
    roleGroups.forEach((r, i) => {
      const angle = (2 * Math.PI * i) / roleGroups.length
      roleCenters.set(r, {
        x: width / 2 + Math.cos(angle) * Math.min(width, height) * 0.25,
        y: height / 2 + Math.sin(angle) * Math.min(width, height) * 0.25,
      })
    })

    const simulation = d3.forceSimulation<Node>(data.nodes)
      .force('link', d3.forceLink<Node, Edge>(data.edges).id(d => d.id).distance(60).strength(0.3))
      .force('charge', d3.forceManyBody<Node>().strength(-120))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide(16))
      .force('cluster', () => {
        for (const n of data.nodes) {
          const center = roleCenters.get(n.role)
          if (!center) continue
          const k = 0.03
          n.vx = (n.vx ?? 0) + (center.x - (n.x ?? 0)) * k
          n.vy = (n.vy ?? 0) + (center.y - (n.y ?? 0)) * k
        }
      })

    simulationRef.current = simulation

    function draw() {
      const t = transformRef.current
      ctx.save()
      ctx.clearRect(0, 0, width, height)
      ctx.translate(t.x, t.y)
      ctx.scale(t.k, t.k)

      // Edges
      for (const e of data!.edges) {
        const source = e.source as Node
        const target = e.target as Node
        if (source.x == null || target.x == null) continue
        ctx.beginPath()
        ctx.moveTo(source.x, source.y!)
        ctx.lineTo(target.x, target.y!)
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.12)'
        ctx.lineWidth = Math.max(0.5, (e.strength || 1) * 0.4)
        ctx.stroke()
      }

      // Nodes
      for (const n of data!.nodes) {
        if (n.x == null || n.y == null) continue
        const radius = n.role === 'admin' ? 10 : 5
        const color = ROLE_COLORS[n.role] || '#888'

        ctx.beginPath()
        ctx.arc(n.x, n.y, radius, 0, 2 * Math.PI)
        ctx.fillStyle = color
        ctx.fill()

        if (n.id === hoveredNode?.id || n.id === selectedNode?.id) {
          ctx.strokeStyle = '#FFD700'
          ctx.lineWidth = 2.5
          ctx.stroke()
        }

        // Labels for admin or at zoom > 1.5
        if (n.role === 'admin' || t.k > 1.5) {
          ctx.fillStyle = '#001220'
          ctx.font = `${Math.max(9, 11 / t.k)}px sans-serif`
          ctx.textAlign = 'center'
          ctx.fillText(n.full_name?.split(' ')[0] ?? '', n.x, n.y + radius + 12)
        }
      }

      ctx.restore()
      drawMinimap()
    }

    // Minimap
    function drawMinimap() {
      const mc = minimapRef.current
      if (!mc) return
      const mctx = mc.getContext('2d')!
      const mw = 150
      const mh = 100
      mc.width = mw * dpr
      mc.height = mh * dpr
      mc.style.width = `${mw}px`
      mc.style.height = `${mh}px`
      mctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      mctx.clearRect(0, 0, mw, mh)

      // Compute bounds
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
      for (const n of data!.nodes) {
        if (n.x == null || n.y == null) continue
        if (n.x < minX) minX = n.x
        if (n.x > maxX) maxX = n.x
        if (n.y < minY) minY = n.y
        if (n.y > maxY) maxY = n.y
      }
      const pad = 30
      minX -= pad; minY -= pad; maxX += pad; maxY += pad
      const graphW = maxX - minX || 1
      const graphH = maxY - minY || 1
      const scale = Math.min(mw / graphW, mh / graphH)
      const offX = (mw - graphW * scale) / 2
      const offY = (mh - graphH * scale) / 2

      // Draw mini edges
      mctx.strokeStyle = 'rgba(212, 175, 55, 0.15)'
      mctx.lineWidth = 0.5
      for (const e of data!.edges) {
        const s = e.source as Node
        const t = e.target as Node
        if (s.x == null || t.x == null) continue
        mctx.beginPath()
        mctx.moveTo((s.x - minX) * scale + offX, (s.y! - minY) * scale + offY)
        mctx.lineTo((t.x - minX) * scale + offX, (t.y! - minY) * scale + offY)
        mctx.stroke()
      }

      // Draw mini nodes
      for (const n of data!.nodes) {
        if (n.x == null || n.y == null) continue
        mctx.beginPath()
        mctx.arc((n.x - minX) * scale + offX, (n.y - minY) * scale + offY, 1.5, 0, 2 * Math.PI)
        mctx.fillStyle = ROLE_COLORS[n.role] || '#888'
        mctx.fill()
      }

      // Viewport rectangle
      const tr = transformRef.current
      const vx1 = (-tr.x / tr.k - minX) * scale + offX
      const vy1 = (-tr.y / tr.k - minY) * scale + offY
      const vw = (width / tr.k) * scale
      const vh = (height / tr.k) * scale
      mctx.strokeStyle = '#D4AF37'
      mctx.lineWidth = 1.5
      mctx.strokeRect(vx1, vy1, vw, vh)
    }

    // Zoom & Pan
    const zoomBehavior = d3.zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([0.3, 4])
      .on('zoom', (event) => {
        transformRef.current = event.transform
        draw()
      })

    zoomRef.current = zoomBehavior
    d3.select(canvas).call(zoomBehavior)

    simulation.on('tick', draw)

    // Hit-test in world coordinates
    const findNode = (clientX: number, clientY: number): Node | undefined => {
      const rect = canvas.getBoundingClientRect()
      const t = transformRef.current
      const worldX = (clientX - rect.left - t.x) / t.k
      const worldY = (clientY - rect.top - t.y) / t.k
      return data.nodes.find((n: Node) => {
        const dx = (n.x ?? 0) - worldX
        const dy = (n.y ?? 0) - worldY
        const r = n.role === 'admin' ? 10 : 5
        return dx * dx + dy * dy < (r + 4) * (r + 4)
      })
    }

    const handleMouseMove = (e: MouseEvent) => {
      const found = findNode(e.clientX, e.clientY)
      setHoveredNode(found ?? null)
      canvas.style.cursor = found ? 'pointer' : 'grab'
    }

    const handleClick = (e: MouseEvent) => {
      setSelectedNode(findNode(e.clientX, e.clientY) ?? null)
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('click', handleClick)

    return () => {
      simulation.stop()
      ro.disconnect()
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
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4">
      {/* Graph */}
      <div ref={containerRef} className="relative bg-white border border-slate-100 rounded-2xl overflow-hidden h-[600px]">
        <canvas ref={canvasRef} className="w-full h-full" />

        {/* Zoom controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-1 z-10">
          <button
            onClick={handleZoomIn}
            className="w-8 h-8 bg-white/95 backdrop-blur border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-800 flex items-center justify-center text-lg font-medium shadow-sm transition-colors"
            title="Zoom in"
          >
            +
          </button>
          <button
            onClick={handleZoomOut}
            className="w-8 h-8 bg-white/95 backdrop-blur border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-800 flex items-center justify-center text-lg font-medium shadow-sm transition-colors"
            title="Zoom out"
          >
            -
          </button>
          <button
            onClick={handleZoomReset}
            className="w-8 h-8 bg-white/95 backdrop-blur border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-800 flex items-center justify-center text-xs font-medium shadow-sm transition-colors"
            title="Reset zoom"
          >
            1:1
          </button>
        </div>

        {/* Hovered node tooltip */}
        {hoveredNode && (
          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur border border-slate-200 rounded-xl p-3 shadow-lg z-10">
            <div className="text-sm text-slate-800 font-medium">{hoveredNode.full_name}</div>
            <div className="text-xs text-slate-500">{hoveredNode.role}</div>
            {hoveredNode.partner_line && <div className="text-xs text-slate-500">{hoveredNode.partner_line}</div>}
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-28 left-4 bg-white/95 backdrop-blur border border-slate-200 rounded-xl p-3 text-xs z-10">
          <div className="text-slate-400 mb-2 uppercase tracking-wider font-bold text-[10px]">Legenda</div>
          {Object.entries(ROLE_COLORS).map(([role, color]) => (
            <div key={role} className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-slate-600 capitalize">{role}</span>
            </div>
          ))}
        </div>

        {/* Minimap */}
        <canvas
          ref={minimapRef}
          className="absolute bottom-4 left-4 bg-white/90 backdrop-blur border border-slate-200 rounded-lg z-10"
          style={{ width: 150, height: 100 }}
        />

        {/* Node count badge */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur border border-slate-200 rounded-full px-3 py-1 text-xs text-slate-500 z-10">
          {data.nodes.length} nodi &middot; {data.edges.length} connessioni
        </div>
      </div>

      {/* Side panel */}
      <aside className="bg-white border border-slate-100 rounded-2xl p-5 max-h-[600px] overflow-y-auto">
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
