import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ICharacter, Vector3 } from '@epic-mmorpg/shared';

interface CharacterState {
  currentCharacter: ICharacter | null;
  characters: ICharacter[];
  isLoading: boolean;
  error: string | null;
  position: Vector3 | null;
  targetId: string | null;
  isMoving: boolean;
  isCasting: boolean;
}

const initialState: CharacterState = {
  currentCharacter: null,
  characters: [],
  isLoading: false,
  error: null,
  position: null,
  targetId: null,
  isMoving: false,
  isCasting: false,
};

const characterSlice = createSlice({
  name: 'character',
  initialState,
  reducers: {
    setCharacters: (state, action: PayloadAction<ICharacter[]>) => {
      state.characters = action.payload;
    },
    selectCharacter: (state, action: PayloadAction<ICharacter>) => {
      state.currentCharacter = action.payload;
      state.position = {
        x: action.payload.positionX,
        y: action.payload.positionY,
        z: action.payload.positionZ,
      };
    },
    updateCharacter: (state, action: PayloadAction<Partial<ICharacter>>) => {
      if (state.currentCharacter) {
        state.currentCharacter = { ...state.currentCharacter, ...action.payload };
      }
    },
    updatePosition: (state, action: PayloadAction<Vector3>) => {
      state.position = action.payload;
      if (state.currentCharacter) {
        state.currentCharacter.positionX = action.payload.x;
        state.currentCharacter.positionY = action.payload.y;
        state.currentCharacter.positionZ = action.payload.z;
      }
    },
    setTarget: (state, action: PayloadAction<string | null>) => {
      state.targetId = action.payload;
    },
    setMoving: (state, action: PayloadAction<boolean>) => {
      state.isMoving = action.payload;
    },
    setCasting: (state, action: PayloadAction<boolean>) => {
      state.isCasting = action.payload;
    },
    updateHealth: (state, action: PayloadAction<{ current: number; max: number }>) => {
      if (state.currentCharacter) {
        state.currentCharacter.health = action.payload.current;
        state.currentCharacter.maxHealth = action.payload.max;
      }
    },
    updateMana: (state, action: PayloadAction<{ current: number; max: number }>) => {
      if (state.currentCharacter) {
        state.currentCharacter.mana = action.payload.current;
        state.currentCharacter.maxMana = action.payload.max;
      }
    },
    updateExperience: (state, action: PayloadAction<{ current: bigint; toLevelUp: bigint }>) => {
      if (state.currentCharacter) {
        state.currentCharacter.experience = action.payload.current;
      }
    },
    levelUp: (state, action: PayloadAction<number>) => {
      if (state.currentCharacter) {
        state.currentCharacter.level = action.payload;
      }
    },
    clearCharacter: (state) => {
      state.currentCharacter = null;
      state.position = null;
      state.targetId = null;
      state.isMoving = false;
      state.isCasting = false;
    },
  },
});

export const {
  setCharacters,
  selectCharacter,
  updateCharacter,
  updatePosition,
  setTarget,
  setMoving,
  setCasting,
  updateHealth,
  updateMana,
  updateExperience,
  levelUp,
  clearCharacter,
} = characterSlice.actions;

export default characterSlice.reducer;