export const idlFactory = ({ IDL }) => {
  const Result = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  const PriceData = IDL.Record({
    'source' : IDL.Text,
    'timestamp' : IDL.Int,
    'price' : IDL.Float64,
  });
  return IDL.Service({
    'get_btc_price' : IDL.Func(
        [],
        [
          IDL.Record({
            'source' : IDL.Text,
            'rejected_updates' : IDL.Nat,
            'timestamp' : IDL.Int,
            'price' : IDL.Float64,
            'age_seconds' : IDL.Int,
          }),
        ],
        ['query'],
      ),
    'get_price_history' : IDL.Func(
        [IDL.Opt(IDL.Nat)],
        [IDL.Vec(IDL.Tuple(IDL.Int, IDL.Float64))],
        ['query'],
      ),
    'get_price_stats' : IDL.Func(
        [],
        [
          IDL.Record({
            'is_fresh' : IDL.Bool,
            'source' : IDL.Text,
            'history_size' : IDL.Nat,
            'update_frequency' : IDL.Text,
            'current_price' : IDL.Float64,
            'rejected_updates' : IDL.Nat,
            'subscribers' : IDL.Nat,
            'last_update' : IDL.Int,
          }),
        ],
        ['query'],
      ),
    'get_recent_prices' : IDL.Func(
        [IDL.Nat],
        [IDL.Vec(IDL.Tuple(IDL.Int, IDL.Float64))],
        ['query'],
      ),
    'is_price_fresh' : IDL.Func([IDL.Int], [IDL.Bool], ['query']),
    'set_btc_price' : IDL.Func([IDL.Float64], [Result], []),
    'subscribe_to_price_updates' : IDL.Func(
        [IDL.Func([PriceData], [], [])],
        [],
        [],
      ),
    'unsubscribe_from_price_updates' : IDL.Func([IDL.Principal], [], []),
  });
};
export const init = ({ IDL }) => { return []; };
