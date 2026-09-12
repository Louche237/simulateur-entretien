import { Sequelize } from "sequelize";
import mysql from "mysql2/promise";
import { config } from "../config.js";

const { host, port, name, user, password, logging } = config.db;

/**
 * Creates the database if it doesn't exist yet.
 */
export const ensureDatabaseExists = async () => {
  try {
    const connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
    });
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    await connection.end();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
};

/**
 * Main Sequelize instance for MySQL
 */
export const sequelize = new Sequelize(name, user, password, {
  host,
  port,
  dialect: "mysql",
  logging: logging ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: false,
    charset: "utf8mb4",
    collate: "utf8mb4_unicode_ci",
  },
});

export const testDbConnection = async () => {
  try {
    await sequelize.authenticate();
    return { connected: true, host, port, database: name };
  } catch (error) {
    return { connected: false, host, port, database: name, error: error.message };
  }
};
