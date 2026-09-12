import { DataTypes } from "sequelize";
import { sequelize } from "../db/sequelize.js";

export const Session = sequelize.define(
  "Session",
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.STRING(64),
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    source: {
      type: DataTypes.STRING(50),
      defaultValue: "local",
    },
    status: {
      type: DataTypes.ENUM("en_cours", "terminee"),
      defaultValue: "en_cours",
      allowNull: false,
    },
    poste: {
      type: DataTypes.STRING(255),
      defaultValue: "",
    },
    entreprise: {
      type: DataTypes.STRING(255),
      defaultValue: "",
    },
    niveau: {
      type: DataTypes.STRING(50),
      defaultValue: "debutant",
    },
    difficulte: {
      type: DataTypes.STRING(50),
      defaultValue: "facile",
    },
    recruteur: {
      type: DataTypes.STRING(50),
      defaultValue: "aria",
    },
    surprises: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    duree: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
    },
    langue: {
      type: DataTypes.STRING(10),
      defaultValue: "fr",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    cvName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING(50),
      defaultValue: "rh",
    },
    questions: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    feedback: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    review: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    finishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "sessions",
    timestamps: true,
    indexes: [
      {
        fields: ["userId"],
      },
      {
        fields: ["status"],
      },
      {
        fields: ["createdAt"],
      },
    ],
  }
);
