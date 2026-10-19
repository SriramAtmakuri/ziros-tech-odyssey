import { SQL_ISLAND_ZONE } from '../sql/sqlIslandChallenges.js'
import { CODE_KINGDOM_ZONE } from './codeKingdomChallenges.js'
import { PYTHON_JUNGLE_ZONE } from './pythonJungleChallenges.js'
import { DATA_REALM_ZONE } from './dataRealmChallenges.js'
import { CLOUD_CITADEL_ZONE } from './cloudCitadelChallenges.js'
import { SUPPLY_CHAIN_DOCKS_ZONE } from './supplyChainDocksChallenges.js'
import { AI_FRONTIER_ZONE } from './aiFrontierChallenges.js'
import { HEALTHCARE_HIGHLANDS_ZONE } from './healthcareHighlandsChallenges.js'
import { IOT_OUTPOST_ZONE } from './iotOutpostChallenges.js'
import { SECURITY_STRONGHOLD_ZONE } from './securityStrongholdChallenges.js'
import { ALGORITHM_DUNGEON_ZONE } from './algorithmDungeonChallenges.js'
import { WEB_DEV_WORKSHOP_ZONE } from './webDevWorkshopChallenges.js'
import { COLLABORATION_COMMONS_ZONE } from './collaborationCommonsChallenges.js'

export const ZONES = {
  [SQL_ISLAND_ZONE.id]: SQL_ISLAND_ZONE,
  [CODE_KINGDOM_ZONE.id]: CODE_KINGDOM_ZONE,
  [PYTHON_JUNGLE_ZONE.id]: PYTHON_JUNGLE_ZONE,
  [DATA_REALM_ZONE.id]: DATA_REALM_ZONE,
  [CLOUD_CITADEL_ZONE.id]: CLOUD_CITADEL_ZONE,
  [ALGORITHM_DUNGEON_ZONE.id]: ALGORITHM_DUNGEON_ZONE,
  [AI_FRONTIER_ZONE.id]: AI_FRONTIER_ZONE,
  [HEALTHCARE_HIGHLANDS_ZONE.id]: HEALTHCARE_HIGHLANDS_ZONE,
  [SUPPLY_CHAIN_DOCKS_ZONE.id]: SUPPLY_CHAIN_DOCKS_ZONE,
  [IOT_OUTPOST_ZONE.id]: IOT_OUTPOST_ZONE,
  [WEB_DEV_WORKSHOP_ZONE.id]: WEB_DEV_WORKSHOP_ZONE,
  [SECURITY_STRONGHOLD_ZONE.id]: SECURITY_STRONGHOLD_ZONE,
  [COLLABORATION_COMMONS_ZONE.id]: COLLABORATION_COMMONS_ZONE,
}

export const ZONE_ORDER = [
  SQL_ISLAND_ZONE.id,
  CODE_KINGDOM_ZONE.id,
  PYTHON_JUNGLE_ZONE.id,
  DATA_REALM_ZONE.id,
  CLOUD_CITADEL_ZONE.id,
  ALGORITHM_DUNGEON_ZONE.id,
  AI_FRONTIER_ZONE.id,
  HEALTHCARE_HIGHLANDS_ZONE.id,
  SUPPLY_CHAIN_DOCKS_ZONE.id,
  IOT_OUTPOST_ZONE.id,
  WEB_DEV_WORKSHOP_ZONE.id,
  SECURITY_STRONGHOLD_ZONE.id,
  COLLABORATION_COMMONS_ZONE.id,
]
