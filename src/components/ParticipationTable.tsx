import { useState } from "react";
import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableFooter,
  Paper,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Stack,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
import { DVParticipation } from "../types/dataverse/DVParticipation";
import { DVContact } from "../types/dataverse/DVContact";
import useAPI, { DataTable } from "../hooks/useAPI";
import { DVRiskFile } from "../types/dataverse/DVRiskFile";
import useRecords from "../hooks/useRecords";

export default function ParticipationTable({ riskFile }: { riskFile: DVRiskFile }) {
  const api = useAPI();

  const { data: participants, reloadData: getParticipants } = useRecords<DVParticipation<DVContact>>({
    table: DataTable.PARTICIPATION,
    query: `$filter=_cr4de_risk_file_value eq ${riskFile.cr4de_riskfilesid}&$expand=cr4de_contact`,
  });

  const [dialogOpen, setDialogOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("expert");

  const handleCloseDialog = () => setDialogOpen(false);

  const handleAddParticipant = async () => {
    setIsLoading(true);

    const existingContact = await api.getContacts(`$filter=emailaddress1 eq ${email}`);

    let contactId;

    if (existingContact.length <= 0) {
      const newContact = await api.createContact({
        emailaddress1: email,
      });
      contactId = newContact.id;
    } else {
      contactId = existingContact[0].contactid;
    }

    await api.createParticipant({
      "cr4de_contact@odata.bind": `https://bnra.powerappsportals.com/_api/contacts(${contactId})`,
      "cr4de_risk_file@odata.bind": `https://bnra.powerappsportals.com/_api/cr4de_riskfileses(${riskFile.cr4de_riskfilesid})`,
      cr4de_role: role,
    });

    await getParticipants();

    setIsLoading(false);
  };

  return (
    <>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: "100%" }}>Email</TableCell>
              <TableCell sx={{ whiteSpace: "nowrap" }} align="right">
                Role
              </TableCell>
              <TableCell sx={{ whiteSpace: "nowrap" }} align="right">
                Validation
              </TableCell>
              <TableCell sx={{ whiteSpace: "nowrap" }} align="right">
                Direct Analysis
              </TableCell>
              <TableCell sx={{ whiteSpace: "nowrap" }} align="right">
                Cascade Analysis
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!participants && (
              <TableRow>
                <TableCell colSpan={5}>Loading</TableCell>
              </TableRow>
            )}
            {participants &&
              participants.length > 0 &&
              participants.map((p) => (
                <TableRow key={p.cr4de_bnraparticipationid} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                  <TableCell component="th" scope="row">
                    {p.cr4de_contact.emailaddress1}
                  </TableCell>
                  <TableCell align="right"></TableCell>
                  <TableCell align="right"></TableCell>
                  <TableCell align="right"></TableCell>
                  <TableCell align="right"></TableCell>
                </TableRow>
              ))}
            {participants && participants.length <= 0 && (
              <TableRow>
                <TableCell colSpan={5}>No participants defined, add some!</TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={5} size="small" sx={{ textAlign: "right" }}>
                <Button>Add Participant</Button>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>Add participant</DialogTitle>
        <DialogContent>
          <Stack direction="column" spacing={4} sx={{ width: 300 }}>
            <TextField
              autoFocus
              margin="dense"
              id="name"
              label="Email"
              fullWidth
              variant="standard"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <FormControl fullWidth>
              <InputLabel id="demo-simple-select-label">Role</InputLabel>
              <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={role}
                label="Role"
                onChange={(e) => setRole(e.target.value)}
              >
                <MenuItem value="analist">CIPRA Analist</MenuItem>
                <MenuItem value="expert">Topical Expert</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <LoadingButton loading={isLoading} onClick={handleAddParticipant}>
            Add participant
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
}
