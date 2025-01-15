import React, { useState, useEffect } from "react";
import moment from "moment";
import openSocket from "../../services/socket-io";

import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import Container from "@material-ui/core/Container";
import Select from "@material-ui/core/Select";
import TextField from "@material-ui/core/TextField";
import { toast } from "react-toastify";
import { MuiPickersUtilsProvider } from "@material-ui/pickers";
import { TimePicker } from "@material-ui/pickers";

import api from "../../services/api";
import { i18n } from "../../translate/i18n.js";
import toastError from "../../errors/toastError";
import MomentUtils from "@date-io/moment";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    alignItems: "center",
    padding: theme.spacing(8, 8, 3),
  },

  paper: {
    padding: theme.spacing(2),
    display: "flex",
    alignItems: "center",
    marginBottom: 12,
  },

  paperHorizontal: {
    padding: theme.spacing(2),
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 12,
  },

  settingOption: {
    marginLeft: "auto",
  },
  margin: {
    margin: theme.spacing(1),
  },
}));

const Settings = () => {
  const classes = useStyles();

  const [settings, setSettings] = useState([]);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data } = await api.get("/settings");
        setSettings(data);
        data.forEach((setting) => {
          if (setting.key === "startHour" || setting.key === "endHour") {
            console.log(setting);
            const result = moment(setting.value, "hh:mm A");
            const second = result.toDate();
            console.log(result);
            console.log(second);
            console.log(result.hours(), result.minutes());
            console.log(second.getHours(), second.getMinutes());
          }
        });
      } catch (err) {
        toastError(err);
      }
    };
    fetchSession();
  }, []);

  useEffect(() => {
    const socket = openSocket();

    socket.on("settings", (data) => {
      if (data.action === "update") {
        setSettings((prevState) => {
          const aux = [...prevState];
          const settingIndex = aux.findIndex((s) => s.key === data.setting.key);
          aux[settingIndex].value = data.setting.value;
          return aux;
        });
      }
    });

    return () => {
      if (socket.readyState === 1) {
        socket.disconnect();
      }
    };
  }, []);

  const handleChangeSetting = async (e) => {
    const selectedValue = e.target.value;
    const settingKey = e.target.name;

    try {
      await api.put(`/settings/${settingKey}`, {
        value: selectedValue,
      });
      toast.success(i18n.t("settings.success"));
    } catch (err) {
      toastError(err);
    }
  };

  const getSettingValue = (key) => {
    const setting = settings.find((s) => s.key === key);
    return setting ? setting.value : null;
  };

  const handleTimeChange = async (key, date) => {
    try {
      console.log(key, date);
      const formattedTime = moment(date).format("hh:mm A");
      console.log(formattedTime);
      await api.put(`/settings/${key}`, { value: formattedTime });
      toast.success(i18n.t("settings.success"));
    } catch (err) {
      toastError(err);
    }
  };

  return (
    <MuiPickersUtilsProvider utils={MomentUtils}>
      <div className={classes.root}>
        <Container className={classes.container} maxWidth="sm">
          <Typography variant="body2" gutterBottom>
            {i18n.t("settings.title")}
          </Typography>
          <Paper className={classes.paper}>
            <Typography variant="body1">
              {i18n.t("settings.settings.userCreation.name")}
            </Typography>
            <Select
              margin="dense"
              variant="outlined"
              native
              id="userCreation-setting"
              name="userCreation"
              value={
                settings &&
                settings.length > 0 &&
                getSettingValue("userCreation")
              }
              className={classes.settingOption}
              onChange={handleChangeSetting}
            >
              <option value="enabled">
                {i18n.t("settings.settings.userCreation.options.enabled")}
              </option>
              <option value="disabled">
                {i18n.t("settings.settings.userCreation.options.disabled")}
              </option>
            </Select>
          </Paper>

          <Paper className={classes.paper}>
            <TextField
              id="api-token-setting"
              readonly
              label="Token Api"
              margin="dense"
              variant="outlined"
              fullWidth
              value={
                settings &&
                settings.length > 0 &&
                getSettingValue("userApiToken")
              }
            />
          </Paper>
          <Paper className={classes.paperHorizontal}>
            <TimePicker
              name="startHour"
              label="Hora de entrada"
              margin="dense"
              variant="outlined"
              value={
                settings &&
                settings.length > 0 &&
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
                settings &&
                settings.length > 0 &&
                moment(getSettingValue("endHour"), "hh:mm A").toDate()
              }
              onChange={(date) => handleTimeChange("endHour", date)}
              ampm
            />
          </Paper>
        </Container>
      </div>
    </MuiPickersUtilsProvider>
  );
};

export default Settings;
