// JV-1: texts with a name inside ("{title} eliminada") where the name must stand out.
// Instead of wrapping it in «», it goes in its own <span> with a weight or a color.
// "{title} eliminada" + "Clase" → <><span class="font-semibold">Clase</span> eliminada</>
export function highlight(template: string, key: string, value: string, className = "font-semibold") {
  const [before, after] = template.split(`{${key}}`);

  return (
    <>
      {before}
      <span className={className}>{value}</span>
      {after}
    </>
  );
}
