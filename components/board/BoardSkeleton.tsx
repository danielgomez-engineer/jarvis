import { es } from "@/lib/i18n/es";

const LANES = 3;
const COLUMNS = 8; // "Sin fecha" + 7 days

//=====JV-1 (U2.4.3): LOADING = GRAY BLOCKS WITH THE BOARD'S SHAPE (spec 5)=====
// Still blocks, no pulse: ESTILOS §2.6 forbids looping animations. Same grid as BoardGrid,
// so nothing jumps when the real board arrives.
export default function BoardSkeleton() {
  return (
    <div role="status" aria-busy="true" className="space-y-4">
      <span className="sr-only">{es.dashboard.board.loading}</span>

      {/* Toolbar: week on the left, "Nueva tarea" on the right */}
      <div aria-hidden="true" className="flex items-center justify-between">
        <div className="h-8 w-48 rounded-control bg-surface-sunken" />
        <div className="h-8 w-36 rounded-control bg-surface-sunken" />
      </div>

      {/* Area selector */}
      <div aria-hidden="true" className="flex gap-4">
        {[16, 20, 16, 20].map((width, index) => (
          <div key={index} style={{ width: `${width * 4}px` }} className="h-6 rounded-card bg-surface-sunken" />
        ))}
      </div>

      <div aria-hidden="true" className="overflow-hidden pb-2">
        <div className="grid min-w-[72rem] grid-cols-[10rem_repeat(8,minmax(0,1fr))] gap-1.5">
          {Array.from({ length: LANES }, (_, lane) => (
            <div key={lane} className="contents">
              <div className="py-1.5 pr-2">
                <div className="h-5 w-24 rounded-card bg-surface-sunken" />
              </div>
              {Array.from({ length: COLUMNS }, (_, column) => (
                <div key={column} className="h-24 rounded-panel bg-surface-sunken" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
