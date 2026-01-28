import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sizeParam = Number(searchParams.get('size') || 32);
  const size = Number.isFinite(sizeParam)
    ? Math.max(16, Math.min(256, Math.round(sizeParam)))
    : 32;

  const radius = Math.round(size * 0.25);
  const iconSize = Math.round(size * 0.625);

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          backgroundColor: '#00e676',
          borderRadius: radius,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ color: '#ffffff' }}
        >
          <rect
            x="3"
            y="3"
            width="7"
            height="9"
            rx="1"
            stroke="currentColor"
            strokeWidth="2"
          />
          <rect
            x="14"
            y="3"
            width="7"
            height="5"
            rx="1"
            stroke="currentColor"
            strokeWidth="2"
          />
          <rect
            x="14"
            y="12"
            width="7"
            height="9"
            rx="1"
            stroke="currentColor"
            strokeWidth="2"
          />
          <rect
            x="3"
            y="16"
            width="7"
            height="5"
            rx="1"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      </div>
    ),
    {
      width: size,
      height: size,
    },
  );
}

