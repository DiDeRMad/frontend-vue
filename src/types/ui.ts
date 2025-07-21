// ==================== БАЗОВЫЕ UI ТИПЫ ====================

export interface UIElement {
  id: string
  type: UIElementType
  parent?: UIElement
  children: UIElement[]
  
  // Позиционирование и размеры
  position: UIPosition
  size: UISize
  anchor: UIAnchor
  pivot: UIPivot
  
  // Состояние
  visible: boolean
  enabled: boolean
  interactive: boolean
  
  // Стиль
  style: UIStyle
  
  // События
  events: UIEvents
  
  // Данные
  data?: any
}

export enum UIElementType {
  CONTAINER = 'container',
  PANEL = 'panel',
  WINDOW = 'window',
  BUTTON = 'button',
  TEXT = 'text',
  INPUT = 'input',
  IMAGE = 'image',
  PROGRESS_BAR = 'progress_bar',
  SLIDER = 'slider',
  DROPDOWN = 'dropdown',
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  LIST = 'list',
  GRID = 'grid',
  SCROLL_VIEW = 'scroll_view',
  TAB_CONTAINER = 'tab_container',
  MODAL = 'modal',
  TOOLTIP = 'tooltip',
  MINIMAP = 'minimap',
  HEALTHBAR = 'healthbar',
  INVENTORY_SLOT = 'inventory_slot',
  SKILL_BUTTON = 'skill_button',
  CHAT_BOX = 'chat_box'
}

export interface UIPosition {
  x: number
  y: number
  z?: number
  relative?: boolean
}

export interface UISize {
  width: number
  height: number
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  autoSize?: boolean
}

export interface UIAnchor {
  left: number    // 0-1
  top: number     // 0-1
  right: number   // 0-1
  bottom: number  // 0-1
}

export interface UIPivot {
  x: number // 0-1
  y: number // 0-1
}

export interface UIStyle {
  // Цвета
  backgroundColor?: Color
  borderColor?: Color
  textColor?: Color
  
  // Границы
  borderWidth?: number
  borderRadius?: number
  
  // Отступы
  margin?: UISpacing
  padding?: UISpacing
  
  // Шрифт
  font?: UIFont
  
  // Тени и эффекты
  shadow?: UIShadow
  glow?: UIGlow
  blur?: number
  opacity?: number
  
  // Анимации
  transition?: UITransition
  
  // Состояния
  hover?: Partial<UIStyle>
  active?: Partial<UIStyle>
  disabled?: Partial<UIStyle>
  
  // Дополнительные стили
  overflow?: UIOverflow
  zIndex?: number
}

export interface UISpacing {
  top: number
  right: number
  bottom: number
  left: number
}

export interface UIFont {
  family: string
  size: number
  weight: FontWeight
  style: FontStyle
  lineHeight?: number
  letterSpacing?: number
}

export enum FontWeight {
  NORMAL = 'normal',
  BOLD = 'bold',
  LIGHT = 'light',
  MEDIUM = 'medium',
  HEAVY = 'heavy'
}

export enum FontStyle {
  NORMAL = 'normal',
  ITALIC = 'italic',
  OBLIQUE = 'oblique'
}

export interface UIShadow {
  offsetX: number
  offsetY: number
  blur: number
  color: Color
}

export interface UIGlow {
  color: Color
  intensity: number
  size: number
}

export interface UITransition {
  property: string
  duration: number
  timing: UITimingFunction
  delay?: number
}

export enum UITimingFunction {
  LINEAR = 'linear',
  EASE = 'ease',
  EASE_IN = 'ease-in',
  EASE_OUT = 'ease-out',
  EASE_IN_OUT = 'ease-in-out'
}

export enum UIOverflow {
  VISIBLE = 'visible',
  HIDDEN = 'hidden',
  SCROLL = 'scroll',
  AUTO = 'auto'
}

export interface UIEvents {
  onClick?: (event: UIClickEvent) => void
  onDoubleClick?: (event: UIClickEvent) => void
  onMouseEnter?: (event: UIMouseEvent) => void
  onMouseLeave?: (event: UIMouseEvent) => void
  onMouseDown?: (event: UIMouseEvent) => void
  onMouseUp?: (event: UIMouseEvent) => void
  onMouseMove?: (event: UIMouseEvent) => void
  onFocus?: (event: UIFocusEvent) => void
  onBlur?: (event: UIFocusEvent) => void
  onChange?: (event: UIChangeEvent) => void
  onInput?: (event: UIInputEvent) => void
  onScroll?: (event: UIScrollEvent) => void
  onResize?: (event: UIResizeEvent) => void
  onDragStart?: (event: UIDragEvent) => void
  onDrag?: (event: UIDragEvent) => void
  onDragEnd?: (event: UIDragEvent) => void
  onDrop?: (event: UIDropEvent) => void
}

export interface UIEvent {
  type: string
  target: UIElement
  currentTarget: UIElement
  timestamp: number
  bubbles: boolean
  cancelable: boolean
  preventDefault(): void
  stopPropagation(): void
}

export interface UIClickEvent extends UIEvent {
  button: number
  clientX: number
  clientY: number
  shiftKey: boolean
  ctrlKey: boolean
  altKey: boolean
  metaKey: boolean
}

export interface UIMouseEvent extends UIEvent {
  clientX: number
  clientY: number
  deltaX: number
  deltaY: number
  shiftKey: boolean
  ctrlKey: boolean
  altKey: boolean
  metaKey: boolean
}

export interface UIFocusEvent extends UIEvent {
  relatedTarget?: UIElement
}

export interface UIChangeEvent extends UIEvent {
  value: any
  oldValue: any
}

export interface UIInputEvent extends UIEvent {
  value: string
  selectionStart: number
  selectionEnd: number
}

export interface UIScrollEvent extends UIEvent {
  scrollX: number
  scrollY: number
  deltaX: number
  deltaY: number
}

export interface UIResizeEvent extends UIEvent {
  newWidth: number
  newHeight: number
  oldWidth: number
  oldHeight: number
}

export interface UIDragEvent extends UIEvent {
  clientX: number
  clientY: number
  deltaX: number
  deltaY: number
  dataTransfer: UIDataTransfer
}

export interface UIDropEvent extends UIEvent {
  clientX: number
  clientY: number
  dataTransfer: UIDataTransfer
}

export interface UIDataTransfer {
  setData(format: string, data: string): void
  getData(format: string): string
  clearData(format?: string): void
  setDragImage(image: HTMLImageElement, x: number, y: number): void
}

// ==================== СПЕЦИАЛИЗИРОВАННЫЕ UI КОМПОНЕНТЫ ====================

export interface UIWindow extends UIElement {
  title: string
  closable: boolean
  minimizable: boolean
  maximizable: boolean
  resizable: boolean
  draggable: boolean
  modal: boolean
  
  // Состояние окна
  windowState: WindowState
  
  // Ограничения
  minSize?: UISize
  maxSize?: UISize
  
  // События окна
  onClose?: () => void
  onMinimize?: () => void
  onMaximize?: () => void
  onRestore?: () => void
}

export enum WindowState {
  NORMAL = 'normal',
  MINIMIZED = 'minimized',
  MAXIMIZED = 'maximized',
  FULLSCREEN = 'fullscreen'
}

export interface UIButton extends UIElement {
  text: string
  icon?: string
  disabled: boolean
  pressed: boolean
  toggle: boolean
  
  // Стили кнопки
  variant: ButtonVariant
  size: ButtonSize
}

export enum ButtonVariant {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  SUCCESS = 'success',
  WARNING = 'warning',
  DANGER = 'danger',
  INFO = 'info',
  LINK = 'link'
}

export enum ButtonSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large'
}

export interface UIText extends UIElement {
  text: string
  richText: boolean
  textAlign: TextAlign
  verticalAlign: VerticalAlign
  wordWrap: boolean
  autoSize: boolean
  selectable: boolean
}

export enum TextAlign {
  LEFT = 'left',
  CENTER = 'center',
  RIGHT = 'right',
  JUSTIFY = 'justify'
}

export enum VerticalAlign {
  TOP = 'top',
  MIDDLE = 'middle',
  BOTTOM = 'bottom'
}

export interface UIInput extends UIElement {
  value: string
  placeholder: string
  inputType: InputType
  disabled: boolean
  readonly: boolean
  maxLength?: number
  pattern?: string
  
  // Валидация
  validation?: UIValidation
  
  // Автозаполнение
  autocomplete: boolean
  suggestions?: string[]
}

export enum InputType {
  TEXT = 'text',
  PASSWORD = 'password',
  EMAIL = 'email',
  NUMBER = 'number',
  SEARCH = 'search',
  URL = 'url',
  TEL = 'tel'
}

export interface UIValidation {
  required: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  customValidator?: (value: string) => boolean | string
  errorMessage?: string
}

export interface UIImage extends UIElement {
  src: string
  alt: string
  preserveAspect: boolean
  fillMode: ImageFillMode
  
  // Состояния загрузки
  loading: boolean
  error: boolean
  
  // События изображения
  onLoad?: () => void
  onError?: () => void
}

export enum ImageFillMode {
  STRETCH = 'stretch',
  ASPECT_FIT = 'aspect_fit',
  ASPECT_FILL = 'aspect_fill',
  CENTER = 'center',
  TILE = 'tile'
}

export interface UIProgressBar extends UIElement {
  value: number      // 0-1
  animated: boolean
  showText: boolean
  text?: string
  variant: ProgressVariant
}

export enum ProgressVariant {
  STANDARD = 'standard',
  SUCCESS = 'success',
  WARNING = 'warning',
  DANGER = 'danger',
  INFO = 'info'
}

export interface UISlider extends UIElement {
  value: number
  min: number
  max: number
  step: number
  orientation: SliderOrientation
  showTicks: boolean
  showLabels: boolean
  
  // Стиль слайдера
  trackStyle?: UIStyle
  thumbStyle?: UIStyle
  fillStyle?: UIStyle
}

export enum SliderOrientation {
  HORIZONTAL = 'horizontal',
  VERTICAL = 'vertical'
}

export interface UIDropdown extends UIElement {
  options: DropdownOption[]
  selectedIndex: number
  selectedValue?: any
  placeholder: string
  searchable: boolean
  multiSelect: boolean
  
  // Состояние
  open: boolean
  
  // Настройки отображения
  maxDisplayItems: number
  itemHeight: number
}

export interface DropdownOption {
  value: any
  text: string
  icon?: string
  disabled?: boolean
  group?: string
}

export interface UICheckbox extends UIElement {
  checked: boolean
  indeterminate: boolean
  text: string
  disabled: boolean
}

export interface UIRadio extends UIElement {
  checked: boolean
  value: any
  name: string
  text: string
  disabled: boolean
}

export interface UIList extends UIElement {
  items: ListItem[]
  selectedIndices: number[]
  multiSelect: boolean
  
  // Виртуализация
  virtualized: boolean
  itemHeight: number
  
  // Прокрутка
  scrollable: boolean
  
  // Сортировка и фильтрация
  sortable: boolean
  filterable: boolean
  searchQuery?: string
}

export interface ListItem {
  id: string
  content: UIElement | string
  data?: any
  selected?: boolean
  disabled?: boolean
}

export interface UIGrid extends UIElement {
  columns: GridColumn[]
  rows: GridRow[]
  
  // Настройки сетки
  cellSpacing: number
  showHeaders: boolean
  showGrid: boolean
  
  // Выделение
  selectionMode: SelectionMode
  selectedCells: GridCell[]
  
  // Сортировка
  sortable: boolean
  sortColumn?: number
  sortDirection?: SortDirection
}

export interface GridColumn {
  id: string
  title: string
  width: number | string
  minWidth?: number
  maxWidth?: number
  resizable: boolean
  sortable: boolean
  align: TextAlign
  renderer?: (value: any, row: GridRow) => UIElement | string
}

export interface GridRow {
  id: string
  cells: GridCell[]
  data?: any
  selected?: boolean
  height?: number
}

export interface GridCell {
  column: string
  value: any
  content?: UIElement | string
  style?: UIStyle
  editable?: boolean
}

export enum SelectionMode {
  NONE = 'none',
  SINGLE = 'single',
  MULTIPLE = 'multiple',
  RANGE = 'range'
}

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc'
}

export interface UIScrollView extends UIElement {
  content: UIElement
  
  // Настройки прокрутки
  scrollX: boolean
  scrollY: boolean
  wheelStep: number
  
  // Полосы прокрутки
  showScrollbars: boolean
  scrollbarStyle?: UIStyle
  
  // Текущая позиция
  scrollPosition: UIPosition
  
  // Ограничения
  contentSize: UISize
}

export interface UITabContainer extends UIElement {
  tabs: Tab[]
  activeTab: number
  tabPosition: TabPosition
  
  // Настройки вкладок
  closableTabs: boolean
  reorderableTabs: boolean
  scrollableTabs: boolean
  
  // События вкладок
  onTabChange?: (index: number, tab: Tab) => void
  onTabClose?: (index: number, tab: Tab) => void
}

export interface Tab {
  id: string
  title: string
  icon?: string
  content: UIElement
  closable?: boolean
  disabled?: boolean
  badge?: string
}

export enum TabPosition {
  TOP = 'top',
  BOTTOM = 'bottom',
  LEFT = 'left',
  RIGHT = 'right'
}

// ==================== ИГРОВЫЕ UI КОМПОНЕНТЫ ====================

export interface UIInventorySlot extends UIElement {
  item?: Item
  quantity: number
  locked: boolean
  highlighted: boolean
  
  // Drag & Drop
  draggable: boolean
  droppable: boolean
  
  // События слота
  onItemDrop?: (item: Item, quantity: number) => void
  onItemDrag?: (item: Item) => void
  onItemClick?: (item: Item, button: number) => void
  onItemHover?: (item: Item) => void
}

export interface UISkillButton extends UIElement {
  skill: Skill
  cooldownRemaining: number
  manaCost: number
  
  // Состояние
  usable: boolean
  onCooldown: boolean
  
  // Hotkey
  hotkey?: string
  
  // События
  onSkillUse?: (skill: Skill) => void
  onSkillHover?: (skill: Skill) => void
}

export interface UIHealthBar extends UIElement {
  currentHealth: number
  maxHealth: number
  animationSpeed: number
  
  // Визуализация
  showText: boolean
  showPercentage: boolean
  colorGradient: HealthBarGradient
  
  // Анимации
  smoothTransition: boolean
  pulseOnDamage: boolean
}

export interface HealthBarGradient {
  full: Color
  half: Color
  low: Color
  critical: Color
}

export interface UIMinimap extends UIElement {
  worldBounds: Bounds
  playerPosition: Vector3
  zoom: number
  
  // Отображаемые элементы
  showPlayers: boolean
  showNPCs: boolean
  showMonsters: boolean
  showItems: boolean
  showWaypoints: boolean
  
  // Цвета элементов
  playerColor: Color
  npcColor: Color
  monsterColor: Color
  itemColor: Color
  waypointColor: Color
  
  // События
  onMapClick?: (worldPosition: Vector3) => void
}

export interface UIChatBox extends UIElement {
  messages: ChatMessage[]
  maxMessages: number
  
  // Фильтры каналов
  visibleChannels: ChatChannel[]
  
  // Настройки отображения
  showTimestamps: boolean
  showPlayerNames: boolean
  fadeOldMessages: boolean
  
  // Input
  inputElement: UIInput
  
  // События
  onMessageSend?: (message: string, channel: ChatChannel) => void
  onChannelToggle?: (channel: ChatChannel, visible: boolean) => void
}

export interface UIQuestTracker extends UIElement {
  activeQuests: Quest[]
  maxDisplayQuests: number
  
  // Настройки отображения
  showObjectives: boolean
  showProgress: boolean
  showDistance: boolean
  
  // События
  onQuestClick?: (quest: Quest) => void
  onObjectiveClick?: (objective: QuestObjective) => void
}

export interface UIActionBar extends UIElement {
  slots: ActionBarSlot[]
  hotkeys: boolean
  
  // Настройки
  orientation: SliderOrientation
  slotSize: number
  spacing: number
  
  // События
  onSlotClick?: (slot: ActionBarSlot, button: number) => void
  onSlotDrop?: (slot: number, item: Item | Skill) => void
}

export interface ActionBarSlot {
  id: string
  type: ActionBarSlotType
  content?: Item | Skill
  hotkey?: string
  cooldownRemaining?: number
  quantity?: number
}

export enum ActionBarSlotType {
  EMPTY = 'empty',
  SKILL = 'skill',
  ITEM = 'item',
  MACRO = 'macro'
}

export interface UIBuffBar extends UIElement {
  buffs: StatusEffect[]
  debuffs: StatusEffect[]
  
  // Настройки отображения
  showDuration: boolean
  showStacks: boolean
  separateBuffsDebuffs: boolean
  
  // Размеры
  iconSize: number
  maxIcons: number
  
  // События
  onBuffClick?: (effect: StatusEffect) => void
  onBuffHover?: (effect: StatusEffect) => void
}

export interface UITargetFrame extends UIElement {
  target?: CombatParticipant
  
  // Отображаемая информация
  showHealth: boolean
  showMana: boolean
  showLevel: boolean
  showBuffs: boolean
  
  // События
  onTargetChange?: (target: CombatParticipant | null) => void
}

export interface UIPartyFrame extends UIElement {
  partyMembers: PartyMember[]
  
  // Настройки
  showPets: boolean
  showBuffs: boolean
  vertical: boolean
  
  // События
  onMemberClick?: (member: PartyMember) => void
  onMemberRightClick?: (member: PartyMember) => void
}

export interface PartyMember {
  id: string
  name: string
  level: number
  class: CharacterClass
  health: number
  maxHealth: number
  mana: number
  maxMana: number
  online: boolean
  inRange: boolean
  buffs: StatusEffect[]
  debuffs: StatusEffect[]
}

// ==================== МОДАЛЬНЫЕ ОКНА И ДИАЛОГИ ====================

export interface UIModal extends UIElement {
  backdrop: boolean
  closeOnBackdrop: boolean
  closeOnEscape: boolean
  
  // Анимация
  fadeIn: boolean
  slideIn: boolean
  
  // События
  onOpen?: () => void
  onClose?: () => void
}

export interface UIDialog extends UIModal {
  title: string
  content: string | UIElement
  buttons: DialogButton[]
  
  // Тип диалога
  type: DialogType
  icon?: string
}

export enum DialogType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  QUESTION = 'question',
  CUSTOM = 'custom'
}

export interface DialogButton {
  text: string
  variant: ButtonVariant
  action: () => void
  default?: boolean
  cancel?: boolean
}

export interface UITooltip extends UIElement {
  content: string | UIElement
  target: UIElement
  
  // Позиционирование
  placement: TooltipPlacement
  offset: number
  followMouse: boolean
  
  // Поведение
  delay: number
  duration?: number
  
  // Стрелка
  showArrow: boolean
  arrowSize: number
}

export enum TooltipPlacement {
  TOP = 'top',
  BOTTOM = 'bottom',
  LEFT = 'left',
  RIGHT = 'right',
  TOP_LEFT = 'top-left',
  TOP_RIGHT = 'top-right',
  BOTTOM_LEFT = 'bottom-left',
  BOTTOM_RIGHT = 'bottom-right'
}

export interface UIContextMenu extends UIElement {
  items: ContextMenuItem[]
  target: UIElement
  
  // Позиционирование
  triggerPosition: UIPosition
  
  // События
  onItemSelect?: (item: ContextMenuItem) => void
}

export interface ContextMenuItem {
  id: string
  text: string
  icon?: string
  shortcut?: string
  disabled?: boolean
  separator?: boolean
  submenu?: ContextMenuItem[]
  action?: () => void
}

// ==================== АНИМАЦИИ И ПЕРЕХОДЫ ====================

export interface UIAnimation {
  id: string
  target: UIElement
  properties: AnimationProperty[]
  duration: number
  timing: UITimingFunction
  delay: number
  iterations: number
  direction: AnimationDirection
  fillMode: AnimationFillMode
  
  // Состояние
  playing: boolean
  paused: boolean
  finished: boolean
  
  // События
  onStart?: () => void
  onUpdate?: (progress: number) => void
  onComplete?: () => void
}

export interface AnimationProperty {
  name: string
  from: any
  to: any
  unit?: string
}

export enum AnimationDirection {
  NORMAL = 'normal',
  REVERSE = 'reverse',
  ALTERNATE = 'alternate',
  ALTERNATE_REVERSE = 'alternate-reverse'
}

export enum AnimationFillMode {
  NONE = 'none',
  FORWARDS = 'forwards',
  BACKWARDS = 'backwards',
  BOTH = 'both'
}

// ==================== МАКЕТЫ И МЕНЕДЖЕРЫ КОМПОНОВКИ ====================

export interface UILayout {
  type: LayoutType
  container: UIElement
  
  // Параметры макета
  spacing: number
  padding: UISpacing
  alignment: LayoutAlignment
  
  // Методы
  updateLayout(): void
  addElement(element: UIElement, constraints?: LayoutConstraints): void
  removeElement(element: UIElement): void
}

export enum LayoutType {
  ABSOLUTE = 'absolute',
  HORIZONTAL = 'horizontal',
  VERTICAL = 'vertical',
  GRID = 'grid',
  FLEX = 'flex',
  DOCK = 'dock'
}

export enum LayoutAlignment {
  START = 'start',
  CENTER = 'center',
  END = 'end',
  STRETCH = 'stretch'
}

export interface LayoutConstraints {
  // Flexbox
  flex?: number
  alignSelf?: LayoutAlignment
  
  // Grid
  gridColumn?: number
  gridRow?: number
  gridColumnSpan?: number
  gridRowSpan?: number
  
  // Dock
  dock?: DockDirection
  
  // Общие
  margin?: UISpacing
  weight?: number
}

export enum DockDirection {
  LEFT = 'left',
  RIGHT = 'right',
  TOP = 'top',
  BOTTOM = 'bottom',
  FILL = 'fill'
}

// ==================== ТЕМЫ И СТИЛИ ====================

export interface UITheme {
  id: string
  name: string
  
  // Цветовая палитра
  colors: ThemeColors
  
  // Шрифты
  fonts: ThemeFonts
  
  // Размеры
  sizes: ThemeSizes
  
  // Стили компонентов
  components: { [componentType: string]: UIStyle }
  
  // Анимации
  animations: ThemeAnimations
}

export interface ThemeColors {
  // Основные цвета
  primary: Color
  secondary: Color
  success: Color
  warning: Color
  danger: Color
  info: Color
  
  // Нейтральные цвета
  background: Color
  surface: Color
  text: Color
  textSecondary: Color
  border: Color
  
  // Игровые цвета
  health: Color
  mana: Color
  experience: Color
  gold: Color
  
  // Редкость предметов
  itemCommon: Color
  itemUncommon: Color
  itemRare: Color
  itemEpic: Color
  itemLegendary: Color
  itemMythic: Color
  itemArtifact: Color
}

export interface ThemeFonts {
  primary: UIFont
  secondary: UIFont
  monospace: UIFont
  heading: UIFont
  caption: UIFont
}

export interface ThemeSizes {
  // Отступы
  spacingXS: number
  spacingS: number
  spacingM: number
  spacingL: number
  spacingXL: number
  
  // Радиусы скругления
  radiusS: number
  radiusM: number
  radiusL: number
  
  // Размеры элементов
  buttonHeight: number
  inputHeight: number
  iconSize: number
}

export interface ThemeAnimations {
  // Длительности
  durationFast: number
  durationNormal: number
  durationSlow: number
  
  // Функции времени
  easeIn: string
  easeOut: string
  easeInOut: string
}

// ==================== МЕНЕДЖЕР UI ====================

export interface UIManager {
  root: UIElement
  activeTheme: UITheme
  
  // Стеки элементов
  modalStack: UIModal[]
  tooltipStack: UITooltip[]
  contextMenuStack: UIContextMenu[]
  
  // События
  onElementCreate?: (element: UIElement) => void
  onElementDestroy?: (element: UIElement) => void
  onThemeChange?: (theme: UITheme) => void
  
  // Методы
  createElement(type: UIElementType, properties?: Partial<UIElement>): UIElement
  destroyElement(element: UIElement): void
  findElement(id: string): UIElement | null
  showModal(modal: UIModal): void
  hideModal(modal: UIModal): void
  showTooltip(tooltip: UITooltip): void
  hideTooltip(tooltip: UITooltip): void
  setTheme(theme: UITheme): void
  update(deltaTime: number): void
  render(): void
}

// ==================== DRAG & DROP ====================

export interface UIDragDropManager {
  draggedElement?: UIElement
  dragData?: UIDragData
  dropZones: UIDropZone[]
  
  // Методы
  startDrag(element: UIElement, data: UIDragData): void
  endDrag(): void
  registerDropZone(zone: UIDropZone): void
  unregisterDropZone(zone: UIDropZone): void
}

export interface UIDragData {
  type: string
  data: any
  source: UIElement
  preview?: UIElement
}

export interface UIDropZone {
  element: UIElement
  acceptedTypes: string[]
  onDragEnter?: (data: UIDragData) => void
  onDragLeave?: (data: UIDragData) => void
  onDragOver?: (data: UIDragData) => boolean
  onDrop?: (data: UIDragData) => boolean
}

// ==================== ВИРТУАЛИЗАЦИЯ ====================

export interface UIVirtualList extends UIList {
  // Параметры виртуализации
  itemHeight: number
  visibleRange: VirtualRange
  bufferSize: number
  
  // Рендеринг
  itemRenderer: (index: number, item: ListItem) => UIElement
  
  // Оптимизации
  recycleElements: boolean
  elementPool: UIElement[]
}

export interface VirtualRange {
  start: number
  end: number
}

// ==================== ДОСТУПНОСТЬ ====================

export interface UIAccessibility {
  // ARIA атрибуты
  role?: string
  label?: string
  labelledBy?: string
  describedBy?: string
  
  // Состояния
  disabled?: boolean
  expanded?: boolean
  selected?: boolean
  checked?: boolean
  
  // Навигация
  tabIndex?: number
  focusable?: boolean
  
  // Клавиатурная навигация
  onKeyDown?: (event: KeyboardEvent) => void
  onKeyUp?: (event: KeyboardEvent) => void
}

// ==================== ЭКСПОРТЫ ====================

export * from './index'

export interface Color {
  r: number
  g: number
  b: number
  a: number
}