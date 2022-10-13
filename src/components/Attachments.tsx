import { ReactNode, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  ListItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  TextField,
  DialogActions,
  Grid,
  Divider,
  Snackbar,
  CircularProgress,
  Alert,
  Stack,
  IconButton,
  Tooltip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Link,
  Collapse,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import useLoggedInUser from "../hooks/useLoggedInUser";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { Trans } from "react-i18next";
import { DVAttachment } from "../types/dataverse/DVAttachment";
import { DVRiskFile } from "../types/dataverse/DVRiskFile";
import useAPI from "../hooks/useAPI";
import { DVValidation } from "../types/dataverse/DVValidation";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteIcon from "@mui/icons-material/Delete";

export interface Action {
  icon: ReactNode;
  tooltip: string;
  onClick: (e: any) => Promise<void>;
}

export default function Attachments({
  actions,
  attachments,
  children,
  field,
  riskFile,
  validation,
  isExternal = false,
  onUpdate,
}: {
  actions?: Action[];
  attachments: DVAttachment[] | null;
  children?: ReactNode;
  field: string;
  riskFile?: DVRiskFile | null;
  validation?: DVValidation<DVRiskFile | undefined> | null;
  isExternal?: boolean;
  onUpdate: () => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const api = useAPI();
  const theme = useTheme();
  const [t] = useTranslation();
  const { user } = useLoggedInUser();

  const [openDialog, setOpenDialog] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isUploadingFinished, setIsUploadingFinished] = useState(false);
  const [isRemovingFile, setIsRemovingFile] = useState(false);
  const [isRemovingFinished, setIsRemovingFinished] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const [title, setTitle] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  const handleToggleDialog = () => setOpenDialog(!openDialog);

  const fieldAttachments = useMemo(() => {
    if (!attachments) return [];

    if (!field) return attachments;

    return attachments?.filter((a) => {
      // Only show attachments that belong to this field
      if (a.cr4de_field !== field) return false;

      // If the viewer is not external (CIPRA) we can show all sources
      if (!isExternal) return true;

      // If the viewer is external, only show CIPRA sources
      if (a._cr4de_validation_value === null) return true;

      // And their own source
      if (a._cr4de_owner_value === user?.contactid) return true;

      return false;
    });
  }, [attachments, field, isExternal, user?.contactid]);

  const handlePickFile = () => {
    if (!inputRef.current) return;

    inputRef.current.click();
  };

  const handleSaveAttachment = async () => {
    if (!inputRef.current) return;

    const file = inputRef.current.files && inputRef.current.files[0];

    setIsUploadingFile(true);
    setOpenDialog(false);

    await api.createAttachment(
      {
        "cr4de_owner@odata.bind": `https://bnra.powerappsportals.com/_api/contacts(${user?.contactid})`,
        cr4de_name: title || (file && file.name),
        cr4de_reference: attachments ? attachments.reduce((max, a) => Math.max(max, a.cr4de_reference), -1) + 1 : 1,
        cr4de_field: field,
        cr4de_url: url,
        ...(riskFile
          ? {
              "cr4de_risk_file@odata.bind": `https://bnra.powerappsportals.com/_api/cr4de_riskfileses(${riskFile.cr4de_riskfilesid})`,
            }
          : {}),
        ...(validation
          ? {
              "cr4de_validation@odata.bind": `https://bnra.powerappsportals.com/_api/cr4de_bnravalidations(${validation.cr4de_bnravalidationid})`,
            }
          : {}),
      },
      file
    );

    setTitle(null);
    setUrl(null);

    await onUpdate();

    setIsUploadingFile(false);
    setIsUploadingFinished(true);
  };

  const handleRemoveAttachment = async (id: string) => {
    if (window.confirm("Are you sure you want to remove this attachment?")) {
      setIsRemovingFile(true);

      await api.deleteAttachment(id);

      await onUpdate();

      setIsRemovingFile(false);
      setIsRemovingFinished(true);
    }
  };

  return (
    <Box mt={1}>
      <Dialog open={openDialog} onClose={handleToggleDialog}>
        <input ref={inputRef} type="file" style={{ display: "none" }} onInput={handleSaveAttachment} />
        <DialogTitle>
          <Trans i18nKey="source.dialog.title">Provide source material</Trans>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            <Trans i18nKey="source.dialog.helpText">
              Please provide a title and a web url for the source, or upload a file from your computer.
            </Trans>
          </DialogContentText>
          <Grid container>
            <Grid item xs>
              <TextField
                autoFocus
                margin="dense"
                id="name"
                label={t("source.dialog.sourceTitle")}
                fullWidth
                variant="standard"
                value={title || ""}
                onChange={(e) => setTitle(e.target.value)}
              />
              <TextField
                margin="dense"
                id="url"
                label={t("source.dialog.sourceLink")}
                fullWidth
                variant="standard"
                value={url || ""}
                onChange={(e) => setUrl(e.target.value)}
              />
            </Grid>
            <Divider orientation="vertical" flexItem sx={{ mx: 4 }} />
            <Grid item xs sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={handlePickFile}>
                <Trans i18nKey="source.dialog.uploadFile">Upload File</Trans>
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleToggleDialog}>
            <Trans i18nKey="source.dialog.cancel">Cancel</Trans>
          </Button>
          <Button onClick={handleSaveAttachment}>
            <Trans i18nKey="source.dialog.addSource">Add source</Trans>
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={isUploadingFile}>
        <Alert severity="info" icon={false} sx={{ width: "100%" }}>
          <CircularProgress size={12} sx={{ mr: 1 }} />{" "}
          <Trans i18nKey="source.alert.savingAttachment">Saving attachment</Trans>
        </Alert>
      </Snackbar>
      <Snackbar open={isUploadingFinished} autoHideDuration={6000} onClose={() => setIsUploadingFinished(false)}>
        <Alert severity="success" sx={{ width: "100%" }} onClose={() => setIsUploadingFinished(false)}>
          <Trans i18nKey="source.alert.attachmentSaved">Attachment saved</Trans>
        </Alert>
      </Snackbar>
      <Snackbar open={isRemovingFile}>
        <Alert severity="info" icon={false} sx={{ width: "100%" }}>
          <CircularProgress size={12} sx={{ mr: 1 }} />{" "}
          <Trans i18nKey="source.alert.removingAttachment">Removing attachment</Trans>
        </Alert>
      </Snackbar>
      <Snackbar open={isRemovingFinished} autoHideDuration={6000} onClose={() => setIsRemovingFinished(false)}>
        <Alert severity="success" sx={{ width: "100%" }} onClose={() => setIsRemovingFinished(false)}>
          <Trans i18nKey="source.alert.attachmentRemoved">Attachment removed</Trans>
        </Alert>
      </Snackbar>
      <Snackbar open={isDownloading}>
        <Alert severity="info" icon={false} sx={{ width: "100%" }}>
          <CircularProgress size={12} sx={{ mr: 1 }} />{" "}
          <Trans i18nKey="source.alert.downloadingAttachment">Downloading attachment</Trans>
        </Alert>
      </Snackbar>

      <Stack direction="row" sx={{ mt: 2 }}>
        <Tooltip title={t("source.button.attach")}>
          <IconButton onClick={handleToggleDialog}>
            <AttachFileIcon />
          </IconButton>
        </Tooltip>
        {actions &&
          actions.map((a, i) => (
            <Tooltip title={a.tooltip}>
              <IconButton key={i} onClick={a.onClick}>
                {a.icon}
              </IconButton>
            </Tooltip>
          ))}
        <Box sx={{ flex: 1 }} />
        <Tooltip title={expanded ? t("source.button.hide") : t("source.button.show")}>
          <IconButton onClick={() => setExpanded(!expanded)}>
            <ExpandMoreIcon
              sx={{
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                transition: theme.transitions.create("transform", {
                  duration: theme.transitions.duration.shortest,
                }),
              }}
            />
          </IconButton>
        </Tooltip>
      </Stack>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                <Trans i18nKey="source.list.fileName">Source filename</Trans>
              </TableCell>
              <TableCell sx={{ width: 0, whiteSpace: "nowrap" }}>
                <Trans i18nKey="source.list.type">Source Type</Trans>
              </TableCell>
              <TableCell align="right" sx={{ width: 0 }}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fieldAttachments.length > 0 ? (
              fieldAttachments.map((a) => (
                <TableRow key={a.cr4de_name} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                  <TableCell component="th" scope="row">
                    <Link
                      sx={{ "&:hover": { cursor: "pointer" } }}
                      onClick={async () => {
                        if (a) {
                          setIsDownloading(true);
                        }
                        await api.serveAttachmentFile(a);
                        setIsDownloading(false);
                      }}
                    >
                      {a.cr4de_name}
                    </Link>
                  </TableCell>
                  <TableCell>{a.cr4de_url ? t("source.type.link") : t("source.type.file")}</TableCell>
                  <TableCell align="center">
                    {(!isExternal || a._cr4de_owner_value === user?.contactid) && (
                      <IconButton
                        onClick={() => {
                          handleRemoveAttachment(a.cr4de_bnraattachmentid);
                        }}
                      >
                        <DeleteIcon color="error" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell sx={{ textAlign: "center" }} colSpan={3}>
                  <Trans i18nKey="source.list.noSources">No sources attached</Trans>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {children}
      </Collapse>
    </Box>
  );
}
