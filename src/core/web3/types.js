export var SigningErrorType;
(function (SigningErrorType) {
    SigningErrorType[SigningErrorType["UNKNOWN"] = 0] = "UNKNOWN";
    SigningErrorType[SigningErrorType["USER_CANCELED"] = 4001] = "USER_CANCELED";
    SigningErrorType[SigningErrorType["WRONG_CHAIN"] = -32603] = "WRONG_CHAIN";
})(SigningErrorType || (SigningErrorType = {}));
export class SigniningError extends Error {
    type;
    constructor(type, message = "Could not sign data.") {
        super(message);
        this.type = type;
    }
}
export var TxnStatus;
(function (TxnStatus) {
    TxnStatus["NotStarted"] = "not-started";
    TxnStatus["Sent"] = "sent";
    TxnStatus["WaitingForConfirmation"] = "waiting-for-confirmation";
    TxnStatus["Confirmed"] = "success";
    TxnStatus["Failed"] = "failure";
})(TxnStatus || (TxnStatus = {}));
export class Txn {
    id;
    _status = TxnStatus.NotStarted;
    _hash = "";
    _error = "";
    constructor(id) {
        this.id = id;
        this._status = TxnStatus.Sent;
    }
    get status() {
        return this._status;
    }
    get hash() {
        return this._hash;
    }
    get error() {
        return this._error;
    }
    get isConfirmed() {
        return this._status === TxnStatus.Confirmed;
    }
    sent() {
        this._status = TxnStatus.Sent;
    }
    waiting() {
        this._status = TxnStatus.WaitingForConfirmation;
    }
    confirm(hash) {
        this._status = TxnStatus.Confirmed;
        this._hash = hash;
    }
    fail(error) {
        this._status = TxnStatus.Failed;
        this._error = error;
    }
    onResolve(cb) {
        // TODO
    }
}
