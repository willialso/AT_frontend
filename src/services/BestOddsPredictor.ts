/**
 * ✅ ENHANCED BEST ODDS PREDICTOR - Hybrid Optimized Approach
 * Combines real backend statistics with live market analysis
 * Uses simplified but effective mathematical techniques
 */

export interface TradeRecommendation {
  optionType: 'call' | 'put';
  expiry: string;
  strikeOffset: number;
  winRate: number;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  sampleSize?: number; // Number of real trades used
}

export interface PricePoint {
  timestamp: number;
  price: number;
}

interface EnhancedTrendData {
  direction: 'up' | 'down' | 'neutral';
  strength: number;      // 0-1 strength score
  confidence: number;    // 0-1 confidence score
  volatility: number;    // Market volatility (percentage)
}

interface TradeStats {
  expiry: string;
  strike_offset: number;
  option_type: string;
  total_trades: number;
  wins: number;
  losses: number;
  ties: number;
  win_rate: number;
  last_updated: number;
}

export class EnhancedBestOddsPredictor {
  private priceHistory: PricePoint[] = [];
  private readonly MAX_HISTORY = 200; // Increased from 50 to 200
  private volatilityEWMA: number = 0;
  private readonly LAMBDA = 0.94; // EWMA decay factor
  private isVolatilityInitialized = false;
  
  // Real statistics from backend (cached)
  private realStatistics: Map<string, TradeStats> = new Map();
  private lastStatsFetch: number = 0;
  private readonly STATS_CACHE_TIME = 30000; // 30 seconds cache
  
  // Improved default win rates (more realistic)
  private readonly DEFAULT_WIN_RATES = {
    '5s': { 2.5: 0.60, 5: 0.55, 10: 0.42, 15: 0.28 },
    '10s': { 2.5: 0.65, 5: 0.60, 10: 0.47, 15: 0.33 },
    '15s': { 2.5: 0.70, 5: 0.65, 10: 0.52, 15: 0.38 }
  };

  // Reference to backend service (injected)
  private backendService: any = null;

  /**
   * ✅ INITIALIZE WITH BACKEND SERVICE
   */
  public initializeBackendService(service: any): void {
    this.backendService = service;
    console.log('✅ Backend service initialized for Best Odds');
  }

  /**
   * ✅ UPDATE PRICE DATA
   * Called on each price tick to maintain real-time analysis
   */
  public updatePrice(price: number): void {
    const now = Date.now();
    
    // Calculate return if we have previous price
    if (this.priceHistory.length > 0) {
      const prevPrice = this.priceHistory[this.priceHistory.length - 1].price;
      const priceReturn = Math.log(price / prevPrice);
      this.updateVolatilityEWMA(priceReturn);
    }
    
    // Add new price point
    this.priceHistory.push({ timestamp: now, price });
    
    // Keep only recent history (200 points)
    if (this.priceHistory.length > this.MAX_HISTORY) {
      this.priceHistory = this.priceHistory.slice(-this.MAX_HISTORY);
    }
  }

  /**
   * ✅ EWMA VOLATILITY CALCULATION
   * Updates volatility using exponentially weighted moving average
   */
  private updateVolatilityEWMA(currentReturn: number): void {
    const returnSquared = currentReturn * currentReturn;
    
    if (!this.isVolatilityInitialized) {
      this.volatilityEWMA = returnSquared;
      this.isVolatilityInitialized = true;
    } else {
      // EWMA formula: σ²ₜ = λσ²ₜ₋₁ + (1-λ)r²ₜ
      this.volatilityEWMA = this.LAMBDA * this.volatilityEWMA + 
                            (1 - this.LAMBDA) * returnSquared;
    }
  }

  /**
   * ✅ GET CURRENT VOLATILITY
   * Returns volatility as percentage
   */
  private getVolatility(): number {
    if (!this.isVolatilityInitialized) return 0.3; // Default 30% volatility
    // Convert to percentage (not annualized for short-term trading)
    return Math.sqrt(this.volatilityEWMA) * 100;
  }

  /**
   * ✅ SIMPLIFIED TREND DETECTION
   * Uses weighted moving average instead of complex regression
   */
  private analyzeTrendSimplified(): EnhancedTrendData {
    if (this.priceHistory.length < 10) {
      return {
        direction: 'neutral',
        strength: 0,
        confidence: 0,
        volatility: this.getVolatility()
      };
    }

    const recent = this.priceHistory.slice(-15); // Last 15 points
    
    // 1. Simple weighted moving average (faster than regression)
    let weightedSum = 0;
    let weightSum = 0;
    recent.forEach((point, i) => {
      const weight = i + 1; // Linear weights (recent = higher weight)
      weightedSum += point.price * weight;
      weightSum += weight;
    });
    const wma = weightedSum / weightSum;
    const currentPrice = recent[recent.length - 1].price;
    
    // 2. Calculate volatility
    const prices = recent.map(p => p.price);
    const mean = prices.reduce((a, b) => a + b) / prices.length;
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
    const volatility = Math.sqrt(variance) / mean * 100; // Coefficient of variation
    
    // 3. Determine trend direction with dynamic threshold
    const percentChange = (currentPrice - recent[0].price) / recent[0].price;
    const threshold = Math.max(0.002, volatility * 0.5 / 100); // Dynamic threshold
    
    let direction: 'up' | 'down' | 'neutral' = 'neutral';
    if (percentChange > threshold) direction = 'up';
    else if (percentChange < -threshold) direction = 'down';
    
    // 4. Calculate strength and confidence
    const strength = Math.min(Math.abs(percentChange) / 0.01, 1.0);
    
    // Confidence based on consistency
    let consistentMoves = 0;
    for (let i = 1; i < recent.length; i++) {
      const move = recent[i].price - recent[i-1].price;
      if ((direction === 'up' && move > 0) || (direction === 'down' && move < 0)) {
        consistentMoves++;
      }
    }
    const confidence = consistentMoves / (recent.length - 1);
    
    return { direction, strength, confidence, volatility };
  }

  /**
   * ✅ FETCH REAL STATISTICS FROM BACKEND
   * Cached for 30 seconds to reduce backend calls
   */
  private async fetchRealStatistics(): Promise<void> {
    const now = Date.now();
    if (now - this.lastStatsFetch < this.STATS_CACHE_TIME) {
      return; // Use cached data
    }

    if (!this.backendService) {
      console.warn('⚠️ Backend service not initialized, using defaults');
      return;
    }

    try {
      console.log('🔄 Fetching real trade statistics from backend...');
      const stats = await this.backendService.get_trade_statistics();
      
      this.realStatistics.clear();
      
      // Convert backend format to our format
      for (const [key, stat] of stats) {
        const tradeStats: TradeStats = {
          expiry: stat.expiry,
          strike_offset: Number(stat.strike_offset),
          option_type: stat.option_type,
          total_trades: Number(stat.total_trades),
          wins: Number(stat.wins),
          losses: Number(stat.losses),
          ties: Number(stat.ties),
          win_rate: Number(stat.win_rate),
          last_updated: Number(stat.last_updated)
        };
        this.realStatistics.set(key, tradeStats);
      }
      
      this.lastStatsFetch = now;
      console.log('✅ Fetched', stats.length, 'trade statistics entries');
    } catch (error) {
      console.warn('⚠️ Failed to fetch statistics, using defaults:', error);
    }
  }

  /**
   * ✅ GET WIN RATE WITH LAPLACE SMOOTHING
   * Uses real data > smoothed > default (in that order)
   */
  private getWinRate(expiry: string, strike: number, type: 'call' | 'put'): { rate: number; sampleSize: number } {
    const key = `${expiry}_${strike}_${type}`;
    const realStat = this.realStatistics.get(key);

    if (realStat && realStat.total_trades >= 20) {
      // Use real data if we have enough trades
      return { rate: realStat.win_rate, sampleSize: realStat.total_trades };
    } else if (realStat && realStat.total_trades >= 5) {
      // Use Laplace smoothing for small samples
      const smoothed = (realStat.wins + 1) / (realStat.wins + realStat.losses + 2);
      return { rate: smoothed, sampleSize: realStat.total_trades };
    } else {
      // Fall back to improved defaults
      const defaultRate = this.DEFAULT_WIN_RATES[expiry as keyof typeof this.DEFAULT_WIN_RATES]?.[strike] || 0.5;
      return { rate: defaultRate, sampleSize: 0 };
    }
  }

  /**
   * ✅ VOLATILITY-AWARE WIN RATE ADJUSTMENT
   * Adjusts predictions based on market conditions
   */
  private calculateVolatilityAdjustedWinRate(
    baseRate: number,
    trendStrength: number,
    volatility: number,
    sampleSize: number
  ): { adjustedRate: number; confidence: 'high' | 'medium' | 'low' } {
    
    // Sample size penalty for small datasets
    const samplePenalty = Math.min(1.0, sampleSize / 50); // Full confidence at 50+ trades
    
    // Volatility adjustment curve
    let volatilityMultiplier = 1.0;
    if (volatility < 0.3) {
      // Low volatility - more predictable
      volatilityMultiplier = 1.0 + (0.3 - volatility) * 0.5; // Up to +15% boost
    } else if (volatility > 0.6) {
      // High volatility - less predictable  
      volatilityMultiplier = 1.0 - (volatility - 0.6) * 0.3; // Up to -12% penalty
    }

    // Trend strength bonus (strong trends are more reliable)
    const trendBonus = 1.0 + trendStrength * 0.1; // Up to +10% for strong trends

    // Combined adjustment
    let adjustedRate = baseRate * volatilityMultiplier * trendBonus * (sampleSize > 0 ? samplePenalty : 1.0);
    
    // Cap at reasonable maximum
    adjustedRate = Math.min(adjustedRate, 0.85); // Max 85% win rate

    // Confidence levels based on multiple factors
    const confidenceScore = (volatilityMultiplier + (sampleSize > 0 ? samplePenalty : 0.5) + trendStrength) / 3;
    let confidence: 'high' | 'medium' | 'low';
    
    if (confidenceScore >= 0.8 && sampleSize >= 30) confidence = 'high';
    else if (confidenceScore >= 0.6 && sampleSize >= 15) confidence = 'medium';
    else confidence = 'low';

    return { adjustedRate, confidence };
  }

  /**
   * ✅ GET BEST RECOMMENDATION
   * Main entry point - combines all improvements
   */
  public async getBestRecommendation(): Promise<TradeRecommendation> {
    if (this.priceHistory.length < 10) {
      return {
        optionType: 'call',
        expiry: '15s',
        strikeOffset: 2.5,
        winRate: 0.70,
        confidence: 'low',
        reasoning: 'Insufficient price data - using conservative defaults',
        sampleSize: 0
      };
    }

    // 1. Fetch latest real statistics (cached)
    await this.fetchRealStatistics();

    // 2. Analyze current market trend
    const trend = this.analyzeTrendSimplified();

    // 3. Test all combinations with real + live data
    const expiries = ['5s', '10s', '15s'];
    const strikes = [2.5, 5, 10, 15];
    let bestOption: TradeRecommendation | null = null;
    let bestScore = 0;

    for (const expiry of expiries) {
      for (const strike of strikes) {
        // Determine option type based on trend
        let optionType: 'call' | 'put' = 'call';
        let trendBonus = 1.0;
        
        if (trend.direction === 'up') {
          optionType = 'call';
          trendBonus = 1.0 + (trend.strength * 0.1); // Up to +10%
        } else if (trend.direction === 'down') {
          optionType = 'put';
          trendBonus = 1.0 + (trend.strength * 0.1); // Up to +10%
        }

        // Get base win rate from real data or defaults
        const { rate: baseRate, sampleSize } = this.getWinRate(expiry, strike, optionType);
        
        // Apply volatility and trend adjustments
        const { adjustedRate, confidence } = this.calculateVolatilityAdjustedWinRate(
          baseRate * trendBonus,
          trend.strength,
          trend.volatility,
          sampleSize
        );

        // Calculate composite score
        const score = adjustedRate * (confidence === 'high' ? 1.2 : confidence === 'medium' ? 1.0 : 0.8);
        
        if (score > bestScore) {
          bestScore = score;
          
          let reasoning = sampleSize >= 20 
            ? `Based on ${sampleSize} real trades (${(baseRate * 100).toFixed(1)}% win rate)`
            : sampleSize >= 5
            ? `Based on ${sampleSize} trades with smoothing`
            : `Using improved defaults`;
          
          if (trend.direction !== 'neutral') {
            reasoning += ` + ${trend.direction === 'up' ? 'Uptrend' : 'Downtrend'} detected (${(trend.strength * 100).toFixed(0)}% strength)`;
          }
          
          reasoning += ` + Volatility: ${trend.volatility.toFixed(1)}%`;

          bestOption = {
            optionType,
            expiry,
            strikeOffset: strike,
            winRate: adjustedRate,
            confidence,
            reasoning,
            sampleSize
          };
        }
      }
    }

    return bestOption || this.getConservativeDefault();
  }

  /**
   * ✅ GET CONSERVATIVE DEFAULT
   * Fallback when no better option is found
   */
  private getConservativeDefault(): TradeRecommendation {
    return {
      optionType: 'call',
      expiry: '15s',
      strikeOffset: 2.5,
      winRate: 0.70,
      confidence: 'medium',
      reasoning: 'Conservative default - longer expiry, small strike offset',
      sampleSize: 0
    };
  }

  /**
   * ✅ GET CURRENT TREND INFO
   * Returns current market trend for display
   */
  public getTrendInfo(): { direction: string; strength: number; description: string } {
    const trend = this.analyzeTrendSimplified();
    
    let description = 'Market is stable';
    if (trend.direction === 'up') {
      description = `Uptrend detected (${(trend.strength * 100).toFixed(0)}% strength) - Favoring calls`;
    } else if (trend.direction === 'down') {
      description = `Downtrend detected (${(trend.strength * 100).toFixed(0)}% strength) - Favoring puts`;
    }
    
    return {
      direction: trend.direction,
      strength: trend.strength,
      description
    };
  }

  /**
   * ✅ RESET ANALYSIS
   * Clear history for fresh analysis
   */
  public reset(): void {
    this.priceHistory = [];
    this.volatilityEWMA = 0;
    this.isVolatilityInitialized = false;
  }
}

// Export singleton instance
export const bestOddsPredictor = new EnhancedBestOddsPredictor();
