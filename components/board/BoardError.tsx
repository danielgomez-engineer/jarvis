import { es } from "@/lib/i18n/es";
import { translateError } from "@/lib/i18n/traslate";
import { ErrorCode } from "@/lib/errors/codes";

type BoardErrorProps = {
  code: ErrorCode | undefined;
  onRetry: () => void;
};

//=====JV-1 (U2.4.3): LOAD ERROR = WHAT HAPPENED + HOW TO GO ON (spec 5)=====
export default function BoardError({ code, onRetry }: BoardErrorProps) {
  return (
    <div role="alert" className="max-w-md space-y-3 rounded-panel border border-line bg-surface p-4">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{es.dashboard.board.loadError}</p>
        {/* The reason, e.g. "Error de conexión" or "Algo falló en el servidor…" */}
        <p className="text-sm text-foreground-secondary">{translateError(code)}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-control border border-line bg-surface px-3 py-1.5 text-sm font-medium text-foreground transition-colors duration-150 hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {es.dashboard.board.retry}
      </button>
    </div>
  );
}
