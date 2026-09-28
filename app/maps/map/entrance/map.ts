import entranceData from "../../data/entrance.json";
import { loadGameMap } from "../serialized";
import type { SerializedGameMap } from "../serialized";

export const entranceMap = loadGameMap(
  entranceData as SerializedGameMap,
);
