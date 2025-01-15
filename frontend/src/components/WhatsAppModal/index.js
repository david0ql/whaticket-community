import React, { useState, useEffect } from "react";
import * as Yup from "yup";
import moment from "moment";
import { Formik, Form, Field } from "formik";
import { toast } from "react-toastify";
import { TimePicker } from "@material-ui/pickers";

import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import MomentUtils from "@date-io/moment";
import { MuiPickersUtilsProvider } from "@material-ui/pickers";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  DialogActions,
  CircularProgress,
  TextField,
  Switch,
  FormControlLabel,
} from "@material-ui/core";

import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import toastError from "../../errors/toastError";
import QueueSelect from "../QueueSelect";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
  },

  multFieldLine: {
    display: "flex",
    "& > *:not(:last-child)": {
      marginRight: theme.spacing(1),
    },
  },

  btnWrapper: {
    position: "relative",
  },

  buttonProgress: {
    color: green[500],
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -12,
    marginLeft: -12,
  },
}));

const SessionSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Too Short!")
    .max(50, "Too Long!")
    .required("Required"),
});

const WhatsAppModal = ({ open, onClose, whatsAppId }) => {
  const classes = useStyles();
  const initialState = {
    name: "",
    greetingMessage: "",
    farewellMessage: "",
    notAvailableMessage: "",
    startHour: "",
    endHour: "",
    isDefault: false,
  };
  const [whatsApp, setWhatsApp] = useState(initialState);
  const [selectedQueueIds, setSelectedQueueIds] = useState([]);

  useEffect(() => {
    const fetchSession = async () => {
      if (!whatsAppId) return;

      try {
        const { data } = await api.get(`whatsapp/${whatsAppId}`);
        setWhatsApp(data);

        const whatsQueueIds = data.queues?.map((queue) => queue.id);
        setSelectedQueueIds(whatsQueueIds);
      } catch (err) {
        toastError(err);
      }
    };
    fetchSession();
  }, [whatsAppId]);

  const handleSaveWhatsApp = async (values) => {
    const whatsappData = { ...values, queueIds: selectedQueueIds };

    try {
      if (whatsAppId) {
        await api.put(`/whatsapp/${whatsAppId}`, whatsappData);
      } else {
        await api.post("/whatsapp", whatsappData);
      }
      toast.success(i18n.t("whatsappModal.success"));
      handleClose();
    } catch (err) {
      toastError(err);
    }
  };

  const handleClose = () => {
    onClose();
    setWhatsApp(initialState);
  };

  const handleTimeChange = async (key, date) => {
    try {
      const formattedTime = moment(date).format("hh:mm A");
      setWhatsApp({ ...whatsApp, [key]: formattedTime });
    } catch (err) {
      toastError(err);
    }
  };

  const getSettingValue = (key) => {
    return whatsApp[key] !== undefined ? whatsApp[key] : null;
  };

  return (
    <MuiPickersUtilsProvider utils={MomentUtils}>
      <div className={classes.root}>
        <Dialog
          open={open}
          onClose={handleClose}
          maxWidth="sm"
          fullWidth
          scroll="paper"
        >
          <DialogTitle>
            {whatsAppId
              ? i18n.t("whatsappModal.title.edit")
              : i18n.t("whatsappModal.title.add")}
          </DialogTitle>
          <Formik
            initialValues={whatsApp}
            enableReinitialize={true}
            validationSchema={SessionSchema}
            onSubmit={(values, actions) => {
              setTimeout(() => {
                handleSaveWhatsApp(values);
                actions.setSubmitting(false);
              }, 400);
            }}
          >
            {({ values, touched, errors, isSubmitting }) => (
              <Form>
                <DialogContent dividers>
                  <div className={classes.multFieldLine}>
                    <Field
                      as={TextField}
                      label={i18n.t("whatsappModal.form.name")}
                      autoFocus
                      name="name"
                      error={touched.name && Boolean(errors.name)}
                      helperText={touched.name && errors.name}
                      variant="outlined"
                      margin="dense"
                      className={classes.textField}
                    />
                    <FormControlLabel
                      control={
                        <Field
                          as={Switch}
                          color="primary"
                          name="isDefault"
                          checked={values.isDefault}
                        />
                      }
                      label={i18n.t("whatsappModal.form.default")}
                    />
                  </div>
                  <div>
                    <Field
                      as={TextField}
                      label={i18n.t("queueModal.form.greetingMessage")}
                      type="greetingMessage"
                      multiline
                      rows={5}
                      fullWidth
                      name="greetingMessage"
                      error={
                        touched.greetingMessage &&
                        Boolean(errors.greetingMessage)
                      }
                      helperText={
                        touched.greetingMessage && errors.greetingMessage
                      }
                      variant="outlined"
                      margin="dense"
                    />
                  </div>
                  <div>
                    <Field
                      as={TextField}
                      label={i18n.t("queueModal.form.notAvailableMessage")}
                      type="notAvailableMessage"
                      multiline
                      rows={5}
                      fullWidth
                      name="notAvailableMessage"
                      error={
                        touched.notAvailableMessage &&
                        Boolean(errors.notAvailableMessage)
                      }
                      helperText={
                        touched.notAvailableMessage &&
                        errors.notAvailableMessage
                      }
                      variant="outlined"
                      margin="dense"
                    />
                  </div>
                  <TimePicker
                    name="startHour"
                    label="Hora de entrada"
                    margin="dense"
                    variant="outlined"
                    value={
                      whatsApp &&
                      whatsApp.startHour.length > 0 &&
                      moment(getSettingValue("startHour"), "hh:mm A").toDate()
                    }
                    onChange={(date) => handleTimeChange("startHour", date)}
                    ampm
                  />
                  <TimePicker
                    name="endHour"
                    label="Hora de finalización"
                    margin="dense"
                    variant="outlined"
                    value={
                      whatsApp &&
                      whatsApp.endHour.length > 0 &&
                      moment(getSettingValue("endHour"), "hh:mm A").toDate()
                    }
                    onChange={(date) => handleTimeChange("endHour", date)}
                    ampm
                  />
                  <div>
                    <Field
                      as={TextField}
                      label={i18n.t("whatsappModal.form.farewellMessage")}
                      type="farewellMessage"
                      multiline
                      rows={5}
                      fullWidth
                      name="farewellMessage"
                      error={
                        touched.farewellMessage &&
                        Boolean(errors.farewellMessage)
                      }
                      helperText={
                        touched.farewellMessage && errors.farewellMessage
                      }
                      variant="outlined"
                      margin="dense"
                    />
                  </div>
                  <QueueSelect
                    selectedQueueIds={selectedQueueIds}
                    onChange={(selectedIds) => setSelectedQueueIds(selectedIds)}
                  />
                </DialogContent>
                <DialogActions>
                  <Button
                    onClick={handleClose}
                    color="secondary"
                    disabled={isSubmitting}
                    variant="outlined"
                  >
                    {i18n.t("whatsappModal.buttons.cancel")}
                  </Button>
                  <Button
                    type="submit"
                    color="primary"
                    disabled={isSubmitting}
                    variant="contained"
                    className={classes.btnWrapper}
                  >
                    {whatsAppId
                      ? i18n.t("whatsappModal.buttons.okEdit")
                      : i18n.t("whatsappModal.buttons.okAdd")}
                    {isSubmitting && (
                      <CircularProgress
                        size={24}
                        className={classes.buttonProgress}
                      />
                    )}
                  </Button>
                </DialogActions>
              </Form>
            )}
          </Formik>
        </Dialog>
      </div>
    </MuiPickersUtilsProvider>
  );
};

export default React.memo(WhatsAppModal);
