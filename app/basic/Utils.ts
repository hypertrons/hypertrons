
export function parseRepoName(fullName: string): { owner: string, repo: string } {
  const s = fullName.split('/');
  if (s.length !== 2) {
    return {
      owner: '',
      repo: '',
    };
  }
  return {
    owner: s[0],
    repo: s[1],
  };
}

export function getRepoFullName(owner: string, repo: string): string {
  return `${owner}/${repo}`;
}

export const GloablEvents = {
  READY: 'oss-mentor-bot-ready',
  START: 'oss-mentor-bot-start',
  CLOSE: 'oss-mentor-bot-close',
};

export class AutoCreateMap<K, V> extends Map<K, V> {

  private valueGenerator: () => V;

  constructor(valueGenerator: () => V) {
    super();
    this.valueGenerator = valueGenerator;
  }

  public get(key: K, valueGenerator?: () => V): V {
    let value = super.get(key);
    if (!value) {
      value = valueGenerator ? valueGenerator() : this.valueGenerator();
      this.set(key, value);
    }
    return value;
  }
}
