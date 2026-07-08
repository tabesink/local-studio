import { withMockLatency } from "../../../_shared/api";
import { settingsPanelSnapshot } from "../fixtures";

export async function loadSettingsPanelSnapshot() {
  return withMockLatency(settingsPanelSnapshot, 200);
}
