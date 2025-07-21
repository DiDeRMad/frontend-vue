// ==================== ИГРОВОЙ ДВИЖОК ====================

export interface GameEngine {
  renderer: GameRenderer
  physics: PhysicsEngine
  audio: AudioEngine
  input: InputManager
  networking: NetworkManager
  
  // Состояние
  isRunning: boolean
  isPaused: boolean
  deltaTime: number
  totalTime: number
  
  // Методы
  initialize(): Promise<void>
  start(): void
  pause(): void
  resume(): void
  stop(): void
  update(deltaTime: number): void
  render(): void
}

export interface GameRenderer {
  canvas: HTMLCanvasElement
  context: CanvasRenderingContext2D | WebGLRenderingContext
  width: number
  height: number
  
  // Камера
  camera: Camera
  
  // Слои рендеринга
  layers: RenderLayer[]
  
  // Методы
  clear(): void
  drawSprite(sprite: Sprite, position: Vector3, rotation?: number, scale?: Vector3): void
  drawText(text: string, position: Vector3, style: TextStyle): void
  drawShape(shape: Shape, position: Vector3, style: ShapeStyle): void
  setViewport(x: number, y: number, width: number, height: number): void
}

export interface Camera {
  position: Vector3
  target: Vector3
  zoom: number
  rotation: number
  bounds?: Bounds
  
  // Методы
  follow(target: Vector3, smoothing?: number): void
  shake(intensity: number, duration: number): void
  worldToScreen(worldPos: Vector3): Vector2
  screenToWorld(screenPos: Vector2): Vector3
}

export interface RenderLayer {
  id: string
  zIndex: number
  visible: boolean
  opacity: number
  objects: RenderObject[]
}

export interface RenderObject {
  id: string
  type: RenderObjectType
  position: Vector3
  rotation: number
  scale: Vector3
  sprite?: Sprite
  animation?: Animation
  visible: boolean
  data?: any
}

export enum RenderObjectType {
  SPRITE = 'sprite',
  ANIMATED_SPRITE = 'animated_sprite',
  PARTICLE_SYSTEM = 'particle_system',
  TILEMAP = 'tilemap',
  UI_ELEMENT = 'ui_element',
  TEXT = 'text',
  SHAPE = 'shape'
}

export interface Sprite {
  texture: Texture
  sourceRect: Rectangle
  anchor: Vector2
  tint: Color
}

export interface Texture {
  id: string
  image: HTMLImageElement
  width: number
  height: number
  loaded: boolean
}

export interface Animation {
  id: string
  frames: AnimationFrame[]
  currentFrame: number
  speed: number
  loop: boolean
  playing: boolean
  finished: boolean
}

export interface AnimationFrame {
  texture: Texture
  sourceRect: Rectangle
  duration: number
}

export interface Vector2 {
  x: number
  y: number
}

export interface Rectangle {
  x: number
  y: number
  width: number
  height: number
}

export interface Color {
  r: number
  g: number
  b: number
  a: number
}

export interface Bounds {
  min: Vector3
  max: Vector3
}

export interface TextStyle {
  font: string
  size: number
  color: Color
  align: TextAlign
  baseline: TextBaseline
  stroke?: {
    color: Color
    width: number
  }
  shadow?: {
    color: Color
    offset: Vector2
    blur: number
  }
}

export enum TextAlign {
  LEFT = 'left',
  CENTER = 'center',
  RIGHT = 'right'
}

export enum TextBaseline {
  TOP = 'top',
  MIDDLE = 'middle',
  BOTTOM = 'bottom'
}

export interface Shape {
  type: ShapeType
  vertices: Vector2[]
  radius?: number
}

export enum ShapeType {
  CIRCLE = 'circle',
  RECTANGLE = 'rectangle',
  POLYGON = 'polygon',
  LINE = 'line'
}

export interface ShapeStyle {
  fill?: Color
  stroke?: {
    color: Color
    width: number
  }
}

// ==================== ФИЗИЧЕСКИЙ ДВИЖОК ====================

export interface PhysicsEngine {
  world: PhysicsWorld
  
  // Методы
  update(deltaTime: number): void
  addBody(body: PhysicsBody): void
  removeBody(body: PhysicsBody): void
  raycast(start: Vector3, end: Vector3, filter?: CollisionFilter): RaycastResult[]
}

export interface PhysicsWorld {
  gravity: Vector3
  bodies: PhysicsBody[]
  constraints: PhysicsConstraint[]
  
  // Настройки
  iterations: number
  damping: number
  restitution: number
}

export interface PhysicsBody {
  id: string
  type: BodyType
  position: Vector3
  velocity: Vector3
  acceleration: Vector3
  rotation: number
  angularVelocity: number
  
  // Физические свойства
  mass: number
  density: number
  friction: number
  restitution: number
  
  // Форма столкновения
  shape: CollisionShape
  
  // Состояние
  isStatic: boolean
  isKinematic: boolean
  isSleeping: boolean
  
  // Фильтры
  layer: number
  mask: number
  
  // Пользовательские данные
  userData?: any
}

export enum BodyType {
  STATIC = 'static',
  KINEMATIC = 'kinematic',
  DYNAMIC = 'dynamic'
}

export interface CollisionShape {
  type: CollisionShapeType
  bounds: Bounds
  
  // Для разных типов форм
  radius?: number
  width?: number
  height?: number
  vertices?: Vector3[]
}

export enum CollisionShapeType {
  CIRCLE = 'circle',
  BOX = 'box',
  POLYGON = 'polygon',
  MESH = 'mesh'
}

export interface PhysicsConstraint {
  id: string
  type: ConstraintType
  bodyA: PhysicsBody
  bodyB: PhysicsBody
  anchorA: Vector3
  anchorB: Vector3
  
  // Параметры
  stiffness: number
  damping: number
  length?: number
  angle?: number
}

export enum ConstraintType {
  DISTANCE = 'distance',
  REVOLUTE = 'revolute',
  PRISMATIC = 'prismatic',
  WELD = 'weld'
}

export interface CollisionFilter {
  layer?: number
  mask?: number
  excludeBodies?: string[]
}

export interface RaycastResult {
  body: PhysicsBody
  point: Vector3
  normal: Vector3
  distance: number
}

// ==================== ЗВУКОВОЙ ДВИЖОК ====================

export interface AudioEngine {
  masterVolume: number
  musicVolume: number
  effectsVolume: number
  voiceVolume: number
  muted: boolean
  
  // Источники звука
  sources: AudioSource[]
  
  // Методы
  loadSound(id: string, url: string): Promise<AudioBuffer>
  playSound(id: string, options?: PlaySoundOptions): AudioSource
  stopSound(id: string): void
  pauseSound(id: string): void
  resumeSound(id: string): void
  setVolume(volume: number): void
  mute(): void
  unmute(): void
}

export interface AudioSource {
  id: string
  buffer: AudioBuffer
  node: AudioBufferSourceNode
  gainNode: GainNode
  
  // Состояние
  playing: boolean
  paused: boolean
  loop: boolean
  volume: number
  
  // 3D позиционирование
  position?: Vector3
  velocity?: Vector3
  
  // Методы
  play(): void
  stop(): void
  pause(): void
  resume(): void
  setVolume(volume: number): void
  setPosition(position: Vector3): void
}

export interface PlaySoundOptions {
  volume?: number
  loop?: boolean
  delay?: number
  position?: Vector3
  fadeIn?: number
  fadeOut?: number
}

// ==================== УПРАВЛЕНИЕ ВВОДОМ ====================

export interface InputManager {
  // Состояние клавиш
  keys: { [key: string]: KeyState }
  
  // Состояние мыши
  mouse: MouseState
  
  // Состояние геймпада
  gamepad: GamepadState
  
  // События
  onKeyDown: EventEmitter<KeyEvent>
  onKeyUp: EventEmitter<KeyEvent>
  onMouseDown: EventEmitter<MouseEvent>
  onMouseUp: EventEmitter<MouseEvent>
  onMouseMove: EventEmitter<MouseEvent>
  onMouseWheel: EventEmitter<WheelEvent>
  onGamepadConnect: EventEmitter<GamepadEvent>
  onGamepadDisconnect: EventEmitter<GamepadEvent>
  
  // Методы
  isKeyPressed(key: string): boolean
  isKeyHeld(key: string): boolean
  isKeyReleased(key: string): boolean
  isMouseButtonPressed(button: MouseButton): boolean
  getMousePosition(): Vector2
  getMouseDelta(): Vector2
  isGamepadConnected(index: number): boolean
  getGamepadAxis(index: number, axis: GamepadAxis): number
  isGamepadButtonPressed(index: number, button: GamepadButton): boolean
}

export interface KeyState {
  pressed: boolean
  held: boolean
  released: boolean
  timestamp: number
}

export interface MouseState {
  position: Vector2
  delta: Vector2
  buttons: { [button: number]: KeyState }
  wheel: number
}

export interface GamepadState {
  connected: boolean
  axes: number[]
  buttons: GamepadButtonState[]
}

export interface GamepadButtonState {
  pressed: boolean
  value: number
}

export enum MouseButton {
  LEFT = 0,
  MIDDLE = 1,
  RIGHT = 2
}

export enum GamepadAxis {
  LEFT_STICK_X = 0,
  LEFT_STICK_Y = 1,
  RIGHT_STICK_X = 2,
  RIGHT_STICK_Y = 3,
  LEFT_TRIGGER = 4,
  RIGHT_TRIGGER = 5
}

export enum GamepadButton {
  A = 0,
  B = 1,
  X = 2,
  Y = 3,
  LEFT_BUMPER = 4,
  RIGHT_BUMPER = 5,
  LEFT_TRIGGER = 6,
  RIGHT_TRIGGER = 7,
  SELECT = 8,
  START = 9,
  LEFT_STICK = 10,
  RIGHT_STICK = 11,
  DPAD_UP = 12,
  DPAD_DOWN = 13,
  DPAD_LEFT = 14,
  DPAD_RIGHT = 15
}

export interface KeyEvent {
  key: string
  code: string
  shiftKey: boolean
  ctrlKey: boolean
  altKey: boolean
  metaKey: boolean
}

export interface MouseEvent {
  button: MouseButton
  position: Vector2
  delta: Vector2
  shiftKey: boolean
  ctrlKey: boolean
  altKey: boolean
  metaKey: boolean
}

export interface WheelEvent {
  delta: number
  position: Vector2
}

export interface GamepadEvent {
  index: number
  gamepad: Gamepad
}

// ==================== СЕТЕВОЕ ВЗАИМОДЕЙСТВИЕ ====================

export interface NetworkManager {
  socket: Socket
  connected: boolean
  latency: number
  
  // Методы
  connect(url: string): Promise<void>
  disconnect(): void
  send(event: string, data: any): void
  on(event: string, callback: Function): void
  off(event: string, callback: Function): void
}

export interface Socket {
  id: string
  connected: boolean
  
  // События
  emit(event: string, data: any): void
  on(event: string, callback: Function): void
  off(event: string, callback: Function): void
  disconnect(): void
}

// ==================== СИСТЕМА ЧАСТИЦ ====================

export interface ParticleSystem {
  id: string
  active: boolean
  position: Vector3
  
  // Настройки эмиттера
  emitter: ParticleEmitter
  
  // Частицы
  particles: Particle[]
  maxParticles: number
  
  // Время жизни
  duration: number
  elapsed: number
  loop: boolean
  
  // Методы
  start(): void
  stop(): void
  pause(): void
  resume(): void
  reset(): void
  update(deltaTime: number): void
  render(renderer: GameRenderer): void
}

export interface ParticleEmitter {
  // Скорость порождения
  emissionRate: number
  burstCount: number
  burstInterval: number
  
  // Область порождения
  shape: EmitterShape
  
  // Начальные параметры частиц
  startLifetime: ValueRange
  startSpeed: ValueRange
  startSize: ValueRange
  startRotation: ValueRange
  startColor: ColorRange
  
  // Изменения во времени
  velocityOverLifetime?: VelocityModule
  sizeOverLifetime?: CurveModule
  rotationOverLifetime?: CurveModule
  colorOverLifetime?: ColorModule
  
  // Физика
  gravity: Vector3
  drag: number
}

export interface EmitterShape {
  type: EmitterShapeType
  radius?: number
  width?: number
  height?: number
  angle?: number
}

export enum EmitterShapeType {
  POINT = 'point',
  CIRCLE = 'circle',
  RECTANGLE = 'rectangle',
  CONE = 'cone',
  SPHERE = 'sphere'
}

export interface Particle {
  id: string
  position: Vector3
  velocity: Vector3
  acceleration: Vector3
  rotation: number
  angularVelocity: number
  
  // Визуальные свойства
  size: number
  color: Color
  sprite?: Sprite
  
  // Время жизни
  lifetime: number
  age: number
  
  // Состояние
  active: boolean
}

export interface ValueRange {
  min: number
  max: number
}

export interface ColorRange {
  min: Color
  max: Color
}

export interface VelocityModule {
  enabled: boolean
  velocity: Vector3
  space: VelocitySpace
}

export enum VelocitySpace {
  LOCAL = 'local',
  WORLD = 'world'
}

export interface CurveModule {
  enabled: boolean
  curve: AnimationCurve
  multiplier: number
}

export interface ColorModule {
  enabled: boolean
  gradient: ColorGradient
}

export interface AnimationCurve {
  keys: CurveKey[]
}

export interface CurveKey {
  time: number
  value: number
  inTangent: number
  outTangent: number
}

export interface ColorGradient {
  colorKeys: ColorKey[]
  alphaKeys: AlphaKey[]
}

export interface ColorKey {
  time: number
  color: Color
}

export interface AlphaKey {
  time: number
  alpha: number
}

// ==================== СИСТЕМА СОБЫТИЙ ====================

export interface EventEmitter<T = any> {
  listeners: { [event: string]: EventListener<T>[] }
  
  // Методы
  on(event: string, listener: EventListener<T>): void
  off(event: string, listener: EventListener<T>): void
  once(event: string, listener: EventListener<T>): void
  emit(event: string, data: T): void
  removeAllListeners(event?: string): void
}

export type EventListener<T = any> = (data: T) => void

// ==================== ИГРОВЫЕ ОБЪЕКТЫ ====================

export interface GameObject {
  id: string
  name: string
  active: boolean
  
  // Трансформация
  transform: Transform
  
  // Компоненты
  components: { [type: string]: GameComponent }
  
  // Иерархия
  parent?: GameObject
  children: GameObject[]
  
  // Методы
  addComponent<T extends GameComponent>(component: T): T
  getComponent<T extends GameComponent>(type: ComponentType): T | null
  removeComponent(type: ComponentType): void
  hasComponent(type: ComponentType): boolean
  
  update(deltaTime: number): void
  render(renderer: GameRenderer): void
  destroy(): void
}

export interface Transform {
  position: Vector3
  rotation: Vector3
  scale: Vector3
  
  // Локальные координаты
  localPosition: Vector3
  localRotation: Vector3
  localScale: Vector3
  
  // Методы
  translate(translation: Vector3): void
  rotate(rotation: Vector3): void
  lookAt(target: Vector3): void
  
  // Преобразования координат
  transformPoint(point: Vector3): Vector3
  inverseTransformPoint(point: Vector3): Vector3
}

export interface GameComponent {
  gameObject: GameObject
  enabled: boolean
  
  // Методы жизненного цикла
  awake?(): void
  start?(): void
  update?(deltaTime: number): void
  render?(renderer: GameRenderer): void
  destroy?(): void
}

export enum ComponentType {
  TRANSFORM = 'transform',
  RENDERER = 'renderer',
  COLLIDER = 'collider',
  RIGIDBODY = 'rigidbody',
  ANIMATOR = 'animator',
  AUDIO_SOURCE = 'audio_source',
  PARTICLE_SYSTEM = 'particle_system',
  SCRIPT = 'script'
}

// ==================== АНИМАЦИОННАЯ СИСТЕМА ====================

export interface Animator {
  controller: AnimatorController
  parameters: { [name: string]: AnimatorParameter }
  currentState: AnimatorState
  
  // Методы
  play(stateName: string): void
  setParameter(name: string, value: any): void
  getParameter(name: string): any
  update(deltaTime: number): void
}

export interface AnimatorController {
  states: AnimatorState[]
  transitions: AnimatorTransition[]
  parameters: AnimatorParameter[]
  defaultState: string
}

export interface AnimatorState {
  name: string
  animation: Animation
  speed: number
  loop: boolean
  
  // События
  onEnter?: Function
  onExit?: Function
  onUpdate?: Function
}

export interface AnimatorTransition {
  from: string
  to: string
  conditions: AnimatorCondition[]
  duration: number
  exitTime: number
}

export interface AnimatorCondition {
  parameter: string
  operator: ConditionOperator
  value: any
}

export enum ConditionOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER = 'greater',
  LESS = 'less',
  GREATER_EQUAL = 'greater_equal',
  LESS_EQUAL = 'less_equal'
}

export interface AnimatorParameter {
  name: string
  type: ParameterType
  defaultValue: any
}

export enum ParameterType {
  FLOAT = 'float',
  INT = 'int',
  BOOL = 'bool',
  TRIGGER = 'trigger'
}

// ==================== СИСТЕМА РЕСУРСОВ ====================

export interface ResourceManager {
  resources: { [id: string]: Resource }
  loading: { [id: string]: Promise<Resource> }
  
  // Методы
  load<T extends Resource>(id: string, url: string, type: ResourceType): Promise<T>
  get<T extends Resource>(id: string): T | null
  unload(id: string): void
  unloadAll(): void
  preload(resources: ResourcePreload[]): Promise<void>
}

export interface Resource {
  id: string
  url: string
  type: ResourceType
  loaded: boolean
  data: any
  
  // Метаданные
  size: number
  lastModified: Date
  references: number
}

export enum ResourceType {
  TEXTURE = 'texture',
  AUDIO = 'audio',
  JSON = 'json',
  TEXT = 'text',
  FONT = 'font',
  SHADER = 'shader',
  MODEL = 'model'
}

export interface ResourcePreload {
  id: string
  url: string
  type: ResourceType
  priority: number
}

// ==================== СЦЕНЫ ====================

export interface Scene {
  id: string
  name: string
  active: boolean
  
  // Объекты сцены
  gameObjects: GameObject[]
  
  // Камеры
  cameras: Camera[]
  activeCamera: Camera
  
  // Освещение
  lighting: SceneLighting
  
  // Настройки
  settings: SceneSettings
  
  // Методы
  addGameObject(gameObject: GameObject): void
  removeGameObject(gameObject: GameObject): void
  findGameObject(name: string): GameObject | null
  findGameObjectsWithTag(tag: string): GameObject[]
  
  load(): Promise<void>
  unload(): void
  update(deltaTime: number): void
  render(renderer: GameRenderer): void
}

export interface SceneLighting {
  ambientColor: Color
  ambientIntensity: number
  lights: Light[]
}

export interface Light {
  type: LightType
  position: Vector3
  direction: Vector3
  color: Color
  intensity: number
  range: number
  angle: number
}

export enum LightType {
  DIRECTIONAL = 'directional',
  POINT = 'point',
  SPOT = 'spot'
}

export interface SceneSettings {
  backgroundColor: Color
  fogEnabled: boolean
  fogColor: Color
  fogStart: number
  fogEnd: number
  
  // Физика
  gravity: Vector3
  physicsEnabled: boolean
  
  // Аудио
  audioEnabled: boolean
  reverbZone?: AudioReverbZone
}

export interface AudioReverbZone {
  room: number
  roomHF: number
  roomLF: number
  decayTime: number
  decayHFRatio: number
  reflections: number
  reflectionsDelay: number
  reverb: number
  reverbDelay: number
  diffusion: number
  density: number
  hfReference: number
  lfReference: number
}

// ==================== ТАЙЛОВЫЕ КАРТЫ ====================

export interface Tilemap {
  id: string
  width: number
  height: number
  tileWidth: number
  tileHeight: number
  
  // Слои
  layers: TilemapLayer[]
  
  // Тайлсеты
  tilesets: Tileset[]
  
  // Свойства
  properties: { [key: string]: any }
}

export interface TilemapLayer {
  id: string
  name: string
  width: number
  height: number
  visible: boolean
  opacity: number
  
  // Данные тайлов
  data: number[]
  
  // Тип слоя
  type: LayerType
  
  // Объекты (для object layer)
  objects?: TilemapObject[]
  
  // Свойства
  properties: { [key: string]: any }
}

export enum LayerType {
  TILE = 'tile',
  OBJECT = 'object',
  IMAGE = 'image',
  GROUP = 'group'
}

export interface TilemapObject {
  id: string
  name: string
  type: string
  x: number
  y: number
  width: number
  height: number
  visible: boolean
  
  // Геометрия
  polygon?: Vector2[]
  polyline?: Vector2[]
  ellipse?: boolean
  
  // Свойства
  properties: { [key: string]: any }
}

export interface Tileset {
  id: string
  name: string
  firstGid: number
  tileWidth: number
  tileHeight: number
  tileCount: number
  columns: number
  
  // Изображение
  image: string
  imageWidth: number
  imageHeight: number
  
  // Тайлы
  tiles: TileData[]
  
  // Свойства
  properties: { [key: string]: any }
}

export interface TileData {
  id: number
  type?: string
  
  // Коллизия
  collision?: CollisionData
  
  // Анимация
  animation?: TileAnimation
  
  // Свойства
  properties: { [key: string]: any }
}

export interface CollisionData {
  shapes: CollisionShape[]
}

export interface TileAnimation {
  frames: TileAnimationFrame[]
}

export interface TileAnimationFrame {
  tileId: number
  duration: number
}

// ==================== СОХРАНЕНИЯ ====================

export interface SaveData {
  version: string
  timestamp: Date
  
  // Данные пользователя
  user: SaveUserData
  
  // Персонажи
  characters: SaveCharacterData[]
  
  // Прогресс
  progress: SaveProgressData
  
  // Настройки
  settings: UserSettings
}

export interface SaveUserData {
  id: string
  username: string
  email: string
  stats: UserStats
  achievements: string[]
  titles: string[]
}

export interface SaveCharacterData {
  id: string
  name: string
  class: CharacterClass
  race: CharacterRace
  level: number
  experience: number
  
  // Характеристики
  stats: CharacterStats
  attributes: CharacterAttributes
  
  // Местоположение
  position: Vector3
  map: string
  
  // Инвентарь
  inventory: SaveInventoryData
  equipment: SaveEquipmentData
  
  // Навыки
  skills: CharacterSkills
  
  // Квесты
  activeQuests: string[]
  completedQuests: string[]
  
  // Социальное
  guildId?: string
  friends: string[]
  
  // Время
  totalPlayTime: number
  lastLogin: Date
}

export interface SaveInventoryData {
  slots: SaveInventorySlot[]
  gold: number
}

export interface SaveInventorySlot {
  position: number
  itemId: string
  quantity: number
  enchantments?: string[]
  durability?: number
}

export interface SaveEquipmentData {
  [slot: string]: SaveInventorySlot
}

export interface SaveProgressData {
  // Открытые локации
  unlockedMaps: string[]
  discoveredAreas: string[]
  
  // Побежденные боссы
  defeatedBosses: string[]
  
  // События
  completedEvents: string[]
  
  // Достижения
  unlockedAchievements: string[]
  
  // Статистика
  statistics: { [key: string]: number }
}

// ==================== МОДИФИКАЦИИ ====================

export interface Mod {
  id: string
  name: string
  version: string
  author: string
  description: string
  
  // Зависимости
  dependencies: ModDependency[]
  
  // Файлы
  files: ModFile[]
  
  // Настройки
  config: ModConfig
  
  // Состояние
  enabled: boolean
  loaded: boolean
}

export interface ModDependency {
  modId: string
  version: string
  required: boolean
}

export interface ModFile {
  path: string
  type: ModFileType
  content: string | ArrayBuffer
}

export enum ModFileType {
  SCRIPT = 'script',
  ASSET = 'asset',
  CONFIG = 'config',
  TRANSLATION = 'translation'
}

export interface ModConfig {
  [key: string]: ModConfigValue
}

export type ModConfigValue = string | number | boolean | ModConfigValue[]

// ==================== ОТЛАДКА ====================

export interface DebugInfo {
  fps: number
  frameTime: number
  drawCalls: number
  triangles: number
  
  // Память
  memoryUsage: MemoryUsage
  
  // Сеть
  networkStats: NetworkStats
  
  // Производительность
  profiler: ProfilerData
}

export interface MemoryUsage {
  used: number
  total: number
  textures: number
  audio: number
  scripts: number
}

export interface NetworkStats {
  latency: number
  packetsSent: number
  packetsReceived: number
  bytesSent: number
  bytesReceived: number
}

export interface ProfilerData {
  categories: ProfilerCategory[]
}

export interface ProfilerCategory {
  name: string
  time: number
  calls: number
  children: ProfilerCategory[]
}

export interface Console {
  commands: ConsoleCommand[]
  history: string[]
  
  // Методы
  registerCommand(command: ConsoleCommand): void
  executeCommand(command: string): void
  log(message: string, level: LogLevel): void
}

export interface ConsoleCommand {
  name: string
  description: string
  parameters: CommandParameter[]
  execute: (args: string[]) => void
}

export interface CommandParameter {
  name: string
  type: ParameterType
  required: boolean
  defaultValue?: any
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error'
}