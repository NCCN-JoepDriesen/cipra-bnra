export interface RiskCalculation {
  // The id of the risk that this calculation belongs to
  riskId: string;

  // Direct probability of each scenario
  dp_c: number;
  dp_m: number;
  dp_e: number;

  // Total direct probability
  dp: number;

  // Indirect probabilities of each scenario
  ip_c: number;
  ip_m: number;
  ip_e: number;

  // Total indirect probability
  ip: number;

  // Total probabilities per scenario
  tp_c: number;
  tp_m: number;
  tp_e: number;

  // Total probability of the risk
  tp: number;

  // Relative probabilities of each scenario (normalized)
  rp_c: number;
  rp_m: number;
  rp_e: number;

  // Direct Impacts per damage indicator and per scenario
  di_Ha_c: number;
  di_Hb_c: number;
  di_Hc_c: number;
  di_Sa_c: number;
  di_Sb_c: number;
  di_Sc_c: number;
  di_Sd_c: number;
  di_Ea_c: number;
  di_Fa_c: number;
  di_Fb_c: number;

  di_Ha_m: number;
  di_Hb_m: number;
  di_Hc_m: number;
  di_Sa_m: number;
  di_Sb_m: number;
  di_Sc_m: number;
  di_Sd_m: number;
  di_Ea_m: number;
  di_Fa_m: number;
  di_Fb_m: number;

  di_Ha_e: number;
  di_Hb_e: number;
  di_Hc_e: number;
  di_Sa_e: number;
  di_Sb_e: number;
  di_Sc_e: number;
  di_Sd_e: number;
  di_Ea_e: number;
  di_Fa_e: number;
  di_Fb_e: number;

  // Total direct impact per damage indicator
  di_Ha: number;
  di_Hb: number;
  di_Hc: number;
  di_Sa: number;
  di_Sb: number;
  di_Sc: number;
  di_Sd: number;
  di_Ea: number;
  di_Fa: number;
  di_Fb: number;

  // Total direct impact per scenario
  di_c: number;
  di_m: number;
  di_e: number;

  // Total direct impact
  di: number;

  // Indirect Impacts per damage indicator and per scenario
  ii_Ha_c: number;
  ii_Hb_c: number;
  ii_Hc_c: number;
  ii_Sa_c: number;
  ii_Sb_c: number;
  ii_Sc_c: number;
  ii_Sd_c: number;
  ii_Ea_c: number;
  ii_Fa_c: number;
  ii_Fb_c: number;

  ii_Ha_m: number;
  ii_Hb_m: number;
  ii_Hc_m: number;
  ii_Sa_m: number;
  ii_Sb_m: number;
  ii_Sc_m: number;
  ii_Sd_m: number;
  ii_Ea_m: number;
  ii_Fa_m: number;
  ii_Fb_m: number;

  ii_Ha_e: number;
  ii_Hb_e: number;
  ii_Hc_e: number;
  ii_Sa_e: number;
  ii_Sb_e: number;
  ii_Sc_e: number;
  ii_Sd_e: number;
  ii_Ea_e: number;
  ii_Fa_e: number;
  ii_Fb_e: number;

  // Total indirect impact per damage indicator
  ii_Ha: number;
  ii_Hb: number;
  ii_Hc: number;
  ii_Sa: number;
  ii_Sb: number;
  ii_Sc: number;
  ii_Sd: number;
  ii_Ea: number;
  ii_Fa: number;
  ii_Fb: number;

  // Total indirect impact per scenario
  ii_c: number;
  ii_m: number;
  ii_e: number;

  // Total indirect impact
  ii: number;

  // Total Impacts per damage indicator and per scenario
  ti_Ha_c: number;
  ti_Hb_c: number;
  ti_Hc_c: number;
  ti_Sa_c: number;
  ti_Sb_c: number;
  ti_Sc_c: number;
  ti_Sd_c: number;
  ti_Ea_c: number;
  ti_Fa_c: number;
  ti_Fb_c: number;

  ti_Ha_m: number;
  ti_Hb_m: number;
  ti_Hc_m: number;
  ti_Sa_m: number;
  ti_Sb_m: number;
  ti_Sc_m: number;
  ti_Sd_m: number;
  ti_Ea_m: number;
  ti_Fa_m: number;
  ti_Fb_m: number;

  ti_Ha_e: number;
  ti_Hb_e: number;
  ti_Hc_e: number;
  ti_Sa_e: number;
  ti_Sb_e: number;
  ti_Sc_e: number;
  ti_Sd_e: number;
  ti_Ea_e: number;
  ti_Fa_e: number;
  ti_Fb_e: number;

  // Total impact per damage indicator
  ti_Ha: number;
  ti_Hb: number;
  ti_Hc: number;
  ti_Sa: number;
  ti_Sb: number;
  ti_Sc: number;
  ti_Sd: number;
  ti_Ea: number;
  ti_Fa: number;
  ti_Fb: number;

  // Total impact per scenario
  ti_c: number;
  ti_m: number;
  ti_e: number;

  // Total impact
  ti: number;

  // Risk
  r: number;

  causes: {
    // The object holding the calculated fields for the causing risk
    risk: RiskCalculation;

    // database id of the causing risk file
    riskId: string;
    // database id of the causing risk cascade
    cascadeId: string;

    // title of the causing risk file
    title: string;

    // Conditional probabilities per scenario couple
    c2c: number;
    c2m: number;
    c2e: number;
    m2c: number;
    m2m: number;
    m2e: number;
    e2c: number;
    e2m: number;
    e2e: number;

    // Indirect probability of this cascade per scenario
    ip_c: number;
    ip_m: number;
    ip_e: number;

    // Total indirect probability of this cascade
    ip: number;
  }[];

  effects: {
    // The object holding the calculated fields for the effect risk
    risk: RiskCalculation;

    // database id of the effect risk file
    riskId: string;
    // database id of the effect risk cascade
    cascadeId: string;

    // title of the effect risk file
    title: string;

    // Conditional probabilities per scenario couple
    c2c: number;
    c2m: number;
    c2e: number;
    m2c: number;
    m2m: number;
    m2e: number;
    e2c: number;
    e2m: number;
    e2e: number;

    // Indirect impact of this cascade damage indicator per scenario
    ii_Ha_c: number;
    ii_Hb_c: number;
    ii_Hc_c: number;
    ii_Sa_c: number;
    ii_Sb_c: number;
    ii_Sc_c: number;
    ii_Sd_c: number;
    ii_Ea_c: number;
    ii_Fa_c: number;
    ii_Fb_c: number;

    ii_Ha_m: number;
    ii_Hb_m: number;
    ii_Hc_m: number;
    ii_Sa_m: number;
    ii_Sb_m: number;
    ii_Sc_m: number;
    ii_Sd_m: number;
    ii_Ea_m: number;
    ii_Fa_m: number;
    ii_Fb_m: number;

    ii_Ha_e: number;
    ii_Hb_e: number;
    ii_Hc_e: number;
    ii_Sa_e: number;
    ii_Sb_e: number;
    ii_Sc_e: number;
    ii_Sd_e: number;
    ii_Ea_e: number;
    ii_Fa_e: number;
    ii_Fb_e: number;

    // Indirect impact of this cascade damage indicator
    ii_Ha: number;
    ii_Hb: number;
    ii_Hc: number;
    ii_Sa: number;
    ii_Sb: number;
    ii_Sc: number;
    ii_Sd: number;
    ii_Ea: number;
    ii_Fa: number;
    ii_Fb: number;

    // Total indirect impact of this cascade
    ii: number;
  }[];
}
