import { DataTypes, Model } from "sequelize";
import sequelize from "../config/config.js";

class Contest extends Model {}

Contest.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100],
      },
    },
    description: {
      type: DataTypes.TEXT,
      validate: {
        len: [0, 1000],
      },
    },
    bannerImageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true,
      },
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true,
      },
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true,
        isAfterStart(value) {
          if (value <= this.startDate) {
            throw new Error("End date must be after start date");
          }
        },
      },
    },
    votingStartDate: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true,
        isAfterSubmission(value) {
          if (value < this.endDate) {
            throw new Error(
              "Voting start date must be after or equal to submission end date"
            );
          }
        },
      },
    },
    votingEndDate: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true,
        isAfterVotingStart(value) {
          if (value <= this.votingStartDate) {
            throw new Error("Voting end date must be after voting start date");
          }
        },
      },
    },
    status: {
      type: DataTypes.ENUM("upcoming", "open", "voting", "completed"),
      defaultValue: "upcoming",
      validate: {
        isIn: [["upcoming", "open", "voting", "completed"]],
      },
    },
    phase: {
      type: DataTypes.VIRTUAL,
      get() {
        const now = new Date();
        const startDate = this.startDate;
        const endDate = this.endDate;
        const votingStartDate = this.votingStartDate;
        const votingEndDate = this.votingEndDate;

        if (now < startDate) {
          return "upcoming";
        } else if (now >= startDate && now <= endDate) {
          return "submission";
        } else if (now > endDate && now < votingStartDate) {
          return "processing";
        } else if (now >= votingStartDate && now <= votingEndDate) {
          return "voting";
        } else {
          return "ended";
        }
      },
    },
    maxPhotosPerUser: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    modelName: "Contest",
    timestamps: true,
    indexes: [
      {
        fields: ["status"],
      },
      {
        fields: ["startDate", "endDate"],
      },
      {
        fields: ["votingStartDate", "votingEndDate"],
      },
    ],
  }
);

export default Contest;
