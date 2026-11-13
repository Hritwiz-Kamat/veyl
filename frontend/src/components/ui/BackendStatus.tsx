/**
 * BackendStatus — small indicator showing API connection state.
 * Displayed in the top-right of the shell during development.
 * Will be removed or moved into a proper status bar in a later milestone.
 */
import { ShieldCheck, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useHealthCheck } from '../../hooks/useHealthCheck';

export function BackendStatus() {
  const { status, data, error, refetch } = useHealthCheck();

  const configs = {
    idle: {
      icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
      label: 'Connecting…',
      color: 'text-zinc-400',
      dot: 'bg-zinc-500',
    },
    loading: {
      icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
      label: 'Connecting…',
      color: 'text-zinc-400',
      dot: 'bg-zinc-500',
    },
    connected: {
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
      label: `API v${data?.version ?? '?'} — connected`,
      color: 'text-emerald-400',
      dot: 'bg-emerald-400',
    },
    error: {
      icon: <AlertCircle className="w-3.5 h-3.5" />,
      label: 'Backend unreachable',
      color: 'text-red-400',
      dot: 'bg-red-400',
    },
  } as const;

  const cfg = configs[status];

  return (
    <div className="flex items-center gap-2 text-xs font-mono">
      <span className={`flex items-center gap-1.5 ${cfg.color}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} shrink-0`} />
        {cfg.icon}
        {cfg.label}
      </span>
      {status === 'error' && (
        <button
          onClick={refetch}
          title="Retry connection"
          className="ml-1 p-0.5 rounded hover:text-white transition-colors text-zinc-500"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      )}
      {status === 'error' && error && (
        <span className="text-zinc-600 truncate max-w-xs" title={error}>
          ({error})
        </span>
      )}
    </div>
  );
}

