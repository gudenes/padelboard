import Link from "next/link";
export function WorkspaceBrand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="pbw-logo" aria-label="Padelboard home">
      padelboard
      <span className="pbw-logo-score">
        <sup>6</sup>/<sub>4</sub>
      </span>
    </Link>
  );
}
