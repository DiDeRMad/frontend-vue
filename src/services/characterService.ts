import { apiService } from './apiService';
import { notificationService } from './notificationService';
import { storageService } from './storageService';
import {
  Character,
  CharacterStats,
  CharacterSkills,
  Item,
  Equipment,
  Skill,
  Achievement,
  Title,
  StatusEffect,
  ApiResponse
} from '@types/api';

export interface CharacterProgression {
  level: number;
  experience: number;
  experienceToNext: number;
  skillPoints: number;
  attributePoints: number;
  talentPoints: number;
}

export interface CharacterBuild {
  id: string;
  name: string;
  description: string;
  class: string;
  level: number;
  attributes: CharacterStats['attributes'];
  skills: { [skillId: string]: number };
  equipment: Equipment;
  createdAt: number;
  updatedAt: number;
  isDefault: boolean;
}

export interface CharacterState {
  character: Character | null;
  progression: CharacterProgression | null;
  builds: CharacterBuild[];
  activeBuild: string | null;
  statusEffects: StatusEffect[];
  achievements: Achievement[];
  availableTitles: Title[];
  activeTitle: Title | null;
  isLoading: boolean;
  error: string | null;
}

export interface SkillUpgradeResult {
  skill: Skill;
  newLevel: number;
  unlockedAbilities: string[];
  prerequisites: string[];
  cost: number;
}

export interface StatUpgradeResult {
  stat: keyof CharacterStats['attributes'];
  newValue: number;
  bonuses: { [key: string]: number };
  cost: number;
}

class CharacterService {
  private characterState: CharacterState = {
    character: null,
    progression: null,
    builds: [],
    activeBuild: null,
    statusEffects: [],
    achievements: [],
    availableTitles: [],
    activeTitle: null,
    isLoading: false,
    error: null
  };

  private subscribers: Set<(state: CharacterState) => void> = new Set();
  private statCalculationCache = new Map<string, any>();
  private skillCooldowns = new Map<string, number>();
  private effectTimers = new Map<string, NodeJS.Timeout>();

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Load saved builds
      await this.loadSavedBuilds();
      
      // Setup effect monitoring
      this.setupEffectTimers();
      
    } catch (error) {
      console.error('Character service initialization failed:', error);
    }
  }

  private async loadSavedBuilds(): Promise<void> {
    try {
      const builds = await storageService.getItem<CharacterBuild[]>('character_builds') || [];
      this.updateCharacterState({ builds });
    } catch (error) {
      console.error('Failed to load saved builds:', error);
    }
  }

  private setupEffectTimers(): void {
    // Monitor status effects for expiration
    setInterval(() => {
      if (this.characterState.statusEffects.length > 0) {
        this.updateStatusEffects();
      }
    }, 1000);
  }

  // Character Loading and Management
  async loadCharacter(characterId: string): Promise<void> {
    this.setLoading(true);
    
    try {
      const response = await apiService.get<{
        character: Character;
        progression: CharacterProgression;
        statusEffects: StatusEffect[];
        achievements: Achievement[];
        titles: Title[];
        activeTitle: Title | null;
      }>(`/game/characters/${characterId}/details`);
      
      if (response.success && response.data) {
        const { character, progression, statusEffects, achievements, titles, activeTitle } = response.data;
        
        this.updateCharacterState({
          character,
          progression,
          statusEffects,
          achievements,
          availableTitles: titles,
          activeTitle
        });
        
        // Clear stat cache when character changes
        this.statCalculationCache.clear();
        
        // Load character-specific data
        await this.loadCharacterBuilds(characterId);
        
      } else {
        throw new Error(response.message || 'Failed to load character');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load character';
      this.setError(errorMessage);
      notificationService.showError(errorMessage);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  async updateCharacterStats(updates: Partial<CharacterStats>): Promise<void> {
    if (!this.characterState.character) {
      throw new Error('No character loaded');
    }

    try {
      const response = await apiService.patch('/game/characters/current/stats', updates);
      
      if (response.success && response.data) {
        const updatedCharacter = {
          ...this.characterState.character,
          stats: { ...this.characterState.character.stats, ...updates }
        };
        
        this.updateCharacterState({ character: updatedCharacter });
        this.statCalculationCache.clear(); // Clear cache on stat update
        
        notificationService.showSuccess('Character stats updated');
      } else {
        throw new Error(response.message || 'Failed to update stats');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update stats';
      notificationService.showError(errorMessage);
      throw error;
    }
  }

  // Stat and Attribute Management
  async upgradeAttribute(attribute: keyof CharacterStats['attributes'], points: number = 1): Promise<StatUpgradeResult> {
    if (!this.characterState.character || !this.characterState.progression) {
      throw new Error('No character loaded');
    }

    const availablePoints = this.characterState.progression.attributePoints;
    if (availablePoints < points) {
      throw new Error('Not enough attribute points');
    }

    try {
      const response = await apiService.post<StatUpgradeResult>('/game/characters/current/attributes/upgrade', {
        attribute,
        points
      });
      
      if (response.success && response.data) {
        const result = response.data;
        
        // Update character stats
        const updatedCharacter = { ...this.characterState.character };
        updatedCharacter.stats.attributes[attribute] = result.newValue;
        
        // Update progression
        const updatedProgression = {
          ...this.characterState.progression,
          attributePoints: availablePoints - points
        };
        
        this.updateCharacterState({
          character: updatedCharacter,
          progression: updatedProgression
        });
        
        this.statCalculationCache.clear();
        
        notificationService.showSuccess(`${attribute} increased to ${result.newValue}`);
        
        return result;
      } else {
        throw new Error(response.message || 'Failed to upgrade attribute');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upgrade attribute';
      notificationService.showError(errorMessage);
      throw error;
    }
  }

  calculateEffectiveStats(): CharacterStats {
    if (!this.characterState.character) {
      throw new Error('No character loaded');
    }

    const cacheKey = this.generateStatsCacheKey();
    if (this.statCalculationCache.has(cacheKey)) {
      return this.statCalculationCache.get(cacheKey);
    }

    const baseStats = { ...this.characterState.character.stats };
    let effectiveStats = { ...baseStats };

    // Apply equipment bonuses
    if (this.characterState.character.equipment) {
      Object.values(this.characterState.character.equipment).forEach(item => {
        if (item && item.stats) {
          this.applyItemStats(effectiveStats, item.stats);
        }
      });
    }

    // Apply status effect bonuses
    this.characterState.statusEffects.forEach(effect => {
      if (effect.statModifiers) {
        this.applyStatModifiers(effectiveStats, effect.statModifiers);
      }
    });

    // Apply title bonuses
    if (this.characterState.activeTitle?.bonuses) {
      this.applyStatModifiers(effectiveStats, this.characterState.activeTitle.bonuses);
    }

    // Calculate derived stats
    this.calculateDerivedStats(effectiveStats);

    this.statCalculationCache.set(cacheKey, effectiveStats);
    return effectiveStats;
  }

  private generateStatsCacheKey(): string {
    const char = this.characterState.character!;
    const equipment = char.equipment ? Object.values(char.equipment).map(item => item?.id || '').join(',') : '';
    const effects = this.characterState.statusEffects.map(e => e.id).join(',');
    const title = this.characterState.activeTitle?.id || '';
    
    return `${char.id}-${char.stats.level}-${equipment}-${effects}-${title}`;
  }

  private applyItemStats(stats: CharacterStats, itemStats: Partial<CharacterStats>): void {
    if (itemStats.attributes) {
      Object.entries(itemStats.attributes).forEach(([key, value]) => {
        if (typeof value === 'number') {
          stats.attributes[key as keyof CharacterStats['attributes']] += value;
        }
      });
    }

    // Apply other stat categories
    ['health', 'mana', 'stamina', 'defense', 'resistance'].forEach(category => {
      if (itemStats[category as keyof CharacterStats] && stats[category as keyof CharacterStats]) {
        Object.entries(itemStats[category as keyof CharacterStats]!).forEach(([key, value]) => {
          if (typeof value === 'number') {
            (stats[category as keyof CharacterStats] as any)[key] += value;
          }
        });
      }
    });
  }

  private applyStatModifiers(stats: CharacterStats, modifiers: { [key: string]: number }): void {
    Object.entries(modifiers).forEach(([stat, value]) => {
      const statPath = stat.split('.');
      let current: any = stats;
      
      for (let i = 0; i < statPath.length - 1; i++) {
        current = current[statPath[i]];
        if (!current) return;
      }
      
      const finalKey = statPath[statPath.length - 1];
      if (typeof current[finalKey] === 'number') {
        current[finalKey] += value;
      }
    });
  }

  private calculateDerivedStats(stats: CharacterStats): void {
    // Calculate max health based on constitution
    stats.health.max = stats.health.base + (stats.attributes.constitution * 10);
    
    // Calculate max mana based on intelligence
    stats.mana.max = stats.mana.base + (stats.attributes.intelligence * 8);
    
    // Calculate max stamina based on strength and constitution
    stats.stamina.max = stats.stamina.base + ((stats.attributes.strength + stats.attributes.constitution) * 5);
    
    // Calculate defense based on strength and equipment
    stats.defense.physical = stats.defense.base + Math.floor(stats.attributes.strength / 2);
    stats.defense.magical = stats.defense.base + Math.floor(stats.attributes.intelligence / 2);
    
    // Calculate resistance based on constitution and wisdom
    stats.resistance.fire = stats.resistance.base + Math.floor(stats.attributes.constitution / 3);
    stats.resistance.ice = stats.resistance.base + Math.floor(stats.attributes.constitution / 3);
    stats.resistance.lightning = stats.resistance.base + Math.floor(stats.attributes.wisdom / 3);
    stats.resistance.poison = stats.resistance.base + Math.floor(stats.attributes.constitution / 2);
  }

  // Skill Management
  async upgradeSkill(skillId: string, levels: number = 1): Promise<SkillUpgradeResult> {
    if (!this.characterState.character || !this.characterState.progression) {
      throw new Error('No character loaded');
    }

    const availablePoints = this.characterState.progression.skillPoints;
    if (availablePoints < levels) {
      throw new Error('Not enough skill points');
    }

    try {
      const response = await apiService.post<SkillUpgradeResult>('/game/characters/current/skills/upgrade', {
        skillId,
        levels
      });
      
      if (response.success && response.data) {
        const result = response.data;
        
        // Update character skills
        const updatedCharacter = { ...this.characterState.character };
        updatedCharacter.skills = {
          ...updatedCharacter.skills,
          [skillId]: result.newLevel
        };
        
        // Update progression
        const updatedProgression = {
          ...this.characterState.progression,
          skillPoints: availablePoints - levels
        };
        
        this.updateCharacterState({
          character: updatedCharacter,
          progression: updatedProgression
        });
        
        notificationService.showSuccess(`${result.skill.name} upgraded to level ${result.newLevel}`);
        
        // Notify about unlocked abilities
        if (result.unlockedAbilities.length > 0) {
          result.unlockedAbilities.forEach(ability => {
            notificationService.showAchievement(`New ability unlocked: ${ability}`);
          });
        }
        
        return result;
      } else {
        throw new Error(response.message || 'Failed to upgrade skill');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upgrade skill';
      notificationService.showError(errorMessage);
      throw error;
    }
  }

  async useSkill(skillId: string, targetId?: string): Promise<void> {
    if (!this.characterState.character) {
      throw new Error('No character loaded');
    }

    // Check cooldown
    const cooldownEnd = this.skillCooldowns.get(skillId);
    if (cooldownEnd && Date.now() < cooldownEnd) {
      const remaining = Math.ceil((cooldownEnd - Date.now()) / 1000);
      throw new Error(`Skill on cooldown for ${remaining} seconds`);
    }

    try {
      const response = await apiService.post('/game/characters/current/skills/use', {
        skillId,
        targetId
      });
      
      if (response.success && response.data) {
        const { cooldown, effects } = response.data;
        
        // Set cooldown
        if (cooldown > 0) {
          this.skillCooldowns.set(skillId, Date.now() + (cooldown * 1000));
        }
        
        // Apply effects
        if (effects && effects.length > 0) {
          this.addStatusEffects(effects);
        }
        
        // Update character if mana/stamina was consumed
        if (response.data.characterUpdate) {
          this.updateCharacterState({ character: response.data.characterUpdate });
        }
        
      } else {
        throw new Error(response.message || 'Failed to use skill');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to use skill';
      notificationService.showError(errorMessage);
      throw error;
    }
  }

  getSkillCooldown(skillId: string): number {
    const cooldownEnd = this.skillCooldowns.get(skillId);
    if (!cooldownEnd || Date.now() >= cooldownEnd) {
      return 0;
    }
    return Math.max(0, cooldownEnd - Date.now()) / 1000;
  }

  // Equipment Management
  async equipItem(itemId: string, slot: keyof Equipment): Promise<void> {
    if (!this.characterState.character) {
      throw new Error('No character loaded');
    }

    try {
      const response = await apiService.post('/game/characters/current/equipment/equip', {
        itemId,
        slot
      });
      
      if (response.success && response.data) {
        const updatedCharacter = {
          ...this.characterState.character,
          equipment: response.data.equipment
        };
        
        this.updateCharacterState({ character: updatedCharacter });
        this.statCalculationCache.clear();
        
        notificationService.showSuccess('Item equipped');
      } else {
        throw new Error(response.message || 'Failed to equip item');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to equip item';
      notificationService.showError(errorMessage);
      throw error;
    }
  }

  async unequipItem(slot: keyof Equipment): Promise<void> {
    if (!this.characterState.character) {
      throw new Error('No character loaded');
    }

    try {
      const response = await apiService.post('/game/characters/current/equipment/unequip', {
        slot
      });
      
      if (response.success && response.data) {
        const updatedCharacter = {
          ...this.characterState.character,
          equipment: response.data.equipment
        };
        
        this.updateCharacterState({ character: updatedCharacter });
        this.statCalculationCache.clear();
        
        notificationService.showSuccess('Item unequipped');
      } else {
        throw new Error(response.message || 'Failed to unequip item');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to unequip item';
      notificationService.showError(errorMessage);
      throw error;
    }
  }

  // Status Effects Management
  addStatusEffects(effects: StatusEffect[]): void {
    const updatedEffects = [...this.characterState.statusEffects];
    
    effects.forEach(newEffect => {
      // Check if effect already exists
      const existingIndex = updatedEffects.findIndex(e => e.id === newEffect.id);
      
      if (existingIndex >= 0) {
        // Replace or refresh existing effect
        updatedEffects[existingIndex] = newEffect;
      } else {
        // Add new effect
        updatedEffects.push(newEffect);
      }
      
      // Set up expiration timer
      if (newEffect.duration > 0) {
        this.setupEffectTimer(newEffect);
      }
    });
    
    this.updateCharacterState({ statusEffects: updatedEffects });
    this.statCalculationCache.clear();
  }

  removeStatusEffect(effectId: string): void {
    const updatedEffects = this.characterState.statusEffects.filter(e => e.id !== effectId);
    this.updateCharacterState({ statusEffects: updatedEffects });
    
    // Clear timer
    const timer = this.effectTimers.get(effectId);
    if (timer) {
      clearTimeout(timer);
      this.effectTimers.delete(effectId);
    }
    
    this.statCalculationCache.clear();
  }

  private setupEffectTimer(effect: StatusEffect): void {
    // Clear existing timer
    const existingTimer = this.effectTimers.get(effect.id);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // Set new timer
    const timer = setTimeout(() => {
      this.removeStatusEffect(effect.id);
      notificationService.showInfo(`${effect.name} has worn off`);
    }, effect.duration * 1000);
    
    this.effectTimers.set(effect.id, timer);
  }

  private updateStatusEffects(): void {
    const now = Date.now();
    const activeEffects = this.characterState.statusEffects.filter(effect => {
      if (effect.duration === 0) return true; // Permanent effects
      
      const elapsed = (now - effect.appliedAt) / 1000;
      return elapsed < effect.duration;
    });
    
    if (activeEffects.length !== this.characterState.statusEffects.length) {
      this.updateCharacterState({ statusEffects: activeEffects });
      this.statCalculationCache.clear();
    }
  }

  // Title Management
  async setActiveTitle(titleId: string | null): Promise<void> {
    try {
      const response = await apiService.post('/game/characters/current/title', {
        titleId
      });
      
      if (response.success) {
        const activeTitle = titleId 
          ? this.characterState.availableTitles.find(t => t.id === titleId) || null
          : null;
        
        this.updateCharacterState({ activeTitle });
        this.statCalculationCache.clear();
        
        if (activeTitle) {
          notificationService.showSuccess(`Title "${activeTitle.name}" activated`);
        } else {
          notificationService.showSuccess('Title removed');
        }
      } else {
        throw new Error(response.message || 'Failed to set title');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to set title';
      notificationService.showError(errorMessage);
      throw error;
    }
  }

  // Build Management
  async saveCurrentBuild(name: string, description: string = ''): Promise<CharacterBuild> {
    if (!this.characterState.character) {
      throw new Error('No character loaded');
    }

    const build: CharacterBuild = {
      id: `build_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      class: this.characterState.character.class,
      level: this.characterState.character.stats.level,
      attributes: { ...this.characterState.character.stats.attributes },
      skills: { ...this.characterState.character.skills },
      equipment: { ...this.characterState.character.equipment },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDefault: false
    };

    const updatedBuilds = [...this.characterState.builds, build];
    this.updateCharacterState({ builds: updatedBuilds });
    
    await this.saveBuildsToStorage();
    
    notificationService.showSuccess(`Build "${name}" saved`);
    return build;
  }

  async loadBuild(buildId: string): Promise<void> {
    const build = this.characterState.builds.find(b => b.id === buildId);
    if (!build) {
      throw new Error('Build not found');
    }

    try {
      const response = await apiService.post('/game/characters/current/load-build', {
        attributes: build.attributes,
        skills: build.skills,
        equipment: build.equipment
      });
      
      if (response.success && response.data) {
        this.updateCharacterState({ 
          character: response.data.character,
          activeBuild: buildId
        });
        
        this.statCalculationCache.clear();
        notificationService.showSuccess(`Build "${build.name}" loaded`);
      } else {
        throw new Error(response.message || 'Failed to load build');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load build';
      notificationService.showError(errorMessage);
      throw error;
    }
  }

  deleteBuild(buildId: string): void {
    const updatedBuilds = this.characterState.builds.filter(b => b.id !== buildId);
    this.updateCharacterState({ builds: updatedBuilds });
    this.saveBuildsToStorage();
    
    notificationService.showSuccess('Build deleted');
  }

  private async saveBuildsToStorage(): Promise<void> {
    try {
      await storageService.setItem('character_builds', this.characterState.builds);
    } catch (error) {
      console.error('Failed to save builds:', error);
    }
  }

  private async loadCharacterBuilds(characterId: string): Promise<void> {
    try {
      const response = await apiService.get(`/game/characters/${characterId}/builds`);
      
      if (response.success && response.data) {
        const serverBuilds = response.data.builds || [];
        const localBuilds = this.characterState.builds.filter(b => b.isDefault);
        const allBuilds = [...serverBuilds, ...localBuilds];
        
        this.updateCharacterState({ builds: allBuilds });
      }
    } catch (error) {
      console.error('Failed to load character builds:', error);
    }
  }

  // Experience and Leveling
  async gainExperience(amount: number, source: string = 'Unknown'): Promise<boolean> {
    if (!this.characterState.character || !this.characterState.progression) {
      return false;
    }

    const newExp = this.characterState.progression.experience + amount;
    const expToNext = this.characterState.progression.experienceToNext;
    
    let leveledUp = false;
    let newLevel = this.characterState.character.stats.level;
    let remainingExp = newExp;
    
    // Check for level up
    if (newExp >= expToNext) {
      leveledUp = true;
      newLevel++;
      remainingExp = newExp - expToNext;
      
      // Calculate new experience requirement
      const newExpToNext = this.calculateExperienceToNext(newLevel);
      
      // Update character
      const updatedCharacter = {
        ...this.characterState.character,
        stats: {
          ...this.characterState.character.stats,
          level: newLevel
        }
      };
      
      const updatedProgression = {
        ...this.characterState.progression,
        level: newLevel,
        experience: remainingExp,
        experienceToNext: newExpToNext,
        attributePoints: this.characterState.progression.attributePoints + 5,
        skillPoints: this.characterState.progression.skillPoints + 1
      };
      
      this.updateCharacterState({
        character: updatedCharacter,
        progression: updatedProgression
      });
      
      notificationService.showAchievement(`Level Up! You are now level ${newLevel}`);
      notificationService.showSuccess(`+5 Attribute Points, +1 Skill Point`);
    } else {
      // Just update experience
      const updatedProgression = {
        ...this.characterState.progression,
        experience: newExp
      };
      
      this.updateCharacterState({ progression: updatedProgression });
    }
    
    notificationService.showInfo(`+${amount} Experience from ${source}`);
    
    return leveledUp;
  }

  private calculateExperienceToNext(level: number): number {
    // Exponential experience curve
    return Math.floor(100 * Math.pow(1.5, level - 1));
  }

  // State Management
  private updateCharacterState(updates: Partial<CharacterState>): void {
    this.characterState = { ...this.characterState, ...updates };
    this.notifySubscribers();
  }

  private setLoading(isLoading: boolean): void {
    this.updateCharacterState({ isLoading });
  }

  private setError(error: string | null): void {
    this.updateCharacterState({ error });
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      callback({ ...this.characterState });
    });
  }

  // Public Getters
  getCharacterState(): CharacterState {
    return { ...this.characterState };
  }

  getCurrentCharacter(): Character | null {
    return this.characterState.character;
  }

  getProgression(): CharacterProgression | null {
    return this.characterState.progression;
  }

  getStatusEffects(): StatusEffect[] {
    return [...this.characterState.statusEffects];
  }

  getBuilds(): CharacterBuild[] {
    return [...this.characterState.builds];
  }

  // Subscription Management
  subscribe(callback: (state: CharacterState) => void): () => void {
    this.subscribers.add(callback);
    
    // Immediately call with current state
    callback({ ...this.characterState });
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  // Cleanup
  destroy(): void {
    // Clear all effect timers
    this.effectTimers.forEach(timer => clearTimeout(timer));
    this.effectTimers.clear();
    
    // Clear caches
    this.statCalculationCache.clear();
    this.skillCooldowns.clear();
    
    // Clear subscribers
    this.subscribers.clear();
  }
}

export const characterService = new CharacterService();