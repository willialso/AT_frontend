import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Float "mo:base/Float";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Int "mo:base/Int";
import Int64 "mo:base/Int64";
import Array "mo:base/Array";

persistent actor SimpleAtticus {
    // Simple types
    public type OptionType = { #Call; #Put };
    public type TradeStatus = { #Active; #Settled };

    public type Position = {
        id: Nat;
        user: Principal;
        option_type: OptionType;
        strike_price: Float;
        entry_price: Float;
        expiry: Text;
        size: Float;
        status: TradeStatus;
        opened_at: Int;
    };

    public type UserData = {
        balance: Float;
        created_at: Int;
    };

    // Simple state
    private stable var next_order_id: Nat = 1;
    private stable var positions: [(Nat, Position)] = [];
    private stable var users: [(Principal, UserData)] = [];

    // ✅ CREATE USER
    public func create_user(user: Principal) : async Result.Result<UserData, Text> {
        switch (Array.find(users, func((p, _)) = p == user)) {
            case (?existing_user) {
                #ok(existing_user.1);
            };
            case null {
                let new_user: UserData = {
                    balance = 0.0;
                    created_at = Time.now();
                };
                users := Array.append(users, [(user, new_user)]);
                #ok(new_user);
            };
        };
    };

    // ✅ GET USER
    public func get_user(user: Principal) : async Result.Result<UserData, Text> {
        switch (Array.find(users, func((p, _)) = p == user)) {
            case (?user_data) {
                #ok(user_data.1);
            };
            case null {
                #err("User not found");
            };
        };
    };

    // ✅ PLACE TRADE
    public func place_trade_simple(
        user: Principal,
        option_type: Text,
        strike_offset: Nat,
        expiry: Text,
        contract_count: Nat,
        entry_price_cents: Nat64,
        strike_price_cents: Nat64
    ) : async Result.Result<Nat, Text> {
        let entry_price = Float.fromInt(Int64.toInt(Int64.fromNat64(entry_price_cents))) / 100.0;
        let strike_price = Float.fromInt(Int64.toInt(Int64.fromNat64(strike_price_cents))) / 100.0;
        let option_type_enum = if (option_type == "Call") { #Call } else { #Put };
        let contracts = Float.fromInt(Int.abs(contract_count));
        
        ignore await create_user(user);
        
        let position: Position = {
            id = next_order_id;
            user = user;
            option_type = option_type_enum;
            strike_price = strike_price;
            entry_price = entry_price;
            expiry = expiry;
            size = contracts;
            status = #Active;
            opened_at = Time.now();
        };

        positions := Array.append(positions, [(next_order_id, position)]);
        let trade_id = next_order_id;
        next_order_id += 1;
        #ok(trade_id);
    };

    // ✅ RECORD SETTLEMENT
    public func recordSettlement(
        positionId: Nat, 
        outcome: Text, 
        payout: Nat64, 
        profit: Nat64, 
        finalPrice: Nat64
    ) : async Result.Result<(), Text> {
        // Update position status
        positions := Array.map(positions, func((id, pos)) = 
            if (id == positionId) {
                (id, { pos with status = #Settled })
            } else {
                (id, pos)
            }
        );
        
        #ok(())
    };

    // ✅ GET POSITION
    public func get_position(id: Nat) : async Result.Result<Position, Text> {
        switch (Array.find(positions, func((i, _)) = i == id)) {
            case (?position) {
                #ok(position.1);
            };
            case null {
                #err("Position not found");
            };
        };
    };

    // ✅ GET USER POSITIONS
    public func get_user_positions(user: Principal) : async [Position] {
        let user_positions = Array.filter(positions, func((_, pos)) = pos.user == user);
        Array.map(user_positions, func((_, pos)) = pos);
    };
}
