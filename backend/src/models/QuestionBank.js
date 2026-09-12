import { DataTypes } from "sequelize";
import { sequelize } from "../db/sequelize.js";

export const QuestionBank = sequelize.define(
  "QuestionBank",
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "general",
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    focus: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    followUp: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "question_banks",
    timestamps: true,
    indexes: [
      {
        fields: ["category"],
      },
      {
        fields: ["isActive"],
      },
    ],
  }
);
