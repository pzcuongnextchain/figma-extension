import { Box } from "@mui/material";
import React, { useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  Edge,
  Handle,
  Node,
  Position,
  useEdgesState,
  useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";

export interface SchemaData {
  tables?: Array<{
    name: string;
    fields: Array<{
      name: string;
      type: string;
      required?: boolean;
      references?: {
        table: string;
        field: string;
      };
    }>;
  }>;
  relationships?: Array<{
    from: {
      table: string;
      field: string;
    };
    to: {
      table: string;
      field: string;
    };
    type: any;
  }>;
}

interface SchemaViewerProps {
  data: SchemaData | null;
}

const TableNode = ({ data }: { data: any }) => {
  return (
    <div
      style={{
        padding: "10px",
        borderRadius: "3px",
        width: 200,
        fontSize: "12px",
        color: "#222",
        background: "white",
        border: "1px solid #ddd",
        boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
      }}
    >
      <Handle type="target" position={Position.Top} />
      <div
        style={{
          fontWeight: "bold",
          borderBottom: "1px solid #eee",
          paddingBottom: "8px",
          marginBottom: "8px",
        }}
      >
        {data.label}
      </div>
      {data.fields.map((field: any, index: number) => (
        <div
          key={index}
          style={{
            padding: "4px 0",
            borderBottom:
              index < data.fields.length - 1 ? "1px solid #eee" : "none",
          }}
        >
          <span style={{ color: field.required ? "#d32f2f" : "#666" }}>
            {field.name}
          </span>
          <span style={{ color: "#999", float: "right" }}>{field.type}</span>
        </div>
      ))}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

const nodeTypes = {
  tableNode: TableNode,
};

export const SchemaViewer: React.FC<SchemaViewerProps> = ({ data }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const createNodesAndEdges = useCallback((schemaData: SchemaData) => {
    if (!schemaData.tables) return;

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    const spacing = 250;
    const maxNodesPerRow = 3;

    // Create nodes for each table
    schemaData.tables.forEach((table, index) => {
      const row = Math.floor(index / maxNodesPerRow);
      const col = index % maxNodesPerRow;

      newNodes.push({
        id: table.name,
        type: "tableNode",
        position: { x: col * spacing, y: row * spacing },
        data: {
          label: table.name,
          fields: table.fields,
        },
      });
    });

    // Create edges for relationships
    schemaData.relationships?.forEach((rel, index) => {
      newEdges.push({
        id: `e${index}`,
        source: rel.from.table,
        target: rel.to.table,
        label: rel.type,
        type: "smoothstep",
        animated: true,
        style: { stroke: "#666" },
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, []);

  React.useEffect(() => {
    if (data) {
      createNodesAndEdges(data);
    }
  }, [data, createNodesAndEdges]);

  if (!data) {
    return (
      <Box sx={{ p: 2 }}>
        No schema data available. Start a conversation to generate schema.
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100%", width: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </Box>
  );
};
