const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

const User = require("../models/User");
const Student = require("../models/Student");
const Settings = require("../models/Settings");
const Stats = require("../models/Stats");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

function parseArgs(argv) {
  const options = {
    email: "",
    apply: false,
    claimSettings: false,
    claimStats: false,
    studentIds: [],
    settingsId: "",
    statsId: "",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--apply") {
      options.apply = true;
      continue;
    }

    if (arg === "--claim-settings") {
      options.claimSettings = true;
      continue;
    }

    if (arg === "--claim-stats") {
      options.claimStats = true;
      continue;
    }

    if (arg === "--email" && argv[i + 1]) {
      options.email = String(argv[i + 1]).trim().toLowerCase();
      i += 1;
      continue;
    }

    if (arg.startsWith("--email=")) {
      options.email = String(arg.split("=")[1] || "").trim().toLowerCase();
      continue;
    }

    if (arg === "--student-ids" && argv[i + 1]) {
      options.studentIds = String(argv[i + 1])
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      i += 1;
      continue;
    }

    if (arg.startsWith("--student-ids=")) {
      options.studentIds = String(arg.split("=")[1] || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      continue;
    }

    if (arg === "--settings-id" && argv[i + 1]) {
      options.settingsId = String(argv[i + 1]).trim();
      i += 1;
      continue;
    }

    if (arg.startsWith("--settings-id=")) {
      options.settingsId = String(arg.split("=")[1] || "").trim();
      continue;
    }

    if (arg === "--stats-id" && argv[i + 1]) {
      options.statsId = String(argv[i + 1]).trim();
      i += 1;
      continue;
    }

    if (arg.startsWith("--stats-id=")) {
      options.statsId = String(arg.split("=")[1] || "").trim();
      continue;
    }
  }

  return options;
}

function printUsage() {
  console.log("Usage:");
  console.log("  node scripts/migrateLegacyOwnership.js --email user@example.com [options]");
  console.log("");
  console.log("Options:");
  console.log("  --apply                 Execute writes (default is dry-run)");
  console.log("  --student-ids id1,id2   Limit student ownership migration to specific IDs");
  console.log("  --claim-settings        Assign one ownerless settings doc to this user");
  console.log("  --settings-id <id>      Select a specific ownerless settings doc to claim");
  console.log("  --claim-stats           Assign one ownerless stats doc to this user");
  console.log("  --stats-id <id>         Select a specific ownerless stats doc to claim");
  console.log("");
  console.log("Examples:");
  console.log("  node scripts/migrateLegacyOwnership.js --email admin@example.com");
  console.log("  node scripts/migrateLegacyOwnership.js --email admin@example.com --apply");
  console.log("  node scripts/migrateLegacyOwnership.js --email owner@example.com --student-ids 65f...,65e... --apply");
}

function ownerlessFilter() {
  return {
    $or: [
      { owner: { $exists: false } },
      { owner: null },
    ],
  };
}

function toObjectIdList(rawIds, label) {
  const objectIds = [];

  for (const rawId of rawIds) {
    if (!mongoose.Types.ObjectId.isValid(rawId)) {
      throw new Error(`Invalid ${label} id: ${rawId}`);
    }

    objectIds.push(new mongoose.Types.ObjectId(rawId));
  }

  return objectIds;
}

async function claimOneDocument(Model, modelName, userId, options) {
  const idKey = modelName === "Settings" ? "settingsId" : "statsId";
  const hasUserDoc = await Model.findOne({ owner: userId }).select("_id").lean();

  if (hasUserDoc) {
    return {
      modelName,
      status: "skipped",
      message: `${modelName} already exists for user (${hasUserDoc._id})`,
    };
  }

  let targetDoc = null;
  const explicitId = options[idKey];

  if (explicitId) {
    if (!mongoose.Types.ObjectId.isValid(explicitId)) {
      throw new Error(`Invalid ${modelName.toLowerCase()} id: ${explicitId}`);
    }

    targetDoc = await Model.findOne({
      _id: new mongoose.Types.ObjectId(explicitId),
      ...ownerlessFilter(),
    })
      .select("_id")
      .lean();

    if (!targetDoc) {
      return {
        modelName,
        status: "skipped",
        message: `Specified ${modelName} id was not ownerless or did not exist`,
      };
    }
  } else {
    const ownerlessDocs = await Model.find(ownerlessFilter())
      .select("_id")
      .sort({ createdAt: 1 })
      .lean();

    if (ownerlessDocs.length === 0) {
      return {
        modelName,
        status: "skipped",
        message: `No ownerless ${modelName} documents found`,
      };
    }

    if (ownerlessDocs.length > 1) {
      return {
        modelName,
        status: "skipped",
        message: `Multiple ownerless ${modelName} docs found (${ownerlessDocs.length}). Use --${modelName.toLowerCase()}-id to choose one.`,
      };
    }

    targetDoc = ownerlessDocs[0];
  }

  if (!options.apply) {
    return {
      modelName,
      status: "dry-run",
      message: `Would assign ${modelName} ${targetDoc._id} to user ${userId}`,
    };
  }

  await Model.updateOne(
    { _id: targetDoc._id },
    { $set: { owner: userId } }
  );

  return {
    modelName,
    status: "updated",
    message: `Assigned ${modelName} ${targetDoc._id} to user ${userId}`,
  };
}

async function run() {
  const options = parseArgs(process.argv.slice(2));

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing in Backend/.env");
  }

  if (!options.email) {
    printUsage();
    throw new Error("--email is required");
  }

  await mongoose.connect(process.env.MONGO_URI);

  try {
    const user = await User.findOne({ email: options.email }).select("_id email").lean();
    if (!user) {
      throw new Error(`User not found for email: ${options.email}`);
    }

    const ownerId = new mongoose.Types.ObjectId(user._id);
    const baseStudentFilter = ownerlessFilter();
    let studentFilter = { ...baseStudentFilter };

    if (options.studentIds.length > 0) {
      studentFilter = {
        ...baseStudentFilter,
        _id: { $in: toObjectIdList(options.studentIds, "student") },
      };
    }

    const studentCount = await Student.countDocuments(studentFilter);
    const settingsCount = await Settings.countDocuments(ownerlessFilter());
    const statsCount = await Stats.countDocuments(ownerlessFilter());

    console.log(`Target user: ${user.email} (${ownerId})`);
    console.log(`Mode: ${options.apply ? "APPLY" : "DRY-RUN"}`);
    console.log(`Ownerless students to assign: ${studentCount}`);
    console.log(`Ownerless settings docs in DB: ${settingsCount}`);
    console.log(`Ownerless stats docs in DB: ${statsCount}`);

    if (!options.apply) {
      console.log("Dry-run only. Re-run with --apply to persist changes.");
    }

    if (studentCount > 0 && options.apply) {
      const studentResult = await Student.updateMany(
        studentFilter,
        { $set: { owner: ownerId } }
      );

      console.log(`Students updated: ${studentResult.modifiedCount}`);
    }

    if (studentCount > 0 && !options.apply) {
      console.log("Students update skipped (dry-run).");
    }

    if (options.claimSettings) {
      const settingsResult = await claimOneDocument(Settings, "Settings", ownerId, options);
      console.log(`[Settings] ${settingsResult.status}: ${settingsResult.message}`);
    } else {
      console.log("[Settings] skipped: pass --claim-settings to assign ownerless settings document");
    }

    if (options.claimStats) {
      const statsResult = await claimOneDocument(Stats, "Stats", ownerId, options);
      console.log(`[Stats] ${statsResult.status}: ${statsResult.message}`);
    } else {
      console.log("[Stats] skipped: pass --claim-stats to assign ownerless stats document");
    }

    console.log("Migration complete.");
  } finally {
    await mongoose.disconnect();
  }
}

run().catch((error) => {
  console.error("Migration failed:", error.message);
  process.exit(1);
});