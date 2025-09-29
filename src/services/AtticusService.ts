/**
 * ✅ ATTICUS SERVICE - DIRECT CANISTER COMMUNICATION
 * Following odin.fun pattern: ZERO intercanister calls, single canister communication
 * All logic consolidated into one Atticus Core canister
 */

import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { pricingEngine } from './OffChainPricingEngine';

// ✅ TYPES - Direct canister communication
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
  bitcoinAddress: string;
  uniqueDepositAddress?: string;
  balance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalWins: number;
  totalLosses: number;
  netPnl: number;
  createdAt: number;
}

export interface PlatformWallet {
  address: string;
  balance: number;
  totalDeposits: number;
  totalWithdrawals: number;
}

export interface WithdrawalRequest {
  id: number;
  user: string;
  amount: number;
  toAddress: string;
  status: 'pending' | 'approved' | 'processed' | 'rejected';
  requestedAt: number;
  processedAt?: number;
  txHash?: string;
}

export class AtticusService {
  private coreCanister: any;
  private agent: HttpAgent;
  private isInitialized: boolean = false;

  constructor() {
    this.agent = new HttpAgent({ host: 'https://ic0.app' });
  }

  /**
   * ✅ INITIALIZE SERVICE
   * Connect to single Atticus Core canister
   */
  public async initialize(canisterId: string): Promise<void> {
    try {
      console.log('🚀 Initializing Atticus Service...');
      
      // Create actor for single canister
      this.coreCanister = Actor.createActor(
        ({ IDL }) => IDL.Service({
          // User management
          create_user: IDL.Func([IDL.Principal], [IDL.Variant({ ok: IDL.Text, err: IDL.Text })], []),
          get_user: IDL.Func([IDL.Principal], [IDL.Opt(IDL.Record({
            principal: IDL.Principal,
            bitcoin_address: IDL.Text,
            unique_deposit_address: IDL.Opt(IDL.Text),
            balance: IDL.Float64,
            total_deposits: IDL.Float64,
            total_withdrawals: IDL.Float64,
            total_wins: IDL.Float64,
            total_losses: IDL.Float64,
            net_pnl: IDL.Float64,
            created_at: IDL.Int
          }))], ['query']),
          get_all_users: IDL.Func([], [IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Record({
            principal: IDL.Principal,
            bitcoin_address: IDL.Text,
            unique_deposit_address: IDL.Opt(IDL.Text),
            balance: IDL.Float64,
            total_deposits: IDL.Float64,
            total_withdrawals: IDL.Float64,
            total_wins: IDL.Float64,
            total_losses: IDL.Float64,
            net_pnl: IDL.Float64,
            created_at: IDL.Int
          })))], ['query']),
          
          // Wallet management
          generate_user_wallet: IDL.Func([IDL.Principal], [IDL.Variant({ ok: IDL.Text, err: IDL.Text })], []),
          process_deposit: IDL.Func([IDL.Principal, IDL.Float64, IDL.Text], [IDL.Variant({ ok: IDL.Text, err: IDL.Text })], []),
          request_withdrawal: IDL.Func([IDL.Principal, IDL.Float64, IDL.Text], [IDL.Variant({ ok: IDL.Nat, err: IDL.Text })], []),
          process_withdrawal: IDL.Func([IDL.Nat, IDL.Text], [IDL.Variant({ ok: IDL.Text, err: IDL.Text })], []),
          get_withdrawal_requests: IDL.Func([], [IDL.Vec(IDL.Record({
            id: IDL.Nat,
            user: IDL.Principal,
            amount: IDL.Float64,
            to_address: IDL.Text,
            status: IDL.Variant({ Pending: IDL.Null, Approved: IDL.Null, Processed: IDL.Null, Rejected: IDL.Null }),
            requested_at: IDL.Int,
            processed_at: IDL.Opt(IDL.Int),
            tx_hash: IDL.Opt(IDL.Text)
          }))], ['query']),
          
          // Platform wallet
          get_platform_wallet: IDL.Func([], [IDL.Record({
            address: IDL.Text,
            balance: IDL.Float64,
            total_deposits: IDL.Float64,
            total_withdrawals: IDL.Float64
          })], ['query']),
          set_platform_bitcoin_address: IDL.Func([IDL.Text], [IDL.Variant({ ok: IDL.Text, err: IDL.Text })], []),
          
          // Trade management
          place_trade_event: IDL.Func([IDL.Record({
            id: IDL.Nat,
            user: IDL.Principal,
            option_type: IDL.Variant({ Call: IDL.Null, Put: IDL.Null }),
            strike_price: IDL.Float64,
            entry_price: IDL.Float64,
            expiry: IDL.Text,
            expiry_timestamp: IDL.Int,
            size: IDL.Float64,
            premium: IDL.Float64,
            status: IDL.Variant({ Active: IDL.Null, Settled: IDL.Null, Expired: IDL.Null }),
            opened_at: IDL.Int,
            settled_at: IDL.Opt(IDL.Int),
            settlement_price: IDL.Opt(IDL.Float64),
            settlement_outcome: IDL.Opt(IDL.Text),
            settlement_payout: IDL.Opt(IDL.Float64),
            settlement_profit: IDL.Opt(IDL.Float64)
          })], [IDL.Variant({ ok: IDL.Text, err: IDL.Text })], []),
          settle_trade_event: IDL.Func([IDL.Nat, IDL.Record({
            final_price: IDL.Float64,
            outcome: IDL.Text,
            payout: IDL.Float64,
            profit: IDL.Float64
          })], [IDL.Variant({ ok: IDL.Text, err: IDL.Text })], []),
          get_user_trades: IDL.Func([IDL.Principal], [IDL.Vec(IDL.Record({
            id: IDL.Nat,
            user: IDL.Principal,
            option_type: IDL.Variant({ Call: IDL.Null, Put: IDL.Null }),
            strike_price: IDL.Float64,
            entry_price: IDL.Float64,
            expiry: IDL.Text,
            expiry_timestamp: IDL.Int,
            size: IDL.Float64,
            premium: IDL.Float64,
            status: IDL.Variant({ Active: IDL.Null, Settled: IDL.Null, Expired: IDL.Null }),
            opened_at: IDL.Int,
            settled_at: IDL.Opt(IDL.Int),
            settlement_price: IDL.Opt(IDL.Float64),
            settlement_outcome: IDL.Opt(IDL.Text),
            settlement_payout: IDL.Opt(IDL.Float64),
            settlement_profit: IDL.Opt(IDL.Float64)
          }))], ['query']),
          get_all_trades: IDL.Func([], [IDL.Vec(IDL.Record({
            id: IDL.Nat,
            user: IDL.Principal,
            option_type: IDL.Variant({ Call: IDL.Null, Put: IDL.Null }),
            strike_price: IDL.Float64,
            entry_price: IDL.Float64,
            expiry: IDL.Text,
            expiry_timestamp: IDL.Int,
            size: IDL.Float64,
            premium: IDL.Float64,
            status: IDL.Variant({ Active: IDL.Null, Settled: IDL.Null, Expired: IDL.Null }),
            opened_at: IDL.Int,
            settled_at: IDL.Opt(IDL.Int),
            settlement_price: IDL.Opt(IDL.Float64),
            settlement_outcome: IDL.Opt(IDL.Text),
            settlement_payout: IDL.Opt(IDL.Float64),
            settlement_profit: IDL.Opt(IDL.Float64)
          }))], ['query']),
          
          // Platform state
          get_platform_state: IDL.Func([], [IDL.Record({
            total_trades: IDL.Nat,
            total_volume: IDL.Float64,
            last_updated: IDL.Int
          })], ['query'])
        }),
        {
          agent: this.agent,
          canisterId: canisterId
        }
      );
      
      this.isInitialized = true;
      console.log('✅ Atticus Service initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Atticus Service:', error);
      throw error;
    }
  }

  /**
   * ✅ PLACE TRADE (OFF-CHAIN PRICING)
   * All pricing logic handled off-chain, only store trade event on-chain
   */
  public async placeTrade(tradeData: TradeData): Promise<TradeResult> {
    if (!this.isInitialized) {
      throw new Error('Atticus Service not initialized');
    }

    try {
      // Get current price from off-chain pricing engine
      const currentPrice = pricingEngine.getCurrentPrice();
      if (currentPrice === 0) {
        throw new Error('Price feed not available');
      }

      // Calculate pricing off-chain
      const strikePrice = pricingEngine.calculateStrikePrice(
        currentPrice, 
        tradeData.strikeOffset, 
        tradeData.optionType
      );
      const premium = pricingEngine.calculatePremium(tradeData.contractCount);

      // Create trade event
      const tradeEvent = {
        id: BigInt(Date.now()),
        user: Principal.fromText(tradeData.userPrincipal),
        option_type: tradeData.optionType === 'call' ? { Call: null } : { Put: null },
        strike_price: strikePrice,
        entry_price: currentPrice,
        expiry: tradeData.expiry,
        expiry_timestamp: Date.now() + (parseInt(tradeData.expiry) * 1000),
        size: tradeData.contractCount,
        premium: premium,
        status: { Active: null },
        opened_at: Date.now(),
        settled_at: null,
        settlement_price: null,
        settlement_outcome: null,
        settlement_payout: null,
        settlement_profit: null
      };

      // Store trade event on-chain
      const result = await this.coreCanister.place_trade_event(tradeEvent);
      
      if ('ok' in result) {
        return {
          success: true,
          tradeId: Number(tradeEvent.id)
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

  /**
   * ✅ SETTLE TRADE (OFF-CHAIN SETTLEMENT)
   * Use off-chain settlement for fast, accurate results
   */
  public async settleTrade(tradeId: number, finalPrice: number): Promise<SettlementResult> {
    if (!this.isInitialized) {
      throw new Error('Atticus Service not initialized');
    }

    try {
      // ✅ FIXED: Use off-chain settlement instead of old backend method
      const { pricingEngine } = await import('./OffChainPricingEngine');
      
      // Get position data from backend to calculate settlement
      const position = await this.coreCanister.get_position(tradeId);
      if (!position || !position.ok) {
        throw new Error('Position not found');
      }
      
      const pos = position.ok;
      const strikeOffset = pos.strike_offset || 0;
      const expiry = pos.expiry || '5s';
      const optionType = pos.option_type?.Call !== undefined ? 'call' : 'put';
      const entryPrice = pos.entry_price || finalPrice;
      
      // Calculate settlement off-chain
      const result = pricingEngine.calculateSettlement(
        optionType,
        strikeOffset,
        expiry,
        finalPrice,
        entryPrice
      );
      
      // Record settlement to backend
      await pricingEngine.recordSettlement(
        tradeId,
        result,
        this.coreCanister
      );
      
      return result;
      
    } catch (error) {
      console.error('❌ Error settling trade:', error);
      throw error;
    }
  }

  /**
   * ✅ GET USER DATA
   * Get user information from single canister
   */
  public async getUser(principal: string): Promise<UserData | null> {
    if (!this.isInitialized) {
      throw new Error('Atticus Service not initialized');
    }

    try {
      const result = await this.coreCanister.get_user(Principal.fromText(principal));
      
      if (result) {
        return {
          principal: result.principal.toString(),
          bitcoinAddress: result.bitcoin_address,
          uniqueDepositAddress: result.unique_deposit_address?.[0],
          balance: Number(result.balance),
          totalDeposits: Number(result.total_deposits),
          totalWithdrawals: Number(result.total_withdrawals),
          totalWins: Number(result.total_wins),
          totalLosses: Number(result.total_losses),
          netPnl: Number(result.net_pnl),
          createdAt: Number(result.created_at)
        };
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error getting user:', error);
      return null;
    }
  }

  /**
   * ✅ GET ALL USERS
   * Get all users from single canister
   */
  public async getAllUsers(): Promise<UserData[]> {
    if (!this.isInitialized) {
      throw new Error('Atticus Service not initialized');
    }

    try {
      const result = await this.coreCanister.get_all_users();
      
      return result.map(([principal, userData]: [Principal, any]) => ({
        principal: principal.toString(),
        bitcoinAddress: userData.bitcoin_address,
        uniqueDepositAddress: userData.unique_deposit_address?.[0],
        balance: Number(userData.balance),
        totalDeposits: Number(userData.total_deposits),
        totalWithdrawals: Number(userData.total_withdrawals),
        totalWins: Number(userData.total_wins),
        totalLosses: Number(userData.total_losses),
        netPnl: Number(userData.net_pnl),
        createdAt: Number(userData.created_at)
      }));
    } catch (error) {
      console.error('❌ Error getting all users:', error);
      return [];
    }
  }

  /**
   * ✅ CREATE USER
   * Create user in the canister (must be called before wallet generation)
   */
  public async createUser(principal: string): Promise<UserData> {
    if (!this.isInitialized) {
      throw new Error('Atticus Service not initialized');
    }

    try {
      const result = await this.coreCanister.create_user(Principal.fromText(principal));
      
      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('❌ Error creating user:', error);
      throw error;
    }
  }

  /**
   * ✅ GENERATE USER WALLET
   * Generate Bitcoin wallet for user (user must exist first)
   */
  public async generateUserWallet(principal: string): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Atticus Service not initialized');
    }

    try {
      const result = await this.coreCanister.generate_user_wallet(Principal.fromText(principal));
      
      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('❌ Error generating user wallet:', error);
      throw error;
    }
  }

  /**
   * ✅ PROCESS DEPOSIT
   * Process Bitcoin deposit using existing backend function
   */
  public async processDeposit(principal: string, amount: number, txHash: string): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('Atticus Service not initialized');
    }

    try {
      const result = await this.coreCanister.deposit_bitcoin(
        Principal.fromText(principal),
        amount,
        txHash
      );
      
      return 'ok' in result;
    } catch (error) {
      console.error('❌ Error processing deposit:', error);
      return false;
    }
  }

  /**
   * ✅ REQUEST WITHDRAWAL
   * Request Bitcoin withdrawal using existing backend function
   */
  public async requestWithdrawal(principal: string, amount: number, toAddress: string): Promise<number> {
    if (!this.isInitialized) {
      throw new Error('Atticus Service not initialized');
    }

    try {
      // Convert amount to satoshis (existing backend expects satoshis)
      const amountSatoshis = Math.round(amount * 100000000);
      
      const result = await this.coreCanister.request_withdrawal(
        Principal.fromText(principal),
        BigInt(amountSatoshis),
        toAddress
      );
      
      if ('ok' in result) {
        return Number(result.ok);
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('❌ Error requesting withdrawal:', error);
      throw error;
    }
  }

  /**
   * ✅ GET PLATFORM WALLET
   * Get platform wallet information
   */
  public async getPlatformWallet(): Promise<PlatformWallet> {
    if (!this.isInitialized) {
      throw new Error('Atticus Service not initialized');
    }

    try {
      const result = await this.coreCanister.get_platform_wallet();
      
      return {
        address: result.address,
        balance: Number(result.balance),
        totalDeposits: Number(result.total_deposits),
        totalWithdrawals: Number(result.total_withdrawals)
      };
    } catch (error) {
      console.error('❌ Error getting platform wallet:', error);
      throw error;
    }
  }

  /**
   * ✅ GET USER TRADES
   * Get user's trade history
   */
  public async getUserTrades(principal: string): Promise<any[]> {
    if (!this.isInitialized) {
      throw new Error('Atticus Service not initialized');
    }

    try {
      const result = await this.coreCanister.get_user_trades(Principal.fromText(principal));
      return result;
    } catch (error) {
      console.error('❌ Error getting user trades:', error);
      return [];
    }
  }

  /**
   * ✅ GET ALL TRADES
   * Get all trades for admin
   */
  public async getAllTrades(): Promise<any[]> {
    if (!this.isInitialized) {
      throw new Error('Atticus Service not initialized');
    }

    try {
      const result = await this.coreCanister.get_all_trades();
      return result;
    } catch (error) {
      console.error('❌ Error getting all trades:', error);
      return [];
    }
  }

  /**
   * ✅ GET WITHDRAWAL REQUESTS
   * Get all withdrawal requests using existing backend function
   */
  public async getWithdrawalRequests(): Promise<WithdrawalRequest[]> {
    if (!this.isInitialized) {
      throw new Error('Atticus Service not initialized');
    }

    try {
      const result = await this.coreCanister.get_all_withdrawals();
      
      return result.map((request: any) => ({
        id: Number(request.id),
        user: request.user.toString(),
        amount: Number(request.amount),
        toAddress: request.to_address,
        status: request.status.Pending ? 'pending' :
                request.status.Approved ? 'approved' :
                request.status.Processed ? 'processed' : 'rejected',
        requestedAt: Number(request.created_at),
        processedAt: request.processed_at ? Number(request.processed_at[0]) : undefined,
        txHash: request.tx_hash?.[0]
      }));
    } catch (error) {
      console.error('❌ Error getting withdrawal requests:', error);
      return [];
    }
  }
}

// ✅ SINGLETON INSTANCE
export const atticusService = new AtticusService();
