import { ActorSubclass } from '@dfinity/agent';
import { _SERVICE as BackendCanister } from '../declarations/backend/backend.did';
import { Principal } from '@dfinity/principal';

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return String(error);
};

export interface TradeRequest {
  optionType: 'call' | 'put';
  strikeOffset: number;  // ✅ FIXED: Use strike offset instead of strike price
  expiry: string;
  size: number;
}

export interface TradeResult {
  orderId: number;
  positionId: number;
  txHash: string;
  status: 'success' | 'failed';
  message: string;
  premium?: number;
  estimatedPayout?: number;
}

export interface SettlementResult {
  outcome: 'win' | 'loss' | 'tie';
  finalPrice: number;
  profit?: number;
  payout?: number;
}

// ✅ PAYOUT TABLES ARE HANDLED BY BACKEND - No need for frontend tables

export class TradingService {
  public canister: ActorSubclass<BackendCanister> | null = null; // ✅ CHANGED: Made public for blockchain monitor access
  private isInitialized: boolean = false;

  async initialize(canister: ActorSubclass<BackendCanister>): Promise<void> {
    try {
      this.canister = canister;
      this.isInitialized = true;
      console.log('✅ Trading service initialized with advanced payout system');
    } catch (error: unknown) {
      console.error('❌ Failed to initialize:', getErrorMessage(error));
      throw error;
    }
  }

  // ✅ NEW: Update price oracle with current price
  async updatePriceOracle(_price: number): Promise<void> {
    try {
      // Import the canister context to get access to price oracle
      // Note: This will be called from components that have access to the canister context
    } catch (error: unknown) {
      console.error('❌ Failed to update price oracle:', getErrorMessage(error));
    }
  }

  // ✅ WORKING TRADE - Matches copy 3 exactly
  async placeTrade(userPrincipal: string, tradeRequest: TradeRequest, isDemoMode: boolean = false, currentBtcPrice?: number): Promise<TradeResult> {
    try {
      // ✅ FIXED: Check if trading service is ready, not just canister
      if (!isDemoMode && !this.isInitialized) {
        throw new Error('Trading service not initialized');
      }
      console.log('🚀 Simple trade:', tradeRequest);

      // ✅ DEMO TRADE LOGIC: Handle demo mode separately
      if (isDemoMode) {
        console.log('🎮 Demo trade simulation:', tradeRequest);
        
        // Simulate trade processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const demoOrderId = Math.floor(Math.random() * 1000000);
        console.log('✅ Demo trade successful! Order ID:', demoOrderId);
        
        return {
          orderId: demoOrderId,
          positionId: demoOrderId,
          txHash: `demo-tx-${demoOrderId}`,
          status: 'success',
          message: 'Demo trade executed successfully'
        };
      }

      // Live trade logic continues...
      if (!this.canister) throw new Error('Trading service not initialized');

      // Create principal - use demo principal for demo mode, real principal for live
      const principal = Principal.fromText(userPrincipal);
      
      // Format option type for backend (must match working version exactly)
      const optionType = tradeRequest.optionType === 'call' ? { 'Call': null } : { 'Put': null };
      
      // ✅ FIXED: Use strike offset instead of strike price cents
      const strikeOffset = tradeRequest.strikeOffset; // Use the strike offset directly
      const contractCount = BigInt(Math.floor(tradeRequest.size)); // ✅ FIXED: Size is now contract count (1, 2, 3, etc.)
      const expiry = String(tradeRequest.expiry).endsWith('s') ? String(tradeRequest.expiry) : String(tradeRequest.expiry) + 's';

      console.log('📋 Calling backend with:', {
        user: principal.toString(),
        optionType,
        strikeOffset: strikeOffset,
        expiry,
        contractCount: contractCount.toString()
      });

      // ✅ FIXED: Use new backend signature with strike offset
      console.log('🔄 Calling backend with strike offset...');
      console.log('🔍 DEBUG: currentBtcPrice value:', currentBtcPrice);
      console.log('🔍 DEBUG: currentBtcPrice type:', typeof currentBtcPrice);
      console.log('🔍 DEBUG: Sending parameter:', currentBtcPrice || null);
      console.log('🔍 DEBUG: Parameter type:', typeof (currentBtcPrice || null));
        console.log('🔍 DEBUG: CACHE BUSTER - Version 5.0 - FINAL FIX - NUMBER TYPE');
      
        // ✅ FIXED: Convert strike offset to integer (multiply by 10: 2.5 → 25)
        const strikeOffsetInt = Math.round(strikeOffset * 10);
        
        console.log('🔍 DEBUG: Strike offset conversion:', {
            original: strikeOffset,
            converted: strikeOffsetInt,
            type: typeof strikeOffsetInt
        });
        
        const result = await this.canister.place_option_order(
            principal,
            optionType,
            BigInt(strikeOffsetInt),  // ✅ FIXED: Convert to BigInt for Nat parameter
            expiry,
            contractCount,
            currentBtcPrice ? [currentBtcPrice] : []  // ✅ FIXED: Pass current BTC price as array
        ) as any;

      if (result && 'ok' in result) {
        const orderId = Number(result.ok);
        console.log('✅ Trade successful! Order ID:', orderId);
        console.log('📊 Trade details recorded:', {
          user: principal.toString(),
          optionType: tradeRequest.optionType,
          strikeOffset: tradeRequest.strikeOffset,
          expiry: tradeRequest.expiry,
          size: tradeRequest.size,
          orderId
        });
        
        return {
          orderId,
          positionId: orderId,
          txHash: `trade-${orderId}`,
          status: 'success',
          message: 'Trade executed successfully!',
          premium: tradeRequest.size * 0.01,
          estimatedPayout: tradeRequest.size * 0.85
        };
      } else {
        console.error('❌ Backend returned error:', result);
        throw new Error('Backend error: ' + (result?.err || 'Unknown'));
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      console.error('❌ Trade failed:', errorMessage);
      return {
        orderId: 0,
        positionId: 0,
        txHash: '',
        status: 'failed' as const,
        message: errorMessage
      };
    }
  }


  // ✅ SIMPLE SETTLEMENT - Uses backend settleTrade method
  async autoSettleTrade(tradeId: string, finalPrice: number, tradeData?: { optionType: 'call' | 'put', strikeOffset: number, expiry?: string }, isDemoMode: boolean = false, userPrincipal?: string): Promise<SettlementResult> {
    try {
      // ✅ FIXED: Check if trading service is initialized, not just canister
      if (!this.isInitialized) {
        throw new Error('Trading service not initialized');
      }
      
      // ✅ ADD: Price validation
      if (finalPrice <= 0) {
        throw new Error('Invalid final price: must be positive');
      }
      
      if (tradeData && tradeData.strikeOffset <= 0) {
        throw new Error('Invalid strike offset: must be positive');
      }
      
      // ✅ ADD: Price sanity check - calculate strike price from offset
      if (tradeData) {
        const entryPrice = finalPrice; // Use current price as entry price for demo
        const strikePrice = tradeData.optionType === 'call' 
          ? entryPrice + tradeData.strikeOffset 
          : entryPrice - tradeData.strikeOffset;
        
        if (Math.abs(finalPrice - strikePrice) > 10000) {
          console.warn('⚠️ Large price difference detected:', {
            finalPrice,
            strikePrice,
            difference: Math.abs(finalPrice - strikePrice)
          });
        }
      }
      
      console.log('🔄 Settling trade:', tradeId, 'at price:', finalPrice);
      
      // ✅ DEMO SETTLEMENT LOGIC: Handle demo mode separately
      if (isDemoMode || this.canister === null) {
        console.log('🎮 Demo settlement simulation:', tradeId, 'at price:', finalPrice);
        
        // Simulate settlement processing delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // ✅ REALISTIC DEMO OUTCOME: Use actual price-based logic if trade data available
        let outcome: 'win' | 'loss' | 'tie' = 'loss';
        let profit = -1; // Default to losing the $1 entry premium
        let payout = 0;
        
        if (tradeData) {
          // ✅ FIXED: Calculate strike price from entry price and offset
          const entryPrice = finalPrice; // Use current price as entry price for demo
          const strikePrice = tradeData.optionType === 'call' 
            ? entryPrice + tradeData.strikeOffset 
            : entryPrice - tradeData.strikeOffset;
          
          // ✅ ENHANCED DEBUG: Comprehensive logging for troubleshooting
          console.log('🎮 Demo settlement debug:', {
            optionType: tradeData.optionType,
            finalPrice,
            entryPrice,
            strikeOffset: tradeData.strikeOffset,
            calculatedStrikePrice: strikePrice,
            finalPriceVsStrike: finalPrice > strikePrice ? 'finalPrice > strikePrice' : 'finalPrice <= strikePrice',
            difference: Math.abs(finalPrice - strikePrice),
            // ✅ ADD THESE DEBUG FIELDS:
            currentTime: Date.now(),
            pricePrecision: {
              finalPriceDecimal: finalPrice.toString().split('.')[1]?.length || 0,
              strikePriceDecimal: strikePrice.toString().split('.')[1]?.length || 0
            }
          });
          
          // ✅ ENHANCED: More robust win/loss calculation
          const priceDifference = finalPrice - strikePrice;
          const isTie = Math.abs(priceDifference) < 0.005; // 0.5 cent tolerance

          let isWin = false;
          if (!isTie) {
            if (tradeData.optionType === 'call') {
              isWin = priceDifference > 0; // finalPrice > strikePrice
            } else {
              isWin = priceDifference < 0; // finalPrice < strikePrice
            }
          }

          // ✅ ADD: Detailed outcome logging
          console.log('🎯 Settlement calculation:', {
            optionType: tradeData.optionType,
            finalPrice,
            strikePrice,
            priceDifference,
            isTie,
            isWin,
            expectedOutcome: tradeData.optionType === 'call' ? 'finalPrice > strikePrice' : 'finalPrice < strikePrice'
          });
          
          if (isTie) {
            outcome = 'tie';
            profit = 0; // Refund entry premium
            payout = 1;
          } else if (isWin) {
            outcome = 'win';
            profit = 1; // Simple $1 profit for demo
            payout = 2; // $2 total payout ($1 profit + $1 refund)
          } else {
            outcome = 'loss';
            profit = -1; // Lose entry premium
            payout = 0;
          }
        } else {
          // Fallback to random if no trade data (shouldn't happen)
          const isWin = Math.random() > 0.5;
          outcome = isWin ? 'win' : 'loss';
          profit = isWin ? 1 : -1;
          payout = isWin ? 2 : 0;
        }
        
        // ✅ ADD: Settlement result verification
        const settlementResult = {
          outcome,
          finalPrice,
          profit,
          payout
        };

        // ✅ VERIFY: Settlement logic correctness
        if (tradeData) {
          // Calculate strike price from offset for verification
          const entryPrice = finalPrice; // Use current price as entry price for demo
          const strikePrice = tradeData.optionType === 'call' 
            ? entryPrice + tradeData.strikeOffset 
            : entryPrice - tradeData.strikeOffset;
            
          console.log('✅ Settlement verification:', {
            positionId: tradeId,
            expectedWin: tradeData.optionType === 'call' ? finalPrice > strikePrice : finalPrice < strikePrice,
            actualOutcome: outcome,
            isCorrect: (tradeData.optionType === 'call' ? finalPrice > strikePrice : finalPrice < strikePrice) === (outcome === 'win')
          });
        }

        console.log('✅ Demo settlement successful:', { 
          positionId: tradeId, 
          finalPrice, 
          outcome, 
          profit, 
          payout 
        });
        
        // ✅ FIX: Apply correction to demo mode as well
        console.log('🔧 DEMO MODE: Before correction:', settlementResult);
        const correctedSettlement = this.correctSettlementResult(settlementResult, tradeData);
        console.log('🔧 DEMO MODE: After correction:', correctedSettlement);
        
        return correctedSettlement;
      }

      // Live settlement logic continues...
      if (!this.canister) throw new Error('Trading service not initialized');
      
      // Convert price to nat64 (BigInt) - backend expects nat64, not float64
      const finalPriceCents = BigInt(Math.floor(finalPrice * 100));
      
      // ✅ SIMPLIFIED: Use position ID directly
      const positionId = parseInt(tradeId);
      const user = userPrincipal ? Principal.fromText(userPrincipal) : Principal.anonymous();
      
      console.log('🔄 Calling backend settleTrade with:', {
        positionId,
        finalPrice,
        finalPriceCents: finalPriceCents.toString(),
        userPrincipal: userPrincipal
      });
      
      const result = await this.canister.settleTrade(BigInt(positionId), finalPriceCents, user) as any;
      
      console.log('🔄 Backend settleTrade result:', result);
      
      if (result && 'ok' in result) {
        const settlement = result.ok;
        console.log('✅ Settlement successful:', settlement);
        console.log('🔍 Full settlement object keys:', Object.keys(settlement));
        console.log('🔍 Settlement object values:', Object.values(settlement));
        
        // ✅ FIX: Override backend payout with correct frontend calculation
        console.log('🔧 LIVE MODE: Before correction:', settlement);
        const correctedSettlement = this.correctSettlementResult(settlement, tradeData);
        console.log('🔧 LIVE MODE: After correction:', correctedSettlement);
        
        return {
          outcome: correctedSettlement.outcome as 'win' | 'loss' | 'tie',
          finalPrice,
          profit: correctedSettlement.profit,
          payout: correctedSettlement.payout
        };
      } else {
        console.error('❌ Backend settlement failed:', result);
        throw new Error('Settlement failed: ' + (result?.err || 'Unknown'));
      }
    } catch (error: unknown) {
      console.error('❌ Settlement failed:', getErrorMessage(error));
      console.error('❌ Full error details:', error);
      return {
        outcome: 'loss',
        finalPrice,
        profit: -1,
        payout: 0
      };
    }
  }

  // ✅ FIX: Correct backend settlement result with proper payout table
  private correctSettlementResult(settlement: any, tradeData?: { optionType: 'call' | 'put', strikeOffset: number, expiry?: string }): any {
    console.log('🔧 correctSettlementResult called with:', {
      settlement,
      tradeData,
      hasTradeData: !!tradeData,
      hasStrikeOffset: !!(tradeData?.strikeOffset),
      hasExpiry: !!(tradeData?.expiry),
      outcome: settlement.outcome
    });
    
    // ✅ CORRECT PAYOUT TABLE (matching frontend)
    const PAYOUT_TABLE: Record<string, Record<number, number>> = {
      '5s': { 2.5: 3.33, 5: 4.00, 10: 10.00, 15: 20.00 },
      '10s': { 2.5: 2.86, 5: 3.33, 10: 6.67, 15: 13.33 },
      '15s': { 2.5: 2.50, 5: 2.86, 10: 5.00, 15: 10.00 }
    };

    // If it's a winning trade, recalculate with correct payout table
    if (settlement.outcome === 'win' && tradeData && tradeData.strikeOffset && tradeData.expiry) {
      // Use the original strike offset selected by user (not calculated from price difference)
      const strikeOffset = tradeData.strikeOffset;
      const expiry = tradeData.expiry;
      
      // Get correct payout from table using the original strike offset
      let correctPayout = 0;
      if (strikeOffset === 2.5 && PAYOUT_TABLE[expiry] && PAYOUT_TABLE[expiry][2.5] !== undefined) {
        correctPayout = PAYOUT_TABLE[expiry][2.5];
      } else if (strikeOffset === 5 && PAYOUT_TABLE[expiry] && PAYOUT_TABLE[expiry][5] !== undefined) {
        correctPayout = PAYOUT_TABLE[expiry][5];
      } else if (strikeOffset === 10 && PAYOUT_TABLE[expiry] && PAYOUT_TABLE[expiry][10] !== undefined) {
        correctPayout = PAYOUT_TABLE[expiry][10];
      } else if (strikeOffset === 15 && PAYOUT_TABLE[expiry] && PAYOUT_TABLE[expiry][15] !== undefined) {
        correctPayout = PAYOUT_TABLE[expiry][15];
      }
      
      // Table shows total payout (what user receives)
      const totalPayout = correctPayout;
      const correctProfit = correctPayout - 1.0; // Net profit = total payout - entry cost
      
      console.log('🔧 Correcting settlement:', {
        originalProfit: settlement.profit,
        originalPayout: settlement.payout,
        correctProfit,
        totalPayout,
        strikeOffset,
        expiry,
        userSelectedOffset: tradeData.strikeOffset
      });
      
      return {
        ...settlement,
        profit: correctProfit,
        payout: totalPayout
      };
    }
    
    // For non-winning trades, return as-is
    console.log('🔧 No correction applied - returning original settlement:', settlement);
    return settlement;
  }


  // ✅ ALL YOUR ADMIN PANEL METHODS
  getStatus(): { canister: boolean; platformWallet: boolean; liquidityPool: boolean } {
    return {
      canister: this.canister !== null,
      platformWallet: this.isInitialized,
      liquidityPool: this.isInitialized
    };
  }

  async getPlatformWallet(): Promise<{ address: string; balance: number; totalDeposits: number; totalWithdrawals: number } | null> {
    try {
      if (!this.canister) return null;
      const wallet = await this.canister.get_platform_wallet() as any;
      if (!wallet) return null;
      
      const address = wallet.address || '';
      
      // ✅ NEW: Get REAL balance from blockchain instead of stored value
      let realBalance = 0;
      try {
        realBalance = await this.getRealBitcoinBalance(address);
        console.log('💰 Real platform wallet balance from blockchain:', realBalance, 'BTC');
      } catch (error) {
        console.warn('⚠️ Failed to get real balance, using stored value:', error);
        realBalance = wallet.balance || 0;
      }
      
      return {
        address: address,
        balance: realBalance, // Use real balance from blockchain
        totalDeposits: wallet.total_deposits || 0,
        totalWithdrawals: wallet.total_withdrawals || 0
      };
    } catch (error: unknown) {
      console.error('❌ Failed to get platform wallet:', getErrorMessage(error));
      return null;
    }
  }

  // ✅ NEW: Get real Bitcoin balance from blockchain
  private async getRealBitcoinBalance(address: string): Promise<number> {
    try {
      console.log('🔍 Fetching real balance for address:', address.substring(0, 12) + '...');
      
      // ✅ ENHANCED: Use CORS proxy for reliable API access
      const corsProxy = 'https://api.allorigins.win/raw?url=';
      const apiUrls = [
        // Primary: Blockstream API with CORS proxy
        `${corsProxy}${encodeURIComponent(`https://blockstream.info/api/address/${address}`)}`,
        // Alternative: Blockchain.info API with CORS proxy
        `${corsProxy}${encodeURIComponent(`https://blockchain.info/q/addressbalance/${address}`)}`,
        // Alternative: Blockchair API with CORS proxy
        `${corsProxy}${encodeURIComponent(`https://api.blockchair.com/bitcoin/dashboards/address/${address}`)}`,
        // Alternative: Mempool.space API with CORS proxy
        `${corsProxy}${encodeURIComponent(`https://mempool.space/api/address/${address}`)}`,
        // Fallback: BlockCypher with CORS proxy
        `${corsProxy}${encodeURIComponent(`https://api.blockcypher.com/v1/btc/main/addrs/${address}/balance`)}`,
        // ✅ FALLBACK: Direct APIs (may work in some browser contexts)
        `https://blockstream.info/api/address/${address}`,
        `https://blockchain.info/q/addressbalance/${address}`,
        `https://api.blockchair.com/bitcoin/dashboards/address/${address}`,
        `https://mempool.space/api/address/${address}`,
        `https://api.blockcypher.com/v1/btc/main/addrs/${address}/balance`
      ];

      let lastError: Error | null = null;

      for (const url of apiUrls) {
        let endpointName = 'Unknown';
        // ✅ ENHANCED: Detect endpoint name for both CORS proxy and direct URLs
        if (url.includes('blockstream.info')) endpointName = 'Blockstream';
        else if (url.includes('blockchain.info')) endpointName = 'Blockchain.info';
        else if (url.includes('blockchair.com')) endpointName = 'Blockchair';
        else if (url.includes('mempool.space')) endpointName = 'Mempool.space';
        else if (url.includes('blockcypher.com')) endpointName = 'BlockCypher';
        
        // Add proxy indicator
        if (url.includes('allorigins.win')) {
          endpointName += ' (via CORS proxy)';
        }
        
        try {
          console.log(`🌐 Trying ${endpointName} for real balance...`);
          
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(10000) // 10 second timeout
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          let data = await response.json();
          
          // ✅ ENHANCED: Handle CORS proxy response format
          if (url.includes('allorigins.win')) {
            // AllOrigins returns the raw response directly
            console.log('📦 CORS proxy response received');
          } else if (data.contents) {
            // Handle legacy AllOrigins wrapper format
            data = JSON.parse(data.contents);
          }
          
          // ✅ UPDATED: Parse balance based on different API formats
          let balanceSatoshis = 0;
          
          if (url.includes('blockstream.info')) {
            // Blockstream format: { chain_stats: { funded_txo_sum: X, spent_txo_sum: Y } }
            if (data.chain_stats) {
              balanceSatoshis = data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
            }
          } else if (url.includes('blockchain.info')) {
            // Blockchain.info format: just the balance number
            balanceSatoshis = parseInt(data) || 0;
          } else if (url.includes('blockchair.com')) {
            // Blockchair format: { data: { [address]: { address: { balance: X } } } }
            if (data.data && data.data[address] && data.data[address].address) {
              balanceSatoshis = data.data[address].address.balance || 0;
            }
          } else if (url.includes('mempool.space')) {
            // Mempool.space format: { chain_stats: { funded_txo_sum: X, spent_txo_sum: Y } }
            if (data.chain_stats) {
              balanceSatoshis = data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
            }
          } else if (url.includes('blockcypher.com')) {
            // BlockCypher format: { balance: X }
            balanceSatoshis = data.balance || 0;
          }
          
          // Convert satoshis to BTC
          const balanceBTC = balanceSatoshis / 100000000;
          
          if (balanceBTC >= 0) {
            console.log(`✅ Got real balance from ${endpointName}:`, balanceBTC, 'BTC');
            return balanceBTC;
          } else {
            throw new Error('Invalid balance received');
          }
          
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          
          // ✅ ENHANCED: Categorize errors for better debugging
          if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            console.warn(`🌐 Network/CORS Error: ${endpointName} - ${lastError.message}`);
          } else if (lastError.message.includes('429')) {
            console.warn(`⏱️ Rate limit: ${endpointName} - ${lastError.message}`);
          } else if (lastError.message.includes('403')) {
            console.warn(`🚫 CORS/Forbidden: ${endpointName} - ${lastError.message}`);
          } else if (lastError.message.includes('500')) {
            console.warn(`🔥 Server error: ${endpointName} - ${lastError.message}`);
          } else {
            console.warn(`⚠️ API Error: ${endpointName} - ${lastError.message}`);
          }
          
          continue;
        }
      }

      // If all endpoints failed
      throw lastError || new Error('All Bitcoin API endpoints failed');
      
    } catch (error) {
      console.error('❌ Failed to get real Bitcoin balance:', error);
      throw error;
    }
  }

  async transferFromPlatformToExternal(address: string, amount: number): Promise<{ status: string; message: string }> {
    try {
      if (!this.canister) throw new Error('Trading service not initialized');
      const result = await (this.canister as any).admin_withdraw_liquidity?.(amount, address);
      if (result && 'ok' in result) {
        return { status: 'success', message: result.ok };
      } else {
        throw new Error(result?.err || 'Transfer failed');
      }
    } catch (error: unknown) {
      return { status: 'failed', message: getErrorMessage(error) };
    }
  }

  async generateUserWallet(userPrincipal: string): Promise<{ address: string }> {
    try {
      if (!this.canister) throw new Error('Service not initialized');
      const principal = Principal.fromText(userPrincipal);
      const result = await this.canister.generate_user_wallet(principal) as any;
      if (result && 'ok' in result) {
        return { address: result.ok };
      } else {
        throw new Error('Wallet generation failed');
      }
    } catch (error: unknown) {
      console.error('❌ Failed to generate wallet:', getErrorMessage(error));
      throw error;
    }
  }

  async updateBTCPrice(priceInCents: number): Promise<void> {
    try {
      if (!this.canister) return;
      await this.canister.update_btc_price(priceInCents / 100);
    } catch (error: unknown) {
      console.error('❌ Failed to update BTC price:', getErrorMessage(error));
    }
  }

  initializeDemoMode(): void {
    this.canister = null; // No real canister in demo
    this.isInitialized = true; // Mark as ready for demo trades
    console.log('✅ Demo trading service initialized');
  }

  isReady(): boolean {
    return this.isInitialized; // Remove canister requirement for demo mode
  }

  /**
   * Generate unique deposit address for user
   */
  async generateUniqueDepositAddress(userPrincipal: string): Promise<{status: 'success' | 'failed', address?: string, message: string}> {
    try {
      if (!this.canister) throw new Error('Trading service not initialized');
      
      console.log('🏦 Generating unique deposit address for user:', userPrincipal);

      const principal = Principal.fromText(userPrincipal);
      const result = await this.canister.generate_unique_deposit_address(principal);

      if ('ok' in result) {
        console.log('✅ Unique deposit address generated:', result.ok);
        return {
          status: 'success',
          address: result.ok,
          message: 'Unique deposit address generated successfully'
        };
      } else {
        console.error('❌ Failed to generate deposit address:', result.err);
        return {
          status: 'failed',
          message: result.err
        };
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      console.error('❌ Generate deposit address error:', errorMessage);
      return {
        status: 'failed',
        message: errorMessage
      };
    }
  }

  /**
   * Get user's deposit address
   */
  async getUserDepositAddress(userPrincipal: string): Promise<{status: 'success' | 'failed', address?: string, message: string}> {
    try {
      if (!this.canister) throw new Error('Trading service not initialized');
      
      const principal = Principal.fromText(userPrincipal);
      const result = await this.canister.get_user_deposit_address(principal);

      if ('ok' in result) {
        return {
          status: 'success',
          address: result.ok,
          message: 'Deposit address retrieved successfully'
        };
      } else {
        return {
          status: 'failed',
          message: result.err
        };
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      return {
        status: 'failed',
        message: errorMessage
      };
    }
  }

  /**
   * Deposit Bitcoin to user account (called by blockchain monitor)
   */
  async depositBitcoin(userPrincipal: string, amountSatoshis: number): Promise<{status: 'success' | 'failed', message: string}> {
    try {
      if (!this.canister) throw new Error('Trading service not initialized');
      
      console.log('💰 Processing Bitcoin deposit:', {
        userPrincipal,
        amountSatoshis
      });

      const result = await this.canister.deposit_bitcoin(Principal.fromText(userPrincipal), BigInt(amountSatoshis));

      if ('ok' in result) {
        console.log('✅ Bitcoin deposit successful:', result.ok);
        return {
          status: 'success',
          message: result.ok
        };
      } else {
        console.error('❌ Bitcoin deposit failed:', result.err);
        return {
          status: 'failed',
          message: result.err
        };
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      console.error('❌ Bitcoin deposit error:', errorMessage);
      return {
        status: 'failed',
        message: errorMessage
      };
    }
  }
}

export const tradingService = new TradingService();
