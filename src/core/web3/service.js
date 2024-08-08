import { SigningErrorType, SigniningError, Txn, } from "./types";
import { getDepositDomain, getDepositTypes, getPermitDomain, getPermitTypes, getRSV, getStakingDomain, getStakingTypes, } from "./helpers";
import { base, baseSepolia } from "thirdweb/chains";
import { getContract, readContract, } from "thirdweb";
import { asyncOps } from "@/core/util/async";
import { WatchedValue, SpyreError, } from "@/core/shared/types";
import { SpyreErrorCode } from "@/core/shared/errors";
export class ThirdWebWeb3Service {
    config;
    _account;
    _rpc;
    thirdweb;
    _connectionManager;
    network;
    _status = new WatchedValue("disconnected");
    _activeAddress = new WatchedValue(null);
    _linkedAddress = new WatchedValue(null);
    _needsToSwitchChains = new WatchedValue(false);
    stakingContract;
    usdcContract;
    stakingBalance;
    usdcBalance;
    withdrawAfter = {
        value: new WatchedValue(new Date()),
        fetch: new WatchedValue(asyncOps.new()),
        refresh: async () => {
            throw new Error("Not implemented");
        },
    };
    constructor(config, _account, _rpc, thirdweb, _connectionManager) {
        this.config = config;
        this._account = _account;
        this._rpc = _rpc;
        this.thirdweb = thirdweb;
        this._connectionManager = _connectionManager;
        if (!config.contracts["staking"]) {
            throw new Error("Missing staking contract");
        }
        if (!config.contracts["usdc"]) {
            throw new Error("Missing usdc contract");
        }
        this.network = config.chainId === 8432 ? base : baseSepolia;
        // load contracts
        this.stakingContract = getContract({
            client: thirdweb,
            chain: this.network,
            address: config.contracts.staking.addr,
            abi: config.contracts.staking.abi,
        });
        this.usdcContract = getContract({
            client: thirdweb,
            chain: this.network,
            address: config.contracts.usdc.addr,
            abi: config.contracts.usdc.abi,
        });
        // setup async values
        this.stakingBalance = {
            value: new WatchedValue(BigInt(0)),
            fetch: new WatchedValue(asyncOps.new()),
            refresh: async () => {
                this.stakingBalance.fetch.setValue(asyncOps.inProgress());
                let result;
                try {
                    result = await readContract({
                        contract: this.stakingContract,
                        method: "balances",
                        params: [this._account.user?.walletAddr],
                    });
                }
                catch (error) {
                    this.stakingBalance.fetch.setValue(asyncOps.failure(error));
                    return;
                }
                this.stakingBalance.value.setValue(result.value);
                this.stakingBalance.fetch.setValue(asyncOps.success());
            },
        };
        this.usdcBalance = {
            value: new WatchedValue(BigInt(0)),
            fetch: new WatchedValue(asyncOps.new()),
            refresh: async () => {
                this.usdcBalance.fetch.setValue(asyncOps.inProgress());
                let result;
                try {
                    result = await readContract({
                        contract: this.usdcContract,
                        method: "balanceOf",
                        params: [this._account.user?.walletAddr],
                    });
                }
                catch (error) {
                    this.usdcBalance.fetch.setValue(asyncOps.failure(error));
                    return;
                }
                this.usdcBalance.value.setValue(result.value);
                this.usdcBalance.fetch.setValue(asyncOps.success());
            },
        };
        // listen to thirdweb
        const thirdwebConnectionStatus = this._connectionManager.activeWalletConnectionStatusStore;
        this._status.setValue(thirdwebConnectionStatus.getValue());
        thirdwebConnectionStatus.subscribe(() => {
            const status = thirdwebConnectionStatus.getValue();
            this._status.setValue(status === "connected" ? "connected" : "disconnected");
        });
        const thirdwebActiveAccount = this._connectionManager.activeAccountStore;
        this._activeAddress.setValue(thirdwebActiveAccount.getValue()?.address || null);
        thirdwebActiveAccount.subscribe(() => {
            this._activeAddress.setValue(thirdwebActiveAccount.getValue()?.address || null);
        });
        const thirdwebActiveChain = this._connectionManager.activeWalletChainStore;
        this._needsToSwitchChains.setValue(thirdwebActiveChain.getValue()?.id !== this.network.id);
        thirdwebActiveChain.subscribe(() => {
            this._needsToSwitchChains.setValue(thirdwebActiveChain.getValue()?.id !== this.network.id);
        });
        // listen to account
        this._account.onUpdate((user) => {
            this._linkedAddress.setValue(user.walletAddr);
        });
        this._linkedAddress.setValue(this._account.user.walletAddr);
    }
    get status() {
        return this._status;
    }
    get needsToSwitchChains() {
        return this._needsToSwitchChains;
    }
    get activeAddress() {
        return this._activeAddress;
    }
    get linkedAddress() {
        return this._linkedAddress;
    }
    requiresApproval(wad, cancel) {
        throw new Error("Method not implemented.");
    }
    approve = async (wad, cancel) => {
        const account = this._connectionManager.activeAccountStore.getValue();
        if (!account) {
            throw new SpyreError(SpyreErrorCode.FAILED_PRECONDITION, "Wallet is not connected.");
        }
        if (this.linkedAddress.getValue() !== this.activeAddress.getValue()) {
            throw new SpyreError(SpyreErrorCode.FAILED_PRECONDITION, "Connected wallet address is not linked to account.");
        }
        cancel?.throwIfCancelled();
        // get nonce first
        let nonce;
        try {
            nonce = await readContract({
                contract: this.usdcContract,
                method: "nonces",
                params: [this._linkedAddress.getValue()],
            });
        }
        catch (error) {
            throw new SpyreError(SpyreErrorCode.UNAVAILABLE, "Failed to get nonce.", [
                error,
            ]);
        }
        cancel?.throwIfCancelled();
        const domain = getPermitDomain({
            contractAddr: this.config.contracts.usdc.addr,
            chainId: this.network.id,
        });
        const types = { Permit: getPermitTypes() };
        const permit = {
            owner: this._linkedAddress.getValue(),
            spender: this.config.contracts.staking.addr,
            value: wad ||
                BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"),
            nonce,
            deadline: BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"),
        };
        let signResult;
        try {
            signResult = await account.signTypedData({
                domain,
                types,
                primaryType: "Permit",
                message: permit,
            });
        }
        catch (error) {
            throw new SpyreError(SpyreErrorCode.UNAVAILABLE, "Failed to sign permit.", [error]);
        }
        cancel?.throwIfCancelled();
        let permitResult;
        try {
            permitResult = await this._rpc.call("pipeline/permit", {
                permit,
                signedMsg: signResult,
            });
        }
        catch (error) {
            throw new SpyreError(SpyreErrorCode.UNAVAILABLE, "Permit successfully signed, but there was an error submitting.", [error]);
        }
        cancel?.throwIfCancelled();
        if (!permitResult.payload.success) {
            throw new SpyreError(SpyreErrorCode.UNAVAILABLE, "Failed to submit permit.", [permitResult.payload.error]);
        }
        const txn = new Txn(permitResult.payload.txnId);
        // todo: WATCH txn
        return txn;
    };
    deposit = async (wad, cancel) => {
        const account = this._connectionManager.activeAccountStore.getValue();
        if (!account) {
            throw new SpyreError(SpyreErrorCode.FAILED_PRECONDITION, "Wallet is not connected.");
        }
        if (this.linkedAddress.getValue() !== this.activeAddress.getValue()) {
            throw new SpyreError(SpyreErrorCode.FAILED_PRECONDITION, "Connected wallet address is not linked to account.");
        }
        cancel?.throwIfCancelled();
        // get nonce
        const { payload: { success, nonce }, } = await this._rpc.call("nonces/get-nonce", {});
        if (!success) {
            throw new SpyreError(SpyreErrorCode.UNAVAILABLE, "Failed to get nonce.");
        }
        const domain = getDepositDomain({
            contractAddr: this.config.contracts.staking.addr,
            chainId: this.network.id,
        });
        const types = { Deposit: getDepositTypes() };
        const deposit = {
            user: this.linkedAddress.getValue(),
            nonce: BigInt(nonce),
            expiry: BigInt(0),
            amount: BigInt(wad + "000000"),
            fee: BigInt(0),
        };
        let result;
        try {
            result = await account.signTypedData({
                domain,
                primaryType: "Deposit",
                types,
                message: deposit,
            });
        }
        catch (error) {
            throw new SpyreError(SpyreErrorCode.UNAVAILABLE, "Failed to sign deposit.");
        }
        const signature = result;
        const rsv = getRSV(signature);
        let depositResult;
        try {
            depositResult = await this._rpc.call("pipeline/deposit", {
                deposit,
                signedMsg: rsv,
            });
        }
        catch (error) {
            throw new SpyreError(SpyreErrorCode.UNAVAILABLE, "Failed to submit deposit.");
        }
        cancel?.throwIfCancelled();
        if (!depositResult.payload.success) {
            throw new SpyreError(SpyreErrorCode.UNAVAILABLE, "Failed to submit deposit.");
        }
        const txn = new Txn(depositResult.payload.txnId);
        // TODO: WATCH txn
        return txn;
    };
    switchChain = async () => {
        await this._connectionManager.switchActiveWalletChain(this.network);
    };
    signStake = async ({ nonce, expiry, amount, fee }, cancel) => {
        const account = this._connectionManager.activeAccountStore.getValue();
        if (!account) {
            throw new SpyreError(SpyreErrorCode.FAILED_PRECONDITION, "Wallet is not connected.");
        }
        if (this.linkedAddress.getValue() !== this.activeAddress.getValue()) {
            throw new SpyreError(SpyreErrorCode.FAILED_PRECONDITION, "Connected wallet address is not linked to account.");
        }
        const domain = getStakingDomain({
            chainId: this.network.id,
            contractAddr: this.config.contracts["staking"].addr,
            name: this.config.name,
            version: "2",
        });
        const types = { Stake: getStakingTypes() };
        const stake = {
            user: this.activeAddress.getValue(),
            nonce,
            expiry,
            amount,
            fee,
        };
        let result;
        try {
            result = await account.signTypedData({
                domain,
                types,
                primaryType: "Stake",
                message: stake,
            });
        }
        catch (error) {
            if (error.code === 4001) {
                // TODO: MIXPANEL
                // user canceled -- do nothing
                throw new SigniningError(SigningErrorType.USER_CANCELED);
            }
            if (error.code === -32603) {
                // TODO: MIXPANEL
                //mixpanel.track("stake/sign/error", { nonce, });
                // TODO: wrong chain
                //switchChain(network);
                throw new SigniningError(SigningErrorType.WRONG_CHAIN);
            }
            // TODO: MIXPANEL
            // TODO: SENTRY
            //mixpanel.track("stake/sign/error", { nonce, });
            //Sentry.captureException(error);
            throw new SigniningError(SigningErrorType.UNKNOWN, error.message);
        }
        return getRSV(result);
    };
}
