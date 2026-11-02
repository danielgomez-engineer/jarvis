// JV-1: full class names written out so Tailwind can find them (it can't read `bg-area-${color}`)
const DOT_CLASSES: Record<number, string> = {
  1: "bg-area-1",
  2: "bg-area-2",
  3: "bg-area-3",
  4: "bg-area-4",
  5: "bg-area-5",
  6: "bg-area-6",
};

// The area's identity color. Always next to its name, never alone (ESTILOS §2.1).
export default function AreaDot({ color }: { color: number }) {
  return <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${DOT_CLASSES[color] ?? DOT_CLASSES[6]}`} />;
}
