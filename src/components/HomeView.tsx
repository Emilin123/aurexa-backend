import React from 'react';
import { 
  Sparkles, 
  Diamond, 
  Pickaxe, 
  Crown, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  Flame, 
  ArrowUpRight,
  Zap,
  Gift,
  Trophy
} from 'lucide-react';
import { UserProfile, ViewType, MiningWell } from '../types';
import { AUREXA_CONFIG } from '../data/aurexaData';

interface HomeViewProps {
  user: UserProfile;
  activeWell: MiningWell | null;
  onNavigate: (view: ViewType) => void;
  onOpenStore: () => void;
  onClaimMining: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  user,
  activeWell,
  onNavigate,
  onOpenStore,
  onClaimMining,
}) => {
  const cupEquivalent = user.diamonds * AUREXA_CONFIG.exchangeRateCupPerDiamond;

  return (