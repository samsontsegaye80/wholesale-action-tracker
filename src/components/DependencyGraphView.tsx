import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { 
  GitFork, 
  Workflow, 
  Layers, 
  Search, 
  Filter, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Flame, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  User, 
  ArrowRight, 
  ExternalLink, 
  Maximize2, 
  Eye, 
  EyeOff, 
  Edit3, 
  Info,
  ShieldAlert,
  ChevronRight,
  Sliders,
  Sparkles
} from 'lucide-react';
import { TaskItem, TaskStatus, WorkstreamType } from '../types';
import { 
  buildDependencyGraphData, 
  DependencyGraphNode, 
  DependencyGraphLink, 
  DependencyGraphData,
  PHASES,
  WORKSTREAM_COLORS
} from '../utils/dependencyGraph';
import { formatDateToDisplay, getTaskDeadlineStatus } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';

interface DependencyGraphViewProps {
  tasks: TaskItem[];
  asOfDate: string;
  onEditTask?: (task: TaskItem) => void;
  onNavigateToTask?: (taskId: string) => void;
}

type LayoutMode = 'pipeline' | 'force';

export const DependencyGraphView: React.FC<DependencyGraphViewProps> = ({
  tasks,
  asOfDate,
  onEditTask,
  onNavigateToTask
}) => {
  const { canEdit } = useAuth();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Layout & display state
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('pipeline');
  const [highlightCriticalOnly, setHighlightCriticalOnly] = useState<boolean>(false);
  const [showEdgeLabels, setShowEdgeLabels] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedWorkstream, setSelectedWorkstream] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedNode, setSelectedNode] = useState<DependencyGraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<DependencyGraphNode | null>(null);

  // Container sizing tracked via ResizeObserver
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 1200,
    height: 750
  });

  // Build graph data
  const graphData = useMemo<DependencyGraphData>(() => {
    return buildDependencyGraphData(tasks);
  }, [tasks]);

  // Tasks map for fast lookup
  const taskMap = useMemo(() => {
    const map = new Map<string, TaskItem>();
    tasks.forEach(t => map.set(t.id, t));
    return map;
  }, [tasks]);

  // ResizeObserver for dynamic, responsive canvas
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let debounceTimer: ReturnType<typeof setTimeout>;
    const observer = new ResizeObserver(entries => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (!entries || entries.length === 0) return;
        const entry = entries[0];
        const newWidth = Math.max(entry.contentRect.width, 600);
        const newHeight = Math.max(entry.contentRect.height, 500);
        setDimensions({ width: newWidth, height: newHeight });
      }, 100);
    });

    observer.observe(container);
    return () => {
      clearTimeout(debounceTimer);
      observer.disconnect();
    };
  }, []);

  // Filtered nodes and links based on UI controls
  const { filteredNodes, filteredLinks, connectedNodeIds } = useMemo(() => {
    let nodes = [...graphData.nodes];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      nodes = nodes.filter(n => 
        n.title.toLowerCase().includes(q) ||
        n.sNo.toString() === q.replace('#', '') ||
        n.backendOwner.toLowerCase().includes(q) ||
        n.frontendOwner.toLowerCase().includes(q) ||
        n.workstream.toLowerCase().includes(q)
      );
    }

    // Workstream filter
    if (selectedWorkstream !== 'ALL') {
      nodes = nodes.filter(n => n.workstream === selectedWorkstream);
    }

    // Status filter
    if (selectedStatus !== 'ALL') {
      nodes = nodes.filter(n => n.status === selectedStatus);
    }

    // Critical only filter
    if (highlightCriticalOnly) {
      nodes = nodes.filter(n => n.isCritical);
    }

    const visibleNodeIds = new Set(nodes.map(n => n.id));

    // Links where both endpoints are visible
    const links = graphData.links.filter(l => {
      const sourceId = typeof l.source === 'object' ? (l.source as any).id : l.source;
      const targetId = typeof l.target === 'object' ? (l.target as any).id : l.target;
      return visibleNodeIds.has(sourceId) && visibleNodeIds.has(targetId);
    });

    // Set of nodes that participate in dependencies
    const connectedIds = new Set<string>();
    links.forEach(l => {
      const sourceId = typeof l.source === 'object' ? (l.source as any).id : l.source;
      const targetId = typeof l.target === 'object' ? (l.target as any).id : l.target;
      connectedIds.add(sourceId);
      connectedIds.add(targetId);
    });

    return {
      filteredNodes: nodes,
      filteredLinks: links,
      connectedNodeIds: connectedIds
    };
  }, [graphData, searchQuery, selectedWorkstream, selectedStatus, highlightCriticalOnly]);

  // Main D3 Rendering Effect
  useEffect(() => {
    if (!svgRef.current || filteredNodes.length === 0) return;

    const width = dimensions.width;
    const height = dimensions.height;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Defs: Arrow markers and glow filters
    const defs = svg.append('defs');

    // Glow filter for Critical Path
    const filter = defs.append('filter')
      .attr('id', 'glow-critical')
      .attr('x', '-30%')
      .attr('y', '-30%')
      .attr('width', '160%')
      .attr('height', '160%');

    filter.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'coloredBlur');

    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Arrow markers: Standard, Critical, Highlighted
    const makeMarker = (id: string, color: string, size = 8) => {
      defs.append('marker')
        .attr('id', id)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 24)
        .attr('refY', 0)
        .attr('markerWidth', size)
        .attr('markerHeight', size)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', color);
    };

    makeMarker('arrow-default', '#64748b', 6);
    makeMarker('arrow-critical', '#B38D34', 8);
    makeMarker('arrow-highlight', '#38bdf8', 8);
    makeMarker('arrow-successor', '#a855f7', 8);

    // Root Group for Zoom & Pan
    const g = svg.append('g').attr('class', 'main-graph-group');

    // Setup Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 3.0])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);
    zoomBehaviorRef.current = zoom;

    // Deep clones of nodes & links for simulation mutation
    const simulationNodes: DependencyGraphNode[] = filteredNodes.map(d => ({ ...d }));
    const nodeById = new Map<string, DependencyGraphNode>();
    simulationNodes.forEach(n => nodeById.set(n.id, n));

    const simulationLinks: any[] = filteredLinks
      .filter(l => {
        const sId = typeof l.source === 'object' ? (l.source as any).id : l.source;
        const tId = typeof l.target === 'object' ? (l.target as any).id : l.target;
        return nodeById.has(sId) && nodeById.has(tId);
      })
      .map(l => {
        const sId = typeof l.source === 'object' ? (l.source as any).id : l.source;
        const tId = typeof l.target === 'object' ? (l.target as any).id : l.target;
        return {
          ...l,
          source: sId,
          target: tId
        };
      });

    // LAYOUT COORDINATES
    if (layoutMode === 'pipeline') {
      // 4-Phase Layered Horizontal Flow: Left to right
      // Phase 1 (x: 120), Phase 2 (x: 420), Phase 3 (x: 720), Phase 4 (x: 1020)
      const phaseCols = [1, 2, 3, 4];
      const phaseCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
      
      simulationNodes.sort((a, b) => a.sNo - b.sNo);
      
      // Compute total in each phase
      simulationNodes.forEach(n => {
        phaseCounts[n.phase] = (phaseCounts[n.phase] || 0) + 1;
      });

      const colWidth = Math.max((width - 240) / 4, 250);
      const startX = 140;
      const phaseCurrentIndex: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };

      // Background phase lane guides
      const laneGroup = g.append('g').attr('class', 'phase-lanes');
      PHASES.forEach((p, idx) => {
        const xPos = startX + idx * colWidth - colWidth * 0.45;
        const laneW = colWidth * 0.9;
        
        laneGroup.append('rect')
          .attr('x', xPos)
          .attr('y', 40)
          .attr('width', laneW)
          .attr('height', Math.max(height, 850))
          .attr('rx', 12)
          .attr('fill', '#0f172a')
          .attr('stroke', '#1e293b')
          .attr('stroke-width', 1)
          .attr('opacity', 0.65);

        laneGroup.append('text')
          .attr('x', xPos + 16)
          .attr('y', 75)
          .attr('fill', p.color)
          .attr('font-size', '13px')
          .attr('font-weight', 'bold')
          .attr('font-family', 'monospace')
          .text(p.name);

        laneGroup.append('text')
          .attr('x', xPos + 16)
          .attr('y', 93)
          .attr('fill', '#94a3b8')
          .attr('font-size', '10px')
          .attr('font-family', 'monospace')
          .text(p.range);
      });

      simulationNodes.forEach(n => {
        const phaseIdx = n.phase;
        const idxInPhase = phaseCurrentIndex[phaseIdx]++;
        const totalInPhase = phaseCounts[phaseIdx];
        
        const x = startX + (phaseIdx - 1) * colWidth;
        const topMargin = 130;
        const availableHeight = Math.max(height - 180, totalInPhase * 68);
        const ySpacing = Math.min(availableHeight / Math.max(totalInPhase, 1), 74);
        const y = topMargin + idxInPhase * ySpacing;

        n.x = x;
        n.y = y;
        n.fx = x;
        n.fy = y;
      });
    }

    // Links container
    const linkGroup = g.append('g').attr('class', 'links-layer');
    // Nodes container
    const nodeGroup = g.append('g').attr('class', 'nodes-layer');

    // Create D3 Force Simulation (running in background or for drag interactions)
    const simulation = d3.forceSimulation(simulationNodes)
      .force('link', d3.forceLink(simulationLinks).id((d: any) => d.id).distance(layoutMode === 'force' ? 140 : 120).strength(layoutMode === 'force' ? 0.7 : 0.05))
      .force('charge', d3.forceManyBody().strength(layoutMode === 'force' ? -450 : -40))
      .force('collision', d3.forceCollide().radius(48))
      .alphaDecay(layoutMode === 'pipeline' ? 0.3 : 0.04);

    if (layoutMode === 'force') {
      simulation.force('center', d3.forceCenter(width / 2, height / 2));
    }

    // Render Links
    const linkElements = linkGroup.selectAll<SVGPathElement, any>('.graph-link')
      .data(simulationLinks)
      .join('path')
      .attr('class', 'graph-link')
      .attr('id', d => d.id)
      .attr('fill', 'none')
      .attr('stroke', d => d.isCritical ? '#B38D34' : '#475569')
      .attr('stroke-width', d => d.isCritical ? 2.5 : 1.4)
      .attr('stroke-dasharray', d => d.isCritical ? '4 3' : 'none')
      .attr('marker-end', d => d.isCritical ? 'url(#arrow-critical)' : 'url(#arrow-default)')
      .attr('opacity', 0.8)
      .attr('filter', d => d.isCritical ? 'url(#glow-critical)' : null);

    // Optional link labels (relationship reasons)
    const linkLabelElements = showEdgeLabels
      ? linkGroup.selectAll<SVGTextElement, any>('.link-label')
          .data(simulationLinks)
          .join('text')
          .attr('class', 'link-label')
          .attr('font-size', '9px')
          .attr('fill', '#94a3b8')
          .attr('font-family', 'monospace')
          .attr('text-anchor', 'middle')
          .text(d => d.label)
      : null;

    // Drag behavior for nodes
    const drag = d3.drag<SVGGElement, DependencyGraphNode>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.2).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        if (layoutMode === 'pipeline') {
          // Keep fixed in pipeline view
          d.fx = d.x;
          d.fy = d.y;
        } else {
          d.fx = null;
          d.fy = null;
        }
      });

    // Render Node Group
    const nodeElements = nodeGroup.selectAll<SVGGElement, DependencyGraphNode>('.graph-node')
      .data(simulationNodes)
      .join('g')
      .attr('class', 'graph-node cursor-pointer select-none')
      .attr('id', d => `node-${d.sNo}`)
      .call(drag as any);

    // Node Background Rect / Card
    nodeElements.append('rect')
      .attr('x', -85)
      .attr('y', -24)
      .attr('width', 170)
      .attr('height', 48)
      .attr('rx', 10)
      .attr('fill', d => d.isCritical ? '#1e1b4b' : '#0f172a')
      .attr('stroke', d => {
        if (d.isCritical) return '#B38D34';
        if (d.status === 'Completed') return '#10b981';
        if (d.status === 'In Progress') return '#8b5cf6';
        if (d.status === 'Delayed') return '#f43f5e';
        if (d.status === 'Partial') return '#f59e0b';
        return '#334155';
      })
      .attr('stroke-width', d => d.isCritical ? 2.2 : 1.5)
      .attr('filter', d => d.isCritical ? 'url(#glow-critical)' : null)
      .attr('class', 'transition-all');

    // Sequence Number Badge (Left circle)
    nodeElements.append('circle')
      .attr('cx', -62)
      .attr('cy', 0)
      .attr('r', 14)
      .attr('fill', d => d.isCritical ? '#B38D34' : '#1e293b')
      .attr('stroke', d => d.isCritical ? '#fef08a' : '#475569')
      .attr('stroke-width', 1);

    nodeElements.append('text')
      .attr('x', -62)
      .attr('y', 4)
      .attr('text-anchor', 'middle')
      .attr('fill', d => d.isCritical ? '#020617' : '#f8fafc')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'monospace')
      .text(d => `#${d.sNo}`);

    // Deliverable Title (Truncated)
    nodeElements.append('text')
      .attr('x', -42)
      .attr('y', -6)
      .attr('fill', '#ffffff')
      .attr('font-size', '10px')
      .attr('font-weight', '600')
      .attr('font-family', 'system-ui, -apple-system, sans-serif')
      .text(d => {
        const str = d.title;
        return str.length > 20 ? str.slice(0, 19) + '…' : str;
      });

    // Subtitle: Status Pill & Progress
    nodeElements.append('text')
      .attr('x', -42)
      .attr('y', 12)
      .attr('fill', d => {
        if (d.status === 'Completed') return '#34d399';
        if (d.status === 'In Progress') return '#c084fc';
        if (d.status === 'Delayed') return '#fb7185';
        if (d.status === 'Partial') return '#fbbf24';
        return '#94a3b8';
      })
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .text(d => `${d.status} • ${d.percentComplete}%`);

    // Critical Path Flame Icon on critical nodes
    nodeElements.filter(d => d.isCritical)
      .append('circle')
      .attr('cx', 72)
      .attr('cy', -14)
      .attr('r', 8)
      .attr('fill', '#B38D34')
      .attr('stroke', '#fef08a')
      .attr('stroke-width', 1);

    nodeElements.filter(d => d.isCritical)
      .append('text')
      .attr('x', 72)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .text('★');

    // Click handler for node selection
    nodeElements.on('click', (event, d) => {
      event.stopPropagation();
      setSelectedNode(d);
    });

    // Hover handler for highlighting upstream/downstream paths
    nodeElements.on('mouseenter', (event, d) => {
      setHoveredNode(d);
      
      const predSet = new Set(d.predecessorSNoList);
      const succSet = new Set(d.successorSNoList);

      // Highlight links
      linkElements
        .attr('opacity', l => {
          const sSNo = l.sourceSNo;
          const tSNo = l.targetSNo;
          if (sSNo === d.sNo || tSNo === d.sNo) return 1;
          return 0.15;
        })
        .attr('stroke', l => {
          if (l.targetSNo === d.sNo) return '#38bdf8'; // Predecessor (Upstream) in cyan
          if (l.sourceSNo === d.sNo) return '#c084fc'; // Successor (Downstream) in purple
          return l.isCritical ? '#B38D34' : '#475569';
        })
        .attr('stroke-width', l => {
          if (l.targetSNo === d.sNo || l.sourceSNo === d.sNo) return 3;
          return l.isCritical ? 2.5 : 1.4;
        })
        .attr('marker-end', l => {
          if (l.targetSNo === d.sNo) return 'url(#arrow-highlight)';
          if (l.sourceSNo === d.sNo) return 'url(#arrow-successor)';
          return l.isCritical ? 'url(#arrow-critical)' : 'url(#arrow-default)';
        });

      // Highlight nodes
      nodeElements.attr('opacity', n => {
        if (n.sNo === d.sNo || predSet.has(n.sNo) || succSet.has(n.sNo)) return 1;
        return 0.25;
      });
    });

    nodeElements.on('mouseleave', () => {
      setHoveredNode(null);
      // Reset links
      linkElements
        .attr('opacity', 0.8)
        .attr('stroke', d => d.isCritical ? '#B38D34' : '#475569')
        .attr('stroke-width', d => d.isCritical ? 2.5 : 1.4)
        .attr('marker-end', d => d.isCritical ? 'url(#arrow-critical)' : 'url(#arrow-default)');

      // Reset nodes
      nodeElements.attr('opacity', 1);
    });

    // Background click resets selection
    svg.on('click', () => {
      setSelectedNode(null);
    });

    // Curved link generator function
    const linkGenerator = (d: any) => {
      const sourceX = d.source.x;
      const sourceY = d.source.y;
      const targetX = d.target.x;
      const targetY = d.target.y;

      if (layoutMode === 'pipeline') {
        // Horizontal S-curve
        const dx = targetX - sourceX;
        return `M${sourceX + 85},${sourceY} C${sourceX + 85 + dx * 0.45},${sourceY} ${targetX - 85 - dx * 0.45},${targetY} ${targetX - 85},${targetY}`;
      } else {
        // Force layout straight/slight quadratic curve
        return `M${sourceX},${sourceY} L${targetX},${targetY}`;
      }
    };

    // Simulation Tick Updates
    simulation.on('tick', () => {
      linkElements.attr('d', linkGenerator);

      if (linkLabelElements) {
        linkLabelElements
          .attr('x', d => (d.source.x + d.target.x) / 2)
          .attr('y', d => (d.source.y + d.target.y) / 2 - 6);
      }

      nodeElements.attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);
    });

    // Auto-fit / center the graph smoothly
    setTimeout(() => {
      if (!svgRef.current || !zoomBehaviorRef.current) return;
      const bounds = g.node()?.getBBox();
      if (!bounds || bounds.width === 0 || bounds.height === 0) return;

      const fullWidth = dimensions.width;
      const fullHeight = dimensions.height;
      const widthScale = fullWidth / (bounds.width + 120);
      const heightScale = fullHeight / (bounds.height + 120);
      const initialScale = Math.min(Math.max(Math.min(widthScale, heightScale), 0.35), 1.0);

      const midX = bounds.x + bounds.width / 2;
      const midY = bounds.y + bounds.height / 2;

      svg.transition()
        .duration(600)
        .call(
          zoomBehaviorRef.current.transform,
          d3.zoomIdentity
            .translate(fullWidth / 2, fullHeight / 2)
            .scale(initialScale)
            .translate(-midX, -midY)
        );
    }, 150);

    return () => {
      simulation.stop();
    };
  }, [
    dimensions,
    filteredNodes,
    filteredLinks,
    layoutMode,
    showEdgeLabels
  ]);

  // Zoom control buttons
  const handleZoom = (delta: number) => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(250)
      .call(zoomBehaviorRef.current.scaleBy, delta);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(500)
      .call(zoomBehaviorRef.current.transform, d3.zoomIdentity.translate(40, 20).scale(0.8));
  };

  // Critical path statistics
  const criticalPathTasks = useMemo(() => {
    return graphData.criticalPathSNos
      .map(sNo => tasks.find(t => t.sNo === sNo))
      .filter((t): t is TaskItem => t !== undefined);
  }, [graphData.criticalPathSNos, tasks]);

  const criticalCompletedCount = criticalPathTasks.filter(t => t.status === 'Completed').length;
  const criticalDelayedCount = criticalPathTasks.filter(t => {
    const d = getTaskDeadlineStatus(t.endDate, t.status, asOfDate);
    return d.category === 'OVERDUE' || t.status === 'Delayed';
  }).length;

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      
      {/* TOP HEADER & CRITICAL PATH SUMMARY BANNER */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#95288E]/25 text-[#D667CF] border border-[#95288E]/50 uppercase tracking-wider flex items-center gap-1">
              <Workflow className="w-3 h-3 text-[#D667CF]" />
              Interactive D3 Directed Network
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-xs font-mono font-bold text-[#B38D34] flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-[#FDE047]" />
              Critical Path Method (CPM)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1 flex items-center gap-2">
            <span>Visual Dependency Graph</span>
            <span className="text-[#D667CF] font-light text-lg sm:text-xl">| Critical Path Linkages</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 max-w-3xl">
            Interactive node-link visualization mapping all 44 workstream deliverables, predecessor-successor cascades, and the core 12-task critical path driving project completion.
          </p>
        </div>

        {/* Critical Path Metric Badges */}
        <div className="flex flex-wrap items-center gap-3">
          
          <div className="bg-slate-950/80 px-3.5 py-2 rounded-lg border border-[#B38D34]/40 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#B38D34]/20 border border-[#B38D34]/50 flex items-center justify-center text-[#FDE047]">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Critical Path Spine</span>
              <span className="text-xs font-bold text-[#FDE047] font-mono">
                {graphData.criticalPathNodeCount} Milestones ({criticalCompletedCount}/{graphData.criticalPathNodeCount} done)
              </span>
            </div>
          </div>

          <div className="bg-slate-950/80 px-3.5 py-2 rounded-lg border border-slate-800 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-rose-950/40 border border-rose-800/60 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Critical Path Delays</span>
              <span className={`text-xs font-bold font-mono ${criticalDelayedCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {criticalDelayedCount} Blockers
              </span>
            </div>
          </div>

          <div className="bg-slate-950/80 px-3.5 py-2 rounded-lg border border-slate-800 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-purple-950/40 border border-purple-800/60 flex items-center justify-center text-[#D667CF]">
              <GitFork className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Total Linkages</span>
              <span className="text-xs font-bold text-white font-mono">
                {graphData.totalDependencies} Direct Edges
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* INTERACTIVE CONTROLS TOOLBAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Filters & Search */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search #sNo, title, owner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#95288E] w-48 sm:w-56"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Workstream Filter */}
          <select
            value={selectedWorkstream}
            onChange={(e) => setSelectedWorkstream(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-[#95288E]"
          >
            <option value="ALL">All Workstreams ({tasks.length})</option>
            {Object.keys(WORKSTREAM_COLORS).map(ws => (
              <option key={ws} value={ws}>{ws}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-[#95288E]"
          >
            <option value="ALL">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="In Progress">In Progress</option>
            <option value="Partial">Partial</option>
            <option value="Delayed">Delayed</option>
            <option value="Not Started">Not Started</option>
          </select>

        </div>

        {/* Right: Layout Switchers & Display Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Highlight Critical Path Button */}
          <button
            onClick={() => setHighlightCriticalOnly(!highlightCriticalOnly)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              highlightCriticalOnly
                ? 'bg-gradient-to-r from-[#B38D34] to-[#D4AF37] text-slate-950 shadow-md shadow-[#B38D34]/40 border border-yellow-200'
                : 'bg-slate-950 text-[#FDE047] hover:bg-[#B38D34]/20 border border-[#B38D34]/50'
            }`}
            title="Filter to only the critical path tasks and linkages"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{highlightCriticalOnly ? 'Critical Path Isolated' : 'Highlight Critical Path'}</span>
          </button>

          {/* Show Edge Labels Toggle */}
          <button
            onClick={() => setShowEdgeLabels(!showEdgeLabels)}
            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              showEdgeLabels
                ? 'bg-[#95288E] text-white'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
            title="Toggle dependency relationship labels on arrows"
          >
            {showEdgeLabels ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Labels</span>
          </button>

          {/* Layout Mode Toggle: Pipeline Flow vs Force-Directed */}
          <div className="bg-slate-950 p-0.5 rounded-lg border border-slate-800 flex items-center space-x-0.5">
            <button
              onClick={() => setLayoutMode('pipeline')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                layoutMode === 'pipeline'
                  ? 'bg-[#95288E] text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Sequential 4-Phase pipeline architecture layout"
            >
              <Layers className="w-3 h-3" />
              <span>Phased Flow</span>
            </button>
            <button
              onClick={() => setLayoutMode('force')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                layoutMode === 'force'
                  ? 'bg-[#95288E] text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Force-directed organic network layout"
            >
              <Workflow className="w-3 h-3" />
              <span>Force Network</span>
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => handleZoom(1.25)}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleZoom(0.8)}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
              title="Reset & Center View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>

      {/* GRAPH CANVAS & DETAIL SIDEBAR CONTAINER */}
      <div 
        ref={containerRef}
        className="relative w-full h-[760px] bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl"
      >
        
        {/* SVG Canvas */}
        <svg
          ref={svgRef}
          className="w-full h-full cursor-grab active:cursor-grabbing select-none"
        />

        {/* Legend Overlay (Bottom Left) */}
        <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg p-3 text-[11px] text-slate-300 font-mono shadow-xl max-w-sm pointer-events-auto">
          <div className="font-bold text-white mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#B38D34] animate-pulse"></span>
              Graph Legend &amp; Linkages
            </span>
            <span className="text-[10px] text-slate-500 font-normal">Click node to inspect</span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[#B38D34] border-t-2 border-dashed border-[#B38D34]"></span>
              <span className="text-[#FDE047] font-bold">Critical Path (CPM)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[#64748b]"></span>
              <span>Standard Precedence</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Completed (100%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>Partial / Ongoing</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span>Delayed / Overdue</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center gap-2">
            <span>Hover on node: highlights Upstream (cyan) &amp; Downstream (purple)</span>
          </div>
        </div>

        {/* Critical Path Flow Navigation Pill (Top Center) */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md border border-[#B38D34]/40 rounded-full px-4 py-1.5 shadow-lg flex items-center gap-2 text-xs font-mono">
          <Flame className="w-3.5 h-3.5 text-[#FDE047]" />
          <span className="text-slate-300 font-semibold">Critical Path Sequence:</span>
          <div className="flex items-center gap-1 overflow-x-auto max-w-md scrollbar-none">
            {graphData.criticalPathSNos.map((sNo, idx) => {
              const taskObj = tasks.find(t => t.sNo === sNo);
              const isSelected = selectedNode?.sNo === sNo;
              const isDone = taskObj?.status === 'Completed';

              return (
                <button
                  key={sNo}
                  onClick={() => {
                    const node = graphData.nodes.find(n => n.sNo === sNo);
                    if (node) setSelectedNode(node);
                  }}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition ${
                    isSelected
                      ? 'bg-[#B38D34] text-slate-950 font-extrabold'
                      : isDone
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                      : 'bg-slate-800 text-slate-300 hover:text-[#FDE047]'
                  }`}
                  title={taskObj?.title}
                >
                  #{sNo}
                  {idx < graphData.criticalPathSNos.length - 1 && (
                    <span className="text-slate-600 ml-1">→</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Task Inspection Sidebar / Drawer */}
        {selectedNode && (
          <div className="absolute top-4 right-4 bottom-4 w-96 bg-slate-900/95 backdrop-blur-lg border border-slate-800 rounded-xl p-5 shadow-2xl flex flex-col z-20 overflow-y-auto animate-in slide-in-from-right-4 duration-200">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                    selectedNode.isCritical 
                      ? 'bg-[#B38D34] text-slate-950' 
                      : 'bg-slate-800 text-slate-200'
                  }`}>
                    Task #{selectedNode.sNo}
                  </span>
                  {selectedNode.isCritical && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#B38D34]/20 text-[#FDE047] border border-[#B38D34]/40 flex items-center gap-1">
                      <Flame className="w-3 h-3 text-[#FDE047]" />
                      CRITICAL PATH
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-white mt-1.5 leading-snug">
                  {selectedNode.title}
                </h3>
                <span className="text-[11px] font-mono text-[#D667CF] block mt-0.5">
                  {selectedNode.workstream}
                </span>
              </div>

              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Status & Progress Bar */}
            <div className="py-3 border-b border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Current Status:</span>
                <span className={`font-bold font-mono px-2 py-0.5 rounded text-[11px] ${
                  selectedNode.status === 'Completed'
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                    : selectedNode.status === 'In Progress'
                    ? 'bg-purple-950/80 text-purple-300 border border-purple-800/60'
                    : selectedNode.status === 'Delayed'
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  {selectedNode.status}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
                  <span>Progress Slider</span>
                  <span className="text-white font-bold">{selectedNode.percentComplete}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#95288E] to-[#B38D34] rounded-full transition-all"
                    style={{ width: `${selectedNode.percentComplete}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Dates & Owners */}
            <div className="py-3 border-b border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Target Schedule:
                </span>
                <span className="font-mono text-slate-200">
                  {selectedNode.startDate} → {selectedNode.endDate}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  Backend Owner:
                </span>
                <span className="font-semibold text-slate-200">
                  {selectedNode.backendOwner || '-'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  Frontend Owner:
                </span>
                <span className="font-semibold text-slate-200">
                  {selectedNode.frontendOwner || '-'}
                </span>
              </div>

              {selectedNode.delayDays > 0 && (
                <div className="flex items-center justify-between text-rose-400 font-mono">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Accumulated Delay:
                  </span>
                  <span className="font-bold">+{selectedNode.delayDays} Days</span>
                </div>
              )}
            </div>

            {/* Direct Predecessors (Upstream Blockers) */}
            <div className="py-3 border-b border-slate-800">
              <span className="text-xs font-mono uppercase text-slate-400 font-bold block mb-2 flex items-center justify-between">
                <span>Immediate Predecessors ({selectedNode.predecessorSNoList.length})</span>
                <span className="text-[10px] text-cyan-400 font-normal">Must finish first</span>
              </span>

              {selectedNode.predecessorSNoList.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No incoming predecessor requirements (Root deliverable)</p>
              ) : (
                <div className="space-y-1.5">
                  {selectedNode.predecessorSNoList.map(pSNo => {
                    const predNode = graphData.nodes.find(n => n.sNo === pSNo);
                    const isPredDone = predNode?.status === 'Completed';

                    return (
                      <div
                        key={pSNo}
                        onClick={() => predNode && setSelectedNode(predNode)}
                        className="bg-slate-950 p-2 rounded-lg border border-slate-800/80 hover:border-cyan-500/60 transition cursor-pointer flex items-center justify-between group"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-800/60">
                            #{pSNo}
                          </span>
                          <span className="text-xs text-slate-200 group-hover:text-cyan-300 transition truncate max-w-[170px]">
                            {predNode?.title}
                          </span>
                        </div>
                        <span className={`text-[10px] font-mono ${isPredDone ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {isPredDone ? '✓ Done' : 'In Progress'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Direct Successors (Downstream Impact) */}
            <div className="py-3 border-b border-slate-800">
              <span className="text-xs font-mono uppercase text-slate-400 font-bold block mb-2 flex items-center justify-between">
                <span>Direct Successors ({selectedNode.successorSNoList.length})</span>
                <span className="text-[10px] text-purple-400 font-normal">Will be impacted</span>
              </span>

              {selectedNode.successorSNoList.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No downstream dependents (Terminal deliverable)</p>
              ) : (
                <div className="space-y-1.5">
                  {selectedNode.successorSNoList.map(sSNo => {
                    const succNode = graphData.nodes.find(n => n.sNo === sSNo);

                    return (
                      <div
                        key={sSNo}
                        onClick={() => succNode && setSelectedNode(succNode)}
                        className="bg-slate-950 p-2 rounded-lg border border-slate-800/80 hover:border-purple-500/60 transition cursor-pointer flex items-center justify-between group"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950/60 text-purple-300 border border-purple-800/60">
                            #{sSNo}
                          </span>
                          <span className="text-xs text-slate-200 group-hover:text-purple-300 transition truncate max-w-[170px]">
                            {succNode?.title}
                          </span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-4 mt-auto">
              {onEditTask && canEdit && (
                <button
                  onClick={() => {
                    const taskItem = taskMap.get(selectedNode.id);
                    if (taskItem) onEditTask(taskItem);
                  }}
                  className="w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg bg-gradient-to-r from-[#95288E] to-[#701A75] hover:from-[#aa2ea3] hover:to-[#95288E] text-white font-bold text-xs shadow-lg shadow-[#95288E]/40 border border-[#D667CF]/40 transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#FDE047]" />
                  <span>Edit Task #{selectedNode.sNo} Details</span>
                </button>
              )}
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
