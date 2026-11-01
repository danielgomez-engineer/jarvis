type CharCounterProps = {
  length: number;
  max: number;
};

// Shows "length/max" only once the text reaches 80% of the limit.
export default function CharCounter({ length, max }: CharCounterProps) {
  if (length < max * 0.8) {
    return null;
  }

  return (
    // JV-1: token instead of a palette color, and mono because it is a counter (ESTILOS rule 5)
    <span className="font-mono font-normal tabular-nums text-foreground-secondary">
      {length}/{max}
    </span>
  );
}
