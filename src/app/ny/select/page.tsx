"use client";
import TierSelect from "../../../components/TierSelect";
import { DEFAULT_TIERS } from "../../../lib/states/index";

export default function NYSelectPage() {
  return <TierSelect stateCode="ny" stateName="New York" tiers={DEFAULT_TIERS} />;
}
