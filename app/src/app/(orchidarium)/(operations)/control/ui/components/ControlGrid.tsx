'use client'

import { IoFlaskOutline, IoWaterOutline } from 'react-icons/io5'
import { MdDewPoint } from 'react-icons/md'
import { PiSprayBottle } from 'react-icons/pi'

import { GlowCard } from '@/components'

interface ControlGridProps {
  activeCircuits: Record<string, boolean>
  loadingCircuits: Record<string, boolean>
  isConnecting: boolean
  isOffline: boolean
  isSystemBusy: boolean
  onToggle: (circuit: 'irrigation' | 'humidification' | 'soilWet' | 'fertigation') => void
}

export function ControlGrid({
  activeCircuits,
  loadingCircuits,
  isConnecting,
  isOffline,
  isSystemBusy,
  onToggle,
}: ControlGridProps) {
  return (
    <div className="tds-sm:grid-cols-2 tds-lg:grid-cols-4 grid grid-cols-1 gap-4">
      {/* Riego por Aspersión */}
      <GlowCard
        active={activeCircuits.irrigation}
        color="blue"
        disabled={
          isConnecting ||
          isOffline ||
          (isSystemBusy && !activeCircuits.irrigation && !loadingCircuits['irrigation'])
        }
        icon={<IoWaterOutline />}
        label="Riego por Aspersión"
        pending={loadingCircuits['irrigation']}
        onClick={() => onToggle('irrigation')}
      />

      {/* Nebulización */}
      <GlowCard
        active={activeCircuits.humidification}
        color="cyan"
        disabled={
          isConnecting ||
          isOffline ||
          (isSystemBusy && !activeCircuits.humidification && !loadingCircuits['humidification'])
        }
        icon={<PiSprayBottle />}
        label="Nebulización"
        pending={loadingCircuits['humidification']}
        onClick={() => onToggle('humidification')}
      />

      {/* Humectación del Suelo */}
      <GlowCard
        active={activeCircuits.soilWet}
        color="purple"
        disabled={
          isConnecting ||
          isOffline ||
          (isSystemBusy && !activeCircuits.soilWet && !loadingCircuits['soilWet'])
        }
        icon={<MdDewPoint />}
        label="Humectación del Suelo"
        pending={loadingCircuits['soilWet']}
        onClick={() => onToggle('soilWet')}
      />

      {/* Fertirriego */}
      <GlowCard
        active={activeCircuits.fertigation}
        color="amber"
        disabled={
          isConnecting ||
          isOffline ||
          (isSystemBusy && !activeCircuits.fertigation && !loadingCircuits['fertigation'])
        }
        icon={<IoFlaskOutline />}
        label="Fertirriego"
        pending={loadingCircuits['fertigation']}
        onClick={() => onToggle('fertigation')}
      />
    </div>
  )
}
