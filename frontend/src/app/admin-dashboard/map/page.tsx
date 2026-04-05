'use client'

import { useEffect, useState } from 'react'
import DeckGL from '@deck.gl/react'
import { PolygonLayer } from '@deck.gl/layers'
import Map, { ViewState } from 'react-map-gl/maplibre'
import { cellToBoundary } from 'h3-js'

import {
  fetchLiveZones,
  HexZone,
} from '@/lib/admin/adminClient'

const INITIAL_VIEW_STATE: ViewState = {
  longitude: 77.5946, // Bangalore (you can change later)
  latitude: 12.9716,
  zoom: 10,
  pitch: 45,
  bearing: 0,
  padding: { top: 0, bottom: 0, left: 0, right: 0 },
}

export default function MapPage() {
  const [zones, setZones] = useState<HexZone[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadZones() {
      try {
        const data = await fetchLiveZones()
        setZones(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadZones()
  }, [])

  // Convert H3 → polygon
  const hexPolygons = zones.map((zone) => {
    const boundary = cellToBoundary(zone.h3_index, true)

    return {
      polygon: boundary.map(([lat, lng]) => [lng, lat]),
      dci: zone.dci_score,
      city: zone.city,
    }
  })

  const layer = new PolygonLayer({
    id: 'h3-layer',
    data: hexPolygons,
    pickable: true,
    stroked: true,
    filled: true,
    wireframe: false,

    getPolygon: (d: any) => d.polygon,

    getFillColor: (d: any) => {
      if (d.dci > 0.85) return [239, 68, 68] // red
      if (d.dci > 0.65) return [245, 158, 11] // amber
      return [34, 197, 94] // green
    },

    getLineColor: [255, 255, 255],
    lineWidthMinPixels: 1,
  })

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          H3 Hex Map
        </h1>
        <p className="text-muted-foreground mt-2">
          Real-time disruption visualization using H3 indexing.
        </p>
      </div>

      {/* MAP */}
      <div className="h-[600px] rounded-xl overflow-hidden border border-border">
        {loading ? (
          <div className="flex items-center justify-center h-full bg-card">
            <p className="text-muted-foreground">Loading map...</p>
          </div>
        ) : (
          <DeckGL
            initialViewState={INITIAL_VIEW_STATE}
            controller={true}
            layers={[layer]}
          >
            <Map
              mapStyle="https://demotiles.maplibre.org/style.json"
            />
          </DeckGL>
        )}
      </div>

      {/* LEGEND */}
      <div className="flex gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          Stable (&lt; 0.65)
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-amber-500 rounded"></div>
          Moderate (0.65 - 0.85)
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          High (&gt; 0.85)
        </div>
      </div>
    </div>
  )
}