"use client";

import {useWeb3ConnectionStatus} from "@spyre-io/js";
import {useMemo, useState} from "react";

import {useWeb3Magic} from "@/react/hooks/use-magic";

function Arrow({onClick}: {onClick: () => void}) {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
      className="-ml-0.5 h-5 w-5 text-gray-400"
      onClick={onClick}
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
      />
    </svg>
  );
}

function SignInFlow() {
  const [phone, setPhone] = useState("");
  const magic = useWeb3Magic();

  return (
    <div className="bg-blue-2 flex flex-col border-lg rounded p-10 m-10">
      <p className="font-heebo-regular text-lg text-white">Sign in</p>
      <div className="sm:mx-auto sm:w-full sm:max-w-sm flex ring-1 ring-inset ring-white-2 rounded-md p-2 focus-within:z-10">
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="Phone number"
          className="block w-full bg-transparent border-0 p-1.5 text-white-1 shadow-sm placeholder:text-white-2 sm:text-md"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <button
          type="button"
          className="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-md px-3 py-2 text-white"
        >
          <Arrow
            onClick={async () => {
              console.log("phone", phone);
              const did = await magic.auth.loginWithSMS({
                phoneNumber: "+16182031206",
                showUI: true,
              });
            }}
          />
        </button>
      </div>
    </div>
  );
}

export function SpyreConnect() {
  const status = useWeb3ConnectionStatus();

  return useMemo(() => {
    if (status === "connected") {
      return <div>Connected</div>;
    }

    return <SignInFlow />;
  }, [status]);
}
