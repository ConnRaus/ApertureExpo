import { DataTypes } from "sequelize";

export const up = async (queryInterface) => {
  console.log("🔄 Starting migration: Adding photo support to forum...");

  try {
    // Add photoId column to forum_threads table
    console.log("📝 Adding photoId column to forum_threads table...");
    await queryInterface.addColumn("forum_threads", "photoId", {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "Photos",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    // Add photoId column to forum_posts table
    console.log("📝 Adding photoId column to forum_posts table...");
    await queryInterface.addColumn("forum_posts", "photoId", {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "Photos",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    console.log("✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
};

export const down = async (queryInterface) => {
  console.log(
    "🔄 Rolling back migration: Removing photo support from forum..."
  );

  try {
    // Remove photoId column from forum_posts table
    console.log("🗑️ Removing photoId column from forum_posts table...");
    await queryInterface.removeColumn("forum_posts", "photoId");

    // Remove photoId column from forum_threads table
    console.log("🗑️ Removing photoId column from forum_threads table...");
    await queryInterface.removeColumn("forum_threads", "photoId");

    console.log("✅ Rollback completed successfully!");
  } catch (error) {
    console.error("❌ Rollback failed:", error);
    throw error;
  }
};
