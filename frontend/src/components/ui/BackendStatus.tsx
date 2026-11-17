/**
 * BackendStatus — connection state indicator for RAPIT AI Privacy Layer.
 */
import { ShieldCheck, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useHealthCheck } from '../../hooks/useHealthCheck';

export function BackendStatus() {
  const { status, data, error, refetch } = useHealthCheck();

  const configs = {
    idle: {
      icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
      label: 'Connecting...',
      color: 'text-[#9C9790]',
      dot: 'bg-[#D4CFC8]',
    },
    loading: {
      icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
      label: 'Connecting...',
      color: 'text-[#9C9790]',
      dot: 'bg-[#D4CFC8]',
    },
    connected: {
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
      label: `Local API v${data?.version ?? '1.0'} connected`,
      color: 'text-[#166534]',
      dot: 'bg-[#4CAF7D]',
    },
    error: {
      icon: <AlertCircle className="w-3.5 h-3.5" />,
      label: 'Backend unreachable',
      color: 'text-[#991B1B]',
      dot: 'bg-[#E05252]',
    },
  } as const;

  const cfg = configs[status];

  return (
    <div className="flex items-center gap-2 text-xs font-mono bg-[#FAF8F5] border border-[#EAE6DF] px-3 py-1 rounded-full shadow-2xs">
      <span className={`flex items-center gap-1.5 ${cfg.color}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} shrink-0`} />
        {cfg.icon}
        <span className="font-medium text-[11px]">{cfg.label}</span>
      </span>
      {status === 'error' && (
        <button
          onClick={refetch}
          title="Retry connection"
          className="ml-1 p-0.5 rounded hover:text-[#242424] transition-colors text-[#9C9790] cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      )}
      {status === 'error' && error && (
        <span className="text-[#9C9790] truncate max-w-xs text-[10px]" title={error}>
          ({error})
        </span>
      )}
    </div>
  );
}
