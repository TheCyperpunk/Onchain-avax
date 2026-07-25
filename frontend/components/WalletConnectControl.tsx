"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function WalletConnectControl() {
  return <ConnectButton showBalance={{ smallScreen: false, largeScreen: true }} chainStatus={{ smallScreen: 'icon', largeScreen: 'full' }} accountStatus={{ smallScreen: 'avatar', largeScreen: 'full' }} />;
}
