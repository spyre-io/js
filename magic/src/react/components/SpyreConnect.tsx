"use client";

import {useWeb3ConnectionStatus, useWeb3Link} from "@spyre-io/js";
import {useMemo, useState} from "react";

import {useWeb3Magic} from "@/react/hooks/use-magic";
import {useCallback} from "react";

export const codes = [
  {fifa: "AFG", code: 93},
  {fifa: "ALD", code: 358},
  {fifa: "ALB", code: 355},
  {fifa: "ALG", code: 213},
  {fifa: "AND", code: 376},
  {fifa: "ANG", code: 244},
  {fifa: "ROS3", code: 672},
  {fifa: "ARG", code: 54},
  {fifa: "ARM", code: 374},
  {fifa: "ARU", code: 297},
  {fifa: "AUS", code: 61},
  {fifa: "AUT", code: 43},
  {fifa: "AZE", code: 994},
  {fifa: "BHR", code: 973},
  {fifa: "BAN", code: 880},
  {fifa: "BLR", code: 375},
  {fifa: "BEL", code: 32},
  {fifa: "BLZ", code: 501},
  {fifa: "BEN", code: 229},
  {fifa: "BHU", code: 975},
  {fifa: "BOL", code: 591},
  {fifa: "ANT", code: 599},
  {fifa: "BIH", code: 387},
  {fifa: "BOT", code: 267},
  {fifa: "BRA", code: 55},
  {fifa: "BRU", code: 673},
  {fifa: "BUL", code: 359},
  {fifa: "BFA", code: 226},
  {fifa: "BDI", code: 257},
  {fifa: "CPV", code: 238},
  {fifa: "CAM", code: 855},
  {fifa: "CMR", code: 237},
  {fifa: "CAN", code: 1},
  {fifa: "CTA", code: 236},
  {fifa: "CHA", code: 235},
  {fifa: "CHI", code: 56},
  {fifa: "CHN", code: 86},
  {fifa: "HKG", code: 852},
  {fifa: "MAC", code: 853},
  {fifa: "CXR", code: 61},
  {fifa: "CCK", code: 61},
  {fifa: "COL", code: 57},
  {fifa: "COM", code: 269},
  {fifa: "CGO", code: 242},
  {fifa: "COK", code: 682},
  {fifa: "CRC", code: 506},
  {fifa: "CRO", code: 385},
  {fifa: "CUB", code: 53},
  {fifa: "CYP", code: 357},
  {fifa: "CZE", code: 420},
  {fifa: "PRK", code: 850},
  {fifa: "COD", code: 243},
  {fifa: "DEN", code: 45},
  {fifa: "DEN", code: 45},
  {fifa: "DJI", code: 253},
  {fifa: "ECU", code: 593},
  {fifa: "EGY", code: 20},
  {fifa: "SLV", code: 503},
  {fifa: "EQG", code: 240},
  {fifa: "ERI", code: 291},
  {fifa: "EST", code: 372},
  {fifa: "SWZ", code: 268},
  {fifa: "ETH", code: 251},
  {fifa: "FLK", code: 500},
  {fifa: "FRO", code: 298},
  {fifa: "FIJ", code: 679},
  {fifa: "FIN", code: 358},
  {fifa: "FRA", code: 33},
  {fifa: "GUF", code: 594},
  {fifa: "TAH2", code: 689},
  {fifa: "GAB", code: 241},
  {fifa: "GAM", code: 220},
  {fifa: "GEO", code: 995},
  {fifa: "GER", code: 49},
  {fifa: "GHA", code: 233},
  {fifa: "GBZ", code: 350},
  {fifa: "GRE", code: 30},
  {fifa: "GRL", code: 299},
  {fifa: "GLP", code: 590},
  {fifa: "GUA", code: 502},
  {fifa: "GBG", code: 44},
  {fifa: "GUI", code: 224},
  {fifa: "GNB", code: 245},
  {fifa: "GUY", code: 592},
  {fifa: "HAI", code: 509},
  {fifa: "HON", code: 504},
  {fifa: "HUN", code: 36},
  {fifa: "ISL", code: 354},
  {fifa: "IND", code: 91},
  {fifa: "IDN", code: 62},
  {fifa: "IRN", code: 98},
  {fifa: "IRQ", code: 964},
  {fifa: "IRL", code: 353},
  {fifa: "GBM", code: 44},
  {fifa: "ISR", code: 972},
  {fifa: "ITA", code: 39},
  {fifa: "CIV", code: 225},
  {fifa: "JPN", code: 81},
  {fifa: "GBJ", code: 44},
  {fifa: "JOR", code: 962},
  {fifa: "KAZ", code: 7},
  {fifa: "KEN", code: 254},
  {fifa: "KIR", code: 686},
  {fifa: "KUW", code: 965},
  {fifa: "KGZ", code: 996},
  {fifa: "LAO", code: 856},
  {fifa: "LVA", code: 371},
  {fifa: "LIB", code: 961},
  {fifa: "LES", code: 266},
  {fifa: "LBR", code: 231},
  {fifa: "LBY", code: 218},
  {fifa: "LIE", code: 423},
  {fifa: "LTU", code: 370},
  {fifa: "LUX", code: 352},
  {fifa: "MAD", code: 261},
  {fifa: "MWI", code: 265},
  {fifa: "MAS", code: 60},
  {fifa: "MDV", code: 960},
  {fifa: "MLI", code: 223},
  {fifa: "MLT", code: 356},
  {fifa: "MHL", code: 692},
  {fifa: "MTQ", code: 596},
  {fifa: "MTN", code: 222},
  {fifa: "MRI", code: 230},
  {fifa: "MYT", code: 262},
  {fifa: "MEX", code: 52},
  {fifa: "FSM", code: 691},
  {fifa: "MON", code: 377},
  {fifa: "MNG", code: 976},
  {fifa: "MNE", code: 382},
  {fifa: "MAR", code: 212},
  {fifa: "MOZ", code: 258},
  {fifa: "MYA", code: 95},
  {fifa: "NAM", code: 264},
  {fifa: "NRU", code: 674},
  {fifa: "NEP", code: 977},
  {fifa: "NED", code: 31},
  {fifa: "NED", code: 31},
  {fifa: "NCL", code: 687},
  {fifa: "NZL", code: 64},
  {fifa: "NCA", code: 505},
  {fifa: "NIG", code: 227},
  {fifa: "NGA", code: 234},
  {fifa: "NIU", code: 683},
  {fifa: "NFK", code: 672},
  {fifa: "MKD", code: 389},
  {fifa: "NOR", code: 47},
  {fifa: "OMA", code: 968},
  {fifa: "PAK", code: 92},
  {fifa: "PLW", code: 680},
  {fifa: "PAN", code: 507},
  {fifa: "PNG", code: 675},
  {fifa: "PAR", code: 595},
  {fifa: "PER", code: 51},
  {fifa: "PHI", code: 63},
  {fifa: "PCN", code: 870},
  {fifa: "POL", code: 48},
  {fifa: "POR", code: 351},
  {fifa: "PUR", code: 1},
  {fifa: "QAT", code: 974},
  {fifa: "KOR", code: 82},
  {fifa: "MDA", code: 373},
  {fifa: "REU", code: 262},
  {fifa: "ROU", code: 40},
  {fifa: "RUS", code: 7},
  {fifa: "RWA", code: 250},
  {fifa: "SPM", code: 508},
  {fifa: "SAM", code: 685},
  {fifa: "SMR", code: 378},
  {fifa: "STP", code: 239},
  {fifa: "KSA", code: 966},
  {fifa: "SEN", code: 221},
  {fifa: "SEY", code: 248},
  {fifa: "SEY", code: 248},
  {fifa: "SLE", code: 232},
  {fifa: "SIN", code: 65},
  {fifa: "SVK", code: 421},
  {fifa: "SVN", code: 386},
  {fifa: "SOL", code: 677},
  {fifa: "SOM", code: 252},
  {fifa: "RSA", code: 27},
  {fifa: "ESP", code: 34},
  {fifa: "SRI", code: 94},
  {fifa: "PLE", code: 970},
  {fifa: "SUD", code: 249},
  {fifa: "SUR", code: 597},
  {fifa: "SWE", code: 46},
  {fifa: "SUI", code: 41},
  {fifa: "SYR", code: 963},
  {fifa: "TPE", code: 886},
  {fifa: "TJK", code: 992},
  {fifa: "THA", code: 66},
  {fifa: "TLS", code: 670},
  {fifa: "TOG", code: 228},
  {fifa: "TKL", code: 690},
  {fifa: "TGA", code: 676},
  {fifa: "TUN", code: 216},
  {fifa: "TUR", code: 90},
  {fifa: "TKM", code: 993},
  {fifa: "TUV", code: 688},
  {fifa: "UGA", code: 256},
  {fifa: "UKR", code: 380},
  {fifa: "UAE", code: 971},
  {fifa: "TAN", code: 255},
  {fifa: "USA", code: 1},
  {fifa: "URU", code: 598},
  {fifa: "UZB", code: 998},
  {fifa: "VAN", code: 678},
  {fifa: "VEN", code: 58},
  {fifa: "VIE", code: 84},
  {fifa: "WLF", code: 681},
  {fifa: "SAH", code: 212},
  {fifa: "SAH", code: 212},
  {fifa: "YEM", code: 967},
  {fifa: "ZAM", code: 260},
  {fifa: "ZIM", code: 263},
];

function Arrow({onClick}: {onClick: () => void}) {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className="-ml-0.5 h-5 w-5 text-gray-400"
      onClick={onClick}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
      />
    </svg>
  );
}

function Spinner({className = "", size = 5}) {
  return (
    <svg
      className={`animate-spin h-${size} w-${size} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
}

function Phone() {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className="h-5 w-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
      />
    </svg>
  );
}

function Email() {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className="h-5 w-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
      />
    </svg>
  );
}

const formatPhone = (fifa: string, phone: string) => {
  return `+${codes.find((c) => c.fifa === fifa)?.code}${phone}`;
};

type ButtonInputProps = {
  label: string;
  IconClass: () => JSX.Element;
  onClick: () => void;
};

function ButtonInput({label, IconClass, onClick}: ButtonInputProps) {
  return (
    <div
      className="w-96 h-14 flex items-center ring-1 ring-inset ring-blue-1 rounded-md px-4 py-2 focus-within:z-10 cursor-pointer text-blue-0 space-x-4"
      onClick={onClick}
    >
      <IconClass />
      <p className="text-white text-md">{label}</p>
    </div>
  );
}

type PhoneInputProps = {
  fifa: string;
  setFifa: (fifa: string) => void;
  phone: string;
  setPhone: (phone: string) => void;
  isLoading: boolean;
  onSubmit: () => void;
};
function PhoneInput({
  fifa,
  setFifa,
  phone,
  setPhone,
  isLoading,
  onSubmit,
}: PhoneInputProps) {
  return (
    <div className="w-96 h-14 flex items-center ring-2 ring-inset ring-white rounded-md p-2 focus-within:z-10">
      <div className="inset-y-0 left-0 flex items-center">
        <label htmlFor="country" className="sr-only">
          Country
        </label>
        <select
          id="country"
          name="country"
          autoComplete="country"
          className="h-full rounded-md border-0 bg-transparent py-0 pl-3 pr-4 mr-4 text-white-1 focus:outline-none text-md"
          value={fifa}
          onChange={(e) => setFifa(e.target.value)}
        >
          {codes.map(({fifa}, i) => (
            <option key={i} value={fifa}>
              {fifa}
            </option>
          ))}
        </select>
      </div>

      <input
        id="phone"
        name="phone"
        type="tel"
        autoComplete="tel"
        autoFocus={true}
        placeholder="Phone number"
        className="block w-full outline-none bg-transparent border-0 p-1.5 text-white-1 shadow-sm placeholder:text-white-2 text-md"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      <button
        type="button"
        className="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-md px-3 py-2 text-white"
      >
        {isLoading ? <Spinner /> : <Arrow onClick={onSubmit} />}
      </button>
    </div>
  );
}

type EmailInputProps = {
  email: string;
  setEmail: (email: string) => void;
  isLoading: boolean;
  onSubmit: () => void;
};
function EmailInput({email, setEmail, isLoading, onSubmit}: EmailInputProps) {
  return (
    <div className="w-96 h-14 flex items-center ring-2 ring-inset ring-white rounded-md p-2 focus-within:z-10">
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        autoFocus={true}
        placeholder="Email address"
        className="block w-full outline-none bg-transparent border-0 p-1.5 text-white-1 shadow-sm placeholder:text-white-2 text-md"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <button
        type="button"
        className="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-md px-3 py-2 text-white"
      >
        {isLoading ? <Spinner /> : <Arrow onClick={onSubmit} />}
      </button>
    </div>
  );
}

function SignInFlow() {
  const [isLoadingMagic, setIsLoadingMagic] = useState(false);
  const [error, setError] = useState("");
  const [inputType, setInputType] = useState("phone");

  const [phone, setPhone] = useState("");
  const [fifa, setFifa] = useState("USA");
  const [email, setEmail] = useState("");

  const link = useWeb3Link();
  const magic = useWeb3Magic();

  const submitLink = useCallback(async () => {
    try {
      await link.mutateAsync();
    } catch (e) {
      setError((e as Error).message);
      setIsLoadingMagic(false);
    }
  }, [link]);

  const handlePhone = useCallback(async () => {
    setIsLoadingMagic(true);
    setError("");

    const number = formatPhone(fifa, phone);
    await magic.auth.loginWithSMS({
      phoneNumber: number,
      showUI: true,
    });

    await submitLink();

    setIsLoadingMagic(false);
  }, [magic, fifa, phone]);

  const handleEmail = useCallback(async () => {
    setIsLoadingMagic(true);
    setError("");

    await magic.auth.loginWithEmailOTP({
      email,
      showUI: true,
    });

    await submitLink();
    setIsLoadingMagic(false);
  }, [magic, email]);

  return (
    <div className="bg-blue-2 flex flex-col p-6 m-10 ring-1 ring-inset ring-blue-1 rounded-lg">
      <p className="font-heebo-regular text-lg text-white pb-4">Sign in</p>
      <div className="flex flex-col space-y-2">
        {inputType === "phone" ? (
          <PhoneInput
            fifa={fifa}
            setFifa={setFifa}
            phone={phone}
            setPhone={setPhone}
            isLoading={isLoadingMagic}
            onSubmit={handlePhone}
          />
        ) : (
          <ButtonInput
            label="Phone number"
            IconClass={Phone}
            onClick={() => setInputType("phone")}
          />
        )}
        {inputType === "email" ? (
          <EmailInput
            email={email}
            setEmail={setEmail}
            isLoading={isLoadingMagic}
            onSubmit={handleEmail}
          />
        ) : (
          <ButtonInput
            label="Email address"
            IconClass={Email}
            onClick={() => setInputType("email")}
          />
        )}
      </div>
      {error && (
        <p className="text-red font-bold text-md py-2 text-center">{error}</p>
      )}
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
