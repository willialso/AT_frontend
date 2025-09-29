import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { atticusService } from '../services/AtticusService';
import { pricingEngine } from '../services/OffChainPricingEngine';
import { TreasuryService } from '../services/TreasuryService';

// ✅ NEW CANISTER CONTEXT - Single Canister Architecture
interface CanisterContextType {
  isConnected: boolean;
  atticusService: typeof atticusService;
  treasuryService: TreasuryService;
  pricingEngine: typeof pricingEngine;
  agent: HttpAgent | null;
  principal: Principal | null;
}

const CanisterContext = createContext<CanisterContextType | undefined>(undefined);

export const useCanister = () => {
  const context = useContext(CanisterContext);
  if (!context) {
    throw new Error('useCanister must be used within a CanisterProvider');
  }
  return context;
};

export const CanisterProvider: React.FC<{ children: ReactNode }> = React.memo(({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [agent, setAgent] = useState<HttpAgent | null>(null);
  const [principal] = useState<Principal | null>(null);
  const [treasuryService] = useState(() => new TreasuryService());

  useEffect(() => {
    const initializeAtticusService = async () => {
      try {
        console.log('🚀 Initializing Atticus Service (Single Canister Architecture)...');
        
        const httpAgent = new HttpAgent({
          host: 'https://ic0.app'
        });

        // ✅ ATTICUS CORE CANISTER ID (Your Mainnet Canister)
        const ATTICUS_CORE_CANISTER_ID = process.env.ATTICUS_CORE_CANISTER_ID || 'q4oqk-hyaaa-aaaam-qd4la-cai';
        
        // ✅ ATTICUS TREASURY CANISTER ID (New Treasury Canister)
        const ATTICUS_TREASURY_CANISTER_ID = process.env.ATTICUS_TREASURY_CANISTER_ID || 'rwbsq-fiaaa-aaaam-qd4ma-cai';

        // ✅ INITIALIZE ATTICUS SERVICE (Single Canister)
        await atticusService.initialize(ATTICUS_CORE_CANISTER_ID);
        
        // ✅ INITIALIZE TREASURY SERVICE (Treasury Canister)
        await treasuryService.initialize(ATTICUS_TREASURY_CANISTER_ID);

        // ✅ PRICING ENGINE INITIALIZED (Off-Chain)
        console.log('✅ Off-chain pricing engine initialized');

        setAgent(httpAgent);
        setIsConnected(true);

        console.log('✅ Atticus Service initialized successfully (Single Canister Architecture)!');

      } catch (error) {
        console.error('❌ Failed to initialize Atticus Service:', error);
        setIsConnected(false);
      }
    };

    initializeAtticusService();
  }, []);

  const contextValue: CanisterContextType = {
    isConnected,
    atticusService,
    treasuryService,
    pricingEngine,
    agent,
    principal
  };

  return (
    <CanisterContext.Provider value={contextValue}>
      {children}
    </CanisterContext.Provider>
  );
});