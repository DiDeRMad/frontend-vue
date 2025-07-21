import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../stores/store';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const gameApi = createApi({
  reducerPath: 'gameApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Player', 'Character', 'Inventory', 'Quest', 'Guild', 'Auction'],
  endpoints: (builder) => ({
    // Auth endpoints
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),
    logout: builder.mutation({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),

    // Character endpoints
    getCharacters: builder.query({
      query: () => '/characters',
      providesTags: ['Character'],
    }),
    createCharacter: builder.mutation({
      query: (characterData) => ({
        url: '/characters',
        method: 'POST',
        body: characterData,
      }),
      invalidatesTags: ['Character'],
    }),
    deleteCharacter: builder.mutation({
      query: (characterId) => ({
        url: `/characters/${characterId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Character'],
    }),

    // Inventory endpoints
    getInventory: builder.query({
      query: (characterId) => `/inventory/${characterId}`,
      providesTags: ['Inventory'],
    }),
    moveItem: builder.mutation({
      query: ({ characterId, fromSlot, toSlot }) => ({
        url: `/inventory/${characterId}/move`,
        method: 'POST',
        body: { fromSlot, toSlot },
      }),
      invalidatesTags: ['Inventory'],
    }),

    // Quest endpoints
    getQuests: builder.query({
      query: (characterId) => `/quests/${characterId}`,
      providesTags: ['Quest'],
    }),
    acceptQuest: builder.mutation({
      query: ({ characterId, questId }) => ({
        url: `/quests/${characterId}/accept/${questId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Quest'],
    }),
    completeQuest: builder.mutation({
      query: ({ characterId, questId }) => ({
        url: `/quests/${characterId}/complete/${questId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Quest'],
    }),

    // Guild endpoints
    getGuild: builder.query({
      query: (guildId) => `/guilds/${guildId}`,
      providesTags: ['Guild'],
    }),
    createGuild: builder.mutation({
      query: (guildData) => ({
        url: '/guilds',
        method: 'POST',
        body: guildData,
      }),
      invalidatesTags: ['Guild'],
    }),

    // Auction endpoints
    getAuctions: builder.query({
      query: (params) => ({
        url: '/auctions',
        params,
      }),
      providesTags: ['Auction'],
    }),
    createAuction: builder.mutation({
      query: (auctionData) => ({
        url: '/auctions',
        method: 'POST',
        body: auctionData,
      }),
      invalidatesTags: ['Auction'],
    }),
    bidOnAuction: builder.mutation({
      query: ({ auctionId, amount }) => ({
        url: `/auctions/${auctionId}/bid`,
        method: 'POST',
        body: { amount },
      }),
      invalidatesTags: ['Auction'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetCharactersQuery,
  useCreateCharacterMutation,
  useDeleteCharacterMutation,
  useGetInventoryQuery,
  useMoveItemMutation,
  useGetQuestsQuery,
  useAcceptQuestMutation,
  useCompleteQuestMutation,
  useGetGuildQuery,
  useCreateGuildMutation,
  useGetAuctionsQuery,
  useCreateAuctionMutation,
  useBidOnAuctionMutation,
} = gameApi;