export interface DVCascadeAnalysis<RiskCascadeType = undefined> {
  cr4de_bnracascadeanalysisid: string;

  cr4de_expert: string;
  cr4de_cascade: RiskCascadeType;
  _cr4de_cascade_value: string;

  cr4de_c2c: string | null;
  cr4de_c2m: string | null;
  cr4de_c2e: string | null;
  cr4de_m2c: string | null;
  cr4de_m2m: string | null;
  cr4de_m2e: string | null;
  cr4de_e2c: string | null;
  cr4de_e2m: string | null;
  cr4de_e2e: string | null;
}
