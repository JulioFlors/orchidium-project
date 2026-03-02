import { ReactNode } from 'react'
import { clsx } from 'clsx'

interface DeviceHeaderProps {
  deviceName?: string
  connectionState?: 'online' | 'offline' | 'unknown' | 'zombie'
  isLoadingStatus?: boolean
  selector?: ReactNode
}

export function DeviceHeader({
  deviceName,
  connectionState = 'unknown',
  isLoadingStatus = false,
  selector,
}: DeviceHeaderProps) {
  return (
    <div className="border-input-outline flex w-full flex-col gap-4 border-b pt-2 pb-5 select-none sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-4">
        {selector ? (
          selector
        ) : (
          <h2 className="text-primary text-xl font-bold tracking-tight">{deviceName}</h2>
        )}

        <div
          className={clsx(
            'flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold tracking-wider uppercase transition-colors',
            isLoadingStatus
              ? 'border-zinc-500/30 bg-zinc-500/10 text-zinc-400'
              : connectionState === 'online'
                ? 'border-green-500/30 bg-green-500/10 text-green-400'
                : connectionState === 'zombie'
                  ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
                  : 'border-red-500/30 bg-red-500/10 text-red-500',
          )}
        >
          <div
            className={clsx(
              'h-2 w-2 rounded-full',
              isLoadingStatus
                ? 'animate-pulse bg-zinc-500'
                : connectionState === 'online'
                  ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'
                  : connectionState === 'zombie'
                    ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]'
                    : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]',
            )}
          />
          <span>
            {isLoadingStatus
              ? 'Conectando'
              : connectionState === 'online'
                ? 'Online'
                : connectionState === 'zombie'
                  ? 'Inestable'
                  : 'Offline'}
          </span>
        </div>
      </div>
    </div>
  )
}
