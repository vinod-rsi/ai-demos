import type {
  ConversationProject,
  RawActivity,
  RawCharacter,
  RawCoachStyle,
  RawConversation,
  RawMilestone,
  RawNode,
  RawShot,
  RawTactic,
  RawTag,
  RawVariable,
  LocalizationSource,
} from './types';
import type { ContentSource } from './source';

/**
 * Loads a Konverse project from a logic folder, mirroring
 * ResourcesConversationProjectReader.ReadProject. Node files are discovered
 * by listing Nodes/ (fs) or via an explicit manifest (browser, where the
 * middleware can't list directories).
 */
export async function loadConversationProject(
  source: ContentSource,
  nodeManifest?: string[],
): Promise<ConversationProject> {
  const conversation = await source.readJson<RawConversation>('Conversation.json');
  if (!conversation) {
    throw new Error('Conversation.json not found — wrong logic folder?');
  }

  let nodeFiles: string[];
  if (nodeManifest) {
    nodeFiles = nodeManifest;
  } else {
    nodeFiles = (await source.listFiles('Nodes')).filter((f) => f.endsWith('.json'));
  }

  const nodes: RawNode[] = [];
  for (const file of nodeFiles) {
    const node = await source.readJson<RawNode>(`Nodes/${file}`);
    if (!node) throw new Error(`Node file missing: ${file}`);
    if (!node.id) throw new Error(`Node file has no id: ${file}`);
    // NodeParser enforces filename containing the node id.
    if (!file.toLowerCase().includes(node.id.toLowerCase())) {
      throw new Error(`Node id ${node.id} doesn't match the filename: ${file}`);
    }
    nodes.push(node);
  }

  const [
    variables,
    tags,
    tactics,
    shots,
    characters,
    coachStyles,
    activities,
    milestones,
    localization,
  ] = await Promise.all([
    source.readJson<RawVariable[]>('Variables/Variables.json'),
    source.readJson<RawTag[]>('Tags/Tags.json'),
    source.readJson<RawTactic[]>('Tactics/Tactics.json'),
    source.readJson<RawShot[]>('Shots/Shots.json'),
    source.readJson<RawCharacter[]>('Characters/Characters.json'),
    source.readJson<RawCoachStyle[]>('CoachStyles/CoachStyles.json'),
    source.readJson<RawActivity[]>('Activities/Activities.json'),
    source.readJson<RawMilestone[]>('Milestones/Milestones.json'),
    source.readJson<LocalizationSource>('LocalizationSource/LocalizationSource.json'),
  ]);

  return {
    conversation,
    nodes,
    variables: variables ?? [],
    tags: tags ?? [],
    tactics: tactics ?? [],
    shots: shots ?? [],
    characters: characters ?? [],
    coachStyles: coachStyles ?? [],
    activities: activities ?? [],
    milestones: milestones ?? [],
    localization: localization ?? {},
  };
}

