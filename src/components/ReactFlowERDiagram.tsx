import React, { useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  MarkerType,
  Handle,
  Position,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Key, ArrowRight, Table as TableIcon, Calculator, Database } from 'lucide-react';
import { TableSchema } from '../types';

interface CustomTableNodeData {
  table: TableSchema;
  isActive: boolean;
  onSelect: (tableName: string) => void;
  [key: string]: unknown;
}

// Custom React Flow Node for Database Entities
const TableNode: React.FC<{ data: CustomTableNodeData }> = ({ data }) => {
  const { table, isActive, onSelect } = data;

  return (
    <div
      onClick={() => onSelect(table.name)}
      className={`rounded-xl border shadow-md overflow-hidden min-w-[240px] max-w-[320px] transition-all cursor-pointer ${
        isActive
          ? 'ring-2 ring-[var(--accent-primary)] border-[var(--border-focus)]'
          : 'hover:border-[var(--border-hover)]'
      }`}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: isActive ? 'var(--border-focus)' : 'var(--border-subtle)',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-2.5 h-2.5 !bg-[var(--accent-primary)] !border-2 !border-[var(--bg-surface)]"
      />

      {/* Table Node Header */}
      <div
        className="px-3.5 py-2.5 border-b flex items-center justify-between"
        style={{
          backgroundColor: isActive ? 'var(--accent-light)' : 'var(--bg-surface-subtle)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="flex items-center gap-2">
          <TableIcon className="w-4 h-4 text-[var(--accent-primary)]" />
          <span className="font-mono text-xs font-bold text-[var(--text-primary)]">
            {table.name}
          </span>
        </div>
        <span className="text-[10px] text-[var(--text-muted)] font-mono">
          {table.columns.length} cols
        </span>
      </div>

      {/* Columns List */}
      <div className="p-2 space-y-1 text-xs font-mono divide-y divide-[var(--border-subtle)]">
        {table.columns.map((col) => {
          const isPk = col.name === table.primaryKey;
          const fk = table.foreignKeys?.find((f) => f.column === col.name);
          const isComputed = col.isComputed && col.computedConfig;

          return (
            <div
              key={col.id}
              className="pt-1 first:pt-0 flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                {isPk ? (
                  <span title="Primary Key" className="shrink-0 flex items-center text-amber-500">
                    <Key className="w-3 h-3" />
                  </span>
                ) : fk ? (
                  <span title={`Foreign Key: ${fk.cardinality} -> ${fk.targetTable}.${fk.targetColumn}`} className="shrink-0 flex items-center text-[var(--accent-primary)]">
                    <ArrowRight className="w-3 h-3" />
                  </span>
                ) : isComputed ? (
                  <span title={`Computed: ${col.computedConfig?.aggregation}(${col.computedConfig?.targetChildTable}.${col.computedConfig?.targetChildColumn})`} className="shrink-0 flex items-center text-purple-400">
                    <Calculator className="w-3 h-3" />
                  </span>
                ) : (
                  <span className="w-3 inline-block" />
                )}

                <span
                  className={`truncate text-[11px] ${
                    isPk
                      ? 'font-bold text-[var(--text-primary)]'
                      : isComputed
                      ? 'text-purple-400 font-medium'
                      : 'text-[var(--text-secondary)]'
                  }`}
                >
                  {col.name}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {isComputed ? (
                  <span className="text-[9px] text-purple-400 font-sans uppercase font-bold">
                    {col.computedConfig?.aggregation}()
                  </span>
                ) : (
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {col.type}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-2.5 h-2.5 !bg-[var(--accent-primary)] !border-2 !border-[var(--bg-surface)]"
      />
    </div>
  );
};

interface ReactFlowERDiagramProps {
  tables: TableSchema[];
  activeTable: string;
  onSelectTable: (tableName: string) => void;
  relationships: {
    id: string;
    parentTable: string;
    childTable: string;
    fkCol: string;
    pkCol: string;
    cardinality: string;
    linkCount: number;
  }[];
}

const nodeTypes = {
  tableNode: TableNode,
};

export const ReactFlowERDiagram: React.FC<ReactFlowERDiagramProps> = ({
  tables,
  activeTable,
  onSelectTable,
  relationships,
}) => {
  // Convert tables to React Flow Nodes positioned neatly in a layout grid
  const nodes: Node<CustomTableNodeData>[] = useMemo(() => {
    const spacingX = 360;
    const spacingY = 280;
    const colsPerRow = Math.max(2, Math.min(3, Math.ceil(Math.sqrt(tables.length))));

    return tables.map((tbl, index) => {
      const colIndex = index % colsPerRow;
      const rowIndex = Math.floor(index / colsPerRow);

      return {
        id: tbl.name,
        type: 'tableNode',
        position: { x: 50 + colIndex * spacingX, y: 50 + rowIndex * spacingY },
        data: {
          table: tbl,
          isActive: tbl.name === activeTable,
          onSelect: onSelectTable,
        },
      };
    });
  }, [tables, activeTable, onSelectTable]);

  // Convert foreign keys and relationships to interactive React Flow Edges
  const edges: Edge[] = useMemo(() => {
    const edgeList: Edge[] = [];

    tables.forEach((tbl) => {
      if (tbl.foreignKeys) {
        tbl.foreignKeys.forEach((fk, idx) => {
          const edgeId = `edge_${fk.targetTable}_${tbl.name}_${idx}`;
          const cardinalityLabel = fk.cardinality || '1:N';

          edgeList.push({
            id: edgeId,
            source: fk.targetTable,
            target: tbl.name,
            animated: true,
            label: cardinalityLabel,
            labelStyle: {
              fill: 'var(--text-primary)',
              fontWeight: 700,
              fontSize: 11,
              fontFamily: 'monospace',
            },
            labelBgPadding: [6, 3],
            labelBgBorderRadius: 4,
            labelBgStyle: {
              fill: 'var(--bg-surface-elevated)',
              stroke: 'var(--border-subtle)',
              strokeWidth: 1,
            },
            style: {
              stroke: 'var(--accent-primary)',
              strokeWidth: 2,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: 'var(--accent-primary)',
              width: 16,
              height: 16,
            },
          });
        });
      }
    });

    return edgeList;
  }, [tables]);

  return (
    <div className="w-full h-full min-h-[500px] flex flex-col relative select-none">
      {/* Top Diagram Legend Bar */}
      <div
        className="px-4 py-2 border-b flex flex-wrap items-center justify-between text-xs gap-3 shrink-0"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-[var(--accent-primary)]" />
          <span className="font-semibold text-[var(--text-primary)]">
            Interactive Entity-Relationship Graph (React Flow)
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono text-[var(--text-muted)]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            <span>PK Primary Key</span>
          </span>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] inline-block" />
            <span>FK (1:1, 1:N, N:N)</span>
          </span>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
            <span>Computed Aggregation</span>
          </span>
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1 w-full h-full relative" style={{ backgroundColor: 'var(--bg-canvas)' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          attributionPosition="bottom-right"
          minZoom={0.2}
          maxZoom={1.8}
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="var(--border-subtle)" />
          <Controls
            className="!rounded-xl !overflow-hidden !border !shadow-md"
            style={{
              borderColor: 'var(--border-subtle)',
              backgroundColor: 'var(--bg-surface)',
              fill: 'var(--text-primary)',
            }}
          />
          <MiniMap
            nodeColor="var(--accent-primary)"
            maskColor="rgba(0, 0, 0, 0.4)"
            className="!rounded-xl !border !shadow-sm !overflow-hidden hidden sm:block"
            style={{
              borderColor: 'var(--border-subtle)',
              backgroundColor: 'var(--bg-surface)',
              width: 140,
              height: 100,
            }}
          />
        </ReactFlow>
      </div>
    </div>
  );
};
