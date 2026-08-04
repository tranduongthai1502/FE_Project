export type NavigationConfigItem<View extends string> = {
  icon: string
  label: string
  view?: View
  activeWhen?: View[]
}

export type NavigationItem = {
  icon: string
  label: string
  active: boolean
  onClick?: () => void
}

export function buildNavigation<View extends string>(
  items: Array<NavigationConfigItem<View>>,
  activeView: View,
  setActiveView: (view: View) => void,
): NavigationItem[] {
  return items.map((item) => ({
    icon: item.icon,
    label: item.label,
    active: item.activeWhen?.includes(activeView) ?? item.view === activeView,
    onClick: item.view ? () => setActiveView(item.view as View) : undefined,
  }))
}
