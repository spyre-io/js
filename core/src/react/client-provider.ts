import {ISpyreClient} from "@/core/interfaces";
import {createContext} from "react";

export const SpyreClientCtx = createContext<ISpyreClient | undefined>(
  undefined,
);
