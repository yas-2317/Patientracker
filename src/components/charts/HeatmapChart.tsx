'use client';

import { PHQ9DataPoint, PHQ9Item, phq9ItemLabels } from '@/data/assessments';

type Props = {
  data: PHQ9DataPoint[];
};

function getCellColor(score: number): string {
  switch (score) {
    case 0:
      return '#ffffff';
    case 1:
      return '#fef9c3'; // 薄黄
    case 2:
      return '#fed7aa'; // 薄橙
    case 3:
      return '#f97316'; // 深橙赤
    default:
      return '#ffffff';
  }
}

function getCellTextColor(score: number): string {
  return score >= 3 ? '#ffffff' : '#374151';
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const itemKeys: (keyof PHQ9Item)[] = [
  'item1',
  'item2',
  'item3',
  'item4',
  'item5',
  'item6',
  'item7',
  'item8',
  'item9',
];

export default function HeatmapChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
        データがありません
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div
        className="inline-grid min-w-full"
        style={{
          gridTemplateColumns: `160px repeat(${data.length}, minmax(52px, 1fr))`,
        }}
      >
        {/* ヘッダー行：空セル + 日付ラベル */}
        <div className="h-8" /> {/* 左上の空セル */}
        {data.map((point) => (
          <div
            key={point.date}
            className="h-8 flex items-center justify-center"
          >
            <span className="text-xs text-gray-500 font-medium">
              {formatDateLabel(point.date)}
            </span>
          </div>
        ))}

        {/* 項目行 */}
        {itemKeys.map((key) => (
          <>
            {/* 項目名（左列） */}
            <div
              key={`label-${key}`}
              className="flex items-center pr-3 py-0.5"
            >
              <span className="text-xs text-gray-700 leading-tight">
                {phq9ItemLabels[key]}
              </span>
            </div>

            {/* スコアセル */}
            {data.map((point) => {
              const score = point.items[key];
              return (
                <div
                  key={`${key}-${point.date}`}
                  className="flex items-center justify-center py-0.5 px-0.5"
                >
                  <div
                    className="w-full h-8 rounded flex items-center justify-center border border-gray-100"
                    style={{
                      backgroundColor: getCellColor(score),
                    }}
                    title={`${phq9ItemLabels[key]}: ${score}`}
                  >
                    <span
                      className="text-xs font-medium"
                      style={{ color: getCellTextColor(score) }}
                    >
                      {score}
                    </span>
                  </div>
                </div>
              );
            })}
          </>
        ))}
      </div>

      {/* 凡例 */}
      <div className="flex items-center gap-3 mt-3 flex-wrap">
        <span className="text-xs text-gray-500">スコア:</span>
        {[
          { score: 0, label: '0 全くない' },
          { score: 1, label: '1 数日' },
          { score: 2, label: '2 半分以上' },
          { score: 3, label: '3 ほぼ毎日' },
        ].map(({ score, label }) => (
          <div key={score} className="flex items-center gap-1">
            <div
              className="w-4 h-4 rounded border border-gray-200"
              style={{ backgroundColor: getCellColor(score) }}
            />
            <span className="text-xs text-gray-600">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
