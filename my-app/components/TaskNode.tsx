'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { getColorForCategory } from '@/utils/colors';

export interface TaskNodeData {
  label: string;
  category: string;
  필요인력: number;
  필요기간: number;
  MM: number;
  cumulativeMM?: number;
  isFinalNode?: boolean;
  hasCycle?: boolean;
  isHighlighted?: boolean;
  isSelected?: boolean;
}

const TaskNode = memo(({ data }: NodeProps<TaskNodeData>) => {
  const colors = getColorForCategory(data.category);

  const borderColor = data.hasCycle
    ? '#F44336' // Red for cycle error
    : data.isSelected
    ? '#000000' // Black for selected
    : data.isHighlighted
    ? colors.border
    : colors.border;

  const borderWidth = data.isSelected ? '3px' : data.isHighlighted ? '2px' : '1px';
  const boxShadow = data.isSelected
    ? '0 4px 12px rgba(0,0,0,0.3)'
    : data.isHighlighted
    ? '0 2px 8px rgba(0,0,0,0.2)'
    : '0 1px 4px rgba(0,0,0,0.1)';

  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: '8px',
        border: `${borderWidth} solid ${borderColor}`,
        backgroundColor: colors.bg,
        color: colors.text,
        minWidth: '180px',
        maxWidth: '250px',
        boxShadow,
        transition: 'all 0.2s ease',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: colors.border, width: '8px', height: '8px' }}
      />

      <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px', wordBreak: 'break-word' }}>
        {data.label}
        {data.hasCycle && (
          <span style={{ color: '#F44336', fontSize: '12px', marginLeft: '4px' }}>⚠️</span>
        )}
      </div>

      <div style={{ fontSize: '11px', color: colors.text, opacity: 0.8, lineHeight: '1.4' }}>
        <div>P: {data.필요인력} | T: {data.필요기간}W</div>
        <div>MM: {data.MM.toFixed(1)}</div>
        {data.isFinalNode && data.cumulativeMM !== undefined && (
          <div style={{ fontWeight: 600, marginTop: '4px', color: colors.border }}>
            Total: {data.cumulativeMM.toFixed(1)}MM
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{ background: colors.border, width: '8px', height: '8px' }}
      />
    </div>
  );
});

TaskNode.displayName = 'TaskNode';

export default TaskNode;
