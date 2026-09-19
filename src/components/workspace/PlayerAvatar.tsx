export function PlayerAvatar({
  color = "#f5ff36",
  style = "headband",
}: {
  color?: string;
  style?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 120"
      role="img"
      aria-label={`Padel mascot with ${style}`}
      className="pbw-avatar"
    >
      <circle
        cx="60"
        cy="60"
        r="56"
        fill={color}
        stroke="#111"
        strokeWidth="3"
      />
      <path
        d="M22 85 13 98M98 85l9 13"
        stroke="#111"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <ellipse
        cx="60"
        cy="64"
        rx="32"
        ry="35"
        fill="#fffdf3"
        stroke="#111"
        strokeWidth="3"
      />
      <path d="M36 45q24-13 48 0" fill="none" stroke={color} strokeWidth="8" />
      {style === "cap" && (
        <path
          d="M29 43q1-25 31-25t31 25H29l-10 5h77"
          fill={color}
          stroke="#111"
          strokeWidth="3"
        />
      )}
      {style === "headband" && (
        <path
          d="M29 43h62v10H29zM90 47l13 10M90 47l12-5"
          fill={color}
          stroke="#111"
          strokeWidth="3"
        />
      )}
      {style === "sunny" ? (
        <path
          d="M36 57h20v12H36zm28 0h20v12H64zM56 60h8"
          fill="#111"
          stroke="#111"
          strokeWidth="3"
        />
      ) : (
        <g fill="#111">
          <ellipse cx="46" cy="64" rx="4" ry="6" />
          <ellipse cx="74" cy="64" rx="4" ry="6" />
        </g>
      )}
      <path
        d="M49 79q11 12 22 0"
        fill="none"
        stroke="#111"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="36" cy="75" r="5" fill="#ff95c7" />
      <circle cx="84" cy="75" r="5" fill="#ff95c7" />
    </svg>
  );
}
