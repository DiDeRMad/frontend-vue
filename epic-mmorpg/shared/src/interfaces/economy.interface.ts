import { CurrencyType } from '../enums/index.js';

export interface ICurrency {
  type: CurrencyType;
  amount: number;
  cap?: number;
}