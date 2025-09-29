/**
 * ✅ ATTICUS SERVICE - ESSENTIAL FUNCTIONS ONLY
 * Following odin.fun pattern: Only essential trading functions
 * Admin features moved off-chain, wallet generation in treasury canister
 */

import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { pricingEngine } from './OffChainPricingEngine';

// ✅ TYPES - Essential trading only
export interface TradeData {
  optionType: 'call' | 'put';
  strikeOffset: number;
  expiry: string;
  contractCount: number;
  userPrincipal: string;
}

export interface TradeResult {
  success: boolean;
  tradeId?: number;
  error?: string;
}

export interface SettlementResult {
  outcome: 'win' | 'loss';
  payout: number;
  profit: number;
  finalPrice: number;
}

export interface UserData {
  principal: string;
  balance: number;
  totalWins: number;
  totalLosses: number;
  netPnl: number;
  createdAt: number;
}

export interface Position {
  id: number;
  user: string;
  optionType: 'call' | 'put';
  strikePrice: number;
  entryPrice: number;
  expiry: string;
  size: number;
  status: 'Active' | 'Settled';
  openedAt: number;
}

export interface TradeSummary {
  totalTrades: number;
  wins: number;
  losses: number;
}

export class AtticusService {
  private agent: HttpAgent;
  private coreCanister: any;
  private isInitialized: boolean = false;

  constructor() {
    this.agent = new HttpAgent({ host: 'https://ic0.app' });
  }

  // ✅ INITIALIZE WITH ATTICUS CORE CANISTER
  public async initialize(canisterId: string): Promise<void> {
    try {
      console.log('🚀 Initializing Atticus Service with canister:', canisterId);
      
      // ✅ ESSENTIAL FUNCTIONS ONLY - No admin, no wallet generation
      const idlFactory = ({ IDL }: any) => {
        return IDL.Service({
          // User management
          create_user: IDL.Func([IDL.Principal], [IDL.Variant({ ok: IDL.Record({
            balance: IDL.Float64,
            total_wins: IDL.Float64,
            total_losses: IDL.Float64,
            net_pnl: IDL.Float64,
            created_at: IDL.Int
          }), err: IDL.Text })], []),
          get_user: IDL.Func([IDL.Principal], [IDL.Variant({ ok: IDL.Record({
            balance: IDL.Float64,
            total_wins: IDL.Float64,
            total_losses: IDL.Float64,
            net_pnl: IDL.Float64,
            created_at: IDL.Int
          }), err: IDL.Text })], ['query']),
          
          // Trading functions
          place_trade_simple: IDL.Func([
            IDL.Principal, IDL.Text, IDL.Nat, IDL.Text, IDL.Nat, IDL.Nat64, IDL.Nat64
          ], [IDL.Variant({ ok: IDL.Nat, err: IDL.Text })], []),
          recordSettlement: IDL.Func([
            IDL.Nat, IDL.Text, IDL.Nat64, IDL.Nat64, IDL.Nat64
          ], [IDL.Variant({ ok: IDL.Null, err: IDL.Text })], []),
          
          // Position management
          get_position: IDL.Func([IDL.Nat], [IDL.Variant({ ok: IDL.Record({
            id: IDL.Nat,
            user: IDL.Principal,
            option_type: IDL.Variant({ Call: IDL.Null, Put: IDL.Null }),
            strike_price: IDL.Float64,
            entry_price: IDL.Float64,
            expiry: IDL.Text,
            size: IDL.Float64,
            status: IDL.Variant({ Active: IDL.Null, Settled: IDL.Null }),
            opened_at: IDL.Int
          }), err: IDL.Text })], ['query']),
          get_user_positions: IDL.Func([IDL.Principal], [IDL.Vec(IDL.Record({
            id: IDL.Nat,
            user: IDL.Principal,
            option_type: IDL.Variant({ Call: IDL.Null, Put: IDL.Null }),
            strike_price: IDL.Float64,
            entry_price: IDL.Float64,
            expiry: IDL.Text,
            size: IDL.Float64,
            status: IDL.Variant({ Active: IDL.Null, Settled: IDL.Null }),
            opened_at: IDL.Int
          }))], ['query']),
          
          // User trade summary (for frontend history)
          get_user_trade_summary: IDL.Func([IDL.Principal], [IDL.Variant({ 
            ok: IDL.Record({ total_trades: IDL.Nat, wins: IDL.Nat, losses: IDL.Nat }), 
            err: IDL.Text 
          })], ['query'])
        });
      };

      this.coreCanister = Actor.createActor(idlFactory, {
        agent: this.agent,
        canisterId: canisterId
      });

      this.isInitialized = true;
      console.log('✅ Atticus Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Atticus Service:', error);
      throw error;
    }
  }

  // ✅ CREATE USER
  public async createUser(principal: string): Promise<UserData> {
    if (!this.isInitialized) throw new Error('Service not initialized');
    
    try {
      const result = await this.coreCanister.create_user(Principal.fromText(principal));
      if ('ok' in result) {
        return {
          principal,
          balance: Number(result.ok.balance),
          totalWins: Number(result.ok.total_wins),
          totalLosses: Number(result.ok.total_losses),
          netPnl: Number(result.ok.net_pnl),
          createdAt: Number(result.ok.created_at)
        };
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('❌ Error creating user:', error);
      throw error;
    }
  }

  // ✅ GET USER
  public async getUser(principal: string): Promise<UserData> {
    if (!this.isInitialized) throw new Error('Service not initialized');
    
    try {
      const result = await this.coreCanister.get_user(Principal.fromText(principal));
      if ('ok' in result) {
        return {
          principal,
          balance: Number(result.ok.balance),
          totalWins: Number(result.ok.total_wins),
          totalLosses: Number(result.ok.total_losses),
          netPnl: Number(result.ok.net_pnl),
          createdAt: Number(result.ok.created_at)
        };
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('❌ Error getting user:', error);
      throw error;
    }
  }

  // ✅ PLACE TRADE (using off-chain pricing)
  public async placeTrade(tradeData: TradeData): Promise<TradeResult> {
    if (!this.isInitialized) throw new Error('Service not initialized');
    
    try {
      // Get current price from off-chain pricing engine
      const currentPrice = pricingEngine.getCurrentPrice();
      if (currentPrice === 0) {
        throw new Error('Price feed not available');
      }

      // Calculate strike price off-chain
      const strikePrice = pricingEngine.calculateStrikePrice(
        currentPrice, 
        tradeData.strikeOffset, 
        tradeData.optionType
      );

      const result = await this.coreCanister.place_trade_simple(
        Principal.fromText(tradeData.userPrincipal),
        tradeData.optionType === 'call' ? 'Call' : 'Put',
        tradeData.strikeOffset,
        tradeData.expiry,
        tradeData.contractCount,
        Math.round(currentPrice * 100), // Convert to cents
        Math.round(strikePrice * 100)   // Convert to cents
      );

      if ('ok' in result) {
        return {
          success: true,
          tradeId: Number(result.ok)
        };
      } else {
        return {
          success: false,
          error: result.err
        };
      }
    } catch (error) {
      console.error('❌ Error placing trade:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ✅ RECORD SETTLEMENT (using off-chain calculation)
  public async recordSettlement(
    positionId: number,
    settlementResult: SettlementResult
  ): Promise<void> {
    if (!this.isInitialized) throw new Error('Service not initialized');
    
    try {
      const result = await this.coreCanister.recordSettlement(
        BigInt(positionId),
        settlementResult.outcome,
        Math.round(settlementResult.payout * 100), // Convert to cents
        Math.round(settlementResult.profit * 100), // Convert to cents
        Math.round(settlementResult.finalPrice * 100) // Convert to cents
      );
      
      if ('err' in result) {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('❌ Error recording settlement:', error);
      throw error;
    }
  }

  // ✅ GET POSITION
  public async getPosition(positionId: number): Promise<Position> {
    if (!this.isInitialized) throw new Error('Service not initialized');
    
    try {
      const result = await this.coreCanister.get_position(BigInt(positionId));
      if ('ok' in result) {
        return {
          id: Number(result.ok.id),
          user: result.ok.user.toString(),
          optionType: result.ok.option_type.Call ? 'call' : 'put',
          strikePrice: Number(result.ok.strike_price),
          entryPrice: Number(result.ok.entry_price),
          expiry: result.ok.expiry,
          size: Number(result.ok.size),
          status: result.ok.status.Active ? 'Active' : 'Settled',
          openedAt: Number(result.ok.opened_at)
        };
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('❌ Error getting position:', error);
      throw error;
    }
  }

  // ✅ GET USER POSITIONS
  public async getUserPositions(principal: string): Promise<Position[]> {
    if (!this.isInitialized) throw new Error('Service not initialized');
    
    try {
      const positions = await this.coreCanister.get_user_positions(Principal.fromText(principal));
      return positions.map((pos: any) => ({
        id: Number(pos.id),
        user: pos.user.toString(),
        optionType: pos.option_type.Call ? 'call' : 'put',
        strikePrice: Number(pos.strike_price),
        entryPrice: Number(pos.entry_price),
        expiry: pos.expiry,
        size: Number(pos.size),
        status: pos.status.Active ? 'Active' : 'Settled',
        openedAt: Number(pos.opened_at)
      }));
    } catch (error) {
      console.error('❌ Error getting user positions:', error);
      throw error;
    }
  }

  // ✅ GET USER TRADE SUMMARY (for frontend history menu)
  public async getUserTradeSummary(principal: string): Promise<TradeSummary> {
    if (!this.isInitialized) throw new Error('Service not initialized');
    
    try {
      const result = await this.coreCanister.get_user_trade_summary(Principal.fromText(principal));
      if ('ok' in result) {
        return {
          totalTrades: Number(result.ok.total_trades),
          wins: Number(result.ok.wins),
          losses: Number(result.ok.losses)
        };
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('❌ Error getting user trade summary:', error);
      throw error;
    }
  }
}

// ✅ SINGLETON INSTANCE
export const atticusService = new AtticusService();