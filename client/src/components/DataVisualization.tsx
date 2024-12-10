import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Card } from "@/components/ui/card";

interface DataPoint {
  timestamp: Date;
  value: number;
}

interface DataVisualizationProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  color?: string;
}

export default function DataVisualization({
  data,
  width = 600,
  height = 300,
  color = "#7c3aed"
}: DataVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const x = d3.scaleTime()
      .domain(d3.extent(data, d => d.timestamp) as [Date, Date])
      .range([0, innerWidth]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value) || 0])
      .range([innerHeight, 0]);

    // Line generator
    const line = d3.line<DataPoint>()
      .x(d => x(d.timestamp))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX);

    // Add the line path
    g.append("path")
      .datum(data)
      .attr("class", "line")
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 2)
      .attr("d", line);

    // Add axes
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x))
      .attr("color", "currentColor")
      .attr("font-size", "12px");

    g.append("g")
      .call(d3.axisLeft(y))
      .attr("color", "currentColor")
      .attr("font-size", "12px");

    // Add grid lines
    g.append("g")
      .attr("class", "grid")
      .attr("stroke-opacity", 0.1)
      .call(d3.axisLeft(y)
        .tickSize(-innerWidth)
        .tickFormat(() => ""));

    // Matrix-style animation effect
    const particles = g.append("g")
      .attr("class", "particles");

    function animateParticles() {
      const numParticles = 50;
      const particleData = Array.from({ length: numParticles }, () => ({
        x: Math.random() * innerWidth,
        y: Math.random() * innerHeight,
        size: Math.random() * 3
      }));

      const particle = particles
        .selectAll("circle")
        .data(particleData)
        .join("circle")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", d => d.size)
        .attr("fill", color)
        .attr("opacity", 0.3);

      particle
        .transition()
        .duration(2000)
        .attr("cy", innerHeight)
        .attr("opacity", 0)
        .on("end", animateParticles);
    }

    animateParticles();
  }, [data, width, height, color]);

  return (
    <Card className="p-4">
      <svg ref={svgRef} className="w-full h-full" />
    </Card>
  );
}
