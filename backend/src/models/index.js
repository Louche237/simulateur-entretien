import { sequelize } from "../db/sequelize.js";
import { User } from "./User.js";
import { Session } from "./Session.js";
import { QuestionBank } from "./QuestionBank.js";
import { SystemSetting } from "./SystemSetting.js";

// Associations
User.hasMany(Session, {
  foreignKey: "userId",
  as: "sessions",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Session.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

export {
  sequelize,
  User,
  Session,
  QuestionBank,
  SystemSetting,
};
