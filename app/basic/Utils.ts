
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
