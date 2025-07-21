import { createStore } from 'vuex'

export interface RootState {
  // Можно расширять под нужды форм
  forms: Record<string, any>
}

const store = createStore<RootState>({
  state: {
    forms: {},
  },
  mutations: {
    setForm(state, { key, value }) {
      state.forms[key] = value
    },
    resetForm(state, key) {
      state.forms[key] = undefined
    },
  },
  actions: {},
  getters: {},
  modules: {},
})

export default store 