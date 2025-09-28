import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface PriceData {
  'source' : string,
  'timestamp' : bigint,
  'price' : number,
}
export type Result = { 'ok' : null } |
  { 'err' : string };
export interface _SERVICE {
  'get_btc_price' : ActorMethod<
    [],
    {
      'source' : string,
      'rejected_updates' : bigint,
      'timestamp' : bigint,
      'price' : number,
      'age_seconds' : bigint,
    }
  >,
  'get_price_history' : ActorMethod<[[] | [bigint]], Array<[bigint, number]>>,
  'get_price_stats' : ActorMethod<
    [],
    {
      'is_fresh' : boolean,
      'source' : string,
      'history_size' : bigint,
      'update_frequency' : string,
      'current_price' : number,
      'rejected_updates' : bigint,
      'subscribers' : bigint,
      'last_update' : bigint,
    }
  >,
  'get_recent_prices' : ActorMethod<[bigint], Array<[bigint, number]>>,
  'is_price_fresh' : ActorMethod<[bigint], boolean>,
  'set_btc_price' : ActorMethod<[number], Result>,
  'subscribe_to_price_updates' : ActorMethod<[[Principal, string]], undefined>,
  'unsubscribe_from_price_updates' : ActorMethod<[Principal], undefined>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
