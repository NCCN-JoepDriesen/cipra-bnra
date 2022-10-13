import { useCallback, useMemo, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Paper,
  Divider,
  Button,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import TextInputBox from "../../components/TextInputBox";
import TransferList from "../../components/TransferList";
import SaveIcon from "@mui/icons-material/Save";
import { DVValidation } from "../../types/dataverse/DVValidation";
import { DVRiskFile } from "../../types/dataverse/DVRiskFile";
import { DVRiskCascade } from "../../types/dataverse/DVRiskCascade";
import useAPI, { DataTable } from "../../hooks/useAPI";
import * as S from "../../functions/scenarios";
import * as HE from "../../functions/historicalEvents";
import * as IP from "../../functions/intensityParameters";
import useRecord from "../../hooks/useRecord";
import useLazyRecords from "../../hooks/useLazyRecords";
import useAutosave from "../../hooks/useAutosave";
import usePageTitle from "../../hooks/usePageTitle";
import useBreadcrumbs from "../../hooks/useBreadcrumbs";
import ScenariosTable from "../../components/ScenariosTable";
import IntensityParametersTable from "../../components/IntensityParametersTable";
import HistoricalEventsTable from "../../components/HistoricalEventsTable";
import { Trans, useTranslation } from "react-i18next";
import { SmallRisk } from "../../types/dataverse/DVSmallRisk";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import Attachments from "../../components/Attachments";
import { DVAttachment } from "../../types/dataverse/DVAttachment";

interface ProcessedRiskFile extends DVRiskFile {
  historicalEvents: HE.HistoricalEvent[];
  intensityParameters: IP.IntensityParameter[];
  scenarios: S.Scenarios;
}

type RouteParams = {
  validation_id: string;
};

export default function ValidationPage() {
  const params = useParams() as RouteParams;
  const navigate = useNavigate();
  const { t } = useTranslation();
  const api = useAPI();

  const [riskFile, setRiskFile] = useState<ProcessedRiskFile | null>(null);

  const [definitionFeedback, setDefinitionFeedback] = useState<string | undefined>(undefined);
  const [historicalEventsFeedback, setHistoricalEventsFeedback] = useState<string | undefined>(undefined);
  const [parametersFeedback, setParametersFeedback] = useState<string | undefined>(undefined);
  const [scenariosFeedback, setScenariosFeedback] = useState<string | undefined>(undefined);
  const [causesFeedback, setCausesFeedback] = useState<string | undefined>(undefined);
  const [effectsFeedback, setEffectsFeedback] = useState<string | undefined>(undefined);
  const [catalysingFeedback, setCatalysingFeedback] = useState<string | undefined>(undefined);
  const [horizonFeedback, setHorizonFeedback] = useState<string | undefined>(undefined);

  const [finishedDialogOpen, setFinishedDialogOpen] = useState(false);

  const { data: otherHazards, getData: getOtherHazards } = useLazyRecords<SmallRisk>({
    table: DataTable.RISK_FILE,
  });
  const [causes, setCauses] = useState<DVRiskCascade<SmallRisk>[] | null>(null);
  const [catalysing, setCatalysing] = useState<DVRiskCascade<SmallRisk>[] | null>(null);
  const { data: allCauses, getData: getAllCauses } = useLazyRecords<DVRiskCascade<SmallRisk>>({
    table: DataTable.RISK_CASCADE,
    onComplete: async (allCauses) => {
      setCauses(allCauses.filter((c) => c.cr4de_cause_hazard.cr4de_risk_type === "Standard Risk"));
      setCatalysing(allCauses.filter((c) => c.cr4de_cause_hazard.cr4de_risk_type === "Emerging Risk"));
    },
  });
  const { data: effects, getData: getEffects } = useLazyRecords<DVRiskCascade<string, SmallRisk>>({
    table: DataTable.RISK_CASCADE,
  });
  const { data: attachments, getData: getAttachments } = useLazyRecords<DVAttachment>({
    table: DataTable.ATTACHMENT,
  });

  /**
   * Retrieve the Validation record from the database that is defined in the page url when the page loads
   */
  const { data: validation, reloadData: reloadValidation } = useRecord<DVValidation<DVRiskFile>>({
    table: DataTable.VALIDATION,
    id: params.validation_id,
    query: "$expand=cr4de_RiskFile",
    onComplete: async (result) => {
      const ips = IP.unwrap(result.cr4de_RiskFile.cr4de_intensity_parameters);

      // Parse complex data fields before displaying the risk file object
      const processedRiskFile: ProcessedRiskFile = {
        ...result.cr4de_RiskFile,
        historicalEvents: HE.unwrap(result.cr4de_RiskFile.cr4de_historical_events),
        intensityParameters: ips,
        scenarios: S.unwrap(
          ips,
          result.cr4de_RiskFile.cr4de_scenario_considerable,
          result.cr4de_RiskFile.cr4de_scenario_major,
          result.cr4de_RiskFile.cr4de_scenario_extreme
        ),
      };
      setRiskFile(processedRiskFile);

      setDefinitionFeedback(result.cr4de_definition_feedback);
      setHistoricalEventsFeedback(result.cr4de_historical_events_feedback);
      setParametersFeedback(result.cr4de_intensity_parameters_feedback);
      setScenariosFeedback(result.cr4de_scenarios_feedback);
      setCausesFeedback(result.cr4de_causes_feedback);
      setEffectsFeedback(result.cr4de_effects_feedback);
      setCatalysingFeedback(result.cr4de_catalysing_effects_feedback);
      setHorizonFeedback(result.cr4de_horizon_analysis_feedback);

      if (!otherHazards)
        getOtherHazards({
          query: `$filter=cr4de_riskfilesid ne ${processedRiskFile.cr4de_riskfilesid}&$select=cr4de_riskfilesid,cr4de_hazard_id,cr4de_title,cr4de_risk_type,cr4de_definition`,
        });
      if (!allCauses)
        getAllCauses({
          query: `$filter=_cr4de_effect_hazard_value eq ${processedRiskFile.cr4de_riskfilesid}&$expand=cr4de_cause_hazard($select=cr4de_riskfilesid,cr4de_title,cr4de_hazard_id,cr4de_risk_type,cr4de_definition)`,
        });
      if (!effects)
        getEffects({
          query: `$filter=_cr4de_cause_hazard_value eq ${processedRiskFile.cr4de_riskfilesid}&$expand=cr4de_effect_hazard($select=cr4de_riskfilesid,cr4de_title,cr4de_hazard_id,cr4de_risk_type,cr4de_definition)`,
        });
      if (!attachments)
        getAttachments({ query: `$filter=_cr4de_risk_file_value eq ${processedRiskFile.cr4de_riskfilesid}` });
    },
  });

  const updateValidation = useCallback(
    async (fieldsToUpdate: Partial<DVValidation<DVRiskFile>>) => {
      if (fieldsToUpdate === null) return;

      setIsSaving(true);

      await api.updateValidation(params.validation_id, fieldsToUpdate);
      await reloadValidation();

      setIsSaving(false);
    },
    [api, params.validation_id, reloadValidation]
  );

  const [isSaving, setIsSaving] = useState(false);

  const { isSaving: isAutosaving, fieldsToUpdate } = useAutosave<DVValidation<DVRiskFile>>({
    fields: {
      cr4de_definition_feedback: definitionFeedback,
      cr4de_historical_events_feedback: historicalEventsFeedback,
      cr4de_intensity_parameters_feedback: parametersFeedback,
      cr4de_scenarios_feedback: scenariosFeedback,
      cr4de_horizon_analysis_feedback: horizonFeedback,
      cr4de_causes_feedback: causesFeedback,
      cr4de_effects_feedback: effectsFeedback,
      cr4de_catalysing_effects_feedback: catalysingFeedback,
    },
    compareTo: validation || {},
    handleSave: updateValidation,
    enable: !isSaving && validation !== null,
  });

  usePageTitle(t("validation.appFullName"));
  useBreadcrumbs([
    { name: t("bnra.shortName"), url: "/" },
    { name: t("validation.appName"), url: "/validation" },
    riskFile ? { name: riskFile.cr4de_title, url: "" } : null,
  ]);

  // Calculate transfer list data (causes, effects, catalysing effect) and memorize for efficiency
  const causesChoises = useMemo<SmallRisk[]>(
    () =>
      otherHazards && causes
        ? otherHazards.filter((rf) => !causes.find((c) => c._cr4de_cause_hazard_value === rf.cr4de_riskfilesid))
        : [],
    [causes, otherHazards]
  );
  const causesChosen = useMemo(
    () =>
      causes
        ? causes.map((c) => ({
            ...c.cr4de_cause_hazard,
            cascadeId: c.cr4de_bnrariskcascadeid,
            reason: c.cr4de_reason,
          }))
        : [],
    [causes]
  );

  const effectsChoices = useMemo<SmallRisk[]>(
    () =>
      otherHazards && effects
        ? otherHazards.filter((rf) => effects.find((c) => c._cr4de_effect_hazard_value === rf.cr4de_riskfilesid))
        : [],
    [effects, otherHazards]
  );
  const effectsChosen = useMemo(
    () =>
      effects
        ? effects.map((c) => ({
            ...c.cr4de_effect_hazard,
            cascadeId: c.cr4de_bnrariskcascadeid,
            reason: c.cr4de_reason,
          }))
        : [],
    [effects]
  );

  const catalysingChoices = useMemo<SmallRisk[]>(
    () =>
      otherHazards && catalysing
        ? otherHazards.filter(
            (rf) =>
              rf.cr4de_risk_type === "Emerging Risk" &&
              !catalysing.find((c) => c._cr4de_cause_hazard_value === rf.cr4de_riskfilesid)
          )
        : [],
    [catalysing, otherHazards]
  );
  const catalysingChosen = useMemo(
    () =>
      catalysing
        ? catalysing.map((c) => ({
            ...c.cr4de_cause_hazard,
            cascadeId: c.cr4de_bnrariskcascadeid,
            reason: c.cr4de_reason,
          }))
        : [],
    [catalysing]
  );

  return (
    <>
      <Container sx={{ pb: 8 }}>
        <Paper>
          <Box p={2} my={4}>
            <Typography variant="h6" mb={1} color="secondary">
              1. <Trans i18nKey="riskFile.definition.title">Definition</Trans>
            </Typography>
            <Divider />
            {riskFile ? (
              <Box
                mt={3}
                dangerouslySetInnerHTML={{
                  __html: riskFile.cr4de_definition || "",
                }}
              />
            ) : (
              <Box mt={3}>
                <Skeleton variant="text" />
                <Skeleton variant="text" />
                <Skeleton variant="text" />
              </Box>
            )}

            <Typography variant="subtitle2" mt={8} mb={2} color="secondary">
              <Trans i18nKey="riskFile.definition.feedback">
                Please provide any comments or feedback on the definition of the hazard below:
              </Trans>
            </Typography>

            {validation ? (
              <TextInputBox
                initialValue={validation.cr4de_definition_feedback || ""}
                setValue={setDefinitionFeedback}
              />
            ) : (
              <Skeleton variant="rectangular" width="100%" height="300px" />
            )}

            <Attachments
              attachments={attachments}
              field="definition"
              riskFile={riskFile}
              validation={validation}
              isExternal={true}
              onUpdate={() =>
                getAttachments({ query: `$filter=_cr4de_risk_file_value eq ${riskFile?.cr4de_riskfilesid}` })
              }
            />
          </Box>
        </Paper>

        {riskFile && riskFile.cr4de_risk_type === "Standard Risk" && (
          <Paper>
            <Box p={2} my={8}>
              <Typography variant="h6" mb={1} color="secondary">
                2. <Trans i18nKey="riskFile.historicalEvents.title">Historical Events</Trans>
              </Typography>
              <Divider />

              <Box mt={1}>
                <Typography variant="caption" paragraph>
                  <Trans i18nKey="riskFile.historicalEvents.helpText1">
                    Examples of events corresponding to the definition of this hazard in Belgium or other countries.
                  </Trans>
                </Typography>
                <Typography variant="caption" paragraph>
                  <Trans i18nKey="riskFile.historicalEvents.helpText2">
                    This field is optional and serves as a guide when determining intensity parameters and building
                    scenarios. It is in no way meant to be a complete overview of all known events.
                  </Trans>
                </Typography>
              </Box>

              <HistoricalEventsTable historicalEvents={riskFile?.historicalEvents} />

              <Typography variant="subtitle2" mt={8} mb={2} color="secondary">
                <Trans i18nKey="riskFile.historicalEvents.feedback">
                  Please provide any comments or feedback on the historical event examples of the hazard below:
                </Trans>
              </Typography>

              {validation ? (
                <TextInputBox
                  initialValue={validation.cr4de_historical_events_feedback || ""}
                  setValue={setHistoricalEventsFeedback}
                />
              ) : (
                <Skeleton variant="rectangular" width="100%" height="300px" />
              )}

              <Attachments
                attachments={attachments}
                field="historical_events"
                riskFile={riskFile}
                validation={validation}
                isExternal={true}
                onUpdate={() =>
                  getAttachments({ query: `$filter=_cr4de_risk_file_value eq ${riskFile?.cr4de_riskfilesid}` })
                }
              />
            </Box>
          </Paper>
        )}

        {riskFile && riskFile.cr4de_risk_type === "Standard Risk" && (
          <Paper>
            <Box p={2} my={8}>
              <Typography variant="h6" mb={1} color="secondary">
                3. <Trans i18nKey="riskFile.intensityParameters.title">Intensity Parameters</Trans>
              </Typography>
              <Divider />

              <Box mt={1}>
                <Typography variant="caption" paragraph>
                  <Trans i18nKey="riskFile.intensityParameters.helpText">
                    Factors which influence the evolution and consequences of an event of this type.
                  </Trans>
                </Typography>
              </Box>

              <IntensityParametersTable parameters={riskFile?.intensityParameters} />

              <Typography variant="subtitle2" mt={8} mb={2} color="secondary">
                <Trans i18nKey="riskFile.intensityParameters.feedback">
                  Please provide any comments or feedback on the intensity parameters of the hazard below:
                </Trans>
              </Typography>

              {validation ? (
                <TextInputBox
                  initialValue={validation.cr4de_intensity_parameters_feedback || ""}
                  setValue={setParametersFeedback}
                />
              ) : (
                <Skeleton variant="rectangular" width="100%" height="300px" />
              )}

              <Attachments
                attachments={attachments}
                field="intensity_parameters"
                riskFile={riskFile}
                validation={validation}
                isExternal={true}
                onUpdate={() =>
                  getAttachments({ query: `$filter=_cr4de_risk_file_value eq ${riskFile?.cr4de_riskfilesid}` })
                }
              />
            </Box>
          </Paper>
        )}

        {riskFile && riskFile.cr4de_risk_type === "Standard Risk" && (
          <Paper>
            <Box p={2} my={8}>
              <Typography variant="h6" mb={1} color="secondary">
                4. <Trans i18nKey="riskFile.intensityScenarios.title">Intensity Scenarios</Trans>
              </Typography>

              <Divider />

              <Box mt={1}>
                <Typography variant="caption" paragraph>
                  <Trans i18nKey="riskFile.intensityScenarios.helpText1">
                    Outline of the scenarios according to three levels of intensity - <i>considerable, major</i> and{" "}
                    <i>extreme</i> - described in terms of the intensity parameters defined in the previous section.
                  </Trans>
                </Typography>
                <Typography variant="caption" paragraph>
                  <Trans i18nKey="riskFile.intensityScenarios.helpText2">
                    Each scenario should be intuitively differentiable with respect to its impact, but no strict rules
                    are defined as to the limits of the scenarios.
                  </Trans>
                </Typography>
              </Box>

              <ScenariosTable parameters={riskFile?.intensityParameters} scenarios={riskFile?.scenarios} />

              <Typography variant="subtitle2" mt={8} mb={2} color="secondary">
                <Trans i18nKey="riskFile.intensityScenarios.feedback">
                  Please provide any comments or feedback on the intensity scenarios of the hazard below:
                </Trans>
              </Typography>

              {validation ? (
                <TextInputBox
                  initialValue={validation.cr4de_scenarios_feedback || ""}
                  setValue={setScenariosFeedback}
                />
              ) : (
                <Skeleton variant="rectangular" width="100%" height="300px" />
              )}

              <Attachments
                attachments={attachments}
                field="scenarios"
                riskFile={riskFile}
                validation={validation}
                isExternal={true}
                onUpdate={() =>
                  getAttachments({ query: `$filter=_cr4de_risk_file_value eq ${riskFile?.cr4de_riskfilesid}` })
                }
              />
            </Box>
          </Paper>
        )}

        {riskFile && riskFile.cr4de_risk_type === "Malicious Man-made Risk" && (
          <Paper>
            <Box p={2} my={8}>
              <Typography variant="h6" mb={1} color="secondary">
                2. <Trans i18nKey="riskFile.actorCapabilities.title">Actor Capabilities</Trans>
              </Typography>

              <Divider />

              <Box mt={1}>
                <Typography variant="caption" paragraph>
                  <Trans i18nKey="riskFile.actorCapabilities.helpText1">
                    Outline of the actor groups according to three levels of capabilities - <i>considerable, major</i>{" "}
                    and <i>extreme</i>.
                  </Trans>
                </Typography>
                <Typography variant="caption" paragraph>
                  <Trans i18nKey="riskFile.actorCapabilities.helpText2">
                    The information contained in the risk files is considered 'Limited Distribution'.
                  </Trans>
                </Typography>
              </Box>

              {riskFile ? (
                <Box>
                  <Typography variant="subtitle2">
                    <Trans i18nKey="riskFile.actorCapabilities.considerable">Considerable Capabilities</Trans>
                  </Typography>
                  <Box
                    dangerouslySetInnerHTML={{
                      __html: riskFile.scenarios.considerable ? riskFile.scenarios.considerable[0].value : "",
                    }}
                  />
                  <Typography variant="subtitle2">
                    <Trans i18nKey="riskFile.actorCapabilities.major">Major Capabilities</Trans>
                  </Typography>
                  <Box
                    dangerouslySetInnerHTML={{
                      __html: riskFile.scenarios.major ? riskFile.scenarios.major[0].value : "",
                    }}
                  />
                  <Typography variant="subtitle2">
                    <Trans i18nKey="riskFile.actorCapabilities.extreme">Extreme Capabilities</Trans>
                  </Typography>
                  <Box
                    dangerouslySetInnerHTML={{
                      __html: riskFile.scenarios.extreme ? riskFile.scenarios.extreme[0].value : "",
                    }}
                  />
                </Box>
              ) : (
                <Box mt={3}>
                  <Skeleton variant="text" />
                  <Skeleton variant="text" />
                  <Skeleton variant="text" />
                </Box>
              )}

              <Typography variant="subtitle2" mt={8} mb={2} color="secondary">
                <Trans i18nKey="riskFile.actorCapabilities.feedback">
                  Please provide any comments or feedback on the actor capabilities of the hazard below:
                </Trans>
              </Typography>

              {validation ? (
                <TextInputBox
                  initialValue={validation.cr4de_scenarios_feedback || ""}
                  setValue={setScenariosFeedback}
                />
              ) : (
                <Skeleton variant="rectangular" width="100%" height="300px" />
              )}

              <Attachments
                attachments={attachments}
                field="scenarios"
                riskFile={riskFile}
                validation={validation}
                isExternal={true}
                onUpdate={() =>
                  getAttachments({ query: `$filter=_cr4de_risk_file_value eq ${riskFile?.cr4de_riskfilesid}` })
                }
              />
            </Box>
          </Paper>
        )}

        {riskFile && riskFile.cr4de_risk_type === "Emerging Risk" && (
          <Paper>
            <Box p={2} my={8}>
              <Typography variant="h6" mb={1} color="secondary">
                2. <Trans i18nKey="riskFile.horizonAnalysis.title">Horizon Analysis</Trans>
              </Typography>

              <Divider />

              <Box mt={1}>
                <Typography variant="caption" paragraph>
                  <Trans i18nKey="riskFile.horizonAnalysis.helpText1">
                    This section should include a qualitative (or quantitative if possible) description of one or more
                    possible evolution pathways of the emerging risk (e.g. different GHG emission pathways for climate
                    change scenario’s, adoption curves for new technologies, …), including potential timeframes or
                    trigger events.
                  </Trans>
                </Typography>
                <Typography variant="caption" paragraph>
                  <Trans i18nKey="riskFile.horizonAnalysis.helpText2">
                    The horizon analysis investigates and tries to predict at what speed the emerging risk manifests
                    itself. Will a new technology or phenomenon become mature or more prominent in the near future (e.g.
                    5-10 years) or rather long-term (30-50 years)? Due to the uncertainty that emerging risks present,
                    it is encouraged to discuss multiple scenarios with which these risks may emerge and influence
                    others.
                  </Trans>
                </Typography>
              </Box>

              {riskFile ? (
                <Box
                  mt={3}
                  dangerouslySetInnerHTML={{
                    __html: riskFile.cr4de_horizon_analysis || "",
                  }}
                />
              ) : (
                <Box mt={3}>
                  <Skeleton variant="text" />
                  <Skeleton variant="text" />
                  <Skeleton variant="text" />
                </Box>
              )}

              <Typography variant="subtitle2" mt={8} mb={2} color="secondary">
                <Trans i18nKey="riskFile.horizonAnalysis.feedback">
                  Please provide any comments or feedback on the horizon analysis of the emerging risk below:
                </Trans>
              </Typography>

              {validation ? (
                <TextInputBox
                  initialValue={validation.cr4de_scenarios_feedback || ""}
                  setValue={setScenariosFeedback}
                />
              ) : (
                <Skeleton variant="rectangular" width="100%" height="300px" />
              )}

              <Attachments
                attachments={attachments}
                field="horizon_analysis"
                riskFile={riskFile}
                validation={validation}
                isExternal={true}
                onUpdate={() =>
                  getAttachments({ query: `$filter=_cr4de_risk_file_value eq ${riskFile?.cr4de_riskfilesid}` })
                }
              />
            </Box>
          </Paper>
        )}

        {riskFile && riskFile.cr4de_risk_type === "Standard Risk" && (
          <Paper>
            <Box p={2} my={8}>
              <Typography variant="h6" mb={1} color="secondary">
                5. <Trans i18nKey="transferList.causes.title">Causing Hazards</Trans>
              </Typography>
              <Divider />

              <Box mt={1}>
                <Typography variant="caption" paragraph>
                  <Trans i18nKey="riskFile.causes.helpText1">
                    This section identifies other hazards in the BNRA hazard catalogue that may cause the current
                    hazard. A short reason should be provided for each non-trivial causal relation.
                  </Trans>
                </Typography>
                <Typography variant="caption" paragraph>
                  <Trans i18nKey="riskFile.causes.helpText2">
                    On the left are the hazards that were identified by NCCN analist as being a potential cause. On the
                    right are all the other hazards in the hazard catalogue. The definition of a hazard selected in the
                    windows below can be found beneath the comment box.
                  </Trans>
                </Typography>
              </Box>

              {causes !== null && otherHazards !== null && (
                <TransferList
                  choices={causesChoises}
                  chosen={causesChosen}
                  choicesLabel={t("riskFile.causes.choices")}
                  chosenLabel={t("riskFile.causes.chosen")}
                  chosenSubheader={t("riskFile.causes.subheader", { count: causes.length })}
                />
              )}

              <Typography variant="subtitle2" mt={8} mb={2} color="secondary">
                <Trans i18nKey="riskFile.causes.feedback">
                  Please provide any comments or feedback on the intensity scenarios of the hazard below:
                </Trans>
              </Typography>

              {validation ? (
                <TextInputBox initialValue={validation.cr4de_causes_feedback || ""} setValue={setCausesFeedback} />
              ) : (
                <Skeleton variant="rectangular" width="100%" height="300px" />
              )}

              <Attachments
                attachments={attachments}
                field="causes"
                riskFile={riskFile}
                validation={validation}
                isExternal={true}
                onUpdate={() =>
                  getAttachments({ query: `$filter=_cr4de_risk_file_value eq ${riskFile?.cr4de_riskfilesid}` })
                }
              />
            </Box>
          </Paper>
        )}

        {riskFile && riskFile.cr4de_risk_type === "Malicious Man-made Risk" && (
          <Paper>
            <Box p={2} my={8}>
              <Typography variant="h6" mb={1} color="secondary">
                3. <Trans i18nKey="riskFile.maliciousActions.title">Malicious Actions</Trans>
              </Typography>
              <Divider />

              <Box mt={1}>
                <Typography variant="caption" paragraph>
                  <Trans i18nKey="riskFile.maliciousActions.helpText1">
                    This section tries to identify potential malicious actions in the BNRA hazard catalogue that may be
                    taken by the actors described by this hazard. A short reason should be provided for each non-evident
                    action.
                  </Trans>
                </Typography>
                <Typography variant="caption" paragraph>
                  <Trans i18nKey="riskFile.maliciousActions.helpText2">
                    On the left are the hazards that were identified by NCCN analist as being a potential malicious
                    actions. On the right are all the other malicious actions in the hazard catalogue. The definition of
                    a hazard selected in the windows below can be found beneath the comment box.
                  </Trans>
                </Typography>
              </Box>

              {effects !== null && otherHazards !== null && (
                <TransferList
                  choices={effectsChoices}
                  chosen={effectsChosen}
                  choicesLabel={t("riskFile.maliciousActions.choices")}
                  chosenLabel={t("riskFile.maliciousActions.chosen")}
                  chosenSubheader={t("riskFile.maliciousActions.subheader", { count: effects.length })}
                />
              )}

              <Typography variant="subtitle2" mt={8} mb={2} color="secondary">
                <Trans i18nKey="riskFile.maliciousActions.feedback">
                  Please provide any comments or feedback on the list of potential actions of these actors below:
                </Trans>
              </Typography>

              {validation ? (
                <TextInputBox initialValue={validation.cr4de_causes_feedback || ""} setValue={setCausesFeedback} />
              ) : (
                <Skeleton variant="rectangular" width="100%" height="300px" />
              )}

              <Attachments
                attachments={attachments}
                field="effects"
                riskFile={riskFile}
                validation={validation}
                isExternal={true}
                onUpdate={() =>
                  getAttachments({ query: `$filter=_cr4de_risk_file_value eq ${riskFile?.cr4de_riskfilesid}` })
                }
              />
            </Box>
          </Paper>
        )}

        {riskFile && riskFile.cr4de_risk_type === "Standard Risk" && (
          <Paper>
            <Box p={2} my={8}>
              <Typography variant="h6" mb={1} color="secondary">
                6. <Trans i18nKey="riskFile.effects.title">Effect Hazards</Trans>
              </Typography>
              <Divider />

              <Box mt={1}>
                <Typography variant="caption" paragraph>
                  <Trans i18nKey="riskFile.effects.helpText.part1">
                    This section identifies other hazards in the BNRA hazard catalogue that may be a direct consequence
                    of the current hazard. A short reason should be provided for each non-trivial causal relation.
                  </Trans>
                </Typography>
                <Typography variant="caption" paragraph>
                  <Trans i18nKey="riskFile.effects.helpText.part2">
                    On the left are the hazards that were identified by NCCN analist as being a potential effect. On the
                    right are all the other hazards in the hazard catalogue. The definition of a hazard selected in the
                    windows below can be found beneath the comment box.
                  </Trans>
                </Typography>
              </Box>

              {effects !== null && otherHazards !== null && (
                <TransferList
                  choices={effectsChoices}
                  chosen={effectsChosen}
                  choicesLabel={t("riskFile.effects.choices")}
                  chosenLabel={t("riskFile.effects.chosen")}
                  chosenSubheader={t("riskFile.effects.subheader", { count: effects.length })}
                />
              )}

              <Typography variant="subtitle2" mt={8} mb={2} color="secondary">
                <Trans i18nKey="riskFile.effects.feedback">
                  Please provide any comments or feedback on the intensity scenarios of the hazard below:
                </Trans>
              </Typography>

              {validation ? (
                <TextInputBox initialValue={validation.cr4de_effects_feedback || ""} setValue={setEffectsFeedback} />
              ) : (
                <Skeleton variant="rectangular" width="100%" height="300px" />
              )}

              <Attachments
                attachments={attachments}
                field="catalysing_effects"
                riskFile={riskFile}
                validation={validation}
                isExternal={true}
                onUpdate={() =>
                  getAttachments({ query: `$filter=_cr4de_risk_file_value eq ${riskFile?.cr4de_riskfilesid}` })
                }
              />
            </Box>
          </Paper>
        )}

        {riskFile && riskFile.cr4de_risk_type === "Emerging Risk" && (
          <Paper>
            <Box p={2} my={8}>
              <Typography variant="h6" mb={1} color="secondary">
                3. <Trans i18nKey="riskFile.catalysedEffects.title">Catalysing Effects</Trans>
              </Typography>
              <Divider />

              <Box mt={1}>
                <Typography variant="caption" paragraph>
                  <Trans i18nKey="riskFile.catalysedEffects.helpText.part1">
                    This section tries to identify other hazards in the BNRA hazard catalogue that may be catalysed by
                    the current emerging risk (this means in the future it may affect the probability and/or impact of
                    the other hazard). A short reason may be provided for each non-trivial causal relation.
                  </Trans>
                </Typography>
                <Typography variant="caption" paragraph>
                  <Trans i18nKey="riskFile.catalysedEffects.helpText.part2">
                    On the left are the hazards that may experience a catalysing effect. On the right are all the other
                    risks in the hazard catalogue. The definition of a hazard selected in the windows below can be found
                    beneath the comment box.
                  </Trans>
                </Typography>
              </Box>

              {effects !== null && otherHazards !== null && (
                <TransferList
                  choices={effectsChoices}
                  chosen={effectsChosen}
                  choicesLabel={t("riskFile.catalysedEffects.choices")}
                  chosenLabel={t("riskFile.catalysedEffects.chosen")}
                  chosenSubheader={t("riskFile.catalysedEffects.subheader", { count: effects.length })}
                />
              )}

              <Typography variant="subtitle2" mt={8} mb={2} color="secondary">
                <Trans i18nKey="riskFile.catalysedEffects.feedback">
                  Please provide any comments or feedback on the intensity scenarios of the hazard below:
                </Trans>
              </Typography>

              {validation ? (
                <TextInputBox initialValue={validation.cr4de_effects_feedback || ""} setValue={setEffectsFeedback} />
              ) : (
                <Skeleton variant="rectangular" width="100%" height="300px" />
              )}

              <Attachments
                attachments={attachments}
                field="effects"
                riskFile={riskFile}
                validation={validation}
                isExternal={true}
                onUpdate={() =>
                  getAttachments({ query: `$filter=_cr4de_risk_file_value eq ${riskFile?.cr4de_riskfilesid}` })
                }
              />
            </Box>
          </Paper>
        )}

        {riskFile && riskFile.cr4de_risk_type !== "Emerging Risk" && (
          <Paper>
            <Box p={2} my={8}>
              {riskFile.cr4de_risk_type === "Standard Risk" && (
                <Typography variant="h6" mb={1} color="secondary">
                  7. <Trans i18nKey="riskFile.catalysingEffects.title">Catalysing Effects</Trans>
                </Typography>
              )}
              {riskFile.cr4de_risk_type === "Malicious Man-made Risk" && (
                <Typography variant="h6" mb={1} color="secondary">
                  4. <Trans i18nKey="riskFile.catalysingEffects.title">Catalysing Effects</Trans>
                </Typography>
              )}
              <Divider />

              <Box mt={1}>
                <Typography variant="caption" paragraph>
                  <Trans i18nKey="riskFile.catalysingEffects.helpText.part1">
                    This section tries to identifies the emerging risks in the BNRA hazard catalogue that may catalyse
                    the current hazard (this means in the future it may have an effect on the probability and/or impact
                    of this hazard). A short reason may be provided for each non-trivial causal relation.
                  </Trans>
                </Typography>
                <Typography variant="caption" paragraph>
                  <Trans i18nKey="riskFile.catalysingEffects.helpText.part2">
                    On the left are the hazards that were identified by NCCN analists as having a potential catalysing
                    effect. On the right are all the other emerging risks in the hazard catalogue. The definition of a
                    hazard selected in the windows below can be found beneath the comment box.
                  </Trans>
                </Typography>
              </Box>

              {catalysing !== null && otherHazards !== null && (
                <TransferList
                  choices={catalysingChoices}
                  chosen={catalysingChosen}
                  choicesLabel={t("riskFile.catalysingEffects.choices")}
                  chosenLabel={t("riskFile.catalysingEffects.chosen")}
                  chosenSubheader={t("riskFile.catalysedEffects.subheader", { count: catalysing.length })}
                />
              )}

              <Typography variant="subtitle2" mt={8} mb={2} color="secondary">
                <Trans i18nKey="riskFile.catalysingEffects.feedback">
                  Please provide any comments or feedback on the catalysing effects of the hazard below:
                </Trans>
              </Typography>

              {validation ? (
                <TextInputBox
                  initialValue={validation.cr4de_catalysing_effects_feedback || ""}
                  setValue={setCatalysingFeedback}
                />
              ) : (
                <Skeleton variant="rectangular" width="100%" height="300px" />
              )}

              <Attachments
                attachments={attachments}
                field="catalysing"
                riskFile={riskFile}
                validation={validation}
                isExternal={true}
                onUpdate={() =>
                  getAttachments({ query: `$filter=_cr4de_risk_file_value eq ${riskFile?.cr4de_riskfilesid}` })
                }
              />
            </Box>
          </Paper>
        )}
      </Container>

      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          p: 1,
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
        }}
        component={Paper}
        elevation={5}
      >
        <Button color="error" sx={{ mr: 1 }} component={RouterLink} to="/validation">
          <Trans i18nKey="button.exit">Exit</Trans>
        </Button>
        <Box sx={{ flex: "1 1 auto" }} />
        {(isSaving || isAutosaving) && (
          <LoadingButton color="secondary" sx={{ mr: 1 }} loading loadingPosition="start" startIcon={<SaveIcon />}>
            <Trans i18nKey="button.saving">Saving</Trans>
          </LoadingButton>
        )}
        {!(isSaving || isAutosaving) && fieldsToUpdate && (
          <Button color="secondary" sx={{ mr: 1 }} onClick={() => updateValidation(fieldsToUpdate)}>
            <Trans i18nKey="button.save">Save</Trans>
          </Button>
        )}
        {!(isSaving || isAutosaving) && !fieldsToUpdate && (
          <Button color="secondary" disabled sx={{ mr: 1 }}>
            <Trans i18nKey="button.saved">Saved</Trans>
          </Button>
        )}

        <Button
          color="secondary"
          onClick={() => {
            if (fieldsToUpdate) updateValidation(fieldsToUpdate);
            setFinishedDialogOpen(true);
          }}
        >
          <Trans i18nKey="button.saveAndExit">Save & Exit</Trans>
        </Button>
      </Box>

      <Dialog open={finishedDialogOpen} onClose={() => setFinishedDialogOpen(false)}>
        <DialogTitle>
          <Trans i18nKey="validation.dialog.title">Are you finished validating this risk file?</Trans>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            <Trans i18nKey="validation.dialog.helpText">
              Even if you indicate that you are finished, you can still return at a later time to make changes until the
              end of the validation phase.
            </Trans>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFinishedDialogOpen(false)}>
            <Trans i18nKey="validation.dialog.cancel">No, I am not finished</Trans>
          </Button>
          <Button
            onClick={() => {
              if (!validation) return;

              api.updateValidation(validation.cr4de_bnravalidationid, {
                cr4de_finished: true,
              });
              setFinishedDialogOpen(true);
              navigate("/validation");
            }}
          >
            <Trans i18nKey="validation.dialog.finish">Yes, I am finished</Trans>
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
