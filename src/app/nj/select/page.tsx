"use client";
import TierSelect from "../../../components/TierSelect";
import { DEFAULT_TIERS } from "../../../lib/states/index";

export default function NJSelectPage() {
  return <TierSelect stateCode="nj" stateName="New Jersey" tiers={DEFAULT_TIERS} />;
}
