'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

// ── Types ─────────────────────────────────────────────────────────────────────
interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  group: string;
  type: 'category' | 'word';
  children?: string[];
  _children?: string[]; // Hidden children
  expanded?: boolean;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
}

interface Props {
  categories: Record<string, string[]>;
  words: Record<string, number[]>;
  isFullscreen?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  Political: '#5c6bc0',
  Military: '#e53935',
  Geographic: '#00897b',
  Humanitarian: '#f57c00',
  Legal: '#8e24aa',
  Economic: '#43a047',
  Scientific: '#1e88e5',
  Social: '#d81b60',
  Environmental: '#7cb342',
  Medical: '#e91e63',
  Educational: '#3949ab',
  Technological: '#00acc1',
  Cultural: '#fb8c00',
  Historical: '#6d4c41',
  Philosophical: '#5e35b1',
  Other: '#78909c',
};

export default function InteractiveConceptMap({ categories, words, isFullscreen = false }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const nodesRef = useRef<GraphNode[]>([]);
  const linksRef = useRef<GraphLink[]>([]);

  useEffect(() => {
    if (!svgRef.current || !categories || Object.keys(categories).length === 0) return;

    const width = isFullscreen ? 1200 : 520;
    const height = isFullscreen ? 800 : 380;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    // Add zoom behavior
    const g = svg.append('g');
    
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Build initial graph data (only category nodes, no words yet)
    const initialNodes: GraphNode[] = [];
    const initialLinks: GraphLink[] = [];

    // Add center node
    initialNodes.push({
      id: 'center',
      label: 'Concepts',
      group: 'center',
      type: 'category',
      children: Object.keys(categories),
      expanded: true,
    });

    // Add category nodes
    Object.keys(categories).forEach(category => {
      if (categories[category].length > 0) {
        initialNodes.push({
          id: category,
          label: category,
          group: category,
          type: 'category',
          children: categories[category],
          _children: categories[category], // Store children
          expanded: false,
        });

        initialLinks.push({
          source: 'center',
          target: category,
        });
      }
    });

    nodesRef.current = initialNodes;
    linksRef.current = initialLinks;

    // Create force simulation
    const simulation = d3.forceSimulation<GraphNode>(nodesRef.current)
      .force('link', d3.forceLink<GraphNode, GraphLink>(linksRef.current)
        .id(d => d.id)
        .distance(isFullscreen ? 150 : 100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('collide', d3.forceCollide().radius(isFullscreen ? 40 : 30))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('x', d3.forceX(width / 2).strength(0.05))
      .force('y', d3.forceY(height / 2).strength(0.05));

    simulationRef.current = simulation;

    // Create link elements
    const linkGroup = g.append('g').attr('class', 'links');
    const nodeGroup = g.append('g').attr('class', 'nodes');
    const labelGroup = g.append('g').attr('class', 'labels');

    function update() {
      console.log('[ConceptMap] Updating with', nodesRef.current.length, 'nodes and', linksRef.current.length, 'links');

      // Update links
      const link = linkGroup
        .selectAll<SVGLineElement, GraphLink>('line')
        .data(linksRef.current, d => `${typeof d.source === 'string' ? d.source : d.source.id}-${typeof d.target === 'string' ? d.target : d.target.id}`);

      link.exit()
        .transition()
        .duration(300)
        .attr('stroke-opacity', 0)
        .remove();

      const linkEnter = link.enter()
        .append('line')
        .attr('stroke', '#999')
        .attr('stroke-opacity', 0)
        .attr('stroke-width', 1.5);

      linkEnter.transition()
        .duration(300)
        .attr('stroke-opacity', 0.6);

      const linkMerge = linkEnter.merge(link);

      // Update nodes
      const node = nodeGroup
        .selectAll<SVGCircleElement, GraphNode>('circle')
        .data(nodesRef.current, d => d.id);

      node.exit()
        .transition()
        .duration(300)
        .attr('r', 0)
        .remove();

      const nodeEnter = node.enter()
        .append('circle')
        .attr('r', 0)
        .attr('fill', d => d.type === 'category' ? (CATEGORY_COLORS[d.group] || '#78909c') : (CATEGORY_COLORS[d.group] || '#78909c'))
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .attr('opacity', d => d.type === 'category' ? 0.9 : 0.7)
        .style('cursor', d => d.type === 'category' && d.children && d.children.length > 0 ? 'pointer' : 'default')
        .on('click', (event, d) => {
          console.log('[ConceptMap] Node clicked:', d.id, 'type:', d.type, 'expanded:', d.expanded, 'children:', d.children?.length);
          handleNodeClick(event, d);
        })
        .on('mouseover', function(event, d) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', d.type === 'category' ? (isFullscreen ? 28 : 22) : (isFullscreen ? 18 : 14))
            .attr('opacity', 1);

          // Highlight connected links
          linkMerge
            .attr('stroke-opacity', l => {
              const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
              const targetId = typeof l.target === 'string' ? l.target : l.target.id;
              return sourceId === d.id || targetId === d.id ? 1 : 0.2;
            })
            .attr('stroke-width', l => {
              const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
              const targetId = typeof l.target === 'string' ? l.target : l.target.id;
              return sourceId === d.id || targetId === d.id ? 2.5 : 1.5;
            });
        })
        .on('mouseout', function(event, d) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', d.type === 'category' ? (isFullscreen ? 24 : 18) : (isFullscreen ? 14 : 10))
            .attr('opacity', d.type === 'category' ? 0.9 : 0.7);

          // Reset links
          linkMerge
            .attr('stroke-opacity', 0.6)
            .attr('stroke-width', 1.5);
        })
        .call(d3.drag<SVGCircleElement, GraphNode>()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended));

      nodeEnter.transition()
        .duration(300)
        .attr('r', d => d.type === 'category' ? (isFullscreen ? 24 : 18) : (isFullscreen ? 14 : 10));

      const nodeMerge = nodeEnter.merge(node);

      // Update labels
      const label = labelGroup
        .selectAll<SVGTextElement, GraphNode>('text')
        .data(nodesRef.current, d => d.id);

      label.exit()
        .transition()
        .duration(300)
        .attr('opacity', 0)
        .remove();

      const labelEnter = label.enter()
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', d => d.type === 'category' ? (isFullscreen ? 35 : 28) : (isFullscreen ? 22 : 18))
        .attr('font-size', d => d.type === 'category' ? (isFullscreen ? '12px' : '10px') : (isFullscreen ? '10px' : '8px'))
        .attr('font-weight', d => d.type === 'category' ? 'bold' : 'normal')
        .attr('fill', d => CATEGORY_COLORS[d.group] || '#78909c')
        .attr('opacity', 0)
        .text(d => d.label)
        .style('pointer-events', 'none');

      labelEnter.transition()
        .duration(300)
        .attr('opacity', 1);

      const labelMerge = labelEnter.merge(label);

      // Update simulation
      if (simulationRef.current) {
        simulationRef.current.nodes(nodesRef.current);
        (simulationRef.current.force('link') as d3.ForceLink<GraphNode, GraphLink>).links(linksRef.current);
        simulationRef.current.alpha(0.3).restart();

        simulationRef.current.on('tick', () => {
          linkMerge
            .attr('x1', d => {
              const source = typeof d.source === 'string' ? nodesRef.current.find(n => n.id === d.source) : d.source;
              return source?.x || 0;
            })
            .attr('y1', d => {
              const source = typeof d.source === 'string' ? nodesRef.current.find(n => n.id === d.source) : d.source;
              return source?.y || 0;
            })
            .attr('x2', d => {
              const target = typeof d.target === 'string' ? nodesRef.current.find(n => n.id === d.target) : d.target;
              return target?.x || 0;
            })
            .attr('y2', d => {
              const target = typeof d.target === 'string' ? nodesRef.current.find(n => n.id === d.target) : d.target;
              return target?.y || 0;
            });

          nodeMerge
            .attr('cx', d => d.x!)
            .attr('cy', d => d.y!);

          labelMerge
            .attr('x', d => d.x!)
            .attr('y', d => d.y!);
        });
      }
    }

    function handleNodeClick(event: MouseEvent, d: GraphNode) {
      event.stopPropagation();

      console.log('[ConceptMap] handleNodeClick called for:', d.id);

      if (d.type === 'category' && d.children && d.children.length > 0) {
        if (d.expanded) {
          console.log('[ConceptMap] Collapsing node:', d.id);
          // Collapse: remove word nodes
          const childIds = new Set(d.children);
          nodesRef.current = nodesRef.current.filter(n => !childIds.has(n.id));
          linksRef.current = linksRef.current.filter(l => {
            const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
            const targetId = typeof l.target === 'string' ? l.target : l.target.id;
            return !childIds.has(sourceId) && !childIds.has(targetId);
          });
          d.expanded = false;
        } else {
          console.log('[ConceptMap] Expanding node:', d.id, 'with', d.children.length, 'children');
          // Expand: add word nodes
          const newNodes: GraphNode[] = [];
          const newLinks: GraphLink[] = [];

          d.children.forEach(word => {
            if (!nodesRef.current.find(n => n.id === word)) {
              newNodes.push({
                id: word,
                label: word,
                group: d.group,
                type: 'word',
              });

              newLinks.push({
                source: d.id,
                target: word,
              });
            }
          });

          console.log('[ConceptMap] Adding', newNodes.length, 'new nodes and', newLinks.length, 'new links');
          nodesRef.current = [...nodesRef.current, ...newNodes];
          linksRef.current = [...linksRef.current, ...newLinks];
          d.expanded = true;
        }

        update();
      } else {
        console.log('[ConceptMap] Node not expandable:', d.id, 'type:', d.type);
      }
    }

    function dragstarted(event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>) {
      if (!event.active && simulationRef.current) simulationRef.current.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>) {
      if (!event.active && simulationRef.current) simulationRef.current.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    // Initial render
    update();

    // Cleanup
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, [categories, words, isFullscreen]);

  if (!categories || Object.keys(categories).length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        No concept map data available
      </div>
    );
  }

  return (
    <div className={`relative w-full ${isFullscreen ? 'h-full' : 'h-[380px]'} bg-muted/30 rounded-lg border border-border overflow-hidden`}>
      <svg ref={svgRef} className="w-full h-full" />
      <div className="absolute bottom-4 left-4 text-xs text-muted-foreground bg-background/80 backdrop-blur px-3 py-2 rounded-lg border border-border">
        <p className="font-semibold mb-1">Controls:</p>
        <p>• Click category to expand/collapse</p>
        <p>• Drag nodes to reposition</p>
        <p>• Scroll to zoom, drag to pan</p>
      </div>
    </div>
  );
}
