# 🏗️ Mermaid Architecture Diagrams

## System Overview
```mermaid
graph TB
    subgraph "ICP Network"
        FC[Frontend Canister<br/>React + TypeScript]
        BC[Backend Trading Canister<br/>Motoko Smart Contract]
        PC[Price Oracle Canister<br/>Motoko Smart Contract]
    end
    
    subgraph "External Integrations"
        CB[Coinbase Exchange<br/>WebSocket API]
        BT[Bitcoin Network<br/>Mainnet]
        II[Internet Identity<br/>Authentication]
    end
    
    subgraph "Users"
        U1[Retail Traders]
        U2[Institutional Traders]
        U3[Administrators]
    end
    
    U1 --> FC
    U2 --> FC
    U3 --> FC
    
    FC --> BC
    FC --> PC
    BC --> PC
    
    FC --> CB
    FC --> II
    BC --> BT
```

## Canister Architecture
```mermaid
graph TB
    subgraph "Frontend Canister (tf6rq-nqaaa-aaaam-qd4cq-cai)"
        subgraph "Components Layer"
            APP[App.tsx]
            LP[LandingPage.tsx]
            TP[TradingPanel.tsx]
            CH[PriceChart.tsx]
            OF[OptionsTradeForm.tsx]
            TD[TimerDisplay.tsx]
            PM[PositionManager.tsx]
            WC[WalletConnection.tsx]
            AP[AdminPanel.tsx]
        end
        
        subgraph "Contexts Layer"
            WSP[WebSocketProvider.tsx]
            CP[CanisterProvider.tsx]
            BP[BalanceProvider.tsx]
            TC[TradeContext.tsx]
        end
        
        subgraph "Services Layer"
            TS[tradingService.ts]
            WS[walletService.ts]
            PS[priceService.ts]
            BM[blockchainMonitor.ts]
            ES[errorServices.ts]
            BV[balanceValidation.ts]
        end
    end
    
    subgraph "Backend Trading Canister (tl44y-waaaa-aaaam-qd4dq-cai)"
        subgraph "Core Types"
            OT[OptionType]
            TS2[TradeStatus]
            POS[Position]
            UD[UserData]
        end
        
        subgraph "Trading Functions"
            POO[place_option_order]
            ST[settleTrade]
            GUP[get_user_positions]
            GAP[get_all_positions]
            CP2[calculate_premium]
        end
        
        subgraph "Financial Functions"
            GU[get_user]
            GUW[generate_user_wallet]
            GUDA[get_user_deposit_address]
            AAW[admin_approve_withdrawal]
            ARW[admin_reject_withdrawal]
            AMWP[admin_mark_withdrawal_processed]
        end
    end
    
    subgraph "Price Oracle Canister (tm52m-3yaaa-aaaam-qd4da-cai)"
        subgraph "Price Data"
            PD[PriceData]
            VR[ValidationResult]
            PH[PriceHistory]
        end
        
        subgraph "Price Functions"
            SBP[set_btc_price]
            GBP[get_btc_price]
            SIP[set_independent_price]
            GPAT[get_price_at_time]
            VTP[validate_trade_price]
        end
    end
    
    WSP --> SBP
    TS --> POO
    TS --> ST
    CP --> GU
    CP --> GUW
```

## Trade Execution Flow
```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend Canister
    participant P as Price Oracle
    participant C as Coinbase WebSocket
    
    U->>F: Select Trade Parameters
    F->>F: Validate Balance & Parameters
    F->>B: place_option_order()
    B->>P: Record Entry Price
    B->>B: Create Position
    B->>B: Deduct Balance
    B-->>F: Trade Confirmed
    
    loop Real-time Monitoring
        C->>F: Price Updates
        F->>F: Update Price Display
        F->>F: Update Timer
    end
    
    F->>F: Timer Expires
    F->>B: settleTrade()
    B->>P: Record Settlement Price
    B->>B: Calculate Payout
    B->>B: Update Balance
    B-->>F: Settlement Complete
    F-->>U: Trade Result
```

## Price Feed Architecture
```mermaid
graph TB
    subgraph "Real-time Data Flow"
        CB[Coinbase Exchange<br/>wss://ws-feed.exchange.coinbase.com]
        WSP[WebSocketProvider<br/>Real-time Price Feed]
        PC[PriceChart<br/>Visualization]
        TD[TimerDisplay<br/>Trade Countdown]
        OF[OptionsTradeForm<br/>Trade Execution]
    end
    
    subgraph "Backend Integration"
        PO[Price Oracle Canister<br/>Price Recording]
        BC[Backend Trading Canister<br/>Trade Execution]
    end
    
    CB -->|BTC-USD Ticker| WSP
    WSP -->|Live Prices| PC
    WSP -->|Live Prices| TD
    WSP -->|Live Prices| OF
    
    WSP -->|Entry Price| PO
    WSP -->|Settlement Price| PO
    PO -->|Price Validation| BC
    BC -->|Trade Recording| PO
```

## Data Flow Architecture
```mermaid
graph LR
    subgraph "Frontend Layer"
        UI[User Interface]
        WS[WebSocket Client]
        ST[State Management]
    end
    
    subgraph "Backend Layer"
        TC[Trading Canister]
        PO[Price Oracle]
        DB[(Persistent Storage)]
    end
    
    subgraph "External Layer"
        CB[Coinbase API]
        BT[Bitcoin Network]
        II[Internet Identity]
    end
    
    UI --> ST
    WS --> CB
    ST --> TC
    TC --> PO
    TC --> DB
    PO --> DB
    TC --> BT
    UI --> II
```

## Security Architecture
```mermaid
graph TB
    subgraph "Authentication & Authorization"
        II[Internet Identity]
        P[Principal-based Access]
        RBAC[Role-based Access Control]
    end
    
    subgraph "Data Security"
        E[Encryption at Rest]
        T[Transport Security]
        V[Input Validation]
    end
    
    subgraph "Trade Security"
        BV[Balance Validation]
        PV[Price Validation]
        TI[Trade ID Generation]
        AT[Audit Trail]
    end
    
    subgraph "Network Security"
        WS[WebSocket Security]
        API[API Rate Limiting]
        DDOS[DDoS Protection]
    end
    
    II --> P
    P --> RBAC
    RBAC --> BV
    BV --> PV
    PV --> TI
    TI --> AT
```

## Future Enhancement Architecture
```mermaid
graph TB
    subgraph "Phase 1: Dynamic Pricing"
        AI[AI-Powered Pricing]
        VM[Volatility Modeling]
        GC[Greeks Calculation]
        MM[Market Making]
    end
    
    subgraph "Phase 2: Advanced Hedging"
        BH[Backside Hedging]
        RM[Risk Management]
        LP[Liquidity Pools]
        CC[Cross-Chain Integration]
    end
    
    subgraph "Phase 3: Institutional Features"
        API[API Access]
        WL[White-label Solutions]
        AA[Advanced Analytics]
        CT[Compliance Tools]
    end
    
    AI --> BH
    VM --> RM
    GC --> LP
    MM --> CC
    
    BH --> API
    RM --> WL
    LP --> AA
    CC --> CT
```

## Performance Architecture
```mermaid
graph TB
    subgraph "Performance Metrics"
        TE[Trade Execution<br/>< 100ms]
        PU[Price Updates<br/>Real-time]
        ST[Settlement Time<br/>< 1 second]
        UT[Uptime<br/>99.9%]
        TP[Throughput<br/>1000+ trades/min]
    end
    
    subgraph "Scalability Features"
        HS[Horizontal Scaling]
        LB[Load Balancing]
        DO[Database Optimization]
        CS[Caching Strategy]
    end
    
    subgraph "Optimization Techniques"
        CD[Code Splitting]
        LZ[Lazy Loading]
        MC[Memory Caching]
        RC[Request Caching]
    end
    
    TE --> HS
    PU --> LB
    ST --> DO
    UT --> CS
    TP --> CD
    
    HS --> MC
    LB --> RC
    DO --> LZ
    CS --> MC
```

## Competitive Advantages
```mermaid
graph TB
    subgraph "Technical Advantages"
        ICP[ICP Native]
        RT[Real-time Data]
        AS[Automated Settlement]
        IG[Institutional Grade]
        MA[Modular Architecture]
    end
    
    subgraph "Business Advantages"
        MO[Micro-Options]
        LB2[Low Barriers]
        TP2[Transparent Pricing]
        AO[Automated Operations]
        SM[Scalable Model]
    end
    
    subgraph "Market Advantages"
        FI[Financial Inclusion]
        DI[DeFi Innovation]
        EC[ICP Ecosystem]
        OS[Open Source]
    end
    
    ICP --> MO
    RT --> LB2
    AS --> TP2
    IG --> AO
    MA --> SM
    
    MO --> FI
    LB2 --> DI
    TP2 --> EC
    AO --> OS
    SM --> FI
```

## ICP Grant Proposal Value
```mermaid
graph TB
    subgraph "Innovation Contribution"
        FICP[First ICP Options Platform]
        RTI[Real-time Integration]
        ASA[Automated Settlement]
        IF[Institutional Features]
    end
    
    subgraph "Technical Excellence"
        MA2[Modular Architecture]
        PO2[Performance Optimization]
        SI[Security Implementation]
        UX[User Experience]
    end
    
    subgraph "Market Impact"
        FI2[Financial Inclusion]
        DI2[DeFi Innovation]
        EC2[ICP Ecosystem Growth]
        OS2[Open Source Potential]
    end
    
    FICP --> MA2
    RTI --> PO2
    ASA --> SI
    IF --> UX
    
    MA2 --> FI2
    PO2 --> DI2
    SI --> EC2
    UX --> OS2
```
































