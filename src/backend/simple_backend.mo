import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Float "mo:base/Float";
import Nat "mo:base/Nat";
import Array "mo:base/Array";

actor SimpleBackend {
    // Minimal types for deposits/withdrawals only
    public type UserData = {
        balance: Float;
        created_at: Int;
    };

    // Minimal state - only what's needed for deposits/withdrawals
    private stable var next_user_id: Nat = 1;
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

    // ✅ DEPOSIT (stub)
    public func deposit(user: Principal, amount: Float) : async Result.Result<Text, Text> {
        ignore await create_user(user);
        #ok("Deposit successful");
    };

    // ✅ WITHDRAWAL (stub)
    public func withdraw(user: Principal, amount: Float) : async Result.Result<Text, Text> {
        ignore await create_user(user);
        #ok("Withdrawal successful");
    };
}