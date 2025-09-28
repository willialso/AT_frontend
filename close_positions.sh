#!/bin/bash

# List of active position IDs to close
ACTIVE_POSITIONS=(186 187 188 189 190 191 192 193 194 195 196 197 198 199 200 201 202 10 11 35 39 44 45)

# Current Bitcoin price (approximate)
BTC_PRICE=1118000000

# User principal
USER_PRINCIPAL="khtl3-wy5x5-ulr25-bmbgs-qqyiz-vbov4-3qnti-mmepf-l7obz-e7n4j-bae"

echo "Closing all active positions..."

for pos_id in "${ACTIVE_POSITIONS[@]}"; do
    echo "Settling position $pos_id..."
    dfx canister call backend settleTrade "($pos_id, $BTC_PRICE, principal \"$USER_PRINCIPAL\")" --network ic
    sleep 1
done

echo "All positions closed!"






