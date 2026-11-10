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

      {/* Toolbar: week on the left, "Nueva tarea" on the right. On a phone both are 44px tall
          and don't fit in one line, so the button wraps below, like the real one */}
      <div aria-hidden="true" className="flex flex-wrap items-center justify-between gap-3">
        <div className="h-11 w-52 rounded-control bg-surface-sunken sm:h-8 sm:w-48" />
        <div className="h-11 w-32 rounded-control bg-surface-sunken sm:h-8 sm:w-36" />
      </div>

      {/* Area selector: same height as the real chips (text + padding + underline; 44px on a phone), so nothing jumps */}
      <div aria-hidden="true" className="flex h-11 items-center gap-4 sm:h-[38px]">
        {[16, 20, 16, 20].map((width, index) => (
          <div key={index} style={{ width: `${width * 4}px` }} className="h-5 rounded-card bg-surface-sunken" />
        ))}
      </div>

      {/* JV-1 (U2.4.4): the server can't know the screen width, so the skeleton picks its shape with CSS:
          day strip + area sections on a phone, the grid from 640px */}
      <div aria-hidden="true" className="space-y-3 sm:hidden">
        <div className="grid grid-cols-8 gap-1">
          {Array.from({ length: COLUMNS }, (_, slot) => (
            <div key={slot} className="h-12 rounded-control bg-surface-sunken" />
          ))}
        </div>
        {Array.from({ length: LANES }, (_, lane) => (
          <div key={lane} className="space-y-1">
            <div className="flex h-11 items-center px-1">
              <div className="h-5 w-28 rounded-card bg-surface-sunken" />
            </div>
            <div className="h-20 rounded-panel bg-surface-sunken" />
          </div>
        ))}
      </div>

      <div aria-hidden="true" className="hidden overflow-hidden pb-2 sm:block">
        <div className="grid min-w-[72rem] grid-cols-[10rem_minmax(0,1.4fr)_repeat(7,minmax(0,1fr))] gap-1.5">
          {/* Header row ("SIN FECHA", "LUN 2"…): same 22px as the real one */}
          <div />
          {Array.from({ length: COLUMNS }, (_, column) => (
            <div key={column} className="flex h-[22px] items-start px-1.5">
              <div className="h-3 w-14 rounded-card bg-surface-sunken" />
            </div>
          ))}

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
