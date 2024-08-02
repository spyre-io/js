import {Kv} from "core/shared/types";

export class User {
  //
}

export interface IAccountService {
  get user(): User | null;
  get balances(): Kv<BigInt>;

  refresh(): Promise<void>;
  update(user: User): Promise<void>;
}

export class AccountService implements IAccountService {
  private _user: User | null = null;
  private _balances: Kv<BigInt> = {};

  constructor() {
    //
  }

  get user(): User | null {
    return this._user;
  }

  get balances(): Kv<BigInt> {
    return this._balances;
  }

  async refresh(): Promise<void> {
    //
  }

  async update(user: User): Promise<void> {
    //
  }
}
