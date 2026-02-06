import { Linter } from 'eslint';
import importPlugin from 'eslint-plugin-import';

export const booleanPrefixes = [
  'is',
  'are',
  'should',
  'has',
  'can',
  'did',
  'will',
];

const perfectionistSortObjectCustomGroups = {
  id: {
    elementNamePattern: '^(?:id|.+Id)$',
    groupName: 'id',
    selector: 'property',
  },
  flag: {
    elementNamePattern: `^(?:${booleanPrefixes.join('|')})[A-Z].*$`, // Example: /^(?:a|b|c|)[A-Z].*$/
    groupName: 'flag',
    selector: 'property',
  },
};

export const perfectionistSortTypes = {
  ignoreCase: true,
  order: 'asc',
  type: 'natural',
  customGroups: [
    perfectionistSortObjectCustomGroups.id,
    {
      ...perfectionistSortObjectCustomGroups.flag,
      groupName: `required-${perfectionistSortObjectCustomGroups.flag.groupName}`,
      modifiers: ['required'],
    },
    {
      ...perfectionistSortObjectCustomGroups.flag,
      groupName: `optional-${perfectionistSortObjectCustomGroups.flag.groupName}`,
      modifiers: ['optional'],
    },
  ],
  groups: [
    perfectionistSortObjectCustomGroups.id.groupName,
    'required-property',
    'required-multiline-property',
    'optional-property',
    'optional-multiline-property',
    'required-flag',
    'optional-flag',
    'required-method',
    'optional-method',
  ],
};

export const perfectionistSortObjects = {
  ...perfectionistSortTypes,
  objectDeclarations: true,
  customGroups: [
    perfectionistSortObjectCustomGroups.id,
    perfectionistSortObjectCustomGroups.flag,
  ],
  destructuredObjects: {
    groups: true,
  },
  groups: [
    perfectionistSortObjectCustomGroups.id.groupName,
    'property',
    'multiline-property',
    perfectionistSortObjectCustomGroups.flag.groupName,
    'method',
  ],
};

// NOTE: As of v2.32.0, all `eslint-plugin-import` rules are off by default; this explicitly disables them in case of any changes.
export const importRulesOff = Object.keys(
  importPlugin.rules,
).reduce<Linter.RulesRecord>((acc, rule) => {
  acc[`import/${rule}`] = 0;
  return acc;
}, {});

// NOTE: The rule 'import/no-restricted-paths' depends completely on the project structure and should be customized as needed.
type Zone = {
  from: string; // Restriction: Block imports from this directory or file.
  target: string; // Scope: Files belonging to the selected directory or the file itself.
  except?: string[]; // Exception: Allow imports from these specific directories or files, even if they match the 'from' pattern.
  message?: string; // Custom error message to provide more context when the rule triggers.
};

const entrypoints: string[] = ['backloggd.content', 'background', 'popup'];
const features: string[] = ['export'];

const entrypointImportRestrictions: Zone[] = entrypoints.map((entrypoint) => ({
  except: [`./${entrypoint}`, './shared'], // Allow imports from the current entrypoint and entrypoints-level shared files.
  from: 'entrypoints',
  message: 'Importing from other entrypoints is not allowed.',
  target: `entrypoints/${entrypoint}`,
}));

const entrypointSharedImportRestrictions: Zone = {
  except: ['./shared'], // Allow imports from the current shared.
  from: 'entrypoints',
  message: 'Importing from entrypoints is not allowed.',
  target: 'entrypoints/shared',
};

const featureImportRestrictions: Zone[] = features.map((feature) => ({
  except: [`./${feature}`], // Allow imports from the current feature.
  from: 'entrypoints/backloggd.content/features',
  message: 'Importing from other features is not allowed.',
  target: `entrypoints/backloggd.content/features/${feature}`,
}));

export const importNoRestrictedPathsZoneRestrictions: Zone[] = [
  ...entrypointImportRestrictions,
  entrypointSharedImportRestrictions,
  ...featureImportRestrictions,
];
