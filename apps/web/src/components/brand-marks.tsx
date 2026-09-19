import type { SVGProps } from "react";

/**
 * Original LUMI mark: a calm air vortex held inside an aurora orb.
 * It intentionally evokes an elemental companion without borrowing a game
 * character, silhouette, or trademarked visual language.
 */
export function LumiMark(props: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 48 48" fill="none" {...props}>
    <defs>
      <linearGradient id="lumi-aurora" x1="8" y1="6" x2="42" y2="43" gradientUnits="userSpaceOnUse">
        <stop stopColor="#A5B4FC" /><stop offset=".46" stopColor="#5367E8" /><stop offset="1" stopColor="#12235A" />
      </linearGradient>
      <linearGradient id="lumi-wind" x1="13" y1="14" x2="35" y2="35" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFF" /><stop offset="1" stopColor="#D8E7FF" />
      </linearGradient>
    </defs>
    <circle cx="24" cy="24" r="22" fill="url(#lumi-aurora)" />
    <path d="M12 22.6c3.6-6.7 13.4-10 21.4-6.5 2.7 1.2 4.1 3.8 1.8 5.5-3.6 2.8-12.2-1.8-17.4 2.8-2.8 2.5-.8 6.5 3.9 7.1 5.1.7 10.6-1.2 13.7-4.9" stroke="url(#lumi-wind)" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M15.2 29.9c4.1 5.5 13.3 6.5 19.2 2.1" stroke="#8FE5D0" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="33.1" cy="12.9" r="2.1" fill="#8FE5D0" />
  </svg>;
}

/** Official four-colour Google G used only for the clearly-labelled future sign-in option. */
export function GoogleMark(props: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 48 48" {...props}>
    <path fill="#FFC107" d="M43.6 20H24v8.5h11.3C33.7 33.4 29.3 36.5 24 36.5c-6.9 0-12.5-5.6-12.5-12.5S17.1 11.5 24 11.5c3.1 0 5.8 1.1 7.9 3l6-6C34.3 5.2 29.4 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.6 20-21 0-1.4-.1-2.7-.4-4Z" />
    <path fill="#FF3D00" d="m6.2 14.2 7 5.1C15.1 14.6 19.1 11.5 24 11.5c3.1 0 5.8 1.1 7.9 3l6-6C34.3 5.2 29.4 3 24 3 16 3 9 7.5 5.4 14.1l.8.1Z" />
    <path fill="#4CAF50" d="M24 45c5.3 0 10.2-1.7 13.7-4.6l-6.3-5.2c-2.1 1.4-4.7 2.3-7.4 2.3-5.3 0-9.8-3.4-11.4-8.2l-7 5.4C9.1 40.9 16 45 24 45Z" />
    <path fill="#1976D2" d="M43.6 20H24v8.5h11.3c-.8 2.3-2.3 4.2-4 5.5l6.3 5.2C41.2 35.9 44 30.6 44 24c0-1.4-.1-2.7-.4-4Z" />
  </svg>;
}
