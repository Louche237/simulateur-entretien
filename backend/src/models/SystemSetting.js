import { DataTypes } from "sequelize";
import { sequelize } from "../db/sequelize.js";

export const SystemSetting = sequelize.define(
  "SystemSetting",
  {
    key: {
      type: DataTypes.STRING(100),
      primaryKey: true,
      allowNull: false,
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: "system_settings",
    timestamps: true,
  }
);
