import { memo } from 'react'
import ViewSwitcher from '../shell/ViewSwitcher.jsx'
import LeftSidebar from '../features/sidebar/LeftSidebar.jsx'
import RightSidebar from '../features/sidebar/RightSidebar.jsx'
import MainVisualizationViewport from '../features/viewport/MainVisualizationViewport.jsx'

// MissionControl
// ├── TopStatusRail (in layout)
// ├── ViewSwitcher
// └── MissionWorkspace
//     ├── LeftSidebar (persistent, contextual)
//     ├── MainVisualizationViewport (ONE active view)
//     └── RightSidebar (persistent, contextual)
// └── EStopBar (in layout)
function MissionControlPage() {
  return (
    <main className="flex flex-col gap-2 min-h-0 h-[calc(100dvh-215px)] min-h-[560px]">
      <ViewSwitcher />
      <div className="grid gap-2 flex-1 min-h-0 grid-cols-1 overflow-y-auto lg:overflow-visible lg:grid-cols-[18%_1fr_18%] xl:grid-cols-[20%_1fr_20%]">
        <LeftSidebar />
        <MainVisualizationViewport />
        <RightSidebar />
      </div>
    </main>
  )
}

export default memo(MissionControlPage)
