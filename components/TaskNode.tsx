'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { getColorForCategory } from '@/utils/colors';
import { formatDecimal } from '@/utils/format';
import NodeTooltip from './NodeTooltip';
import { L5Task, L6Task } from '@/types/task';
import { useAppStore } from '@/lib/store';

export interface TaskNodeData {
  label: string;
  category: string;
  필요인력: number;
  필요기간: number;
  MM: number;
  cumulativeMM?: number;
  isFinalNode?: boolean;
  isStartNode?: boolean;
  hasCycle?: boolean;
  isHighlighted?: boolean;
  isSelected?: boolean;
  isSearched?: boolean;
  fullData?: Partial<L5Task> | Partial<L6Task>;
  isL5?: boolean;
  isL6?: boolean;
  hasError?: boolean; // 에러가 있는 노드인지
  onErrorClick?: () => void; // 에러 아이콘 클릭 핸들러
}

const TaskNode = memo(({ data }: NodeProps<any>) => {
  const showTooltips = useAppStore((state) => state.showTooltips);
  const colors = getColorForCategory(data.category);

  const borderColor = data.isSearched
    ? '#FFC107' // Yellow/Amber for searched node
    : data.isSelected
    ? '#000000' // Black for selected
    : data.isStartNode
    ? '#FF6B35' // Orange for start node
    : data.isHighlighted
    ? colors.border
    : colors.border;

  const borderWidth = data.isSearched
    ? '4px'
    : data.isStartNode
    ? '3px'
    : data.isSelected
    ? '3px'
    : data.isHighlighted
    ? '2px'
    : '1px';

  const boxShadow = data.isSearched
    ? '0 0 20px rgba(255, 193, 7, 0.8), 0 0 40px rgba(255, 193, 7, 0.4)'
    : data.isStartNode
    ? '0 6px 16px rgba(255, 107, 53, 0.4)'
    : data.isSelected
    ? '0 4px 12px rgba(0,0,0,0.3)'
    : data.isHighlighted
    ? '0 2px 8px rgba(0,0,0,0.2)'
    : '0 1px 4px rgba(0,0,0,0.1)';

  const backgroundColor = data.isSearched
    ? 'rgba(255, 243, 224, 0.95)' // Light yellow background for searched node
    : colors.bg;

  return (
    <div className="group relative" style={{ zIndex: 1 }}>
      <div
        style={{
          padding: '12px 16px',
          borderRadius: '8px',
          border: `${borderWidth} solid ${borderColor}`,
          backgroundColor,
          color: colors.text,
          minWidth: '180px',
          maxWidth: '250px',
          boxShadow,
          transition: 'all 0.2s ease',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Handle
          type="target"
          position={Position.Right}
          style={{ background: colors.border, width: '8px', height: '8px' }}
        />

        <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px', wordBreak: 'break-word' }}>
          {data.isL6 ? `[L6] ${data.label}` : data.label}
        </div>

        <div style={{ fontSize: '11px', color: colors.text, opacity: 0.8, lineHeight: '1.4' }}>
          <div>P: {formatDecimal(data.필요인력)} | T: {formatDecimal(data.필요기간)}W</div>
          <div>MM: {formatDecimal(data.MM)}</div>
          {data.isStartNode && data.cumulativeMM !== undefined && (
            <div style={{
              fontWeight: 700,
              marginTop: '6px',
              padding: '4px 8px',
              backgroundColor: 'rgba(255, 107, 53, 0.15)',
              borderRadius: '4px',
              color: '#FF6B35',
              fontSize: '12px'
            }}>
              누적: {formatDecimal(data.cumulativeMM)}MM
            </div>
          )}
        </div>

        <Handle
          type="source"
          position={Position.Left}
          style={{ background: colors.border, width: '8px', height: '8px' }}
        />
      </div>

      {/* Tooltip - only show if fullData exists and it's L5 or L6 and tooltips are enabled */}
      {showTooltips && data.fullData && (data.isL5 || data.isL6) && (
        <NodeTooltip data={data.fullData} isL5={data.isL5} isL6={data.isL6} />
      )}
    </div>
  );
});

TaskNode.displayName = 'TaskNode';

export default TaskNode;
