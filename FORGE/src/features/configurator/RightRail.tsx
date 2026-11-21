import { useState } from 'react'
import { CATEGORY_META } from '@/lib/catalog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useBuildStore } from '@/stores/useBuildStore'
import { AppearancePanel } from './AppearancePanel'
import { InspectorPanel } from './InspectorPanel'

/**
 * Right rail: component details and studio appearance in one panel.
 *
 * The status readout in the header follows whichever tab is open, so the rail
 * always says what it is showing.
 */
export function RightRail() {
  const [tab, setTab] = useState<'component' | 'studio'>('component')
  const selectedCategory = useBuildStore((state) => state.selectedCategory)

  const status =
    tab === 'studio'
      ? 'STUDIO'
      : selectedCategory
        ? CATEGORY_META[selectedCategory].singular.toUpperCase()
        : 'IDLE'

  return (
    <div className="flex h-full w-full flex-col overflow-hidden border-l border-border/70 panel">
      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as 'component' | 'studio')}
        className="flex h-full min-h-0 flex-col gap-0"
      >
        <div className="flex h-11 shrink-0 items-center gap-3 border-b border-border/60 px-3">
          <TabsList className="h-7 gap-0.5 bg-transparent p-0">
            <TabsTrigger
              value="component"
              className="px-2 text-[11px] data-[state=active]:bg-muted/60"
            >
              Component
            </TabsTrigger>
            <TabsTrigger
              value="studio"
              className="px-2 text-[11px] data-[state=active]:bg-muted/60"
            >
              Studio
            </TabsTrigger>
          </TabsList>
          <span className="numeric ml-auto text-[10px] text-muted-foreground/70">
            {status}
          </span>
        </div>

        <TabsContent
          value="component"
          className="m-0 min-h-0 flex-1 overflow-hidden"
        >
          <InspectorPanel />
        </TabsContent>
        <TabsContent value="studio" className="m-0 min-h-0 flex-1 overflow-hidden">
          <AppearancePanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
