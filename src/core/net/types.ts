import {Client, Session} from "@heroiclabs/nakama-js";

export type AsyncClientFn<T> = (client: Client, session: Session) => Promise<T>;
