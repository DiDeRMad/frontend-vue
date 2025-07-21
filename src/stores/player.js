import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const usePlayerStore = defineStore('player', () => {
  // Player data
  const playerData = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  // Computed properties
  const isLoggedIn = computed(() => !!playerData.value)
  const character = computed(() => playerData.value?.character || null)
  const characterName = computed(() => character.value?.name || '')
  const characterLevel = computed(() => character.value?.level || 1)
  const characterClass = computed(() => character.value?.class || '')
  const characterRace = computed(() => character.value?.race || '')
  
  const stats = computed(() => character.value?.stats || {})
  const currency = computed(() => character.value?.currency || {})
  const inventory = computed(() => character.value?.inventory || { items: [] })
  const equipment = computed(() => character.value?.equipment || {})
  const questLog = computed(() => character.value?.questLog || [])
  const achievements = computed(() => character.value?.achievements || [])
  const titles = computed(() => character.value?.titles || [])
  const activeTitle = computed(() => character.value?.activeTitle || null)
  const guild = computed(() => character.value?.guild || null)
  
  const healthPercentage = computed(() => {
    if (!stats.value.health || !stats.value.maxHealth) return 0
    return Math.round((stats.value.health / stats.value.maxHealth) * 100)
  })
  
  const manaPercentage = computed(() => {
    if (!stats.value.mana || !stats.value.maxMana) return 0
    return Math.round((stats.value.mana / stats.value.maxMana) * 100)
  })
  
  const staminaPercentage = computed(() => {
    if (!stats.value.stamina || !stats.value.maxStamina) return 0
    return Math.round((stats.value.stamina / stats.value.maxStamina) * 100)
  })
  
  const experiencePercentage = computed(() => {
    if (!character.value?.experience || !character.value?.experienceToNext) return 0
    return Math.round((character.value.experience / character.value.experienceToNext) * 100)
  })

  const totalGold = computed(() => {
    const curr = currency.value
    return (curr.gold || 0) + Math.floor((curr.silver || 0) / 100) + Math.floor((curr.copper || 0) / 10000)
  })

  const availableSkillPoints = computed(() => character.value?.skillPoints || 0)
  const availableTalentPoints = computed(() => character.value?.talentPoints || 0)

  const activeQuests = computed(() => {
    return questLog.value.filter(quest => quest.status === 'active')
  })

  const completedQuests = computed(() => {
    return character.value?.completedQuests || []
  })

  const unlockedAchievements = computed(() => {
    return achievements.value.filter(achievement => achievement.unlocked)
  })

  const equippedItems = computed(() => {
    return Object.values(equipment.value).filter(item => item !== null)
  })

  const inventoryItems = computed(() => {
    return inventory.value.items || []
  })

  const freeInventorySlots = computed(() => {
    const totalSlots = inventory.value.size || 30
    const usedSlots = inventoryItems.value.filter(item => item).length
    return totalSlots - usedSlots
  })

  // Actions
  const setPlayerData = (data) => {
    playerData.value = data
    error.value = null
  }

  const updatePlayerData = (updates) => {
    if (playerData.value) {
      playerData.value = { ...playerData.value, ...updates }
    }
  }

  const updateCharacter = (updates) => {
    if (character.value) {
      playerData.value.character = { ...character.value, ...updates }
    }
  }

  const updateStats = (newStats) => {
    if (character.value) {
      playerData.value.character.stats = { ...stats.value, ...newStats }
    }
  }

  const updateCurrency = (newCurrency) => {
    if (character.value) {
      playerData.value.character.currency = { ...currency.value, ...newCurrency }
    }
  }

  const addExperience = (amount) => {
    if (character.value) {
      playerData.value.character.experience = (character.value.experience || 0) + amount
    }
  }

  const levelUp = (levelData) => {
    if (character.value) {
      playerData.value.character.level = levelData.newLevel
      playerData.value.character.skillPoints = levelData.skillPoints
      playerData.value.character.talentPoints = levelData.talentPoints
      
      // Update stats if provided
      if (levelData.statGains) {
        Object.keys(levelData.statGains).forEach(stat => {
          if (stats.value[stat] !== undefined) {
            playerData.value.character.stats[stat] += levelData.statGains[stat]
          }
        })
      }
      
      // Add new abilities if provided
      if (levelData.newAbilities) {
        const currentAbilities = character.value.abilities || []
        playerData.value.character.abilities = [...currentAbilities, ...levelData.newAbilities]
      }
    }
  }

  const updateGold = (amount) => {
    if (character.value) {
      playerData.value.character.currency.gold = amount
    }
  }

  const addGold = (amount) => {
    if (character.value) {
      const currentGold = currency.value.gold || 0
      playerData.value.character.currency.gold = currentGold + amount
    }
  }

  const removeGold = (amount) => {
    if (character.value) {
      const currentGold = currency.value.gold || 0
      playerData.value.character.currency.gold = Math.max(0, currentGold - amount)
    }
  }

  const updateInventory = (newInventory) => {
    if (character.value) {
      playerData.value.character.inventory = { ...inventory.value, ...newInventory }
    }
  }

  const addItemToInventory = (item) => {
    if (character.value) {
      const currentItems = [...inventoryItems.value]
      const emptySlot = currentItems.findIndex(slot => !slot)
      
      if (emptySlot !== -1) {
        currentItems[emptySlot] = item
        playerData.value.character.inventory.items = currentItems
        return true
      }
    }
    return false
  }

  const removeItemFromInventory = (slot) => {
    if (character.value && inventoryItems.value[slot]) {
      const currentItems = [...inventoryItems.value]
      currentItems[slot] = null
      playerData.value.character.inventory.items = currentItems
      return true
    }
    return false
  }

  const moveInventoryItem = (fromSlot, toSlot) => {
    if (character.value) {
      const currentItems = [...inventoryItems.value]
      const item = currentItems[fromSlot]
      currentItems[fromSlot] = currentItems[toSlot]
      currentItems[toSlot] = item
      playerData.value.character.inventory.items = currentItems
      return true
    }
    return false
  }

  const updateEquipment = (newEquipment) => {
    if (character.value) {
      playerData.value.character.equipment = { ...equipment.value, ...newEquipment }
    }
  }

  const equipItem = (item, slot) => {
    if (character.value) {
      playerData.value.character.equipment[slot] = item
      return true
    }
    return false
  }

  const unequipItem = (slot) => {
    if (character.value && equipment.value[slot]) {
      const item = equipment.value[slot]
      playerData.value.character.equipment[slot] = null
      
      // Try to add to inventory
      return addItemToInventory(item)
    }
    return false
  }

  const updateQuest = (questData) => {
    if (character.value) {
      const currentQuests = [...questLog.value]
      const questIndex = currentQuests.findIndex(q => q.id === questData.id)
      
      if (questIndex !== -1) {
        currentQuests[questIndex] = { ...currentQuests[questIndex], ...questData }
      } else {
        currentQuests.push(questData)
      }
      
      playerData.value.character.questLog = currentQuests
    }
  }

  const completeQuest = (questData) => {
    if (character.value) {
      // Remove from active quests
      const activeQuests = questLog.value.filter(q => q.id !== questData.id)
      playerData.value.character.questLog = activeQuests
      
      // Add to completed quests
      const completedQuests = [...(character.value.completedQuests || [])]
      completedQuests.push({
        ...questData,
        completedAt: new Date(),
        status: 'completed'
      })
      playerData.value.character.completedQuests = completedQuests
    }
  }

  const unlockAchievement = (achievement) => {
    if (character.value) {
      const currentAchievements = [...achievements.value]
      const existingIndex = currentAchievements.findIndex(a => a.id === achievement.id)
      
      if (existingIndex !== -1) {
        currentAchievements[existingIndex] = { ...achievement, unlocked: true, unlockedAt: new Date() }
      } else {
        currentAchievements.push({ ...achievement, unlocked: true, unlockedAt: new Date() })
      }
      
      playerData.value.character.achievements = currentAchievements
    }
  }

  const addTitle = (title) => {
    if (character.value) {
      const currentTitles = [...titles.value]
      if (!currentTitles.find(t => t.id === title.id)) {
        currentTitles.push(title)
        playerData.value.character.titles = currentTitles
      }
    }
  }

  const setActiveTitle = (titleId) => {
    if (character.value) {
      const title = titles.value.find(t => t.id === titleId)
      if (title) {
        playerData.value.character.activeTitle = titleId
      }
    }
  }

  const updateGuild = (guildData) => {
    if (character.value) {
      playerData.value.character.guild = guildData
    }
  }

  const joinGuild = (guildData) => {
    updateGuild(guildData)
  }

  const leaveGuild = () => {
    if (character.value) {
      playerData.value.character.guild = null
    }
  }

  const updateSkills = (newSkills) => {
    if (character.value) {
      playerData.value.character.skills = { ...character.value.skills, ...newSkills }
    }
  }

  const learnSkill = (skillId, level = 1) => {
    if (character.value) {
      const currentSkills = character.value.skills || []
      const existingSkill = currentSkills.find(s => s.id === skillId)
      
      if (existingSkill) {
        existingSkill.level = level
      } else {
        currentSkills.push({ id: skillId, level })
      }
      
      playerData.value.character.skills = currentSkills
    }
  }

  const upgradeSkill = (skillId) => {
    if (character.value) {
      const currentSkills = character.value.skills || []
      const skill = currentSkills.find(s => s.id === skillId)
      
      if (skill && availableSkillPoints.value > 0) {
        skill.level += 1
        playerData.value.character.skillPoints -= 1
        return true
      }
    }
    return false
  }

  const updateAbilities = (newAbilities) => {
    if (character.value) {
      playerData.value.character.abilities = newAbilities
    }
  }

  const upgradeAbility = (abilityId) => {
    if (character.value) {
      const currentAbilities = character.value.abilities || []
      const ability = currentAbilities.find(a => a.id === abilityId)
      
      if (ability && availableTalentPoints.value > 0) {
        ability.level += 1
        playerData.value.character.talentPoints -= 1
        return true
      }
    }
    return false
  }

  const updateLocation = (newLocation) => {
    if (character.value) {
      playerData.value.character.location = { ...character.value.location, ...newLocation }
    }
  }

  const updatePvPStats = (newStats) => {
    if (character.value) {
      playerData.value.character.pvpRating = newStats.rating || character.value.pvpRating
      playerData.value.character.pvpKills = newStats.kills || character.value.pvpKills
      playerData.value.character.pvpDeaths = newStats.deaths || character.value.pvpDeaths
    }
  }

  const updateReputation = (faction, amount) => {
    if (character.value) {
      const currentRep = character.value.reputation || {}
      currentRep[faction] = (currentRep[faction] || 0) + amount
      playerData.value.character.reputation = currentRep
    }
  }

  const addPet = (pet) => {
    if (character.value) {
      const currentPets = [...(character.value.pets || [])]
      currentPets.push(pet)
      playerData.value.character.pets = currentPets
    }
  }

  const addMount = (mount) => {
    if (character.value) {
      const currentMounts = [...(character.value.mounts || [])]
      currentMounts.push(mount)
      playerData.value.character.mounts = currentMounts
    }
  }

  const setActivePet = (petId) => {
    if (character.value) {
      playerData.value.character.activePet = petId
    }
  }

  const setActiveMount = (mountId) => {
    if (character.value) {
      playerData.value.character.activeMount = mountId
    }
  }

  const updateSettings = (newSettings) => {
    if (character.value) {
      playerData.value.character.settings = { ...character.value.settings, ...newSettings }
    }
  }

  const clearPlayerData = () => {
    playerData.value = null
    error.value = null
    isLoading.value = false
  }

  const setError = (errorMessage) => {
    error.value = errorMessage
  }

  const setLoading = (loading) => {
    isLoading.value = loading
  }

  return {
    // State
    playerData,
    isLoading,
    error,

    // Computed
    isLoggedIn,
    character,
    characterName,
    characterLevel,
    characterClass,
    characterRace,
    stats,
    currency,
    inventory,
    equipment,
    questLog,
    achievements,
    titles,
    activeTitle,
    guild,
    healthPercentage,
    manaPercentage,
    staminaPercentage,
    experiencePercentage,
    totalGold,
    availableSkillPoints,
    availableTalentPoints,
    activeQuests,
    completedQuests,
    unlockedAchievements,
    equippedItems,
    inventoryItems,
    freeInventorySlots,

    // Actions
    setPlayerData,
    updatePlayerData,
    updateCharacter,
    updateStats,
    updateCurrency,
    addExperience,
    levelUp,
    updateGold,
    addGold,
    removeGold,
    updateInventory,
    addItemToInventory,
    removeItemFromInventory,
    moveInventoryItem,
    updateEquipment,
    equipItem,
    unequipItem,
    updateQuest,
    completeQuest,
    unlockAchievement,
    addTitle,
    setActiveTitle,
    updateGuild,
    joinGuild,
    leaveGuild,
    updateSkills,
    learnSkill,
    upgradeSkill,
    updateAbilities,
    upgradeAbility,
    updateLocation,
    updatePvPStats,
    updateReputation,
    addPet,
    addMount,
    setActivePet,
    setActiveMount,
    updateSettings,
    clearPlayerData,
    setError,
    setLoading
  }
})