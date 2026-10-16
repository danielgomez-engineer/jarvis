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
    <span className="font-normal text-gray-500">
      {length}/{max}
    </span>
  );
}
