/**
 * BackendStatus — indicator showing API connection state for RAPIT light theme.
 */
import { ShieldCheck, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useHealthCheck } from '../../hooks/useHealthCheck';

export function BackendStatus() {
  const { status, data, error, refetch } = useHealthCheck();

  const configs = {
    idle: {
      icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
      label: 'Connecting…',
      color: 'text-gray-500',
      dot: 'bg-gray-400',
    },
    loading: {
      icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
      label: 'Connecting…',
      color: 'text-gray-500',
      dot: 'bg-gray-400',
    },
    connected: {
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
      label: `API v${data?.version ?? '1.0'} — connected`,
      color: 'text-emerald-600',
      dot: 'bg-emerald-500',
    },
    error: {
      icon: <AlertCircle className="w-3.5 h-3.5" />,
      label: 'Backend unreachable',
      color: 'text-red-500',
      dot: 'bg-red-500',
    },
  } as const;

  const cfg = configs[status];

  return (
    <div className="flex items-center gap-2 text-xs font-mono bg-gray-50 border border-gray-200/80 px-2.5 py-1 rounded-full shadow-2xs">
      <span className={`flex items-center gap-1.5 ${cfg.color}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} shrink-0`} />
        {cfg.icon}
        <span className="font-medium text-[11px]">{cfg.label}</span>
      </span>
      {status === 'error' && (
        <button
          onClick={refetch}
          title="Retry connection"
          className="ml-1 p-0.5 rounded hover:text-gray-900 transition-colors text-gray-400 cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      )}
      {status === 'error' && error && (
        <span className="text-gray-400 truncate max-w-xs text-[10px]" title={error}>
          ({error})
        </span>
      )}
    </div>
  );
}
