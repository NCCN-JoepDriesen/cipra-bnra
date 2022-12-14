import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Paper, Skeleton, Select, MenuItem, FormControl, Divider, Box } from "@mui/material";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import RiskMatrix from "../../components/RiskMatrix";
import { DataTable } from "../../hooks/useAPI";
import { DVRiskFile } from "../../types/dataverse/DVRiskFile";
import useRecords from "../../hooks/useRecords";
import { RiskCalculation } from "../../types/RiskCalculation";
import usePageTitle from "../../hooks/usePageTitle";
import useBreadcrumbs from "../../hooks/useBreadcrumbs";
import { CalculatedRisk } from "../../types/CalculatedRisk";

export default function RankingPage() {
  const navigate = useNavigate();

  const [impactField, setImpactField] = useState("r");
  const { data: riskFiles } = useRecords<CalculatedRisk>({
    table: DataTable.RISK_FILE,
    transformResult: (results) => {
      const calculatedResults: CalculatedRisk[] = results.map((r: DVRiskFile) => ({
        ...r,
        calculated: JSON.parse(r.cr4de_calculated || "{}") || {},
      }));

      return calculatedResults;
    },
  });
  const [sortedRisks, setSortedRisks] = useState<CalculatedRisk[] | null>(null);

  useEffect(() => {
    if (!riskFiles) return;

    const sortedResults = [...riskFiles];

    sortedResults.sort(
      (a, b) =>
        ((b.calculated[impactField as keyof RiskCalculation] as number) || 0) -
        ((a.calculated[impactField as keyof RiskCalculation] as number) || 0)
    );

    setSortedRisks(sortedResults);
  }, [riskFiles, impactField]);

  usePageTitle("BNRA 2023 - 2026 Results Overview");
  useBreadcrumbs([
    { name: "BNRA 2023 - 2026", url: "/" },
    { name: "Results", url: "/reporting" },
  ]);

  return (
    <Container sx={{ mt: 4, pb: 8 }}>
      <Box mb={4} sx={{ width: "100%", height: "600px" }}>
        <RiskMatrix riskFiles={sortedRisks} />
      </Box>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 50, textAlign: "center", whiteSpace: "nowrap" }}>#</TableCell>
              <TableCell>Hazard Name</TableCell>
              <TableCell sx={{ width: 0, whiteSpace: "nowrap" }}>
                {/* <FormControl sx={{ m: 0, width: 150 }} size="small">
                  <Select
                    value={impactField}
                    onChange={(e) => {
                      setImpactField(e.target.value);
                    }}
                  >
                    <MenuItem value={"r"}>Risk</MenuItem>
                    <Divider />
                    <MenuItem value={"ti"}>Total Impact</MenuItem>
                    <MenuItem value={"tp"}>Total Probability</MenuItem>
                    <Divider />
                    <MenuItem value={"dp"}>Direct Probability</MenuItem>
                    <MenuItem value={"ip"}>Indirect Probability</MenuItem>
                    <Divider />
                    <MenuItem value={"ti_Ha"}>Total Ha</MenuItem>
                    <MenuItem value={"ti_Hb"}>Total Hb</MenuItem>
                    <MenuItem value={"ti_Hc"}>Total Hc</MenuItem>
                    <MenuItem value={"ti_Sa"}>Total Sa</MenuItem>
                    <MenuItem value={"ti_Sb"}>Total Sb</MenuItem>
                    <MenuItem value={"ti_Sc"}>Total Sc</MenuItem>
                    <MenuItem value={"ti_Sd"}>Total Sd</MenuItem>
                    <MenuItem value={"ti_Ea"}>Total Ea</MenuItem>
                    <MenuItem value={"ti_Fa"}>Total Fa</MenuItem>
                    <MenuItem value={"ti_Fb"}>Total Fb</MenuItem>
                    <Divider />
                    <MenuItem value={"di_Ha"}>Direct Ha</MenuItem>
                    <MenuItem value={"di_Hb"}>Direct Hb</MenuItem>
                    <MenuItem value={"di_Hc"}>Direct Hc</MenuItem>
                    <MenuItem value={"di_Sa"}>Direct Sa</MenuItem>
                    <MenuItem value={"di_Sb"}>Direct Sb</MenuItem>
                    <MenuItem value={"di_Sc"}>Direct Sc</MenuItem>
                    <MenuItem value={"di_Sd"}>Direct Sd</MenuItem>
                    <MenuItem value={"di_Ea"}>Direct Ea</MenuItem>
                    <MenuItem value={"di_Fa"}>Direct Fa</MenuItem>
                    <MenuItem value={"di_Fb"}>Direct Fb</MenuItem>
                    <Divider />
                    <MenuItem value={"ii_Ha"}>Indirect Ha</MenuItem>
                    <MenuItem value={"ii_Hb"}>Indirect Hb</MenuItem>
                    <MenuItem value={"ii_Hc"}>Indirect Hc</MenuItem>
                    <MenuItem value={"ii_Sa"}>Indirect Sa</MenuItem>
                    <MenuItem value={"ii_Sb"}>Indirect Sb</MenuItem>
                    <MenuItem value={"ii_Sc"}>Indirect Sc</MenuItem>
                    <MenuItem value={"ii_Sd"}>Indirect Sd</MenuItem>
                    <MenuItem value={"ii_Ea"}>Indirect Ea</MenuItem>
                    <MenuItem value={"ii_Fa"}>Indirect Fa</MenuItem>
                    <MenuItem value={"ii_Fb"}>Indirect Fb</MenuItem>
                  </Select>
                </FormControl> */}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedRisks
              ? sortedRisks.map((risk, i) => (
                  <TableRow
                    key={risk.cr4de_hazard_id}
                    hover
                    sx={{
                      "&:last-child td, &:last-child th": { border: 0 },
                      cursor: "pointer",
                    }}
                    onClick={() => navigate(`/reporting/${risk.cr4de_riskfilesid}`)}
                  >
                    <TableCell
                      component="th"
                      scope="row"
                      sx={{
                        width: 50,
                        textAlign: "center",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {i + 1}
                    </TableCell>
                    <TableCell component="th" scope="row">
                      {risk.cr4de_title}
                    </TableCell>
                    <TableCell align="right">
                      {/* {Math.round(100 * (risk.calculated[impactField as keyof RiskCalculation] as number)) / 100} */}
                    </TableCell>
                  </TableRow>
                ))
              : [1, 2, 3].map((i) => (
                  <TableRow key={i} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                    <TableCell>
                      <Skeleton variant="rectangular" />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="rectangular" />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="rectangular" />
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
