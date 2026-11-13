"use client";

import { useState } from "react";

/**
 * The overview charts.
 *
 * These are two series over twelve months — the charting library that drew
 * them weighed about 400 KB of the dashboard's JavaScript, and the dashboard
 * is the one screen the studio opens every morning. Drawing the same chart
 * with SVG is a fraction of that, and it loads without a second round trip.
 */

export interface RevenuePoint {
  month: string;
  digital: number;
  service: number;
}

export interface OrderPoint {
  month: string;
  digital: number;
  service: number;
}

const WIDTH = 720;
const HEIGHT = 260;
const PAD = { top: 12, right: 12, bottom: 28, left: 56 };

const COLOURS = {
  digital: "var(--primary)",
  service: "var(--pink)",
};

/** A round number above the largest value, so the axis reads cleanly. */
function niceMax(value: number) {
  if (value <= 4) return 4;
  if (value <= 10) return 10;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const steps = [1, 2, 2.5, 5, 10];
  for (const step of steps) {
    const candidate = step * magnitude;
    if (candidate >= value) return candidate;
  }
  return 10 * magnitude;
}

function formatCompact(value: number) {
  if (value >= 1000) {
    const thousands = value / 1000;
    return `${Number.isInteger(thousands) ? thousands : thousands.toFixed(1)}k`;
  }
  return String(Math.round(value));
}

interface ChartPoint {
  x: number;
  y: number;
  value: number;
  serviceY: number;
  serviceValue: number;
}

interface Hover {
  index: number;
  x: number;
}

function ChartFrame({
  data,
  max,
  children,
  hovered,
  onHover,
}: {
  data: { month: string; digital: number; service: number }[];
  max: number;
  children: (points: ChartPoint[]) => React.ReactNode;
  hovered: Hover | null;
  onHover: (hover: Hover | null) => void;
}) {
  const plotWidth = WIDTH - PAD.left - PAD.right;
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;
  const step = plotWidth / Math.max(data.length - 1, 1);

  const xAt = (index: number) => PAD.left + index * step;
  const yAt = (value: number) =>
    PAD.top + plotHeight - (value / max) * plotHeight;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-64 w-full"
        role="img"
        aria-label={`${data.length} months of data`}
      >
        {/* Gridlines and the value axis */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = PAD.top + plotHeight - ratio * plotHeight;
          return (
            <g key={ratio}>
              <line
                x1={PAD.left}
                x2={WIDTH - PAD.right}
                y1={y}
                y2={y}
                stroke="var(--border)"
                strokeDasharray="3 3"
              />
              <text
                x={PAD.left - 10}
                y={y + 4}
                textAnchor="end"
                className="fill-[var(--muted-foreground)] font-label text-[11px]"
              >
                {formatCompact(max * ratio)}
              </text>
            </g>
          );
        })}

        {/* The month axis — the first and last labels lean inwards so they
            are not clipped by the edge of the chart. */}
        {data.map((point, index) => (
          <text
            key={point.month}
            x={xAt(index)}
            y={HEIGHT - 8}
            textAnchor={
              index === 0
                ? "start"
                : index === data.length - 1
                  ? "end"
                  : "middle"
            }
            className="fill-[var(--muted-foreground)] font-label text-[11px]"
          >
            {point.month}
          </text>
        ))}

        {children(
          data.map((point, index) => ({
            x: xAt(index),
            y: yAt(point.digital),
            value: point.digital,
            serviceY: yAt(point.service),
            serviceValue: point.service,
          })),
        )}

        {/* The pointer the pointer moves over */}
        {hovered ? (
          <line
            x1={hovered.x}
            x2={hovered.x}
            y1={PAD.top}
            y2={PAD.top + plotHeight}
            stroke="var(--text)"
            strokeOpacity="0.25"
          />
        ) : null}

        {/* One hit area per month */}
        {data.map((point, index) => (
          <rect
            key={`hit-${point.month}`}
            x={xAt(index) - step / 2}
            y={PAD.top}
            width={step}
            height={plotHeight}
            fill="transparent"
            onMouseEnter={() => onHover({ index, x: xAt(index) })}
            onMouseLeave={() => onHover(null)}
          />
        ))}
      </svg>

      {hovered ? (
        <div
          className="pointer-events-none absolute top-2 rounded-md border border-border bg-surface px-3 py-2 shadow-sm"
          style={{
            left: `${(hovered.x / WIDTH) * 100}%`,
            transform:
              hovered.x / WIDTH > 0.7 ? "translateX(-100%)" : "translateX(8px)",
          }}
        >
          <p className="font-label text-[11px] font-medium text-text">
            {data[hovered.index].month}
          </p>
          <p className="font-label text-[11px] text-muted-foreground">
            <span
              className="mr-1 inline-block size-2 rounded-full align-middle"
              style={{ background: COLOURS.digital }}
            />
            {data[hovered.index].digital}
          </p>
          <p className="font-label text-[11px] text-muted-foreground">
            <span
              className="mr-1 inline-block size-2 rounded-full align-middle"
              style={{ background: COLOURS.service }}
            />
            {data[hovered.index].service}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function Legend({ items }: { items: { label: string; colour: string }[] }) {
  return (
    <ul className="mt-3 flex flex-wrap items-center gap-4">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-2.5 rounded-sm"
            style={{ background: item.colour }}
          />
          <span className="font-label text-xs text-muted-foreground">
            {item.label}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Revenue per month, split by where it came from. */
export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const [hovered, setHovered] = useState<Hover | null>(null);

  const max = niceMax(
    Math.max(
      1,
      ...data.map((point) => Math.max(point.digital, point.service)),
    ),
  );

  return (
    <>
      <ChartFrame data={data} max={max} hovered={hovered} onHover={setHovered}>
        {(points) => (
          <>
            <path
              d={`M ${points[0]?.x ?? 0} ${HEIGHT - PAD.bottom} ${points
                .map((point) => `L ${point.x} ${point.serviceY}`)
                .join(" ")} L ${points[points.length - 1]?.x ?? 0} ${
                HEIGHT - PAD.bottom
              } Z`}
              fill={COLOURS.service}
              fillOpacity="0.18"
            />
            <path
              d={`M ${points[0]?.x ?? 0} ${HEIGHT - PAD.bottom} ${points
                .map((point) => `L ${point.x} ${point.y}`)
                .join(" ")} L ${points[points.length - 1]?.x ?? 0} ${
                HEIGHT - PAD.bottom
              } Z`}
              fill={COLOURS.digital}
              fillOpacity="0.22"
            />
            {points.map((point, index) => (
              <g key={`digital-${data[index].month}`}>
                <path
                  d={`M ${point.x} ${point.y} L ${point.x} ${HEIGHT - PAD.bottom}`}
                  stroke={COLOURS.digital}
                  strokeWidth="2"
                  fill="none"
                />
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="3"
                  fill={COLOURS.digital}
                />
              </g>
            ))}
            {points.map((point, index) => (
              <path
                key={`service-${data[index].month}`}
                d={`M ${point.x} ${point.serviceY} L ${point.x} ${HEIGHT - PAD.bottom}`}
                stroke={COLOURS.service}
                strokeWidth="2"
                fill="none"
              />
            ))}
          </>
        )}
      </ChartFrame>

      <Legend
        items={[
          { label: "Digital products", colour: COLOURS.digital },
          { label: "Services", colour: COLOURS.service },
        ]}
      />
    </>
  );
}

/** Orders received per month. */
export function OrdersChart({ data }: { data: OrderPoint[] }) {
  const [hovered, setHovered] = useState<Hover | null>(null);

  const max = niceMax(
    Math.max(
      1,
      ...data.map((point) => Math.max(point.digital, point.service)),
    ),
  );

  return (
    <>
      <ChartFrame data={data} max={max} hovered={hovered} onHover={setHovered}>
        {(points) => {
          const plotWidth = WIDTH - PAD.left - PAD.right;
          const step = plotWidth / Math.max(data.length - 1, 1);
          const barWidth = Math.max(4, Math.min(10, step / 3));

          return (
            <>
              {points.map((point, index) => {
                const bottom = HEIGHT - PAD.bottom;
                const digitalHeight = bottom - point.y;
                const serviceHeight = bottom - (point.serviceY ?? bottom);

                return (
                  <g key={data[index].month}>
                    <rect
                      x={point.x - barWidth - 1}
                      y={point.y}
                      width={barWidth}
                      height={Math.max(0, digitalHeight)}
                      rx="3"
                      fill={COLOURS.digital}
                    />
                    <rect
                      x={point.x + 1}
                      y={point.serviceY ?? bottom}
                      width={barWidth}
                      height={Math.max(0, serviceHeight)}
                      rx="3"
                      fill={COLOURS.service}
                    />
                  </g>
                );
              })}
            </>
          );
        }}
      </ChartFrame>

      <Legend
        items={[
          { label: "Digital orders", colour: COLOURS.digital },
          { label: "Service orders", colour: COLOURS.service },
        ]}
      />
    </>
  );
}
