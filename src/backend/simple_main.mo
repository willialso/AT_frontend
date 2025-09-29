import Time "mo:base/Time";
import HashMap "mo:base/HashMap";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Float "mo:base/Float";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Int "mo:base/Int";
import Int64 "mo:base/Int64";
import Hash "mo:base/Hash";
import Iter "mo:base/Iter";

persistent actor AtticusCore {
    // Types
    public type OptionType = { #Call; #Put };
    public type TradeStatus = { #Active; #Settled; #Expired };

    public type Position = {
        id: Nat;
        user: Principal;
        option_type: OptionType;
        strike_price: Float;
        entry_price: Float;
        expiry: Text;
        expiry_timestamp: Int;
        size: Float;
        entry_premium: Float;
        current_value: Float;
        pnl: Float;
        status: TradeStatus;
        opened_at: Int;
        settled_at: ?Int;
        settlement_price: ?Float;
    };

    public type UserData = {
        principal: Principal;
        balance: Float;
        total_wins: Float;
        total_losses: Float;
        net_pnl: Float;
        created_at: Int;
    };

    public type UserTransaction = {
        id: Text;
        user: Principal;
        transaction_type: { #Deposit; #Withdrawal };
        amount: Float;
        deposit_id: ?Text;
        tx_hash: ?Text;
        timestamp: Int;
        status: { #Pending; #Confirmed; #Failed };
    };

    // State
    private stable var next_order_id: Nat = 1;
    private transient var positions = HashMap.HashMap<Nat, Position>(0, Nat.equal, Hash.hash);
    private transient var users = HashMap.HashMap<Principal, UserData>(0, Principal.equal, Principal.hash);
    
    // Migration: Handle old stable variables
    private stable var admin_logs: [Text] = [];
    private stable var btc_price: Float = 0.0;
    private stable var next_withdrawal_id: Nat = 1;
    private stable var platform_ledger: { total_winning_trades: Float; total_losing_trades: Float; net_pnl: Float; total_trades: Nat } = { total_winning_trades = 0.0; total_losing_trades = 0.0; net_pnl = 0.0; total_trades = 0 };
    private stable var platform_wallet: { balance: Float; total_deposits: Float; total_withdrawals: Float } = { balance = 0.0; total_deposits = 0.0; total_withdrawals = 0.0 };
    private stable var positions_stable: [(Nat, Position)] = [];
    private stable var user_address_mapping_stable: [(Principal, Text)] = [];
    private stable var user_transactions: [UserTransaction] = [];
    private stable var user_wallets_stable: [(Principal, Text)] = [];
    private stable var users_stable: [(Principal, UserData)] = [];
    private stable var withdrawal_requests_stable: [(Nat, { user: Principal; amount: Nat; to_address: Text; status: { #Pending; #Approved; #Rejected; #Processed }; created_at: Int; processed_at: ?Int; tx_hash: ?Text; reason: ?Text })] = [];

    // ✅ CREATE USER
    public func create_user(user: Principal) : async Result.Result<UserData, Text> {
        switch (users.get(user)) {
            case (?existing_user) {
                #ok(existing_user);
            };
            case null {
                let new_user: UserData = {
                    principal = user;
                    balance = 0.0;
                    total_wins = 0.0;
                    total_losses = 0.0;
                    net_pnl = 0.0;
                    created_at = Time.now();
                };
                users.put(user, new_user);
                #ok(new_user);
            };
        };
    };

    // ✅ GET USER
    public func get_user(user: Principal) : async Result.Result<UserData, Text> {
        switch (users.get(user)) {
            case (?user_data) {
                #ok(user_data);
            };
            case null {
                #err("User not found");
            };
        };
    };

    // ✅ PLACE TRADE (SIMPLIFIED)
    public func place_trade_simple(
        user: Principal,
        option_type: Text,
        strike_offset: Nat,
        expiry: Text,
        contract_count: Nat,
        entry_price_cents: Nat64,
        strike_price_cents: Nat64
    ) : async Result.Result<Nat, Text> {
        // Convert from cents to dollars
        let entry_price = Float.fromInt(Int64.toInt(Int64.fromNat64(entry_price_cents))) / 100.0;
        let strike_price = Float.fromInt(Int64.toInt(Int64.fromNat64(strike_price_cents))) / 100.0;
        
        let option_type_enum = if (option_type == "Call") { #Call } else { #Put };
        let contracts = Float.fromInt(Int.abs(contract_count));
        let premium_cost = contracts; // $1 per contract
        
        ignore await create_user(user);
        
        switch (users.get(user)) {
            case (?user_data) {
                if (user_data.balance < (premium_cost / entry_price)) {
                    return #err("Insufficient balance for trade");
                };

                let updated_user = {
                    user_data with
                    balance = user_data.balance - (premium_cost / entry_price);
                };
                users.put(user, updated_user);

                let now = Time.now();
                let expiry_seconds = switch (expiry) {
                    case ("5s") { 5 }; case ("10s") { 10 }; case ("15s") { 15 };
                    case (_) { 5 };
                };
                let expiry_timestamp = now + (expiry_seconds * 1_000_000_000);

                let position: Position = {
                    id = next_order_id;
                    user = user;
                    option_type = option_type_enum;
                    strike_price = strike_price;
                    entry_price = entry_price;
                    expiry = expiry;
                    expiry_timestamp = expiry_timestamp;
                    size = contracts;
                    entry_premium = premium_cost;
                    current_value = 0.0;
                    pnl = -(premium_cost);
                    status = #Active;
                    opened_at = now;
                    settled_at = null;
                    settlement_price = null;
                };

                positions.put(next_order_id, position);
                let trade_id = next_order_id;
                next_order_id += 1;
                #ok(trade_id);
            };
            case null { #err("User not found") };
        };
    };

    // ✅ RECORD SETTLEMENT (SIMPLIFIED)
    public func recordSettlement(
        positionId: Nat, 
        outcome: Text, 
        payout: Nat64, 
        profit: Nat64, 
        finalPrice: Nat64
    ) : async Result.Result<(), Text> {
        switch (positions.get(positionId)) {
            case (?position) {
                if (position.status != #Active) {
                    return #err("Position is not active");
                };
                
                // Convert from cents to dollars
                let payoutFloat = Float.fromInt(Int64.toInt(Int64.fromNat64(payout))) / 100.0;
                let profitFloat = Float.fromInt(Int64.toInt(Int64.fromNat64(profit))) / 100.0;
                let finalPriceFloat = Float.fromInt(Int64.toInt(Int64.fromNat64(finalPrice))) / 100.0;
                
                // Update position
                let now = Time.now();
                let settled_position = {
                    position with
                    status = #Settled;
                    current_value = payoutFloat;
                    pnl = profitFloat;
                    settled_at = ?now;
                    settlement_price = ?finalPriceFloat;
                };
                positions.put(positionId, settled_position);
                
                // Update user balance
                switch (users.get(position.user)) {
                    case (?user_data) {
                        let net_gain_btc = if (outcome == "win") {
                            profitFloat / finalPriceFloat
                        } else {
                            0.0
                        };
                        
                        let updated_user = {
                            user_data with
                            balance = user_data.balance + net_gain_btc;
                            total_wins = if (outcome == "win") { user_data.total_wins + (payoutFloat / finalPriceFloat) } else { user_data.total_wins };
                            total_losses = if (outcome == "loss") { user_data.total_losses + (position.entry_premium / finalPriceFloat) } else { user_data.total_losses };
                            net_pnl = if (outcome == "win") { user_data.net_pnl + (payoutFloat / finalPriceFloat) } else { user_data.net_pnl - (position.entry_premium / finalPriceFloat) };
                        };
                        users.put(position.user, updated_user);
                    };
                    case null {};
                };
                
                #ok(())
            };
            case null { #err("Position not found") };
        }
    };

    // ✅ GET POSITIONS
    public func get_positions(user: Principal) : async [Position] {
        let user_positions = positions.entries()
            |> Iter.filter(_, func((_, pos): (Nat, Position)): Bool = pos.user == user)
            |> Iter.map(_, func((_, pos): (Nat, Position)): Position = pos)
            |> Iter.toArray(_);
        user_positions;
    };

    // ✅ GET POSITION BY ID
    public func get_position(id: Nat) : async Result.Result<Position, Text> {
        switch (positions.get(id)) {
            case (?position) {
                #ok(position);
            };
            case null {
                #err("Position not found");
            };
        };
    };
}
