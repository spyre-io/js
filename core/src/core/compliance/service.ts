import {IRpcService} from "@/core/net/interfaces.js";
import {WatchedValue} from "@/core/shared/types.js";

type ComplianceStatus = "allowed" | "blocked" | "unknown";
type IneligibilityType = "none" | "age" | "country" | "state" | "cb" | string;

export type ComplianceRecord = {
  status: ComplianceStatus;
  ineligibilityType: IneligibilityType;
  meta: string;
};

export interface IComplianceService {
  raffles: WatchedValue<ComplianceRecord>;
  cashGames: WatchedValue<ComplianceRecord>;

  refresh(): Promise<void>;
  updateBirthday(year: number, month: number, day: number): Promise<void>;
  updateLocation(): Promise<void>;
}

type ComplianceResponse = {
  success: boolean;
  error: string;

  raffles: ComplianceRecord;
  cashMatches: ComplianceRecord;
};

export class ComplianceService implements IComplianceService {
  public readonly raffles: WatchedValue<ComplianceRecord>;
  public readonly cashGames: WatchedValue<ComplianceRecord>;

  private readonly rpc: IRpcService;

  constructor(rpc: IRpcService) {
    this.rpc = rpc;

    this.raffles = new WatchedValue<ComplianceRecord>({
      status: "unknown",
      ineligibilityType: "none",
      meta: "{}",
    });

    this.cashGames = new WatchedValue<ComplianceRecord>({
      status: "unknown",
      ineligibilityType: "none",
      meta: "{}",
    });
  }

  public async refresh(): Promise<void> {
    const res = await this.rpc.call<ComplianceResponse>(
      "account/get-compliance",
      {},
    );

    if (!res.success) {
      throw new Error(res.error);
    }

    this.raffles.setValue(res.raffles);
    this.cashGames.setValue(res.cashMatches);
  }

  public async updateBirthday(
    year: number,
    month: number,
    day: number,
  ): Promise<void> {
    const res = await this.rpc.call<ComplianceResponse>("account/submit-age", {
      year,
      month,
      day,
    });

    if (!res.success) {
      throw new Error(res.error);
    }

    this.raffles.setValue(res.raffles);
    this.cashGames.setValue(res.cashMatches);
  }

  public async updateLocation(): Promise<void> {
    const res = await this.rpc.call<ComplianceResponse>(
      "account/refresh-ip",
      {},
    );

    if (!res.success) {
      throw new Error(res.error);
    }

    this.raffles.setValue(res.raffles);
    this.cashGames.setValue(res.cashMatches);
  }
}
